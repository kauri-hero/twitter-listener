import type { SlackSinkConfig, SinkResult, SlackMessagePayload, SlackBlock, Hit } from '@brand-listener/types';

export class SlackSink {
  constructor(private config: SlackSinkConfig) {}

  async sendHits(hits: Hit[]): Promise<SinkResult[]> {
    if (hits.length === 0) {
      return [];
    }

    try {
      const result = await this.sendBatchedHits(hits);
      // Return array with single result for all hits
      return [result];
    } catch (error) {
      return [{
        success: false,
        error: `Failed to send batch: ${error}`
      }];
    }
  }

  private async sendBatchedHits(hits: Hit[]): Promise<SinkResult> {
    const webhookUrl = this.config.webhook_url || this.config.webhookUrl;
    
    if (!webhookUrl) {
      return {
        success: false,
        error: `Slack webhook URL not configured`
      };
    }

    const payload = this.buildBatchedSlackMessage(hits);
  
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload) 
    });

    if (response.status === 200) {
      return {
        success: true,
        metadata: { 
          slack_ts: Date.now().toString(),
          hits_count: hits.length
        }
      };
    } else {
      const errorText = await response.text();
      
      return {
        success: false,
        error: `Slack API error: ${response.status} - ${errorText}`
      };
    }
  }

  async sendSingleHit(hit: Hit): Promise<SinkResult> {
    try {
      const webhookUrl = this.config.webhook_url || this.config.webhookUrl;
      
      if (!webhookUrl) {
        return {
          success: false,
          error: `Slack webhook URL not configured`
        };
      }

      const payload = this.buildSlackMessage(hit);
      
      console.log('🔍 Slack Debug - Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload) 
      });

      console.log('🔍 Slack Debug - Response status:', response.status);
      const responseText = await response.text(); 
      console.log('🔍 Slack Debug - Response:', responseText);
      console.log('🔍 Slack Debug - Webhook URL ends with:', webhookUrl.slice(-20));

      if (response.status === 200) {
        return {
          success: true,
          metadata: { slack_ts: Date.now().toString() }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `Slack API error: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`
      };
    }
  }

  private buildBatchedSlackMessage(hits: Hit[]): SlackMessagePayload {
    const mentionHits = hits.filter(h => h.reason === 'mentions');
    const keywordHits = hits.filter(h => h.reason === 'keywords');
    const totalHits = hits.length;
    
    const blocks: SlackBlock[] = [
      // Header with summary
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎯 *Brand Monitoring Report*\n${totalHits} new ${totalHits === 1 ? 'mention' : 'mentions'} found • ${mentionHits.length} @Send mentions • ${keywordHits.length} #sendit keywords`
        }
      },
      
      // Divider
      {
        type: 'divider'
      }
    ];

    // Add top mentions (max 5)
    if (mentionHits.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📧 Recent @Send Mentions (${mentionHits.length})*`
        }
      });

      mentionHits.slice(0, 5).forEach(hit => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${hit.author_name}* (@${hit.author_username})`
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🔗 View Tweet'
            },
            url: hit.tweet_url,
            style: 'primary'
          }
        });
      });

      if (mentionHits.length > 5) {
        blocks.push({
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: `... and ${mentionHits.length - 5} more mentions`
          }]
        });
      }
    }

    // Add top keywords (max 3)
    if (keywordHits.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🔍 Recent Keyword mentions (${keywordHits.length})*`
        }
      });

      keywordHits.slice(0, 3).forEach(hit => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${hit.author_name}* (@${hit.author_username})\n> ${this.truncateText(hit.text, 150)}`
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🔗 View'
            },
            url: hit.tweet_url
          }
        });
      });

      if (keywordHits.length > 3) {
        blocks.push({
          type: 'context',
          elements: [{
            type: 'mrkdwn',
            text: `... and ${keywordHits.length - 3} more keyword mentions`
          }]
        });
      }
    }

    // Footer with timestamp
    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `📊 Report generated at ${new Date().toLocaleString()}`
      }]
    });

    return {
      text: `Brand Monitoring: ${totalHits} new mentions found`,
      blocks
    };
  }

  private buildSlackMessage(hit: Hit): SlackMessagePayload {
    const reasonDisplay = hit.reason === 'mentions' ? 'MENTION' : 
                         hit.reason === 'keywords' ? 'KEYWORD' : 
                         hit.reason.toUpperCase();
    const confidencePercent = (hit.confidence * 100).toFixed(0);
    const matchType = hit.reason === 'mentions' ? 'mentioned @Send' : 'used #sendit';
    
    const blocks: SlackBlock[] = [
      // Clean header with brand context
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎯 *Brand ${reasonDisplay}* • ${confidencePercent}% confidence\n*${hit.author_name}* (@${hit.author_username}) ${matchType}`
        }
      },
      
      // Tweet content
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `> ${this.truncateText(hit.text, 200)}`
        }
      },
      
      // Compact metadata
      {
        type: 'context',
        elements: [
          {
            type: "mrkdwn",
            text: `👥 ${hit.author_followers.toLocaleString()} followers • 📅 ${this.formatDate(hit.created_at_utc)} • 🗣️ ${hit.language?.toUpperCase() || 'EN'}`
          }
        ]
      },

      // Action buttons
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🔗 View Tweet'
            },
            url: hit.tweet_url,
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '👤 Profile'
            },
            url: `https://twitter.com/${hit.author_username}`
          }
        ]
      }
    ];

    return {
      text: `Brand ${reasonDisplay}: ${hit.author_username} ${matchType}`,
      blocks
    };
  }

  private formatDate(utcDate: string): string {
    const date = new Date(utcDate);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
