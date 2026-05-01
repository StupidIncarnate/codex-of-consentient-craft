import type { Dirent } from 'fs';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

const buildFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

const NAMESPACE_BODY_DEFAULT = 'export const StartOrchestrator = { foo: async () => {} };';

export const findStartupFileLayerBrokerProxy = (): {
  setupStartupFiles: ({
    names,
    namespaceFile,
  }: {
    names: string[];
    namespaceFile?: string;
  }) => void;
  setupEmpty: () => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readSourceProxy = readSourceLayerBrokerProxy();

  return {
    setupStartupFiles: ({
      names,
      namespaceFile,
    }: {
      names: string[];
      namespaceFile?: string;
    }): void => {
      readdirProxy.returns({ entries: names.map((name) => buildFileDirent({ name })) });
      // Treat the named namespace file (or the first non-test, non-install start-* file) as
      // the file whose source contains an `export const X = { async-method }` namespace, so the
      // namespace guard accepts it. Other files yield empty source so the guard rejects them.
      const inferredNamespace =
        namespaceFile ??
        names.find(
          (n) =>
            n.startsWith('start-') &&
            n.endsWith('.ts') &&
            !n.includes('.test.') &&
            !n.startsWith('start-install'),
        ) ??
        null;
      readSourceProxy.setupImplementation({
        fn: (filePath) => {
          if (inferredNamespace !== null && String(filePath).endsWith(`/${inferredNamespace}`)) {
            return ContentTextStub({ value: NAMESPACE_BODY_DEFAULT });
          }
          return ContentTextStub({ value: 'export const x = 1;' });
        },
      });
    },

    setupEmpty: (): void => {
      readdirProxy.returns({ entries: [] });
    },
  };
};
