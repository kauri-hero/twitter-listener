import type { DiscordSinkConfig, SinkResult, DiscordMessagePayload, DiscordEmbed, DiscordField, Hit } from '@brand-listener/types';

export class DiscordSink {
  constructor(private config: DiscordSinkConfig) {}

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
        error: `Discord webhook URL not configured`
      };
    }

    const payload = this.buildBatchedDiscordMessage(hits);
  
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload) 
    });

    if (response.status === 204) { // Discord returns 204 on success
      return {
        success: true,
        metadata: { 
          discord_ts: Date.now().toString(),
          hits_count: hits.length
        }
      };
    } else {
      const errorText = await response.text();
      
      return {
        success: false,
        error: `Discord API error: ${response.status} - ${errorText}`
      };
    }
  }

  async sendSingleHit(hit: Hit): Promise<SinkResult> {
    try {
      const webhookUrl = this.config.webhook_url || this.config.webhookUrl;
      
      if (!webhookUrl) {
        return {
          success: false,
          error: `Discord webhook URL not configured`
        };
      }

      const payload = this.buildDiscordMessage(hit);
      
      console.log('🔍 Discord Debug - Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload) 
      });

      console.log('🔍 Discord Debug - Response status:', response.status);
      const responseText = await response.text(); 
      console.log('🔍 Discord Debug - Response:', responseText);
      console.log('🔍 Discord Debug - Webhook URL ends with:', webhookUrl.slice(-20));

      if (response.status === 204) { // Discord returns 204 on success
        return {
          success: true,
          metadata: { discord_ts: Date.now().toString() }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `Discord API error: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`
      };
    }
  }

  private buildBatchedDiscordMessage(hits: Hit[]): DiscordMessagePayload {
    const mentionHits = hits.filter(h => h.reason === 'mentions');
    const keywordHits = hits.filter(h => h.reason === 'keywords');
    const totalHits = hits.length;
    
    const embed: DiscordEmbed = {
      title: '🎯 Brand Monitoring Report',
      description: `${totalHits} new ${totalHits === 1 ? 'mention' : 'mentions'} found • ${mentionHits.length} @Send mentions • ${keywordHits.length} #sendit keywords`,
      color: 0x00ff00, // Green color
      fields: [],
      footer: {
        text: `Report generated at ${new Date().toLocaleString()}`
      },
      timestamp: new Date().toISOString()
    };

    // Add top mentions (max 5)
    if (mentionHits.length > 0) {
      const mentionText = mentionHits.slice(0, 5).map(hit => 
        `• **${hit.author_name}** (@${hit.author_username})`
      ).join('\n');
      
      if (mentionHits.length > 5) {
        embed.fields!.push({
          name: `📧 Recent @Send Mentions (${mentionHits.length})`,
          value: mentionText + `\n... and ${mentionHits.length - 5} more mentions`,
          inline: false
        });
      } else {
        embed.fields!.push({
          name: `📧 Recent @Send Mentions (${mentionHits.length})`,
          value: mentionText,
          inline: false
        });
      }
    }

    // Add top keywords (max 3)
    if (keywordHits.length > 0) {
      const keywordText = keywordHits.slice(0, 3).map(hit => 
        `• **${hit.author_name}** (@${hit.author_username})\n> ${this.truncateText(hit.text, 150)}`
      ).join('\n\n');
      
      if (keywordHits.length > 3) {
        embed.fields!.push({
          name: `🔍 Recent Keyword mentions (${keywordHits.length})`,
          value: keywordText + `\n\n... and ${keywordHits.length - 3} more keyword mentions`,
          inline: false
        });
      } else {
        embed.fields!.push({
          name: `🔍 Recent Keyword mentions (${keywordHits.length})`,
          value: keywordText,
          inline: false
        });
      }
    }

    return {
      content: `Brand Monitoring: ${totalHits} new mentions found`,
      embeds: [embed]
    };
  }

  private buildDiscordMessage(hit: Hit): DiscordMessagePayload {
    const reasonDisplay = hit.reason === 'mentions' ? 'MENTION' : 
                         hit.reason === 'keywords' ? 'KEYWORD' : 
                         hit.reason.toUpperCase();
    const confidencePercent = (hit.confidence * 100).toFixed(0);
    const matchType = hit.reason === 'mentions' ? 'mentioned @Send' : 'used #sendit';
    
    // Determine color based on reason
    const color = hit.reason === 'mentions' ? 0x00ff00 : 0xffa500; // Green for mentions, Orange for keywords
    
    const embed: DiscordEmbed = {
      title: `🎯 Brand ${reasonDisplay} • ${confidencePercent}% confidence`,
      description: `**${hit.author_name}** (@${hit.author_username}) ${matchType}`,
      color: color,
      fields: [
        {
          name: 'Tweet Content',
          value: `> ${this.truncateText(hit.text, 200)}`,
          inline: false
        },
        {
          name: 'Metadata',
          value: `👥 ${hit.author_followers.toLocaleString()} followers • 📅 ${this.formatDate(hit.created_at_utc)} • 🗣️ ${hit.language?.toUpperCase() || 'EN'}`,
          inline: false
        }
      ],
      footer: {
        text: `Tweet ID: ${hit.tweet_id}`
      },
      timestamp: hit.created_at_utc
    };

    return {
      content: `Brand ${reasonDisplay}: ${hit.author_username} ${matchType}`,
      embeds: [embed]
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
