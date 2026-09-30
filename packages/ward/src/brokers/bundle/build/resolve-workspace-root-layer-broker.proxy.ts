import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

export const resolveWorkspaceRootLayerBrokerProxy = (): {
  declaresWorkspaces: (params: { dirPath: string; patterns: string[] }) => void;
  isAPlainPackage: (params: { dirPath: string; name: string }) => void;
  hasNoManifest: (params: { dirPath: string }) => void;
  hasAnUnparseableManifest: (params: { dirPath: string }) => void;
} => {
  const readProxy = readFileProxy();

  const manifestPathFor = ({ dirPath }: { dirPath: string }): string => `${dirPath}/package.json`;

  return {
    declaresWorkspaces: ({ dirPath, patterns }: { dirPath: string; patterns: string[] }): void => {
      readProxy.returns({
        path: manifestPathFor({ dirPath }),
        contents: JSON.stringify({ name: 'root', workspaces: patterns }),
      });
    },
    isAPlainPackage: ({ dirPath, name }: { dirPath: string; name: string }): void => {
      readProxy.returns({
        path: manifestPathFor({ dirPath }),
        contents: JSON.stringify({ name }),
      });
    },
    hasNoManifest: ({ dirPath }: { dirPath: string }): void => {
      readProxy.missing({ path: manifestPathFor({ dirPath }) });
    },
    hasAnUnparseableManifest: ({ dirPath }: { dirPath: string }): void => {
      readProxy.returns({ path: manifestPathFor({ dirPath }), contents: '{ not json' });
    },
  };
};
