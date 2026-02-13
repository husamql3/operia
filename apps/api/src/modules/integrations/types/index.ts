// Notion Types
export interface NotionTokenResponse {
  access_token: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string | null;
  bot_id: string;
  owner: {
    type: string;
    user: {
      object: string;
      id: string;
      name: string | null;
      avatar_url: string | null;
      type: string;
      person: {
        email: string;
      };
    };
  };
  duplicated_template_id: string | null;
}

export interface NotionSearchResponse {
  results: Array<{
    id: string;
    url: string;
    parent: {
      type: 'workspace' | 'database_id' | 'page_id';
    };
    properties: {
      title?: {
        title: Array<{
          plain_text: string;
        }>;
      };
    };
  }>;
}

export interface NotionPageData {
  id: string;
  title: string;
  url: string;
}

export type NotionPagesMap = Record<string, NotionPageData>;

// GitHub Types
export interface GitHubTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

export interface GitHubUserResponse {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    id: number;
    type: string;
  };
  repository_selection: 'all' | 'selected';
  access_tokens_url: string;
  repositories_url: string;
  html_url: string;
  app_id: number;
  app_slug: string;
  target_id: number;
  target_type: string;
  permissions: Record<string, string>;
  events: string[];
  created_at: string;
  updated_at: string;
  single_file_name: string | null;
  has_multiple_single_files: boolean;
  single_file_paths: string[];
  suspended_by: string | null;
  suspended_at: string | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
}

export interface GitHubIssueSimplified {
  number: number;
  title: string;
  body: string | null;
  url: string;
  repository: string;
  assignee: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  comments: number;
}
