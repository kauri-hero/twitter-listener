import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { StateStore, StateConfig } from './types.js';
import { SheetsStateStore } from './services/sinks/index.js';

export function createStateStore(config: StateConfig, spreadsheetId?: string): StateStore {
  switch (config.storage) {
    case 'sheet':
      if (!spreadsheetId) {
        throw new Error('Spreadsheet ID required for sheet-based state storage');
      }
      return new SheetsStateStore(spreadsheetId);
    case 'file':
      return new FileStateStore('.state/state.json');
    default:
      throw new Error(`Unknown state storage type: ${config.storage}`);
  }
}

export class FileStateStore implements StateStore {
  constructor(private filePath: string) {}

  async get(key: string): Promise<string | null> {
    try {
      const data = await this.readState();
      return data[key] || null;
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.setMultiple({ [key]: value });
  }

  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const data = await this.readState();
      const result: Record<string, string | null> = {};
      
      for (const key of keys) {
        result[key] = data[key] || null;
      }
      
      return result;
    } catch (error) {
      return keys.reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {} as Record<string, string | null>);
    }
  }

  async setMultiple(data: Record<string, string>): Promise<void> {
    try {
      const existing = await this.readState();
      const updated = { ...existing, ...data };
      await this.writeState(updated);
    } catch (error) {
      console.error('Failed to update state:', error);
      throw error;
    }
  }

  private async readState(): Promise<Record<string, string>> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // File doesn't exist or is invalid, return empty state
      return {};
    }
  }

  private async writeState(data: Record<string, string>): Promise<void> {
    // Ensure directory exists
    await mkdir(dirname(this.filePath), { recursive: true });
    
    const content = JSON.stringify(data, null, 2);
    await writeFile(this.filePath, content, 'utf8');
  }
}
