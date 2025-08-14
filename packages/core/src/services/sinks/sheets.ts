import { google } from 'googleapis';
import type { Hit } from '../../types.js';
import type { SheetsSinkConfig, SinkResult } from './types.js';

export class SheetsSink {
  private sheets: any;
  private auth: any;

  constructor(private config: SheetsSinkConfig) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (credentialsJson) {
      const credentials = JSON.parse(Buffer.from(credentialsJson, 'base64').toString());
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } else {
      // Fall back to default credentials (for local development)
      this.auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    }
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async appendHits(hits: Hit[]): Promise<SinkResult> {
    if (hits.length === 0) {
      return { success: true, metadata: { rows_added: 0 } };
    }

    try {
      // Ensure the sheet has headers
      await this.ensureHeaders();
      
      // Convert hits to rows
      const rows = hits.map(hit => this.hitToRow(hit));
      
      // Append to sheet
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheet_id,
        range: `${this.config.sheet_name || 'hits_log'}!A:R`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: rows
        }
      });

      return {
        success: true,
        metadata: {
          rows_added: rows.length,
          updated_range: response.data.updates?.updatedRange
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to append to Google Sheets: ${error}`
      };
    }
  }

  private async ensureHeaders(): Promise<void> {
    const sheetName = this.config.sheet_name || 'hits_log';
    
    try {
      // Check if headers exist
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheet_id,
        range: `${sheetName}!1:1`
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Add headers
        const headers = [
          'run_id',
          'captured_at_utc',
          'tweet_id',
          'tweet_url',
          'author_username',
          'author_name',
          'author_followers',
          'created_at_utc',
          'text',
          'language',
          'media_urls',
          'reason',
          'explicit_terms',
          'image_explanations',
          'confidence',
          'decision',
          'slack_ts',
          'errors'
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheet_id,
          range: `${sheetName}!1:1`,
          valueInputOption: 'RAW',
          resource: {
            values: [headers]
          }
        });
      }
    } catch (error) {
      console.warn('Could not ensure headers:', error);
      // Continue anyway - might be a permissions issue
    }
  }

  private hitToRow(hit: Hit): any[] {
    return [
      hit.run_id,
      hit.captured_at_utc,
      hit.tweet_id,
      hit.tweet_url,
      hit.author_username,
      hit.author_name,
      hit.author_followers,
      hit.created_at_utc,
      hit.text,
      hit.language || '',
      hit.media_urls.join(', '),
      hit.reason,
      hit.explicit_terms.join(', '),
      hit.image_explanations.join('; '),
      hit.confidence,
      hit.decision,
      hit.slack_ts || '',
      hit.errors.join('; ')
    ];
  }
}

export class SheetsStateStore {
  private sheets: any;
  private auth: any;
  private sheetName = 'config_state';

  constructor(private spreadsheetId: string) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (credentialsJson) {
      const credentials = JSON.parse(Buffer.from(credentialsJson, 'base64').toString());
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } else {
      this.auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    }
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async get(key: string): Promise<string | null> {
    try {
      await this.ensureStateSheet();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:B`
      });

      const rows = response.data.values || [];
      const row = rows.find((r: any[]) => r[0] === key);
      return row ? row[1] || null : null;
    } catch (error) {
      console.error(`Failed to get state ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.setMultiple({ [key]: value });
  }

  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    
    for (const key of keys) {
      result[key] = await this.get(key);
    }
    
    return result;
  }

  async setMultiple(data: Record<string, string>): Promise<void> {
    try {
      await this.ensureStateSheet();
      
      // Get existing data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:B`
      });

      const existingRows = response.data.values || [];
      const rowMap = new Map<string, number>();
      
      // Build map of existing keys to row indices
      existingRows.forEach((row: any[], index: number) => {
        if (row[0]) {
          rowMap.set(row[0], index);
        }
      });

      // Update or append rows
      const updates: any[] = [];
      for (const [key, value] of Object.entries(data)) {
        const existingRowIndex = rowMap.get(key);
        if (existingRowIndex !== undefined) {
          // Update existing row
          updates.push({
            range: `${this.sheetName}!A${existingRowIndex + 1}:B${existingRowIndex + 1}`,
            values: [[key, value]]
          });
        } else {
          // Append new row
          existingRows.push([key, value]);
        }
      }

      // Perform updates
      if (updates.length > 0) {
        await this.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            valueInputOption: 'RAW',
            data: updates
          }
        });
      }

      // Append new rows if any
      const newRows = existingRows.slice(response.data.values?.length || 0);
      if (newRows.length > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:B`,
          valueInputOption: 'RAW',
          resource: {
            values: newRows
          }
        });
      }
    } catch (error) {
      console.error('Failed to set state:', error);
      throw error;
    }
  }

  private async ensureStateSheet(): Promise<void> {
    try {
      // Try to get the sheet first
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1`
      });
    } catch (error) {
      // Sheet probably doesn't exist, create it
      try {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: this.sheetName,
                  hidden: true
                }
              }
            }]
          }
        });

        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1:B1`,
          valueInputOption: 'RAW',
          resource: {
            values: [['key', 'value']]
          }
        });
      } catch (createError) {
        console.warn('Could not create state sheet:', createError);
      }
    }
  }
}
