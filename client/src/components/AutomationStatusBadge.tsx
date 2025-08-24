import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { AutomationStatus } from "../lib/supabase";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";

interface AutomationStatusBadgeProps {
  status: AutomationStatus | null | undefined;
  onRetry?: () => void;
  showRetryButton?: boolean;
  size?: "sm" | "default";
}

export function AutomationStatusBadge({
  status,
  onRetry,
  showRetryButton = false,
  size = "default",
}: AutomationStatusBadgeProps) {
  if (!status || status.status === null) {
    return (
      <Badge variant="outline" className="text-gray-500 border-gray-300">
        <Zap className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
        No automation
      </Badge>
    );
  }

  const getStatusConfig = () => {
    switch (status.status) {
      case "pending":
        return {
          variant: "outline" as const,
          className: "text-yellow-600 border-yellow-300 bg-yellow-50",
          icon: (
            <Clock
              className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} mr-1`}
            />
          ),
          text: "Pending",
        };
      case "running":
        return {
          variant: "outline" as const,
          className: "text-blue-600 border-blue-300 bg-blue-50",
          icon: (
            <Loader2
              className={`${
                size === "sm" ? "h-2 w-2" : "h-3 w-3"
              } mr-1 animate-spin`}
            />
          ),
          text: "Running",
        };
      case "completed":
        return {
          variant: "outline" as const,
          className: "text-green-600 border-green-300 bg-green-50",
          icon: (
            <CheckCircle
              className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} mr-1`}
            />
          ),
          text: "Completed",
        };
      case "failed":
        return {
          variant: "outline" as const,
          className: "text-red-600 border-red-300 bg-red-50",
          icon: (
            <XCircle
              className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} mr-1`}
            />
          ),
          text: "Failed",
        };
      default:
        return {
          variant: "outline" as const,
          className: "text-gray-500 border-gray-300",
          icon: (
            <Zap className={`${size === "sm" ? "h-2 w-2" : "h-3 w-3"} mr-1`} />
          ),
          text: "Unknown",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-2">
      <Badge
        variant={config.variant}
        className={`${config.className} ${
          size === "sm" ? "text-xs px-1.5 py-0.5" : ""
        }`}
      >
        {config.icon}
        {config.text}
      </Badge>

      {showRetryButton && status.status === "failed" && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 w-6 p-0"
          title="Retry automation"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function AutomationStatusDetails({
  status,
}: {
  status: AutomationStatus | null | undefined;
}) {
  if (!status || status.status === null) {
    return (
      <div className="text-sm text-gray-500">
        No automation has been run for this issue.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center space-x-2">
        <span className="font-medium text-gray-700">Status:</span>
        <AutomationStatusBadge status={status} size="sm" />
      </div>

      {status.started_at && (
        <div>
          <span className="font-medium text-gray-700">Started:</span>
          <span className="ml-2 text-gray-600">
            {new Date(status.started_at).toLocaleString()}
          </span>
        </div>
      )}

      {status.completed_at && (
        <div>
          <span className="font-medium text-gray-700">Completed:</span>
          <span className="ml-2 text-gray-600">
            {new Date(status.completed_at).toLocaleString()}
          </span>
        </div>
      )}

      {status.error_message && (
        <div>
          <span className="font-medium text-red-700">Error:</span>
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
            {status.error_message}
          </div>
        </div>
      )}

      {status.task_id && (
        <div>
          <span className="font-medium text-gray-700">Task ID:</span>
          <span className="ml-2 text-gray-600 font-mono text-xs">
            {status.task_id}
          </span>
        </div>
      )}
    </div>
  );
}
