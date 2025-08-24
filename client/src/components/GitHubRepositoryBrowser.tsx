import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Github,
  Search,
  Star,
  GitFork,
  AlertCircle,
  Loader2,
  Plus,
  Lock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  clone_url: string;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  permissions: {
    admin?: boolean;
    maintain?: boolean;
    push?: boolean;
    triage?: boolean;
    pull?: boolean;
  };
  topics: string[];
}

interface GitHubRepositoryBrowserProps {
  userId: string;
  isOpen: boolean;
  onSelectRepository: (repo: GitHubRepository) => void;
  existingRepos: string[]; // Array of full_names that are already added
}

export function GitHubRepositoryBrowser({
  userId,
  isOpen,
  onSelectRepository,
  existingRepos,
}: GitHubRepositoryBrowserProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchRepositories = useCallback(async () => {
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/github/repositories/${userId}?per_page=100`
      );

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories);
        setFilteredRepos(data.repositories);
      } else if (response.status === 401) {
        setError(
          "GitHub authentication required. Please connect your GitHub account first."
        );
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to fetch repositories");
      }
    } catch (error) {
      console.error("Error fetching repositories:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchRepositories();
    }
  }, [isOpen, userId, fetchRepositories]);

  useEffect(() => {
    const filtered = repositories.filter(
      (repo) =>
        repo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.language?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRepos(filtered);
  }, [searchTerm, repositories]);

  const handleSelectRepository = async (repo: GitHubRepository) => {
    try {
      onSelectRepository(repo);
      toast.success(`Selected repository: ${repo.full_name}`);
    } catch (error) {
      console.error("Error selecting repository:", error);
      toast.error("Failed to select repository");
    }
  };

  const isRepoAlreadyAdded = (fullName: string) => {
    return existingRepos.includes(fullName);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-gray-600">Loading repositories...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchRepositories} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <Github className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-600">
                {searchTerm
                  ? "No repositories found matching your search"
                  : "No repositories found"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredRepos.map((repo) => (
              <Card
                key={repo.id}
                className={`hover:shadow-md transition-shadow ${
                  isRepoAlreadyAdded(repo.full_name)
                    ? "bg-gray-50 border-gray-200"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {repo.private ? (
                          <Lock className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Globe className="h-4 w-4 text-gray-600" />
                        )}
                        <CardTitle className="text-lg truncate">
                          {repo.full_name}
                        </CardTitle>
                      </div>
                      {repo.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleSelectRepository(repo)}
                      disabled={isRepoAlreadyAdded(repo.full_name)}
                      size="sm"
                      className="ml-4 shrink-0"
                    >
                      {isRepoAlreadyAdded(repo.full_name) ? (
                        "Already Added"
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Select
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {repo.language && (
                        <Badge variant="outline" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{repo.stargazers_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitFork className="h-3 w-3" />
                        <span>{repo.forks_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{repo.open_issues_count} issues</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated {formatDate(repo.updated_at)}
                    </div>
                  </div>

                  {repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {repo.topics.slice(0, 5).map((topic) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="text-xs"
                        >
                          {topic}
                        </Badge>
                      ))}
                      {repo.topics.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{repo.topics.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-gray-600">
          {filteredRepos.length} repositories{" "}
          {searchTerm && `matching "${searchTerm}"`}
        </p>
      </div>
    </div>
  );
}
