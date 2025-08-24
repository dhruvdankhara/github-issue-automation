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
import {
  BookOpen,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface ManualWebhookGuideProps {
  userId: string;
  repoFullName: string;
}

export function ManualWebhookGuide({
  userId,
  repoFullName,
}: ManualWebhookGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const webhookUrl = `http://localhost:8000/github/webhook/${userId}`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard");
  };

  const openGitHubWebhookSettings = () => {
    const [owner, repo] = repoFullName.split("/");
    window.open(`https://github.com/${owner}/${repo}/settings/hooks`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-1" />
          Manual Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Manual Webhook Setup Guide</span>
          </DialogTitle>
          <DialogDescription>
            Step-by-step instructions to manually configure GitHub webhooks for{" "}
            {repoFullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Action */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Quick Start</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-blue-800">
                  Your Webhook URL:
                </label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 text-xs bg-white p-2 rounded border border-blue-200">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyWebhookUrl}
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={openGitHubWebhookSettings} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open GitHub Webhook Settings
              </Button>
            </div>
          </div>

          {/* Step by Step */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Step-by-Step Instructions
            </h4>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">
                    Navigate to Repository Settings
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    Go to your GitHub repository → Settings → Webhooks
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Add New Webhook</h5>
                  <p className="text-sm text-gray-600 mt-1">
                    Click "Add webhook" button to create a new webhook
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">
                    Configure Webhook
                  </h5>
                  <div className="text-sm text-gray-600 mt-1 space-y-2">
                    <div>
                      <strong>Payload URL:</strong> Use the URL copied above
                    </div>
                    <div>
                      <strong>Content type:</strong> application/json
                    </div>
                    <div>
                      <strong>Events:</strong> Select individual events (see
                      below)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Select Events</h5>
                  <p className="text-sm text-gray-600 mt-1 mb-2">
                    Choose "Let me select individual events" and check:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Issues</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Issue comments</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Label events</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Save Webhook</h5>
                  <p className="text-sm text-gray-600 mt-1">
                    Make sure "Active" is checked, then click "Add webhook"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
