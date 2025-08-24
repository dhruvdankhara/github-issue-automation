import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { RepositoryAccess } from "../lib/supabase";

interface RepositoryAccessStatusProps {
  repoFullName: string;
  userId: string;
  onAccessUpdate?: (access: RepositoryAccess) => void;
}

export function RepositoryAccessStatus({
  repoFullName,
  userId,
  onAccessUpdate,
}: RepositoryAccessStatusProps) {
  const [access, setAccess] = useState<RepositoryAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Use ref to store the latest callback without causing re-renders
  const onAccessUpdateRef = useRef(onAccessUpdate);

  // Update the ref when the callback changes
  useEffect(() => {
    onAccessUpdateRef.current = onAccessUpdate;
  }, [onAccessUpdate]);

  useEffect(() => {
    let isMounted = true;

    const performAccessCheck = async () => {
      if (!repoFullName || !userId) return;

      setLoading(true);
      try {
        const response = await fetch(
          "http://localhost:8000/repository/access/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              repo_full_name: repoFullName,
              user_id: userId,
            }),
          }
        );

        if (response.ok && isMounted) {
          const accessData = await response.json();
          setAccess(accessData);
          onAccessUpdateRef.current?.(accessData);
        } else {
          throw new Error("Failed to verify repository access");
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error checking repository access:", error);
          toast.error("Failed to check repository access");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only check once on mount or when repo/user changes
    performAccessCheck();

    return () => {
      isMounted = false;
    };
  }, [repoFullName, userId]); // Removed onAccessUpdate from dependencies

  const handleRefresh = async () => {
    if (!repoFullName || !userId) return;

    setChecking(true);
    try {
      const response = await fetch(
        "http://localhost:8000/repository/access/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repo_full_name: repoFullName,
            user_id: userId,
          }),
        }
      );

      if (response.ok) {
        const accessData = await response.json();
        setAccess(accessData);
        onAccessUpdateRef.current?.(accessData);
      } else {
        throw new Error("Failed to verify repository access");
      }
    } catch (error) {
      console.error("Error checking repository access:", error);
      toast.error("Failed to check repository access");
    } finally {
      setChecking(false);
    }
  };

  const handleAuthClick = () => {
    if (access?.auth_url) {
      window.open(access.auth_url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking access...</span>
      </div>
    );
  }

  if (!access) {
    return (
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Access status unknown</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {access.has_access ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Unlock className="h-3 w-3 mr-1" />
                Access Granted
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <Badge
                variant="outline"
                className="text-red-600 border-red-300 bg-red-50"
              >
                <Lock className="h-3 w-3 mr-1" />
                Access Denied
              </Badge>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={checking}
          className="h-6 px-2"
        >
          {checking ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </div>

      {!access.has_access && access.message && (
        <div className="text-xs text-gray-600">{access.message}</div>
      )}

      {!access.has_access && access.auth_url && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAuthClick}
          className="text-xs"
        >
          Authenticate with GitHub
        </Button>
      )}
    </div>
  );
}
