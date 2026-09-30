import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';

export const sourceFilesListLayerBrokerProxy = (): {
  setupTree: (params: { dirPath: string; relativeFilePaths: readonly string[] }) => void;
  setupEntries: (params: {
    dirPath: string;
    entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
  }) => void;
} => {
  const entriesProxy = readdirEntriesProxy();

  return {
    // Stages one readdir per directory the relative paths imply, each listing its direct children.
    setupTree: ({ dirPath, relativeFilePaths }): void => {
      const children = new Map<string, Map<string, 'file' | 'directory'>>([[dirPath, new Map()]]);
      for (const relativeFilePath of relativeFilePaths) {
        const segments = relativeFilePath.split('/');
        segments.forEach((segment, index) => {
          const parent = [dirPath, ...segments.slice(0, index)].join('/');
          const kind = index === segments.length - 1 ? 'file' : 'directory';
          const siblings = children.get(parent) ?? new Map<string, 'file' | 'directory'>();
          siblings.set(segment, kind);
          children.set(parent, siblings);
        });
      }
      for (const [parent, siblings] of children) {
        entriesProxy.returns({
          path: parent,
          entries: [...siblings].map(([name, kind]) => ({ name, kind })),
        });
      }
    },
    setupEntries: ({ dirPath, entries }): void => {
      entriesProxy.returns({ path: dirPath, entries });
    },
  };
};
