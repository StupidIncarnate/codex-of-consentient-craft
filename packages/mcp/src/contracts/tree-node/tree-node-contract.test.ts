import { treeNodeContract as _treeNodeContract } from './tree-node-contract';
import { TreeNodeStub } from './tree-node.stub';
import { FolderNameStub } from '../folder-name/folder-name.stub';

describe('treeNodeContract', () => {
  it('VALID: {name: "guards", children: Map, items: []} => parses successfully', () => {
    const { name, children, items } = TreeNodeStub({
      name: FolderNameStub({ value: 'guards' }),
      items: [],
    });

    expect(name).toBe('guards');
    expect(children).toBeInstanceOf(Map);
    expect(items).toStrictEqual([]);
  });

  it('VALID: {name: "brokers", children: Map, items: [item]} => parses successfully with items', () => {
    const { name, children, items } = TreeNodeStub({
      name: FolderNameStub({ value: 'brokers' }),
    });

    expect(name).toBe('brokers');
    expect(children).toBeInstanceOf(Map);
    expect(items).toStrictEqual([
      {
        name: 'example-guard',
        type: 'guard',
        path: '/project/src/guards/example-guard.ts',
      },
    ]);
  });

  it('VALID: {name: "", children: Map, items: []} => parses successfully with empty name', () => {
    const { name, children, items } = TreeNodeStub({
      name: FolderNameStub({ value: '' }),
      items: [],
    });

    expect(name).toBe('');
    expect(children).toBeInstanceOf(Map);
    expect(items).toStrictEqual([]);
  });
});
