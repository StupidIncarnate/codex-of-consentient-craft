import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { ServedBuildStaleStub } from '../../contracts/served-build-stale/served-build-stale.stub';
import { servedBuildStaleRenderTransformer } from './served-build-stale-render-transformer';

describe('servedBuildStaleRenderTransformer', () => {
  describe('nothing stale', () => {
    it('EMPTY: {stale: []} => returns the empty string', () => {
      expect(
        servedBuildStaleRenderTransformer({
          stale: [],
          buildCommand: ContentTextStub({ value: 'npm run build' }),
        }),
      ).toBe('');
    });
  });

  describe('one stale folder', () => {
    it('VALID: {one changed file, buildCommand} => names the folder, build time, commit, the file and the build command', () => {
      expect(
        servedBuildStaleRenderTransformer({
          stale: [ServedBuildStaleStub()],
          buildCommand: ContentTextStub({ value: 'npm run build' }),
        }),
      ).toBe(
        [
          'STALE BUILD: this lane serves packages/web/dist, last built 2026-09-29T21:35:38.233Z at commit fd13432c156a; 1 file has changed since, and the lane serves none of those changes: packages/web/src/app.tsx.',
          'REBUILD: run `npm run build` while no lane is live in this checkout — a build empties the folder a live lane serves — then start again.',
          '',
        ].join('\n'),
      );
    });

    it('VALID: {seven changed files} => lists the first five and counts the rest', () => {
      const changedFiles = ['a/1.ts', 'a/2.ts', 'a/3.ts', 'a/4.ts', 'a/5.ts', 'a/6.ts', 'a/7.ts'];

      expect(
        servedBuildStaleRenderTransformer({
          stale: [ServedBuildStaleStub({ changedFiles: changedFiles as never })],
          buildCommand: ContentTextStub({ value: 'npm run build' }),
        }),
      ).toBe(
        [
          'STALE BUILD: this lane serves packages/web/dist, last built 2026-09-29T21:35:38.233Z at commit fd13432c156a; 7 files have changed since, and the lane serves none of those changes: a/1.ts, a/2.ts, a/3.ts, a/4.ts, a/5.ts and 2 more.',
          'REBUILD: run `npm run build` while no lane is live in this checkout — a build empties the folder a live lane serves — then start again.',
          '',
        ].join('\n'),
      );
    });
  });

  describe('two stale folders', () => {
    it('VALID: {two folders} => one STALE BUILD line each, one REBUILD line', () => {
      expect(
        servedBuildStaleRenderTransformer({
          stale: [
            ServedBuildStaleStub(),
            ServedBuildStaleStub({
              outDir: 'apps/admin/build' as never,
              changedFiles: ['apps/admin/src/x.ts', 'apps/admin/src/y.ts'] as never,
            }),
          ],
          buildCommand: ContentTextStub({ value: 'npm run build' }),
        }),
      ).toBe(
        [
          'STALE BUILD: this lane serves packages/web/dist, last built 2026-09-29T21:35:38.233Z at commit fd13432c156a; 1 file has changed since, and the lane serves none of those changes: packages/web/src/app.tsx.',
          'STALE BUILD: this lane serves apps/admin/build, last built 2026-09-29T21:35:38.233Z at commit fd13432c156a; 2 files have changed since, and the lane serves none of those changes: apps/admin/src/x.ts, apps/admin/src/y.ts.',
          'REBUILD: run `npm run build` while no lane is live in this checkout — a build empties the folder a live lane serves — then start again.',
          '',
        ].join('\n'),
      );
    });
  });
});
