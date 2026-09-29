import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { seedBindingLineTransformer } from './seed-binding-line-transformer';

describe('seedBindingLineTransformer', () => {
  it('VALID: {bare id} => the id alone', () => {
    const result = seedBindingLineTransformer({
      binding: ContentTextStub({ value: 'guildSlug' }),
      value: ContentTextStub({ value: 'siege-guild' }),
    });

    expect(result).toBe('  guildSlug: siege-guild');
  });

  it('VALID: {row with id, title, status} => id plus the two identity fields', () => {
    const result = seedBindingLineTransformer({
      binding: ContentTextStub({ value: 'quest' }),
      value: { id: 'd4581716', title: 'Advancing quest', status: 'in_progress', extra: 1 },
    });

    expect(result).toBe('  quest: d4581716 (title: Advancing quest, status: in_progress)');
  });

  it('EDGE: {row with no id or identity fields} => dash and no parenthetical', () => {
    const result = seedBindingLineTransformer({
      binding: ContentTextStub({ value: 'blob' }),
      value: { count: 3 },
    });

    expect(result).toBe('  blob: -');
  });

  it('EMPTY: {value: undefined} => dash', () => {
    const result = seedBindingLineTransformer({
      binding: ContentTextStub({ value: 'gone' }),
      value: undefined,
    });

    expect(result).toBe('  gone: -');
  });
});
