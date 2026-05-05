import { architectureOrphanDetectBroker } from './architecture-orphan-detect-broker';
import { architectureOrphanDetectBrokerProxy } from './architecture-orphan-detect-broker.proxy';
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

const dirEntry = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
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

describe('architectureOrphanDetectBroker', () => {
  it('VALID: {one orphan and one reachable broker} => Unreferenced section lists only the orphan', () => {
    const proxy = architectureOrphanDetectBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
          [
            '/repo/packages/sample/src/brokers',
            [dirEntry({ name: 'foo' }), dirEntry({ name: 'orphan' })],
          ],
          ['/repo/packages/sample/src/brokers/foo', [fileEntry({ name: 'foo-broker.ts' })]],
          ['/repo/packages/sample/src/brokers/orphan', [fileEntry({ name: 'orphan-broker.ts' })]],
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
          [
            '/repo/packages/sample/src/brokers/orphan/orphan-broker.ts',
            'export const orphanBroker = () => undefined;',
          ],
        ]),
      }),
    });
    proxy.setupExistsImplementation({
      fn: dispatchExistsByPathSet({
        existing: new Set([
          '/repo/packages/sample/src/brokers/foo/foo-broker.ts',
          '/repo/packages/sample/src/brokers/orphan/orphan-broker.ts',
        ]),
      }),
    });

    const result = architectureOrphanDetectBroker({ packageSrcPath });

    expect(String(result)).toBe('## Unreferenced\n\n```\nbrokers/orphan/orphan-broker\n```');
  });

  it('VALID: {multiple orphans across folder types} => sorts orphans alphabetically by display path', () => {
    const proxy = architectureOrphanDetectBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
          ['/repo/packages/sample/src/responders', [dirEntry({ name: 'zeta' })]],
          ['/repo/packages/sample/src/responders/zeta', [fileEntry({ name: 'zeta-responder.ts' })]],
          ['/repo/packages/sample/src/adapters', [dirEntry({ name: 'alpha' })]],
          ['/repo/packages/sample/src/adapters/alpha', [dirEntry({ name: 'get' })]],
          [
            '/repo/packages/sample/src/adapters/alpha/get',
            [fileEntry({ name: 'alpha-get-adapter.ts' })],
          ],
          ['/repo/packages/sample/src/state', [dirEntry({ name: 'middle' })]],
          ['/repo/packages/sample/src/state/middle', [fileEntry({ name: 'middle-state.ts' })]],
        ]),
      }),
    });
    proxy.setupReadFileImplementation({
      fn: dispatchSourceByPath({
        sources: new Map([
          [
            '/repo/packages/sample/src/startup/start-app.ts',
            'export const StartApp = () => undefined;',
          ],
        ]),
      }),
    });
    proxy.setupExistsImplementation({
      fn: dispatchExistsByPathSet({ existing: new Set() }),
    });

    const result = architectureOrphanDetectBroker({ packageSrcPath });

    expect(String(result)).toBe(
      '## Unreferenced\n\n```\nadapters/alpha/get/alpha-get-adapter\nresponders/zeta/zeta-responder\nstate/middle/middle-state\n```',
    );
  });

  it('EMPTY: {all walked files reachable from startup} => returns empty string', () => {
    const proxy = architectureOrphanDetectBrokerProxy();
    const packageSrcPath = AbsoluteFilePathStub({ value: '/repo/packages/sample/src' });

    proxy.setupReaddirImplementation({
      fn: dispatchByPath({
        entries: new Map([
          ['/repo/packages/sample/src/startup', [fileEntry({ name: 'start-app.ts' })]],
          ['/repo/packages/sample/src/brokers', [dirEntry({ name: 'foo' })]],
          ['/repo/packages/sample/src/brokers/foo', [fileEntry({ name: 'foo-broker.ts' })]],
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

    const result = architectureOrphanDetectBroker({ packageSrcPath });

    expect(String(result)).toBe('');
  });

  it('EMPTY: {package with no walked folders} => returns empty string', () => {
    const proxy = architectureOrphanDetectBrokerProxy();
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

    const result = architectureOrphanDetectBroker({ packageSrcPath });

    expect(String(result)).toBe('');
  });
});
