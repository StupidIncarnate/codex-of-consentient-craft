import { DevServerE2eProcessStub } from '@dungeonmaster/config/contracts';

import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { servedBuildStaleReadBroker } from './served-build-stale-read-broker';
import { servedBuildStaleReadBrokerProxy } from './served-build-stale-read-broker.proxy';

const BUILT_AT_MS = 1_790_717_738_233;

describe('servedBuildStaleReadBroker', () => {
  describe('a served build older than the source', () => {
    it('VALID: {web source changed and a file deleted after the build} => returns the exact warning naming both', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub(),
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build:web',
      });
      proxy.setupIgnored({ paths: ['packages/web/dist'] });
      proxy.setupFolderBuiltAt({ outDir: 'packages/web/dist', builtAtMs: BUILT_AT_MS });
      proxy.setupChangedSince({
        baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
        files: [
          'packages/web/src/app.tsx',
          'packages/shared/src/x.ts',
          'packages/web/src/gone.tsx',
        ],
      });
      proxy.setupFileModifiedAt({
        file: 'packages/web/src/app.tsx',
        modifiedAtMs: BUILT_AT_MS + 60_000,
      });
      proxy.setupFileModifiedAt({
        file: 'packages/shared/src/x.ts',
        modifiedAtMs: BUILT_AT_MS - 60_000,
      });
      proxy.setupFileDeleted({ file: 'packages/web/src/gone.tsx' });

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe(
        [
          'STALE BUILD: this lane serves packages/web/dist, last built 2026-09-29T21:35:38.233Z at commit fd13432c156a; 2 files have changed since, and the lane serves none of those changes: packages/web/src/app.tsx, packages/web/src/gone.tsx.',
          'REBUILD: run `npm run build:web` while no lane is live in this checkout — a build empties the folder a live lane serves — then start again.',
          '',
        ].join('\n'),
      );
    });

    it('VALID: {stale build} => asks git about the command paths, then walks changes since the build second', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub(),
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build',
      });
      proxy.setupIgnored({ paths: ['packages/web/dist'] });
      proxy.setupFolderBuiltAt({ outDir: 'packages/web/dist', builtAtMs: BUILT_AT_MS });
      proxy.setupChangedSince({
        baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
        files: ['packages/web/src/app.tsx'],
      });
      proxy.setupFileModifiedAt({
        file: 'packages/web/src/app.tsx',
        modifiedAtMs: BUILT_AT_MS + 60_000,
      });

      await servedBuildStaleReadBroker({ specName: SpecNameStub({ value: 'stack' }) });

      expect(proxy.getCheckIgnoreArgs()).toStrictEqual([
        'check-ignore',
        '--',
        'packages/web/vite.config.ts',
        'packages/web/dist',
      ]);
      expect(proxy.getChangedSinceArgs()).toStrictEqual([
        '-c',
        'base=$(git rev-list -1 --first-parent --before="@$1" HEAD) && [ -n "$base" ] && printf \'%s\\n\' "$base" && git diff --name-only "$base"',
        'sh',
        '1790717738',
      ]);
    });

    it('EDGE: {no devServer.buildCommand} => the warning names the schema default npm run build', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
      });
      proxy.setupIgnored({ paths: ['packages/web/dist'] });
      proxy.setupFolderBuiltAt({ outDir: 'packages/web/dist', builtAtMs: BUILT_AT_MS });
      proxy.setupChangedSince({
        baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
        files: ['packages/web/src/app.tsx'],
      });
      proxy.setupFileModifiedAt({
        file: 'packages/web/src/app.tsx',
        modifiedAtMs: BUILT_AT_MS + 1,
      });

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe(
        [
          'STALE BUILD: this lane serves packages/web/dist, last built 2026-09-29T21:35:38.233Z at commit fd13432c156a; 1 file has changed since, and the lane serves none of those changes: packages/web/src/app.tsx.',
          'REBUILD: run `npm run build` while no lane is live in this checkout — a build empties the folder a live lane serves — then start again.',
          '',
        ].join('\n'),
      );
    });
  });

  describe('a served build that is current', () => {
    it('EMPTY: {every differing file last touched before the build} => returns the empty string', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build',
      });
      proxy.setupIgnored({ paths: ['packages/web/dist'] });
      proxy.setupFolderBuiltAt({ outDir: 'packages/web/dist', builtAtMs: BUILT_AT_MS });
      proxy.setupChangedSince({
        baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
        files: ['packages/web/src/app.tsx'],
      });
      proxy.setupFileModifiedAt({ file: 'packages/web/src/app.tsx', modifiedAtMs: BUILT_AT_MS });

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe('');
    });

    it('EMPTY: {working tree identical to the build commit} => returns the empty string', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build',
      });
      proxy.setupIgnored({ paths: ['packages/web/dist'] });
      proxy.setupFolderBuiltAt({ outDir: 'packages/web/dist', builtAtMs: BUILT_AT_MS });
      proxy.setupChangedSince({
        baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
        files: [],
      });

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe('');
    });
  });

  describe('nothing git can measure', () => {
    it('EMPTY: {lane commands name no path} => returns the empty string without asking git', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({ processes: [DevServerE2eProcessStub()], buildCommand: 'npm run build' });

      const result = await servedBuildStaleReadBroker({ specName: SpecNameStub({ value: 'api' }) });

      expect({ result, checkIgnoreArgs: proxy.getCheckIgnoreArgs() }).toStrictEqual({
        result: '',
        checkIgnoreArgs: undefined,
      });
    });

    it('EMPTY: {no named path is gitignored} => returns the empty string', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build',
      });
      proxy.setupNoneIgnored();

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe('');
    });

    it('EMPTY: {not a git repository} => returns the empty string', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build',
      });
      proxy.setupNotARepository();

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe('');
    });

    it('EMPTY: {ignored folder never built} => returns the empty string', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build',
      });
      proxy.setupIgnored({ paths: ['packages/web/dist'] });
      proxy.setupFolderMissing({ outDir: 'packages/web/dist' });

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe('');
    });

    it('EMPTY: {build older than every commit} => returns the empty string', async () => {
      const proxy = servedBuildStaleReadBrokerProxy();
      proxy.setupLane({
        processes: [
          DevServerE2eProcessStub({
            name: 'web',
            command:
              'npx vite preview --config packages/web/vite.config.ts --strictPort --outDir packages/web/dist',
            portRole: 'web',
            readyPath: '/',
          } as never),
        ],
        buildCommand: 'npm run build',
      });
      proxy.setupIgnored({ paths: ['packages/web/dist'] });
      proxy.setupFolderBuiltAt({ outDir: 'packages/web/dist', builtAtMs: BUILT_AT_MS });
      proxy.setupNoCommitThatOld();

      const result = await servedBuildStaleReadBroker({
        specName: SpecNameStub({ value: 'stack' }),
      });

      expect(result).toBe('');
    });
  });
});
