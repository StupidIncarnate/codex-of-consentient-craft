import { settleRequestShapeTransformer } from './settle-request-shape-transformer';

describe('settleRequestShapeTransformer', () => {
  describe('query strings a poll varies', () => {
    it('VALID: {GET, url with ?since=1700} => returns "GET http://localhost:3737/api/quests"', () => {
      const result = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/api/quests?since=1700',
      });

      expect(result).toBe('GET http://localhost:3737/api/quests');
    });

    it('VALID: {two cursors of one poll} => both collapse to the same shape', () => {
      const first = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/api/quests?since=1700',
      });
      const second = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/api/quests?since=1750',
      });

      expect(second).toBe(String(first));
    });

    it('VALID: {url with a fragment after the query} => drops both', () => {
      const result = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/api/quests?since=1700#top',
      });

      expect(result).toBe('GET http://localhost:3737/api/quests');
    });

    it('VALID: {url with a fragment and no query} => drops the fragment', () => {
      const result = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/app#/quests',
      });

      expect(result).toBe('GET http://localhost:3737/app');
    });
  });

  describe('parts that stay', () => {
    it('VALID: {two different id path segments} => stay two different shapes', () => {
      const first = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/api/quests/a',
      });
      const second = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/api/quests/b',
      });

      expect(`${String(first)} | ${String(second)}`).toBe(
        'GET http://localhost:3737/api/quests/a | GET http://localhost:3737/api/quests/b',
      );
    });

    it('VALID: {POST and GET on one path} => stay two different shapes', () => {
      const get = settleRequestShapeTransformer({
        method: 'GET',
        url: 'http://localhost:3737/api/quests',
      });
      const post = settleRequestShapeTransformer({
        method: 'POST',
        url: 'http://localhost:3737/api/quests',
      });

      expect(`${String(get)} | ${String(post)}`).toBe(
        'GET http://localhost:3737/api/quests | POST http://localhost:3737/api/quests',
      );
    });

    it('VALID: {method: "get"} => upper-cases the method', () => {
      const result = settleRequestShapeTransformer({
        method: 'get',
        url: 'http://localhost:3737/api/quests',
      });

      expect(result).toBe('GET http://localhost:3737/api/quests');
    });
  });

  describe('edge inputs', () => {
    it('EMPTY: {url: ""} => returns the method and a trailing space', () => {
      const result = settleRequestShapeTransformer({ method: 'GET', url: '' });

      expect(result).toBe('GET ');
    });

    it('EDGE: {url: "?only=query"} => keeps the empty path', () => {
      const result = settleRequestShapeTransformer({ method: 'GET', url: '?only=query' });

      expect(result).toBe('GET ');
    });
  });
});
