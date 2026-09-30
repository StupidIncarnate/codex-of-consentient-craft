import { folderConstraintsState } from './folder-constraints-state';

describe('folderConstraintsState', () => {
  it('VALID: {folderType, content} => stores and retrieves content', () => {
    folderConstraintsState.clear();

    const folderType = 'brokers';
    const content = '**COMPLEXITY:**\n- Keep files under 300 lines';

    folderConstraintsState.set({ folderType, content });
    const retrieved = folderConstraintsState.get({ folderType });

    expect(retrieved).toBe(content);
  });

  it('VALID: {unknown folderType} => returns undefined', () => {
    folderConstraintsState.clear();

    const folderType = 'brokers';

    const retrieved = folderConstraintsState.get({ folderType });

    expect(retrieved).toBe(undefined);
  });

  it('VALID: clear() => removes all stored constraints', () => {
    folderConstraintsState.clear();

    const folderType1 = 'brokers';
    const folderType2 = 'guards';
    const content1 = 'constraint 1';
    const content2 = 'constraint 2';

    folderConstraintsState.set({ folderType: folderType1, content: content1 });
    folderConstraintsState.set({ folderType: folderType2, content: content2 });

    folderConstraintsState.clear();

    expect(folderConstraintsState.get({ folderType: folderType1 })).toBe(undefined);
    expect(folderConstraintsState.get({ folderType: folderType2 })).toBe(undefined);
  });

  it('VALID: getAll() => returns Map with all stored constraints', () => {
    folderConstraintsState.clear();

    const folderType1 = 'brokers';
    const folderType2 = 'guards';
    const content1 = 'constraint 1';
    const content2 = 'constraint 2';

    folderConstraintsState.set({ folderType: folderType1, content: content1 });
    folderConstraintsState.set({ folderType: folderType2, content: content2 });

    const allConstraints = folderConstraintsState.getAll();

    expect(allConstraints.size).toBe(2);
    expect(allConstraints.get(folderType1)).toBe(content1);
    expect(allConstraints.get(folderType2)).toBe(content2);
  });

  it('VALID: set() => overwrites existing content for same folderType', () => {
    folderConstraintsState.clear();

    const folderType = 'brokers';
    const content1 = 'old content';
    const content2 = 'new content';

    folderConstraintsState.set({ folderType, content: content1 });
    folderConstraintsState.set({ folderType, content: content2 });

    const retrieved = folderConstraintsState.get({ folderType });

    expect(retrieved).toBe(content2);
  });
});
