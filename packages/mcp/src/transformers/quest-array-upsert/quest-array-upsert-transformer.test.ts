import { FlowStub } from '@dungeonmaster/shared/contracts';

import { questArrayUpsertTransformer } from './quest-array-upsert-transformer';

type Flow = ReturnType<typeof FlowStub>;

describe('questArrayUpsertTransformer', () => {
  describe('adding new items', () => {
    it('VALID: {flow items} => upserts flow types', () => {
      const existing: Flow[] = [];
      const newFlow = FlowStub({
        id: 'b12ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Login Flow',
        entryPoint: '/login',
        exitPoints: ['/dashboard'],
      });
      const updates = [newFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Login Flow');
    });

    it('VALID: {existing: [], updates: [item]} => adds new item', () => {
      const existing: Flow[] = [];
      const newFlow = FlowStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Item',
        entryPoint: '/new',
        exitPoints: ['/done'],
      });
      const updates = [newFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('New Item');
    });

    it('VALID: {existing: [item1], updates: [item2]} => adds without modifying existing', () => {
      const existingFlow = FlowStub({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Existing',
        entryPoint: '/existing',
        exitPoints: ['/done'],
      });
      const newFlow = FlowStub({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'New',
        entryPoint: '/new',
        exitPoints: ['/done'],
      });
      const existing = [existingFlow];
      const updates = [newFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Existing');
      expect(result[1]?.name).toBe('New');
    });
  });

  describe('updating existing items', () => {
    it('VALID: {existing: [item], updates: [same id, different values]} => updates item', () => {
      const existingFlow = FlowStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Old Name',
        entryPoint: '/old',
        exitPoints: ['/done'],
      });
      const updatedFlow = FlowStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'New Name',
        entryPoint: '/new',
        exitPoints: ['/updated'],
      });
      const existing = [existingFlow];
      const updates = [updatedFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('New Name');
      expect(result[0]?.entryPoint).toBe('/new');
    });

    it('VALID: {partial update} => merges fields', () => {
      const existingFlow = FlowStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Original Name',
        entryPoint: '/original',
        exitPoints: ['/done'],
      });
      const updatedFlow = FlowStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Updated Name',
        entryPoint: '/original',
        exitPoints: ['/done'],
      });
      const existing = [existingFlow];
      const updates = [updatedFlow];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Updated Name');
      expect(result[0]?.entryPoint).toBe('/original');
    });
  });

  describe('mixed operations', () => {
    it('VALID: {existing: [a, b], updates: [a updated, c new]} => updates a, keeps b, adds c', () => {
      const flowA = FlowStub({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Item A',
        entryPoint: '/a',
        exitPoints: ['/done'],
      });
      const flowB = FlowStub({
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Item B',
        entryPoint: '/b',
        exitPoints: ['/done'],
      });
      const flowAUpdated = FlowStub({
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Item A Updated',
        entryPoint: '/a-updated',
        exitPoints: ['/done'],
      });
      const flowC = FlowStub({
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Item C',
        entryPoint: '/c',
        exitPoints: ['/done'],
      });
      const existing = [flowA, flowB];
      const updates = [flowAUpdated, flowC];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(3);
      expect(result[0]?.name).toBe('Item A Updated');
      expect(result[1]?.name).toBe('Item B');
      expect(result[2]?.name).toBe('Item C');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {existing: [], updates: []} => returns empty array', () => {
      const existing: Flow[] = [];
      const updates: Flow[] = [];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {existing: [items], updates: []} => returns existing unchanged', () => {
      const existingFlow = FlowStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Existing',
        entryPoint: '/existing',
        exitPoints: ['/done'],
      });
      const existing = [existingFlow];
      const updates: Flow[] = [];

      const result = questArrayUpsertTransformer({ existing, updates });

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Existing');
    });
  });
});
