import { TreeNodeStub } from './tree-node.stub';
import { FolderNameStub } from '../folder-name/folder-name.stub';

describe('treeNodeContract', () => {
  it('VALID: {name: "guards", children: Map, items: []} => parses successfully', () => {
    const result = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [],
    });

    expect(result.name).toBe('guards');
    expect(result.children).toBeInstanceOf(Map);
    expect(result.items).toStrictEqual([]);
  });

  it('VALID: {name: "brokers", children: Map, items: [item]} => parses successfully with items', () => {
    const result = TreeNodeStub({
      name: FolderNameStub({ value: 'brokers' }),
    });

    expect(result.name).toBe('brokers');
    expect(result.children).toBeInstanceOf(Map);
    expect(result.items).toHaveLength(1);
  });

  it('VALID: {name: "", children: Map, items: []} => parses successfully with empty name', () => {
    const result = TreeNodeStub({
      name: FolderNameStub({ value: '' }),
      items: [],
    });

    expect(result.name).toBe('');
    expect(result.children).toBeInstanceOf(Map);
    expect(result.items).toStrictEqual([]);
  });
});
