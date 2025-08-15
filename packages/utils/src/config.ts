import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import type { Config } from '@brand-listener/types';

/**
 * Load and parse configuration from a YAML file
 */
export async function loadConfig(configPath: string): Promise<Config> {
  try {
    const configContent = await readFile(configPath, 'utf-8');
    const config = parse(configContent) as Config;
    
    // Validate required fields
    if (!config.brand?.handles?.length) {
      throw new Error('Config must include brand.handles');
    }
    
    if (!config.brand?.keywords?.length) {
      throw new Error('Config must include brand.keywords');
    }
    
    return config;
    
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error}`);
  }
}
