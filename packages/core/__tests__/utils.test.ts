import { makeDecision, generateRunId, detectionResultToHit } from '../src/utils.js';
import type { DetectionResult, Config } from '../src/types.js';

describe('Utility Functions', () => {
  describe('makeDecision', () => {
    const thresholds = { notify: 0.8, log_only: 0.6 };

    test('should return notify for high confidence', () => {
      expect(makeDecision(0.85, thresholds)).toBe('notify');
      expect(makeDecision(0.8, thresholds)).toBe('notify');
    });

    test('should return log_only for medium confidence', () => {
      expect(makeDecision(0.7, thresholds)).toBe('log_only');
      expect(makeDecision(0.6, thresholds)).toBe('log_only');
    });

    test('should return ignore for low confidence', () => {
      expect(makeDecision(0.5, thresholds)).toBe('ignore');
      expect(makeDecision(0.1, thresholds)).toBe('ignore');
    });
  });

  describe('generateRunId', () => {
    test('should generate unique run IDs', () => {
      const id1 = generateRunId();
      const id2 = generateRunId();
      
      expect(id1).toMatch(/^run_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^run_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('detectionResultToHit', () => {
    const mockConfig: Config = {
      brand: { handles: ['@test'], keywords: ['test'] },
      filters: { lang: 'en', include_replies: true, include_quotes: true },
      image: { backend: 'gcp-vision', logoThreshold: 0.8, clipThreshold: 0.3 },
      notify: { slack_channel: '#test' },
      thresholds: { notify: 0.8, log_only: 0.6 },
      sheet: { spreadsheetId: 'test' },
      state: { storage: 'file' }
    };

    const mockResult: DetectionResult = {
      tweet: {
        id: '123456789',
        url: 'https://twitter.com/user/status/123456789',
        text: 'Test tweet about @test brand',
        createdAt: '2024-01-01T12:00:00.000Z',
        author: {
          id: 'author123',
          userName: 'testuser',
          name: 'Test User',
          followersCount: 1000
        },
        entities: { hashtags: [], user_mentions: [], urls: [] }
      },
      reason: 'explicit_text',
      confidence: 0.9,
      explicit_terms: ['@test']
    };

    test('should convert detection result to hit', () => {
      const hit = detectionResultToHit(mockResult, 'test-run-id', mockConfig);
      
      expect(hit.run_id).toBe('test-run-id');
      expect(hit.tweet_id).toBe('123456789');
      expect(hit.author_username).toBe('testuser');
      expect(hit.confidence).toBe(0.9);
      expect(hit.decision).toBe('notify');
      expect(hit.explicit_terms).toEqual(['@test']);
      expect(hit.errors).toEqual([]);
    });
  });
});
