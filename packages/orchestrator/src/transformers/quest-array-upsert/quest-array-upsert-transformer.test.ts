import { ContextStub, DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questArrayUpsertTransformer } from './quest-array-upsert-transformer';

describe('questArrayUpsertTransformer', () => {
  it('VALID: {new item} => adds to array', () => {
    const existing = [ContextStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'A' })];
    const updates = [ContextStub({ id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'B' })];

    const result = questArrayUpsertTransformer({ existing, updates });

    expect(result).toHaveLength(2);
  });

  it('VALID: {existing item} => updates in place', () => {
    const existing = [ContextStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Old' })];
    const updates = [ContextStub({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'New' })];

    const result = questArrayUpsertTransformer({ existing, updates });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('New');
  });

  it('VALID: {empty existing} => adds all updates', () => {
    const updates = [DependencyStepStub({ name: 'Step 1' })];

    const result = questArrayUpsertTransformer({ existing: [], updates });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Step 1');
  });

  it('VALID: {empty updates} => preserves existing', () => {
    const existing = [ContextStub({ name: 'Existing' })];

    const result = questArrayUpsertTransformer({ existing, updates: [] });

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Existing');
  });
});
