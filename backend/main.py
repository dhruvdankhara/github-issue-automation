from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Dict, Optional, List
import threading
import time
import requests
import os
from urllib.parse import urlencode

# Import Supabase client
from supabase_client import supabase_repo

# Configuration from environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "https://github-issue-automation.onrender.com")

# Try to import Portia, fallback if not available
try:
    from portia_setup import portia, task0
    PORTIA_AVAILABLE = True
except ImportError:
    PORTIA_AVAILABLE = False
    print("Warning: Portia not available. Automation features will be disabled.")

app = FastAPI()

origins = [
    FRONTEND_URL,  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, 
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# In-memory store for automation status
# In production, this should be a proper database
automation_status: Dict[str, Dict] = {}

# In-memory store for GitHub access tokens
# In production, this should be encrypted and stored in database
github_tokens: Dict[str, str] = {}  # user_id -> github_token

# In-memory store for webhook secrets  
# In production, this should be encrypted and stored in database
webhook_secrets: Dict[str, str] = {}  # repo_full_name -> webhook_secret

# In-memory store for repositories (fallback when Supabase not available)
in_memory_repositories: Dict[str, List[Dict]] = {}  # user_id -> repositories list

# GitHub OAuth configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "your_github_client_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "your_github_client_secret")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", f"https://github-issue-automation.onrender.com/auth/github/callback")

security = HTTPBearer(auto_error=False)

class TaskRequest(BaseModel):
    task: str

class AutomationStatus(BaseModel):
    status: str  # "pending", "running", "completed", "failed"
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    task_id: Optional[str] = None

class GitHubAuthRequest(BaseModel):
    code: str
    user_id: str

class RepositoryAccessRequest(BaseModel):
    repo_full_name: str
    user_id: str

class WebhookSetupRequest(BaseModel):
    repo_full_name: str

class RepositoryCreateRequest(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    url: str

def update_automation_status(repo_full_name: str, issue_number: int, status_data: Dict):
    """Update automation status for a specific issue"""
    key = f"{repo_full_name}#{issue_number}"
    automation_status[key] = status_data

def get_automation_status(repo_full_name: str, issue_number: int) -> Optional[Dict]:
    """Get automation status for a specific issue"""
    key = f"{repo_full_name}#{issue_number}"
    return automation_status.get(key)

def get_github_token_for_user(user_id: str) -> Optional[str]:
    """Get GitHub token for a user"""
    return github_tokens.get(user_id)

def set_github_token_for_user(user_id: str, token: str):
    """Set GitHub token for a user"""
    github_tokens[user_id] = token

async def verify_repository_access(repo_full_name: str, user_id: str) -> Dict:
    """Verify if user has access to the repository"""
    token = get_github_token_for_user(user_id)
    
    if not token:
        return {
            "has_access": False,
            "error": "no_github_token",
            "message": "GitHub authentication required",
            "auth_url": get_github_auth_url()
        }
    
    # Check repository access
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        response = requests.get(f"https://api.github.com/repos/{repo_full_name}", headers=headers)
        
        if response.status_code == 200:
            repo_data = response.json()
            return {
                "has_access": True,
                "repository": repo_data,
                "permissions": repo_data.get("permissions", {})
            }
        elif response.status_code == 401:
            return {
                "has_access": False,
                "error": "invalid_token",
                "message": "GitHub token is invalid or expired",
                "auth_url": get_github_auth_url()
            }
        elif response.status_code == 404:
            return {
                "has_access": False,
                "error": "repository_not_found",
                "message": "Repository not found or access denied"
            }
        else:
            return {
                "has_access": False,
                "error": "api_error",
                "message": f"GitHub API error: {response.status_code}"
            }
    except Exception as e:
        return {
            "has_access": False,
            "error": "network_error",
            "message": f"Failed to verify repository access: {str(e)}"
        }

def get_github_auth_url() -> str:
    """Generate GitHub OAuth URL"""
    if GITHUB_CLIENT_ID == "your_github_client_id":
        return ""
    
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "repo,read:user",
        "state": "github_auth"
    }
    
    return f"https://github.com/login/oauth/authorize?{urlencode(params)}"

async def exchange_github_code_for_token(code: str) -> Dict:
    """Exchange GitHub OAuth code for access token"""
    if GITHUB_CLIENT_ID == "your_github_client_id" or GITHUB_CLIENT_SECRET == "your_github_client_secret":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured"
        )
    
    data = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": GITHUB_REDIRECT_URI
    }
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            "https://github.com/login/oauth/access_token",
            json=data,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            
            if "access_token" in result:
                # Get user info
                user_headers = {
                    "Authorization": f"token {result['access_token']}",
                    "Accept": "application/vnd.github.v3+json"
                }
                
                user_response = requests.get("https://api.github.com/user", headers=user_headers)
                user_data = user_response.json() if user_response.status_code == 200 else {}
                
                return {
                    "success": True,
                    "access_token": result["access_token"],
                    "user": user_data
                }
            else:
                return {
                    "success": False,
                    "error": result.get("error", "unknown_error"),
                    "message": result.get("error_description", "Failed to get access token")
                }
        else:
            return {
                "success": False,
                "error": "api_error",
                "message": f"GitHub API error: {response.status_code}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": "network_error", 
            "message": f"Failed to exchange code for token: {str(e)}"
        }

