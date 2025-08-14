import { buildExplicitQuery, buildImageOnlyQuery, toSinceUTCString } from '../src/services/twitter/queries.js';

describe('Twitter Query Builders', () => {
  describe('buildExplicitQuery', () => {
    test('should build basic explicit query', () => {
      const keywords = ['mybrand', 'my product'];
      const result = buildExplicitQuery(keywords, 'en', '2024-01-01_12:00:00_UTC');
      
      expect(result).toBe('("mybrand" OR "my product") lang:en -is:retweet since:2024-01-01_12:00:00_UTC');
    });

    test('should handle single keyword', () => {
      const keywords = ['onlybrand'];
      const result = buildExplicitQuery(keywords, 'en', '2024-01-01_12:00:00_UTC');
      
      expect(result).toBe('("onlybrand") lang:en -is:retweet since:2024-01-01_12:00:00_UTC');
    });
  });

  describe('buildImageOnlyQuery', () => {
    test('should build image-only query excluding brand terms', () => {
      const excludeTerms = ['@mybrand', 'mybrand', '#mybrand'];
      const result = buildImageOnlyQuery(excludeTerms, 'en', '2024-01-01_12:00:00_UTC');
      
      expect(result).toBe('has:images -(@mybrand OR "mybrand" OR #mybrand) lang:en -is:retweet since:2024-01-01_12:00:00_UTC');
    });

    test('should handle mixed term types', () => {
      const excludeTerms = ['@handle', '#hashtag', 'keyword'];
      const result = buildImageOnlyQuery(excludeTerms, 'en', '2024-01-01_12:00:00_UTC');
      
      expect(result).toBe('has:images -(@handle OR #hashtag OR "keyword") lang:en -is:retweet since:2024-01-01_12:00:00_UTC');
    });
  });

  describe('toSinceUTCString', () => {
    test('should format date correctly', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = toSinceUTCString(date);
      
      expect(result).toBe('2024-01-15_14:30:45_UTC');
    });

    test('should pad single digits', () => {
      const date = new Date('2024-03-05T08:09:07.000Z');
      const result = toSinceUTCString(date);
      
      expect(result).toBe('2024-03-05_08:09:07_UTC');
    });
  });
});
