export interface Config {
  brand: BrandConfig;
  filters: FilterConfig;
  notify: NotifyConfig;
  thresholds: ThresholdConfig;
  sheet: SheetConfig;
}

export interface BrandConfig {
  handles: string[];
  keywords: string[];
}

export interface FilterConfig {
  lang: string;
  time_range_hours: number;
}

export interface NotifyConfig {
  slack_channel?: string; // Backward compatibility
  discord_channel?: string; // Discord-specific channel
  channel?: string; // Unified channel for both platforms
}

export interface ThresholdConfig {
  notify: number;
  log_only: number;
}

export interface SheetConfig {
  spreadsheetId: string;
  sheetName?: string;
}