import { folderConstraintsState } from './folder-constraints-state';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { FolderTypeStub } from '@dungeonmaster/shared/contracts';

describe('folderConstraintsState', () => {
  it('VALID: {folderType, content} => stores and retrieves content', () => {
    folderConstraintsState.clear();

    const folderType = FolderTypeStub({ value: 'brokers' });
    const content = ContentTextStub({ value: '**COMPLEXITY:**\n- Keep files under 300 lines' });

    folderConstraintsState.set({ folderType, content });
    const retrieved = folderConstraintsState.get({ folderType });

    expect(retrieved).toBe(content);
  });

  it('VALID: {unknown folderType} => returns undefined', () => {
    folderConstraintsState.clear();

    const folderType = FolderTypeStub({ value: 'brokers' });

    const retrieved = folderConstraintsState.get({ folderType });

    expect(retrieved).toBeUndefined();
  });

  it('VALID: clear() => removes all stored constraints', () => {
    folderConstraintsState.clear();

    const folderType1 = FolderTypeStub({ value: 'brokers' });
    const folderType2 = FolderTypeStub({ value: 'guards' });
    const content1 = ContentTextStub({ value: 'constraint 1' });
    const content2 = ContentTextStub({ value: 'constraint 2' });

    folderConstraintsState.set({ folderType: folderType1, content: content1 });
    folderConstraintsState.set({ folderType: folderType2, content: content2 });

    folderConstraintsState.clear();

    expect(folderConstraintsState.get({ folderType: folderType1 })).toBeUndefined();
    expect(folderConstraintsState.get({ folderType: folderType2 })).toBeUndefined();
  });

  it('VALID: getAll() => returns Map with all stored constraints', () => {
    folderConstraintsState.clear();

    const folderType1 = FolderTypeStub({ value: 'brokers' });
    const folderType2 = FolderTypeStub({ value: 'guards' });
    const content1 = ContentTextStub({ value: 'constraint 1' });
    const content2 = ContentTextStub({ value: 'constraint 2' });

    folderConstraintsState.set({ folderType: folderType1, content: content1 });
    folderConstraintsState.set({ folderType: folderType2, content: content2 });

    const allConstraints = folderConstraintsState.getAll();

    expect(allConstraints.size).toBe(2);
    expect(allConstraints.get(folderType1)).toBe(content1);
    expect(allConstraints.get(folderType2)).toBe(content2);
  });

  it('VALID: set() => overwrites existing content for same folderType', () => {
    folderConstraintsState.clear();

    const folderType = FolderTypeStub({ value: 'brokers' });
    const content1 = ContentTextStub({ value: 'old content' });
    const content2 = ContentTextStub({ value: 'new content' });

    folderConstraintsState.set({ folderType, content: content1 });
    folderConstraintsState.set({ folderType, content: content2 });

    const retrieved = folderConstraintsState.get({ folderType });

    expect(retrieved).toBe(content2);
  });
});
