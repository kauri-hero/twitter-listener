import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import type { Config } from './types.js';

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
  if (!config.brand?.handles?.length) {
    throw new Error('Config must include brand.handles array');
  }
  
  if (!config.brand?.keywords?.length) {
    throw new Error('Config must include brand.keywords array');
  }
  
  if (!config.sheet?.spreadsheetId) {
    throw new Error('Config must include sheet.spreadsheetId');
  }
  
  if (!config.notify?.slack_channel) {
    throw new Error('Config must include notify.slack_channel');
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
  getEnvVar('SLACK_WEBHOOK_URL');
  getEnvVar('GOOGLE_APPLICATION_CREDENTIALS');
  
  // Optional for Vision API
  getEnvVar('GOOGLE_PROJECT_ID', false);
}
