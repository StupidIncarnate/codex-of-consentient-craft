import { ContextStub } from '@dungeonmaster/shared/contracts';

import { questArrayUpsertTransformer } from './quest-array-upsert-transformer';

type Context = ReturnType<typeof ContextStub>;

describe('questArrayUpsertTransformer', () => {
  describe('adding new items', () => {
    it('VALID: {existing: [], updates: [item]} => adds new item', () => {
      const existing: Context[] = [];
      const newContext = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Item',
        description: 'A new item',
        locator: { page: '/new' },
      });
      const updates = [newContext];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Item',
        description: 'A new item',
        locator: { page: '/new' },
      });
    });

    it('VALID: {existing: [item1], updates: [item2]} => adds without modifying existing', () => {
      const existingContext = ContextStub({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Existing',
        description: 'Existing item',
        locator: { page: '/existing' },
      });
      const newContext = ContextStub({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'New',
        description: 'New item',
        locator: { page: '/new' },
      });
      const existing = [existingContext];
      const updates = [newContext];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Existing');
      expect(result[1]?.name).toBe('New');
    });
  });

  describe('updating existing items', () => {
    it('VALID: {existing: [item], updates: [same id, different values]} => updates item', () => {
      const existingContext = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Old Name',
        description: 'Old description',
        locator: { page: '/old' },
      });
      const updatedContext = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Name',
        description: 'New description',
        locator: { page: '/new' },
      });
      const existing = [existingContext];
      const updates = [updatedContext];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Name',
        description: 'New description',
        locator: { page: '/new' },
      });
    });

    it('VALID: {partial update} => merges fields', () => {
      const existingContext = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Original Name',
        description: 'Original description',
        locator: { page: '/original' },
      });
      const updatedContext = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Updated Name',
        description: 'Original description',
        locator: { page: '/original' },
      });
      const existing = [existingContext];
      const updates = [updatedContext];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Updated Name');
      expect(result[0]?.description).toBe('Original description');
    });
  });

  describe('mixed operations', () => {
    it('VALID: {existing: [a, b], updates: [a updated, c new]} => updates a, keeps b, adds c', () => {
      const contextA = ContextStub({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Item A',
        description: 'A',
        locator: { page: '/a' },
      });
      const contextB = ContextStub({
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Item B',
        description: 'B',
        locator: { page: '/b' },
      });
      const contextAUpdated = ContextStub({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Item A Updated',
        description: 'A updated',
        locator: { page: '/a-updated' },
      });
      const contextC = ContextStub({
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Item C',
        description: 'C',
        locator: { page: '/c' },
      });
      const existing = [contextA, contextB];
      const updates = [contextAUpdated, contextC];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(3);
      expect(result[0]?.name).toBe('Item A Updated');
      expect(result[1]?.name).toBe('Item B');
      expect(result[2]?.name).toBe('Item C');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {existing: [], updates: []} => returns empty array', () => {
      const existing: Context[] = [];
      const updates: Context[] = [];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {existing: [items], updates: []} => returns existing unchanged', () => {
      const existingContext = ContextStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Existing',
        description: 'Existing item',
        locator: { page: '/existing' },
      });
      const existing = [existingContext];
      const updates: Context[] = [];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Existing');
    });
  });
});
