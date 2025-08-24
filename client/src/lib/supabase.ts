import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Repository = {
  id: string;
  user_id: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  created_at: string;
  updated_at: string;
  github_access?: RepositoryAccess;
};

export type Profile = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  github_auth?: GitHubAuthStatus;
};

export type GitHubAuthStatus = {
  authenticated: boolean;
  user?: {
    login: string;
    avatar_url: string;
    name?: string;
  };
  auth_url?: string;
};

export type RepositoryAccess = {
  has_access: boolean;
  error?: string;
  message?: string;
  auth_url?: string;
  repository?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
};

export type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  automation_status?: AutomationStatus;
};

export type AutomationStatus = {
  status: "pending" | "running" | "completed" | "failed" | null;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  task_id?: string;
};
