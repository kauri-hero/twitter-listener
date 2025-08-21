// Sink Configuration Types
export interface SheetsSinkConfig {
  spreadsheetId: string;
  sheetName?: string;
  credentialsPath?: string;
  serviceAccountKey?: any;
}

export interface SlackSinkConfig {
  webhookUrl?: string;
  webhook_url?: string; // Support both naming conventions
  token?: string;
  channel: string;
}

export interface DiscordSinkConfig {
  webhookUrl?: string;
  webhook_url?: string; // Support both naming conventions
  channel?: string; // Optional for Discord (webhook is channel-specific)
}

// Sink Result Types
export interface SinkResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  metadata?: any;
}

// Slack Message Types
export interface SlackMessagePayload {
  text?: string;
  blocks?: SlackBlock[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'actions' | 'context' | 'image';
  text?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
  fields?: Array<{
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }>;
  accessory?: {
    type: string;
    [key: string]: any;
  };
  elements?: any[];
  image_url?: string;
  alt_text?: string;
}

// Discord Message Types
export interface DiscordMessagePayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  thumbnail?: { url: string };
  footer?: { text: string };
  timestamp?: string;
}

export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}
