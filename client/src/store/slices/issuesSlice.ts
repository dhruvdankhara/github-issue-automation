import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { GitHubIssue, AutomationStatus } from "../../lib/supabase";

interface IssuesState {
  issues: GitHubIssue[];
  loading: boolean;
  error: string | null;
  filters: {
    state: "all" | "open" | "closed";
    assignee: string;
    label: string;
    sort: "created" | "updated" | "comments";
    direction: "asc" | "desc";
  };
}

const initialState: IssuesState = {
  issues: [],
  loading: false,
  error: null,
  filters: {
    state: "all",
    assignee: "",
    label: "",
    sort: "created",
    direction: "desc",
  },
};

export const fetchIssues = createAsyncThunk(
  "issues/fetchIssues",
  async ({
    owner,
    repo,
    filters,
  }: {
    owner: string;
    repo: string;
    filters?: Partial<IssuesState["filters"]>;
  }) => {
    const params = new URLSearchParams();

    if (filters?.state && filters.state !== "all") {
      params.append("state", filters.state);
    }

    if (filters?.assignee) {
      params.append("assignee", filters.assignee);
    }

    if (filters?.label) {
      params.append("labels", filters.label);
    }

    params.append("sort", filters?.sort || "created");
    params.append("direction", filters?.direction || "desc");
    params.append("per_page", "100");

    const url = `https://api.github.com/repos/${owner}/${repo}/issues?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Add GitHub token if available
        ...(import.meta.env.VITE_GITHUB_TOKEN && {
          Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    // Filter out pull requests (GitHub API returns both issues and PRs)
    const issues = data.filter(
      (item: GitHubIssue & { pull_request?: unknown }) => !item.pull_request
    ) as GitHubIssue[];

    // Fetch automation statuses for all issues
    try {
      const automationResponse = await fetch(
        `http://localhost:8000/automation-status/${owner}/${repo}`
      );

      if (automationResponse.ok) {
        const automationData = await automationResponse.json();
        const automationStatuses = automationData.automation_statuses || {};

        // Merge automation status with issues
        return issues.map((issue) => ({
          ...issue,
          automation_status:
            automationStatuses[issue.number.toString()] || null,
        }));
      }
    } catch (error) {
      console.warn("Failed to fetch automation statuses:", error);
    }

    return issues;
  }
);

export const retryAutomation = createAsyncThunk(
  "issues/retryAutomation",
  async ({
    owner,
    repo,
    issueNumber,
  }: {
    owner: string;
    repo: string;
    issueNumber: number;
  }) => {
    const response = await fetch(
      `http://localhost:8000/automation-status/${owner}/${repo}/${issueNumber}/retry`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to retry automation: ${response.status}`);
    }

    return { issueNumber, status: "pending" };
  }
);

const issuesSlice = createSlice({
  name: "issues",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<IssuesState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearIssues: (state) => {
      state.issues = [];
    },
    updateIssueAutomationStatus: (
      state,
      action: PayloadAction<{ issueNumber: number; status: AutomationStatus }>
    ) => {
      const issue = state.issues.find(
        (issue) => issue.number === action.payload.issueNumber
      );
      if (issue) {
        issue.automation_status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload;
        state.error = null;
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch issues";
      })
      .addCase(retryAutomation.fulfilled, (state, action) => {
        const issue = state.issues.find(
          (issue) => issue.number === action.payload.issueNumber
        );
        if (issue) {
          issue.automation_status = { status: "pending" };
        }
      });
  },
});

export const {
  setFilters,
  clearError,
  clearIssues,
  updateIssueAutomationStatus,
} = issuesSlice.actions;
export default issuesSlice.reducer;
