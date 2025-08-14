import type { DetectionResult, Hit } from '../../types.js';

export interface SlackSinkConfig {
  webhook_url: string;
  channel: string;
}

export interface SheetsSinkConfig {
  spreadsheet_id: string;
  sheet_name?: string;
}

export interface SinkResult {
  success: boolean;
  error?: string;
  metadata?: any;
}

export interface SlackMessagePayload {
  text: string;
  blocks: SlackBlock[];
  channel?: string;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  elements?: SlackElement[];
  fields?: SlackField[];
  accessory?: SlackAccessory;
}

export interface SlackElement {
  type: string;
  text?: string | {
    type: string;
    text: string;
  };
  url?: string;
  value?: string;
  style?: string;
}

export interface SlackField {
  type: string;
  text: string;
  short?: boolean;
}

export interface SlackAccessory {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  url?: string;
  image_url?: string;
  alt_text?: string;
}
