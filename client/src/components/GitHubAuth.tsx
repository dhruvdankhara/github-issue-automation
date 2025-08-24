import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { AlertCircle, CheckCircle, Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { GitHubAuthStatus } from "../lib/supabase";
import { API_BASE_URL } from "../lib/api";

interface GitHubAuthProps {
  userId: string;
  onAuthUpdate?: (authStatus: GitHubAuthStatus) => void;
}

export function GitHubAuth({ userId, onAuthUpdate }: GitHubAuthProps) {
  const [authStatus, setAuthStatus] = useState<GitHubAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  // Use ref to store the latest callback without causing re-renders
  const onAuthUpdateRef = useRef(onAuthUpdate);

  // Update the ref when the callback changes
  useEffect(() => {
    onAuthUpdateRef.current = onAuthUpdate;
  }, [onAuthUpdate]);

  const performAuthCheck = async () => {
    setLoading(true);
    try {
      // Try the provided user ID first
      let response = await fetch(
        `${API_BASE_URL}/auth/github/status/${userId}`
      );

      // If that fails and we have a different userId, try default_user
      if (!response.ok && userId !== "default_user") {
        response = await fetch(
          `${API_BASE_URL}/auth/github/status/default_user`
        );
      }

      if (response.ok) {
        const status = await response.json();
        setAuthStatus(status);
        onAuthUpdateRef.current?.(status);
      }
    } catch (error) {
      console.error("Failed to check GitHub auth status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Store user ID in localStorage for OAuth callback
    if (userId) {
      localStorage.setItem("userId", userId);
    }

    // Function to check auth status - only runs once on mount
    const performInitialAuthCheck = async () => {
      setLoading(true);
      try {
        // Try the provided user ID first
        let response = await fetch(
          `${API_BASE_URL}/auth/github/status/${userId}`
        );

        // If that fails and we have a different userId, try default_user
        if (!response.ok && userId !== "default_user") {
          response = await fetch(
            `${API_BASE_URL}/auth/github/status/default_user`
          );
        }

        if (response.ok && isMounted) {
          const status = await response.json();
          setAuthStatus(status);
          onAuthUpdateRef.current?.(status);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to check GitHub auth status:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Check for auth success flag
    const checkAuthSuccess = () => {
      if (localStorage.getItem("github_auth_success") === "true") {
        localStorage.removeItem("github_auth_success");
        // Delay refresh to ensure backend has processed the token
        setTimeout(performInitialAuthCheck, 1000);
      }
    };

    // Only check once on mount
    performInitialAuthCheck();
    checkAuthSuccess();

    return () => {
      isMounted = false;
    };
  }, [userId]); // Removed onAuthUpdate from dependencies to prevent cycles

  const handleGitHubAuth = async () => {
    setAuthenticating(true);
    try {
      // Get GitHub auth URL
      const response = await fetch(`${API_BASE_URL}/auth/github/url`);
      if (response.ok) {
        const data = await response.json();

        // Open GitHub OAuth in a popup
        const popup = window.open(
          data.auth_url,
          "github-auth",
          "width=600,height=600,scrollbars=yes,resizable=yes"
        );

        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setAuthenticating(false);
            // Check auth status after popup closes
            setTimeout(performAuthCheck, 1000);
          }
        }, 1000);
      } else {
        throw new Error("Failed to get GitHub auth URL");
      }
    } catch (error) {
      console.error("GitHub auth error:", error);
      toast.error("Failed to start GitHub authentication");
      setAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking GitHub authentication...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Github className="h-5 w-5" />
          <span>GitHub Authentication</span>
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to enable automated issue labeling
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authStatus?.authenticated ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={authStatus.user?.avatar_url}
                    alt={authStatus.user?.login}
                  />
                  <AvatarFallback>
                    {authStatus.user?.login?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {authStatus.user?.name || authStatus.user?.login}
                  </div>
                  <div className="text-sm text-gray-500">
                    @{authStatus.user?.login}
                  </div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>

            <div className="text-sm text-gray-600">
              Your GitHub account is connected. The automation bot can now
              access your repositories to read issues and apply labels
              automatically.
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={performAuthCheck}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Refresh Status"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-300 bg-yellow-50"
              >
                Not Connected
              </Badge>
            </div>

            <div className="text-sm text-gray-600">
              To enable automated issue labeling, you need to connect your
              GitHub account. This allows the AI bot to access your repositories
              and apply labels to issues automatically.
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>What permissions are requested:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Read access to your repositories</li>
                  <li>Write access to issues (for adding labels)</li>
                  <li>Basic profile information</li>
                </ul>
              </div>
            </div>

            <Button
              onClick={handleGitHubAuth}
              disabled={authenticating}
              className="w-full"
            >
              {authenticating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4 mr-2" />
                  Connect GitHub Account
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// GitHub OAuth callback handler component
export function GitHubOAuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");

      if (code && (state === "github_auth" || !state)) {
        try {
          // Get user ID from localStorage, URL params, or use default
          let userId = localStorage.getItem("userId");

          // Try to get user ID from URL params if not in localStorage
          if (!userId) {
            const currentUrl = new URLSearchParams(window.location.search);
            userId = currentUrl.get("user_id") || "default_user";
          }

          console.log("Using user ID for OAuth:", userId);

          const response = await fetch(`${API_BASE_URL}/auth/github/callback`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, user_id: userId }),
          });

          if (response.ok) {
            await response.json();
            toast.success("GitHub authentication successful!");

            // Store success in localStorage to trigger refresh
            localStorage.setItem("github_auth_success", "true");

            // Close popup if this is in a popup
            if (window.opener) {
              window.close();
            } else {
              // Redirect to dashboard if not in popup
              window.location.href = "/dashboard";
            }
          } else {
            const error = await response.json();
            toast.error(`Authentication failed: ${error.detail}`);
          }
        } catch (error) {
          console.error("OAuth callback error:", error);
          toast.error("Authentication failed");
        }
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <h2 className="text-lg font-semibold">
              Completing GitHub Authentication
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