def run_automation_task(repo_full_name: str, issue_number: int, repository_url: str, user_id: Optional[str] = None):
    """Run automation task in background thread"""
    if not PORTIA_AVAILABLE:
        print(f"Portia not available, skipping automation for {repo_full_name}#{issue_number}")
        return
        
    key = f"{repo_full_name}#{issue_number}"
    
    try:
        # Update status to running
        update_automation_status(repo_full_name, issue_number, {
            "status": "running",
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
            "error_message": None,
            "task_id": None
        })
        
        # Get GitHub token for repository access
        github_token = get_github_token_for_user(user_id) if user_id else None
        
        # Prepare the task with authentication if available
        task_description = f"give labels to this issue #{issue_number} from reading it title and body of github repository url: {repository_url}"
        
        if github_token:
            task_description += f". Use this GitHub token for authentication: {github_token}"
        
        # Run the automation task
        plan_run = portia.run(task_description)
        
        # Update status to completed
        update_automation_status(repo_full_name, issue_number, {
            "status": "completed",
            "started_at": automation_status[key]["started_at"],
            "completed_at": datetime.now().isoformat(),
            "error_message": None,
            "task_id": plan_run.id if hasattr(plan_run, 'id') else None
        })
        
        print(f"Automation completed for {key}")
        if hasattr(plan_run, 'outputs'):
            print(plan_run.outputs)
            
    except Exception as e:
        error_message = str(e)
        
        # Check if it's an access-related error
        if "403" in error_message or "401" in error_message or "access" in error_message.lower():
            error_message = "GitHub access denied. Please authenticate with GitHub to enable automation."
        
        # Update status to failed
        update_automation_status(repo_full_name, issue_number, {
            "status": "failed",
            "started_at": automation_status[key].get("started_at"),
            "completed_at": datetime.now().isoformat(),
            "error_message": error_message,
            "task_id": None
        })
        print(f"Automation failed for {key}: {error_message}")

@app.get("/")
def read_root():
    return {"message": "GitHub Issue Automation API", "portia_available": PORTIA_AVAILABLE}

@app.get("/auth/github/url")
def get_github_auth_url_endpoint():
    """Get GitHub OAuth URL for authentication"""
    auth_url = get_github_auth_url()
    if not auth_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured"
        )
    return {"auth_url": auth_url}

@app.get("/auth/github/login")
def github_auth_login(user_id: str):
    """Initiate GitHub OAuth flow"""
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "repo,read:user",
        "state": user_id  # Pass user_id in state parameter
    }
    
    auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    return RedirectResponse(auth_url)

@app.get("/auth/github/callback")
async def github_oauth_callback_get(code: str, state: Optional[str] = None):
    """Handle GitHub OAuth callback (GET redirect from GitHub)"""
    # Redirect to frontend with the code for processing
    frontend_url = f"{FRONTEND_URL}/auth/callback?code={code}&state={state or 'github_auth'}"
    return RedirectResponse(url=frontend_url)

