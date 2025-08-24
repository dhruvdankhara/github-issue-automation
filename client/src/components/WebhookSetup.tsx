import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Webhook, CheckCircle, Loader2 } from "lucide-react";
import { ManualWebhookGuide } from "./ManualWebhookGuide";
import { api } from "../lib/api";

interface WebhookSetupProps {
  userId: string;
  repoFullName: string;
  hasGitHubAccess: boolean;
}

interface WebhookStatus {
  configured: boolean;
  webhook_url?: string;
  events?: string[];
  active?: boolean;
  last_response?: {
    code: number;
    status: string;
    message: string;
  };
}

export function WebhookSetup({
  userId,
  repoFullName,
  hasGitHubAccess,
}: WebhookSetupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const fetchWebhookStatus = async () => {
    if (!userId || !repoFullName) return;

    setLoading(true);
    try {
      const response = await api.get(
        `/github/webhook/status/${userId}?repo_full_name=${encodeURIComponent(
          repoFullName
        )}`
      );
      setWebhookStatus(response.data);
    } catch (error) {
      console.error("Error fetching webhook status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && hasGitHubAccess) {
      fetchWebhookStatus();
    }
  };

  if (!hasGitHubAccess) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="opacity-50"
        title="GitHub authentication required"
      >
        <Webhook className="h-4 w-4 mr-1" />
        Webhook
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Webhook className="h-4 w-4 mr-1" />
          Webhook
          {webhookStatus?.configured && (
            <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Webhook Setup - {repoFullName}</span>
          </DialogTitle>
          <DialogDescription>
            Configure webhooks to automatically track new issues in this
            repository
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Checking webhook status...</span>
            </div>
          ) : (
            <>
              {/* Actions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Actions</h4>

                <div className="pt-2">
                  <ManualWebhookGuide
                    userId={userId}
                    repoFullName={repoFullName}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
