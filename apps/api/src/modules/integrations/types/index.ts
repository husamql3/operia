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
