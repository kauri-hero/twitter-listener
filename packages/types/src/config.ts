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
  slack_channel: string;
}

export interface ThresholdConfig {
  notify: number;
  log_only: number;
}

export interface SheetConfig {
  spreadsheetId: string;
  sheetName?: string;
}