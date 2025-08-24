import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  fetchIssues,
  setFilters,
  clearIssues,
  retryAutomation,
} from "../store/slices/issuesSlice";
import { Navbar } from "../../../client/src/components/Navbar";
import {
  AutomationStatusBadge,
  AutomationStatusDetails,
} from "../../../client/src/components/AutomationStatusBadge";
import { Button } from "../../../client/src/components/ui/button";
import { Input } from "../../../client/src/components/ui/input";
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
} from "../../../client/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../client/src/components/ui/select";
import { Badge } from "../../../client/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../client/src/components/ui/avatar";
import {
  Search,
  ExternalLink,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { GitHubIssue } from "../lib/supabase";
import { MarkdownRenderer } from "../../../client/src/components/MarkdownRenderer";

// Types for GitHub API responses
type GitHubComment = {
  id: number;
  body: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
};

type IssueDetails = GitHubIssue & {
  comments_data?: GitHubComment[];
  comments_count?: number;
};

export function IssuesPage() {
  const { selectedRepository } = useAppSelector((state) => state.repositories);
  const { issues, loading, error, filters } = useAppSelector(
    (state) => state.issues
  );
  const dispatch = useAppDispatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<IssueDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [issueComments, setIssueComments] = useState<GitHubComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (selectedRepository) {
      const [owner, repo] = selectedRepository.full_name.split("/");
      dispatch(fetchIssues({ owner, repo, filters }));
    } else {
      dispatch(clearIssues());
    }
  }, [dispatch, selectedRepository, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const filteredIssues = issues.filter(
    (issue: GitHubIssue) =>
      searchQuery === "" ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const refreshIssues = () => {
    if (selectedRepository) {
      const [owner, repo] = selectedRepository.full_name.split("/");
      dispatch(fetchIssues({ owner, repo, filters }));
      toast.success("Issues refreshed");
    }
  };

  const handleRetryAutomation = (issueNumber: number) => {
    if (selectedRepository) {
      const [owner, repo] = selectedRepository.full_name.split("/");
      dispatch(retryAutomation({ owner, repo, issueNumber }));
      toast.success("Automation retry initiated");
    }
  };

  // Fetch issue comments
  const fetchIssueComments = async (issue: GitHubIssue) => {
    if (!selectedRepository) return;

    setCommentsLoading(true);
    try {
      const [owner, repo] = selectedRepository.full_name.split("/");
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issue.number}/comments`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(import.meta.env.VITE_GITHUB_TOKEN && {
              Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
            }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const comments = await response.json();
      setIssueComments(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
      setIssueComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Handle opening issue details dialog
  const handleIssueClick = async (issue: GitHubIssue) => {
    setSelectedIssue(issue);
    setIsDialogOpen(true);
    await fetchIssueComments(issue);
  };

  // Close dialog and reset state
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedIssue(null);
    setIssueComments([]);
  };

  if (!selectedRepository) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No Repository Selected</CardTitle>
              <CardDescription>
                Please select a repository from the navbar to view its issues
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Issues - {selectedRepository.name}
          </h1>
          <p className="text-gray-600">
            Track and manage issues from {selectedRepository.full_name}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* State Filter */}
              <Select
                value={filters.state}
                onValueChange={(value) => handleFilterChange("state", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Filter */}
              <Select
                value={filters.sort}
                onValueChange={(value) => handleFilterChange("sort", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                </SelectContent>
              </Select>

              {/* Direction Filter */}
              <Select
                value={filters.direction}
                onValueChange={(value) =>
                  handleFilterChange("direction", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                {loading
                  ? "Loading..."
                  : `${filteredIssues.length} issues found`}
              </div>
              <Button
                onClick={refreshIssues}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Issues List */}
        {loading && issues.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No Issues Found</CardTitle>
              <CardDescription>
                {searchQuery
                  ? "No issues match your search criteria"
                  : "This repository has no issues"}
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue: GitHubIssue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onIssueClick={() => handleIssueClick(issue)}
                onRetryAutomation={() => handleRetryAutomation(issue.number)}
              />
            ))}
          </div>
        )}

        {/* Issue Details Dialog */}
        <IssueDetailsDialog
          issue={selectedIssue}
          comments={issueComments}
          commentsLoading={commentsLoading}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          repositoryFullName={selectedRepository?.full_name || ""}
        />
      </div>
    </div>
  );
}

interface IssueCardProps {
  issue: GitHubIssue;
  onIssueClick: () => void;
  onRetryAutomation: () => void;
}

function IssueCard({ issue, onIssueClick, onRetryAutomation }: IssueCardProps) {
  const getStateIcon = (state: string) => {
    return state === "open" ? (
      <AlertCircle className="h-4 w-4 text-green-600" />
    ) : (
      <CheckCircle className="h-4 w-4 text-purple-600" />
    );
  };

  const getStateColor = (state: string) => {
    return state === "open"
      ? "bg-green-100 text-green-800"
      : "bg-purple-100 text-purple-800";
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onIssueClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getStateIcon(issue.state)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {issue.title}
                </h3>
                <Badge className={`text-xs ${getStateColor(issue.state)}`}>
                  {issue.state}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>#{issue.number}</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{issue.user.login}</span>
                </div>
                <AutomationStatusBadge
                  status={issue.automation_status}
                  size="sm"
                  showRetryButton={true}
                  onRetry={onRetryAutomation}
                />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(issue.html_url, "_blank");
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {issue.body && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {issue.body.substring(0, 200)}
            {issue.body.length > 200 && "..."}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Labels */}
            {issue.labels.length > 0 && (
              <div className="flex items-center space-x-2">
                <Tag className="h-3 w-3 text-gray-400" />
                <div className="flex space-x-1">
                  {issue.labels.slice(0, 3).map((label) => (
                    <Badge
                      key={label.name}
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: `#${label.color}20`,
                        borderColor: `#${label.color}`,
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                  {issue.labels.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{issue.labels.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Assignees */}
          {issue.assignees.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Assigned to:</span>
              <div className="flex -space-x-2">
                {issue.assignees.slice(0, 3).map((assignee) => (
                  <Avatar
                    key={assignee.login}
                    className="h-6 w-6 border-2 border-white"
                  >
                    <AvatarImage
                      src={assignee.avatar_url}
                      alt={assignee.login}
                    />
                    <AvatarFallback className="text-xs">
                      {assignee.login.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {issue.assignees.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-gray-600">
                      +{issue.assignees.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Issue Details Dialog Component
interface IssueDetailsDialogProps {
  issue: IssueDetails | null;
  comments: GitHubComment[];
  commentsLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  repositoryFullName: string;
}

function IssueDetailsDialog({
  issue,
  comments,
  commentsLoading,
  isOpen,
  onClose,
  repositoryFullName,
}: IssueDetailsDialogProps) {
  if (!issue) return null;

  const getStateIcon = (state: string) => {
    return state === "open" ? (
      <AlertCircle className="h-5 w-5 text-green-600" />
    ) : (
      <CheckCircle className="h-5 w-5 text-purple-600" />
    );
  };

  const getStateColor = (state: string) => {
    return state === "open"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {getStateIcon(issue.state)}
                <DialogTitle className="text-xl font-semibold">
                  {issue.title}
                </DialogTitle>
                <Badge className={`${getStateColor(issue.state)} border`}>
                  {issue.state}
                </Badge>
              </div>
              <DialogDescription className="text-sm text-gray-600">
                #{issue.number} opened on {formatDate(issue.created_at)} by{" "}
                <span className="font-medium">{issue.user.login}</span> in{" "}
                <span className="font-medium">{repositoryFullName}</span>
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(issue.html_url, "_blank")}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on GitHub</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Issue Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Author</h4>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={issue.user.avatar_url}
                    alt={issue.user.login}
                  />
                  <AvatarFallback>
                    {issue.user.login.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{issue.user.login}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">
                Assignees
              </h4>
              {issue.assignees.length > 0 ? (
                <div className="flex -space-x-1">
                  {issue.assignees.map((assignee) => (
                    <Avatar
                      key={assignee.login}
                      className="h-8 w-8 border-2 border-white"
                    >
                      <AvatarImage
                        src={assignee.avatar_url}
                        alt={assignee.login}
                      />
                      <AvatarFallback className="text-xs">
                        {assignee.login.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500">No one assigned</span>
              )}
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Labels</h4>
              {issue.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map((label) => (
                    <Badge
                      key={label.name}
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: `#${
                          label.color == "ededed" ? "000000" : label.color
                        }20`,
                        borderColor: `#${
                          label.color == "ededed" ? "000000" : label.color
                        }`,
                        color: `#${
                          label.color == "ededed" ? "000000" : label.color
                        }`,
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-500">No labels</span>
              )}
            </div>
          </div>

          {/* Automation Status */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Automation Status</span>
            </h3>
            <div className="bg-white p-4 rounded-lg border">
              <AutomationStatusDetails status={issue.automation_status} />
            </div>
          </div>

          {/* Issue Body */}
          {issue.body && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Description</span>
              </h3>
              <div className="bg-white p-4 rounded-lg border">
                <MarkdownRenderer content={issue.body} />
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Comments ({comments.length})</span>
            </h3>

            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Loading comments...
                </span>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No comments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white p-4 rounded-lg border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={comment.user.avatar_url}
                            alt={comment.user.login}
                          />
                          <AvatarFallback className="text-xs">
                            {comment.user.login.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {comment.user.login}
                        </span>
                        <span className="text-xs text-gray-500">commented</span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(comment.html_url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <div>
                      <MarkdownRenderer content={comment.body} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline Information */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Created: {formatDate(issue.created_at)}</span>
                {issue.updated_at !== issue.created_at && (
                  <span>Updated: {formatDate(issue.updated_at)}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-3 w-3" />
                <span>{comments.length} comments</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