@app.post("/auth/github/callback")
async def github_oauth_callback_post(auth_request: GitHubAuthRequest):
    """Handle GitHub OAuth callback (POST from frontend)"""
    result = await exchange_github_code_for_token(auth_request.code)
    
    if result["success"]:
        # Store the token for the user
        set_github_token_for_user(auth_request.user_id, result["access_token"])
        
        return {
            "success": True,
            "message": "GitHub authentication successful",
            "user": result["user"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

@app.get("/auth/github/status/{user_id}")
def get_github_auth_status(user_id: str):
    """Check if user has GitHub authentication"""
    token = get_github_token_for_user(user_id)
    
    if token:
        # Verify token is still valid
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        try:
            response = requests.get("https://api.github.com/user", headers=headers)
            if response.status_code == 200:
                user_data = response.json()
                return {
                    "authenticated": True,
                    "user": {
                        "login": user_data.get("login"),
                        "avatar_url": user_data.get("avatar_url"),
                        "name": user_data.get("name")
                    }
                }
            else:
                # Token is invalid, remove it
                github_tokens.pop(user_id, None)
                return {
                    "authenticated": False,
                    "auth_url": get_github_auth_url()
                }
        except Exception:
            return {
                "authenticated": False,
                "auth_url": get_github_auth_url()
            }
    else:
        return {
            "authenticated": False,
            "auth_url": get_github_auth_url()
        }

@app.post("/repository/access/verify")
async def verify_repository_access_endpoint(access_request: RepositoryAccessRequest):
    """Verify if user has access to a repository"""
    result = await verify_repository_access(access_request.repo_full_name, access_request.user_id)
    return result

@app.get("/github/repositories/{user_id}")
def get_user_github_repositories(user_id: str, per_page: int = 30, page: int = 1):
    """Fetch user's GitHub repositories"""
    token = get_github_token_for_user(user_id)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="GitHub authentication required"
        )
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        # Fetch user's repositories
        response = requests.get(
            f"https://api.github.com/user/repos",
            headers=headers,
            params={
                "per_page": min(per_page, 100),
                "page": page,
                "sort": "updated",
                "affiliation": "owner,collaborator,organization_member"
            }
        )
        
        if response.status_code == 200:
            repos = response.json()
            
            # Filter and format repository data
            formatted_repos = []
            for repo in repos:
                formatted_repos.append({
                    "id": repo["id"],
                    "name": repo["name"],
                    "full_name": repo["full_name"],
                    "description": repo["description"],
                    "html_url": repo["html_url"],
                    "clone_url": repo["clone_url"],
                    "private": repo["private"],
                    "language": repo["language"],
                    "stargazers_count": repo["stargazers_count"],
                    "forks_count": repo["forks_count"],
                    "open_issues_count": repo["open_issues_count"],
                    "updated_at": repo["updated_at"],
                    "permissions": repo.get("permissions", {}),
                    "topics": repo.get("topics", [])
                })
            
            return {
                "repositories": formatted_repos,
                "total_count": len(formatted_repos),
                "page": page,
                "per_page": per_page
            }
        elif response.status_code == 401:
            # Token is invalid
            github_tokens.pop(user_id, None)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="GitHub token expired or invalid"
            )
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"GitHub API error: {response.status_code}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repositories: {str(e)}"
        )

# Repository Management Endpoints (Supabase)
@app.post("/repositories")
async def create_repository(user_id: str, repo_data: RepositoryCreateRequest):
    """Add a repository to user's collection"""
    try:
        repository = await supabase_repo.add_repository(user_id, repo_data.dict())
        return {"success": True, "repository": repository}
    except Exception as e:
        if not supabase_repo.available:
            # Use in-memory storage as fallback
            import uuid
            repo_id = str(uuid.uuid4())
            repository = {
                "id": repo_id,
                "user_id": user_id,
                "name": repo_data.name,
                "full_name": repo_data.full_name,
                "description": repo_data.description,
                "url": repo_data.url,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Initialize user's repository list if not exists
            if user_id not in in_memory_repositories:
                in_memory_repositories[user_id] = []
            
            # Check if repository already exists
            existing = next((r for r in in_memory_repositories[user_id] if r["full_name"] == repo_data.full_name), None)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Repository already exists"
                )
            
            # Add to in-memory storage
            in_memory_repositories[user_id].append(repository)
            
            return {
                "success": True, 
                "repository": repository,
                "note": "Using in-memory storage (Supabase not configured)"
            }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create repository: {str(e)}"
        )

