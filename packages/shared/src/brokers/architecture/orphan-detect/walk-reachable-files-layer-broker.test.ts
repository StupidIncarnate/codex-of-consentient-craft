import { walkReachableFilesLayerBroker } from './walk-reachable-files-layer-broker';
import { walkReachableFilesLayerBrokerProxy } from './walk-reachable-files-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import type { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';

type Dirent = ReturnType<typeof fsReaddirWithTypesAdapter>[0];

const fileEntry = ({ name }: { name: string }): Dirent =>
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

const throwEnoent = (): never => {
  throw new Error('ENOENT');
};

const dispatchByPath =
  ({ entries }: { entries: ReadonlyMap<string, Dirent[]> }) =>
  (dirPath: string): Dirent[] => {
    const result = entries.get(dirPath);
    return result ?? throwEnoent();
  };

const dispatchSourceByPath =
  ({ sources }: { sources: ReadonlyMap<string, string> }) =>
  (filePath: ReturnType<typeof ContentTextStub>): ReturnType<typeof ContentTextStub> => {
    const text = sources.get(String(filePath));
    return text === undefined ? throwEnoent() : ContentTextStub({ value: text });
  };

const dispatchExistsByPathSet =
  ({ existing }: { existing: ReadonlySet<string> }) =>
  (filePath: string): boolean =>
    existing.has(filePath);

describe('walkReachableFilesLayerBroker', () => {
  it('VALID: {startup imports broker which imports adapter} => returns startup, broker, and adapter', () => {
    const proxy = walkReachableFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
        ]),
      }),
    });

    proxy.setupReadFileImplementation({
      fn: dispatchSourceByPath({
        sources: new Map([
          [
            '/repo/packages/sample/src/startup/start-app.ts',
            "import { fooBroker } from '../brokers/foo/foo-broker';",
          ],
          [
            '/repo/packages/sample/src/brokers/foo/foo-broker.ts',
            "import { httpAdapter } from '../../adapters/http/get/http-get-adapter';",
          ],
          [
            '/repo/packages/sample/src/adapters/http/get/http-get-adapter.ts',
            'export const httpAdapter = () => undefined;',
          ],
        ]),
      }),
    });

    proxy.setupExistsImplementation({
      fn: dispatchExistsByPathSet({
        existing: new Set([
          '/repo/packages/sample/src/brokers/foo/foo-broker.ts',
          '/repo/packages/sample/src/adapters/http/get/http-get-adapter.ts',
        ]),
      }),
    });

    const result = walkReachableFilesLayerBroker({ packageSrcPath });

    const sortedDisplay = [...result]
      .map((p) => String(p).slice(`${String(packageSrcPath)}/`.length))
      .sort((a, b) => a.localeCompare(b));

    expect(sortedDisplay).toStrictEqual([
      'adapters/http/get/http-get-adapter.ts',
      'brokers/foo/foo-broker.ts',
      'startup/start-app.ts',
    ]);
  });

  it('VALID: {orphan broker not imported by startup} => walk excludes the orphan', () => {
    const proxy = walkReachableFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
        ]),
      }),
    });

    proxy.setupReadFileImplementation({
      fn: dispatchSourceByPath({
        sources: new Map([
          [
            '/repo/packages/sample/src/startup/start-app.ts',
            "import { fooBroker } from '../brokers/foo/foo-broker';",
          ],
          [
            '/repo/packages/sample/src/brokers/foo/foo-broker.ts',
            'export const fooBroker = () => undefined;',
          ],
        ]),
      }),
    });

    proxy.setupExistsImplementation({
      fn: dispatchExistsByPathSet({
        existing: new Set(['/repo/packages/sample/src/brokers/foo/foo-broker.ts']),
      }),
    });

    const result = walkReachableFilesLayerBroker({ packageSrcPath });

    const sortedDisplay = [...result]
      .map((p) => String(p).slice(`${String(packageSrcPath)}/`.length))
      .sort((a, b) => a.localeCompare(b));

    expect(sortedDisplay).toStrictEqual(['brokers/foo/foo-broker.ts', 'startup/start-app.ts']);
  });

  it('VALID: {.tsx file exists for resolved .ts path} => follows the .tsx file', () => {
    const proxy = walkReachableFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
        ]),
      }),
    });

    proxy.setupReadFileImplementation({
      fn: dispatchSourceByPath({
        sources: new Map([
          [
            '/repo/packages/sample/src/startup/start-app.ts',
            "import { BarWidget } from '../widgets/bar/bar-widget';",
          ],
          [
            '/repo/packages/sample/src/widgets/bar/bar-widget.tsx',
            'export const BarWidget = () => null;',
          ],
        ]),
      }),
    });

    proxy.setupExistsImplementation({
      fn: dispatchExistsByPathSet({
        existing: new Set(['/repo/packages/sample/src/widgets/bar/bar-widget.tsx']),
      }),
    });

    const result = walkReachableFilesLayerBroker({ packageSrcPath });

    const sortedDisplay = [...result]
      .map((p) => String(p).slice(`${String(packageSrcPath)}/`.length))
      .sort((a, b) => a.localeCompare(b));

    expect(sortedDisplay).toStrictEqual(['startup/start-app.ts', 'widgets/bar/bar-widget.tsx']);
  });

  it('VALID: {non-relative npm import} => walk skips it (out of package)', () => {
    const proxy = walkReachableFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
        ]),
      }),
    });

    proxy.setupReadFileImplementation({
      fn: dispatchSourceByPath({
        sources: new Map([
          [
            '/repo/packages/sample/src/startup/start-app.ts',
            "import { z } from 'zod';\nexport const StartApp = () => z;",
          ],
        ]),
      }),
    });

    proxy.setupExistsImplementation({
      fn: dispatchExistsByPathSet({ existing: new Set() }),
    });

    const result = walkReachableFilesLayerBroker({ packageSrcPath });

    const sortedDisplay = [...result]
      .map((p) => String(p).slice(`${String(packageSrcPath)}/`.length))
      .sort((a, b) => a.localeCompare(b));

    expect(sortedDisplay).toStrictEqual(['startup/start-app.ts']);
  });

  it('EMPTY: {no startup files} => returns empty set', () => {
    const proxy = walkReachableFilesLayerBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: () => throwEnoent(),
    });

    proxy.setupReadFileImplementation({
      fn: () => throwEnoent(),
    });

    proxy.setupExistsImplementation({
      fn: () => false,
    });

    const result = walkReachableFilesLayerBroker({ packageSrcPath });

    expect([...result]).toStrictEqual([]);
  });
});
