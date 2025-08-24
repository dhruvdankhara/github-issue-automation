import os
from supabase import create_client, Client
from typing import Optional, Dict, List
import uuid
from datetime import datetime

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

def get_supabase_client() -> Optional[Client]:
    """Get Supabase client if configured"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    
    try:
        return create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to create Supabase client: {e}")
        return None

class SupabaseRepository:
    """Repository class for Supabase operations"""
    
    def __init__(self):
        self.client = get_supabase_client()
        self.available = self.client is not None
    
    async def add_repository(self, user_id: str, repo_data: Dict) -> Dict:
        """Add a repository to Supabase"""
        if not self.available:
            raise Exception("Supabase not configured")
        
        repository = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": repo_data["name"],
            "full_name": repo_data["full_name"],
            "description": repo_data.get("description"),
            "url": repo_data["url"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        try:
            result = self.client.table("repositories").insert(repository).execute()
            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to insert repository")
        except Exception as e:
            raise Exception(f"Database error: {str(e)}")
    
    async def get_repositories(self, user_id: str) -> List[Dict]:
        """Get repositories for a user"""
        if not self.available:
            raise Exception("Supabase not configured")
        
        try:
            result = self.client.table("repositories").select("*").eq("user_id", user_id).execute()
            return result.data if result.data else []
        except Exception as e:
            raise Exception(f"Database error: {str(e)}")
    
    async def delete_repository(self, repository_id: str, user_id: str) -> bool:
        """Delete a repository"""
        if not self.available:
            raise Exception("Supabase not configured")
        
        try:
            result = self.client.table("repositories").delete().eq("id", repository_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            raise Exception(f"Database error: {str(e)}")
    
    async def get_repository(self, repository_id: str) -> Optional[Dict]:
        """Get a single repository"""
        if not self.available:
            raise Exception("Supabase not configured")
        
        try:
            result = self.client.table("repositories").select("*").eq("id", repository_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Database error: {str(e)}")

# Global instance
supabase_repo = SupabaseRepository()