@app.get("/repositories/{user_id}")
async def get_user_repositories(user_id: str):
    """Get user's repositories from Supabase"""
    try:
        repositories = await supabase_repo.get_repositories(user_id)
        return {"repositories": repositories}
    except Exception as e:
        if not supabase_repo.available:
            # Use in-memory storage as fallback
            user_repos = in_memory_repositories.get(user_id, [])
            return {
                "repositories": user_repos,
                "note": f"Using in-memory storage ({len(user_repos)} repositories found)"
            }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch repositories: {str(e)}"
        )

@app.delete("/repositories/{repository_id}")
async def delete_repository(repository_id: str, user_id: str):
    """Delete a repository"""
    try:
        success = await supabase_repo.delete_repository(repository_id, user_id)
        if success:
            return {"success": True, "message": "Repository deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )
    except Exception as e:
        if not supabase_repo.available:
            # Use in-memory storage as fallback
            if user_id in in_memory_repositories:
                user_repos = in_memory_repositories[user_id]
                repo_to_delete = next((r for r in user_repos if r["id"] == repository_id), None)
                if repo_to_delete:
                    user_repos.remove(repo_to_delete)
                    return {
                        "success": True,
                        "message": "Repository deleted successfully (in-memory mode)"
                    }
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete repository: {str(e)}"
        )

@app.post("/github/webhook/{user_id}")
def setup_github_webhook(user_id: str, request: WebhookSetupRequest):
    """Set up GitHub webhook for a repository"""
    repo_full_name = request.repo_full_name
    token = get_github_token_for_user(user_id)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="GitHub authentication required"
        )
    
    # Generate a webhook secret
    import secrets
    webhook_secret = secrets.token_urlsafe(32)
    
    # Webhook configuration
    webhook_config = {
        "name": "web",
        "active": True,
        "events": [
            "issues",
            "issue_comment", 
            "pull_request",
            "pull_request_review_comment"
        ],
        "config": {
            "url": f"{BACKEND_URL}/github-webhook",
            "content_type": "json",
            "secret": webhook_secret,
            "insecure_ssl": "0"
        }
    }
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
    }
    
    try:
        # Create webhook
        response = requests.post(
            f"https://api.github.com/repos/{repo_full_name}/hooks",
            headers=headers,
            json=webhook_config
        )
        
        if response.status_code == 201:
            webhook_data = response.json()
            
            # Store webhook secret
            webhook_secrets[repo_full_name] = webhook_secret
            
            return {
                "success": True,
                "webhook_id": webhook_data["id"],
                "webhook_url": webhook_data["config"]["url"],
                "events": webhook_data["events"],
                "message": "Webhook created successfully"
            }
        elif response.status_code == 422:
            return {
                "success": False,
                "error": "webhook_exists",
                "message": "Webhook already exists for this repository"
            }
        elif response.status_code == 403:
            return {
                "success": False,
                "error": "permission_denied",
                "message": "Insufficient permissions to create webhook. Admin access required."
            }
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            return {
                "success": False,
                "error": "api_error",
                "message": f"GitHub API error: {response.status_code}",
                "details": error_data
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create webhook: {str(e)}"
        )

@app.get("/github/webhook/status/{user_id}")
def get_webhook_status(user_id: str, repo_full_name: Optional[str] = None):
    """Get webhook status for a GitHub repository."""
    if not repo_full_name:
        raise HTTPException(status_code=400, detail="repo_full_name query parameter required")
        
    token = get_github_token_for_user(user_id)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="GitHub authentication required"
        )
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    try:
        # Get existing webhooks
        response = requests.get(
            f"https://api.github.com/repos/{repo_full_name}/hooks",
            headers=headers
        )
        
        if response.status_code == 200:
            webhooks = response.json()
            
            # Look for our webhook
            our_webhook_url = f"{BACKEND_URL}/github-webhook"
            our_webhook = None
            
            for webhook in webhooks:
                if webhook.get("config", {}).get("url") == our_webhook_url:
                    our_webhook = webhook
                    break
            
            if our_webhook:
                return {
                    "configured": True,
                    "webhook_url": our_webhook["config"]["url"],
                    "events": our_webhook["events"],
                    "active": our_webhook["active"],
                    "webhook_id": our_webhook["id"],
                    "last_response": our_webhook.get("last_response")
                }
            else:
                return {"configured": False}
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch webhooks: {error_data.get('message', 'Unknown error')}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get webhook status: {str(e)}"
        )

