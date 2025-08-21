import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import type { Config } from '@brand-listener/types';

export async function loadConfig(configPath: string = 'config.yaml'): Promise<Config> {
  try {
    const configFile = await readFile(configPath, 'utf8');
    const config = parse(configFile) as Config;
    
    validateConfig(config);
    return config;
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
}

function validateConfig(config: Config): void {
  // Validate handles - allow empty array but warn
  if (!config.brand?.handles) {
    throw new Error('Config must include brand.handles array');
  }
  
  if (!Array.isArray(config.brand.handles)) {
    throw new Error('Config brand.handles must be an array');
  }
  
  // Filter out empty strings and warn about them
  const validHandles = config.brand.handles.filter(handle => handle && handle.trim() !== '');
  if (validHandles.length !== config.brand.handles.length) {
    console.warn('⚠️ Warning: Some handles in config are empty strings and will be ignored');
  }
  
  if (validHandles.length === 0) {
    console.warn('⚠️ Warning: No valid handles configured - mentions monitoring will be skipped');
  }
  
  // Validate keywords - allow empty array but warn
  if (!config.brand?.keywords) {
    throw new Error('Config must include brand.keywords array');
  }
  
  if (!Array.isArray(config.brand.keywords)) {
    throw new Error('Config brand.keywords must be an array');
  }
  
  // Filter out empty strings and warn about them
  const validKeywords = config.brand.keywords.filter(keyword => keyword && keyword.trim() !== '');
  if (validKeywords.length !== config.brand.keywords.length) {
    console.warn('⚠️ Warning: Some keywords in config are empty strings and will be ignored');
  }
  
  if (validKeywords.length === 0) {
    console.warn('⚠️ Warning: No valid keywords configured - keyword monitoring will be skipped');
  }
  
  // Require at least one valid source
  if (validHandles.length === 0 && validKeywords.length === 0) {
    throw new Error('Config must include at least one valid handle or keyword to monitor');
  }
  
  if (!config.sheet?.spreadsheetId) {
    throw new Error('Config must include sheet.spreadsheetId');
  }
  
  // Check for at least one notification channel (Slack or Discord)
  if (!config.notify?.slack_channel && !config.notify?.discord_channel && !config.notify?.channel) {
    throw new Error('Config must include at least one notification channel: notify.slack_channel, notify.discord_channel, or notify.channel');
  }
  
  if (typeof config.thresholds?.notify !== 'number' || config.thresholds.notify < 0 || config.thresholds.notify > 1) {
    throw new Error('Config thresholds.notify must be a number between 0 and 1');
  }
  
  if (typeof config.thresholds?.log_only !== 'number' || config.thresholds.log_only < 0 || config.thresholds.log_only > 1) {
    throw new Error('Config thresholds.log_only must be a number between 0 and 1');
  }
}

export function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value || '';
}

export function validateEnvVars(): void {
  getEnvVar('TWITTER_API_KEY');
  
  // Check for at least one webhook URL (Slack or Discord)
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  
  if (!slackWebhook && !discordWebhook) {
    throw new Error('At least one webhook URL must be set: SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL');
  }
  
  getEnvVar('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  
  // Optional for Vision API
  getEnvVar('GOOGLE_PROJECT_ID', false);
}
