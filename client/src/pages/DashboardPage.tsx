import { useEffect, useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  fetchRepositories,
  addRepository,
  deleteRepository,
} from "../store/slices/repositorySlice";
import { setSelectedRepository } from "../store/slices/repositorySlice";
import { Navbar } from "../../../client/src/components/Navbar";
import { GitHubAuth } from "../../../client/src/components/GitHubAuth";
import { RepositoryAccessStatus } from "../../../client/src/components/RepositoryAccessStatus";
import { GitHubRepositoryBrowser } from "../../../client/src/components/GitHubRepositoryBrowser";
import { WebhookSetup } from "../../../client/src/components/WebhookSetup";
import { Button } from "../../../client/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../client/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../client/src/components/ui/dialog";
import { Badge } from "../../../client/src/components/ui/badge";
import { Plus, Github, ExternalLink, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import type { Repository } from "../lib/supabase";

export function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const { repositories, loading, error } = useAppSelector(
    (state) => state.repositories
  );
  const dispatch = useAppDispatch();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRepoFromBrowser, setSelectedRepoFromBrowser] = useState<{
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [repoAccessStatus, setRepoAccessStatus] = useState<
    Record<string, boolean>
  >({});
  console.log(
    "🚀 ~ DashboardPage.tsx:55 ~ DashboardPage ~ repoAccessStatus:",
    repoAccessStatus
  );

  // Memoize the access update callback to prevent unnecessary re-renders
  const handleAccessUpdate = useCallback((repoFullName: string) => {
    return (access: { has_access: boolean; error?: string }) => {
      setRepoAccessStatus((prev) => ({
        ...prev,
        [repoFullName]: access.has_access,
      }));
      if (!access.has_access && access.error === "no_github_token") {
        // Could trigger auth flow here if needed
      }
    };
  }, []);

  // Memoize the auth update callback
  const handleAuthUpdate = useCallback(
    (authStatus: { authenticated: boolean }) => {
      if (authStatus.authenticated) {
        toast.success("GitHub authentication updated");
      }
    },
    []
  );

  useEffect(() => {
    if (user) {
      dispatch(fetchRepositories(user.id));
    }
  }, [dispatch, user]);

  const validateAndAddRepository = async () => {
    if (!selectedRepoFromBrowser) {
      toast.error("Please select a repository");
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setIsValidating(true);

    try {
      const { name, full_name, description, html_url } =
        selectedRepoFromBrowser;

      // Check if repository already exists
      const existingRepo = repositories.find((r) => r.full_name === full_name);
      if (existingRepo) {
        toast.error("This repository is already added");
        setIsValidating(false);
        return;
      }

      // Add repository to database
      await dispatch(
        addRepository({
          userId: user.id,
          repoData: {
            name: name,
            full_name: full_name,
            description: description || undefined,
            url: html_url,
          },
        })
      ).unwrap();

      toast.success("Repository added successfully!");
      setSelectedRepoFromBrowser(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding repository:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add repository"
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteRepository = async (
    repositoryId: string,
    repositoryName: string
  ) => {
    if (!confirm(`Are you sure you want to remove "${repositoryName}"?`)) {
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      await dispatch(
        deleteRepository({ repositoryId, userId: user.id })
      ).unwrap();
      toast.success("Repository removed successfully!");
    } catch (error) {
      console.error("Error deleting repository:", error);
      toast.error("Failed to remove repository");
    }
  };

  const handleSelectRepository = (repository: Repository) => {
    dispatch(setSelectedRepository(repository));
    toast.success(`Selected "${repository.name}" repository`);
  };

  if (loading && repositories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Manage your GitHub repositories and track issues
          </p>
        </div>

        {/* GitHub Authentication */}
        <div className="mb-8">
          <GitHubAuth userId={user?.id || ""} onAuthUpdate={handleAuthUpdate} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Repository</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Add GitHub Repository</DialogTitle>
                <DialogDescription>
                  Browse and select repositories from your GitHub account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <GitHubRepositoryBrowser
                  isOpen={isAddDialogOpen}
                  userId={user?.id || ""}
                  onSelectRepository={(repo: {
                    id: number;
                    name: string;
                    full_name: string;
                    description: string | null;
                    html_url: string;
                  }) => {
                    setSelectedRepoFromBrowser(repo);
                  }}
                  existingRepos={repositories.map((r) => r.full_name)}
                />

                {selectedRepoFromBrowser && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Selected Repository:
                    </h4>
                    <p className="text-blue-800">
                      {selectedRepoFromBrowser.full_name}
                    </p>
                    {selectedRepoFromBrowser.description && (
                      <p className="text-blue-700 text-sm mt-1">
                        {selectedRepoFromBrowser.description}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={validateAndAddRepository}
                    disabled={isValidating || !selectedRepoFromBrowser}
                    className="flex-1"
                  >
                    {isValidating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </div>
                    ) : (
                      "Add Repository"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSelectedRepoFromBrowser(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {repositories.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Github className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No repositories yet</CardTitle>
              <CardDescription className="mb-6">
                Add your first GitHub repository to start tracking issues
              </CardDescription>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <Card key={repo.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Github className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-lg truncate">
                        {repo.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRepository(repo.id, repo.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {repo.full_name.split("/")[0]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {repo.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {repo.description}
                    </p>
                  )}

                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Added {new Date(repo.created_at).toLocaleDateString()}
                  </div>

                  {/* Repository Access Status */}
                  <div className="mb-4">
                    <RepositoryAccessStatus
                      repoFullName={repo.full_name}
                      userId={user?.id || ""}
                      onAccessUpdate={handleAccessUpdate(repo.full_name)}
                    />
                  </div>

                  <div className="flex space-x-2 mb-4">
                    <Button
                      onClick={() => handleSelectRepository(repo)}
                      className="flex-1"
                      size="sm"
                    >
                      Select Repository
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(repo.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <WebhookSetup
                      userId={user?.id || ""}
                      repoFullName={repo.full_name}
                      hasGitHubAccess={
                        repoAccessStatus[repo.full_name] ?? false
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