@app.post("/github-webhook")
def handle_github_webhook(payload: dict):
    """Handle GitHub webhook events"""
    print("GitHub webhook received")

    if payload.get("action") == "opened" and "issue" in payload:
        issue = payload["issue"]
        repository = payload["repository"]
        repo_full_name = repository["full_name"]
        issue_number = issue["number"]
        repository_url = issue["repository_url"]
        
        # Try to find user_id from repository owner (this is a simplification)
        # In production, you'd want to map repository to user_id properly
        repo_owner = repository.get("owner", {}).get("login")
        user_id = repo_owner  # Simplified mapping
        
        # Initialize status as pending
        update_automation_status(repo_full_name, issue_number, {
            "status": "pending",
            "started_at": None,
            "completed_at": None,
            "error_message": None,
            "task_id": None
        })
        
        # Start automation in background thread only if Portia is available
        if PORTIA_AVAILABLE:
            thread = threading.Thread(
                target=run_automation_task, 
                args=(repo_full_name, issue_number, repository_url, user_id)
            )
            thread.daemon = True
            thread.start()
            
            return {
                "message": "GitHub webhook received", 
                "automation_status": "pending",
                "payload": payload
            }
        else:
            return {
                "message": "GitHub webhook received (automation disabled - Portia not available)", 
                "payload": payload
            }
    else:
        return {"message": "GitHub webhook received", "payload": payload}

@app.get("/automation-status/{repo_owner}/{repo_name}/{issue_number}")
def get_issue_automation_status(repo_owner: str, repo_name: str, issue_number: int):
    """Get automation status for a specific issue"""
    repo_full_name = f"{repo_owner}/{repo_name}"
    status = get_automation_status(repo_full_name, issue_number)
    
    if status:
        return {"automation_status": status}
    else:
        return {"automation_status": None}

@app.get("/automation-status/{repo_owner}/{repo_name}")
def get_repository_automation_status(repo_owner: str, repo_name: str):
    """Get automation status for all issues in a repository"""
    repo_full_name = f"{repo_owner}/{repo_name}"
    repo_statuses = {}
    
    for key, status in automation_status.items():
        if key.startswith(f"{repo_full_name}#"):
            issue_number = key.split("#")[1]
            repo_statuses[issue_number] = status
    
    return {"automation_statuses": repo_statuses}

@app.post("/automation-status/{repo_owner}/{repo_name}/{issue_number}/retry")
def retry_automation(repo_owner: str, repo_name: str, issue_number: int, user_id: Optional[str] = None):
    """Retry automation for a specific issue"""
    if not PORTIA_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Automation service not available (Portia not configured)"
        )
        
    repo_full_name = f"{repo_owner}/{repo_name}"
    
    # Reset status to pending
    update_automation_status(repo_full_name, issue_number, {
        "status": "pending",
        "started_at": None,
        "completed_at": None,
        "error_message": None,
        "task_id": None
    })
    
    # Start automation in background thread
    repository_url = f"https://api.github.com/repos/{repo_full_name}"
    thread = threading.Thread(
        target=run_automation_task, 
        args=(repo_full_name, issue_number, repository_url, user_id)
    )
    thread.daemon = True
    thread.start()
    
    return {"message": "Automation retry initiated", "status": "pending"}

# Portia task endpoints (only available if Portia is configured)
@app.get("/run-task")
def run_task():
    """Run default Portia task"""
    if not PORTIA_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Portia not available"
        )
    plan_run = portia.run(task0)
    return {"message": "Task is running", "task_id": plan_run.id}

@app.post("/run-task")
def run_task_post(request: TaskRequest):
    """Run custom Portia task"""
    if not PORTIA_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Portia not available"
        )
        
    if not request.task or request.task.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task cannot be empty"
        )
    
    print("Received task:", request.task)
    plan_run = portia.run(request.task)
    return {"message": "Task is running", "task_id": plan_run}

@app.get("/debug/tokens")
def debug_tokens():
    """Debug endpoint to check stored tokens"""
    return {
        "stored_tokens": list(github_tokens.keys()),
        "webhook_secrets": list(webhook_secrets.keys()),
        "portia_available": PORTIA_AVAILABLE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
