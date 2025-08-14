import { request } from 'undici';
import type { DetectionResult, Hit } from '../../types.js';
import type { SlackSinkConfig, SinkResult, SlackMessagePayload, SlackBlock } from './types.js';

export class SlackSink {
  constructor(private config: SlackSinkConfig) {}

  async sendHits(hits: Hit[]): Promise<SinkResult[]> {
    const results: SinkResult[] = [];
    
    for (const hit of hits) {
      try {
        const result = await this.sendSingleHit(hit);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: `Failed to send hit ${hit.tweet_id}: ${error}`
        });
      }
    }
    
    return results;
  }

  async sendSingleHit(hit: Hit): Promise<SinkResult> {
    try {
      const payload = this.buildSlackMessage(hit);
      
      const response = await request(this.config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.statusCode === 200) {
        return {
          success: true,
          metadata: { slack_ts: Date.now().toString() }
        };
      } else {
        const errorText = await response.body.text();
        return {
          success: false,
          error: `Slack API error: ${response.statusCode} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`
      };
    }
  }

  private buildSlackMessage(hit: Hit): SlackMessagePayload {
    const reasonDisplay = hit.reason === 'explicit_text' ? 'EXPLICIT' : 'IMAGE-IMPLICIT';
    const confidencePercent = (hit.confidence * 100).toFixed(0);
    
    const blocks: SlackBlock[] = [
      // Header
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🔍 Brand hit — ${reasonDisplay} (${confidencePercent}%)`
        }
      },
      
      // Tweet content
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${hit.author_name}* (@${hit.author_username}) • ${hit.author_followers.toLocaleString()} followers\n\n${this.truncateText(hit.text, 280)}`
        },
        accessory: hit.media_urls.length > 0 ? {
          type: 'image',
          image_url: hit.media_urls[0],
          alt_text: 'Tweet image'
        } : undefined
      }
    ];

    // Context information
    const contextElements = [
      `📅 ${new Date(hit.created_at_utc).toLocaleString()}`,
      `🗣️ ${hit.language || 'unknown'}`
    ];

    if (hit.explicit_terms.length > 0) {
      contextElements.push(`🎯 Matched: ${hit.explicit_terms.join(', ')}`);
    }

    if (hit.image_explanations.length > 0) {
      contextElements.push(`🖼️ ${hit.image_explanations.join('; ')}`);
    }

    blocks.push({
      type: 'context',
      elements: contextElements.map(text => ({
        type: "mrkdwn",
        text: text
      }))
    });

    // Actions
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Open Tweet'
          },
          url: hit.tweet_url,
          style: 'primary'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Profile'
          },
          url: `https://twitter.com/${hit.author_username}`
        }
      ]
    });

    return {
      text: `Brand mention detected: ${hit.author_username}`,
      blocks,
      channel: this.config.channel
    };
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
