import { servedBuildStaleContract } from './served-build-stale-contract';
import { ServedBuildStaleStub } from './served-build-stale.stub';

describe('servedBuildStaleContract', () => {
  describe('valid readings', () => {
    it('VALID: {stub defaults} => parses the folder, build time, base commit and changed files', () => {
      const stale = ServedBuildStaleStub();

      const result = servedBuildStaleContract.parse(stale);

      expect(result).toStrictEqual({
        outDir: 'packages/web/dist',
        builtAtMs: 1_790_717_738_233,
        baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
        changedFiles: ['packages/web/src/app.tsx'],
      });
    });

    it('EMPTY: {changedFiles: []} => parses an empty changed-file list', () => {
      const stale = ServedBuildStaleStub({ changedFiles: [] });

      const result = servedBuildStaleContract.parse(stale);

      expect(result).toStrictEqual({
        outDir: 'packages/web/dist',
        builtAtMs: 1_790_717_738_233,
        baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
        changedFiles: [],
      });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {outDir: absolute} => throws for a folder outside the repo', () => {
      expect(() =>
        servedBuildStaleContract.parse({
          outDir: '/abs/dist',
          builtAtMs: 1_790_717_738_233,
          baseCommit: 'fd13432c156a579b5bf862f89a681309a42b3153',
          changedFiles: [],
        }),
      ).toThrow(/Path must be repo-relative \(not absolute\)/u);
    });

    it('INVALID: {missing baseCommit} => throws Required', () => {
      expect(() =>
        servedBuildStaleContract.parse({
          outDir: 'packages/web/dist',
          builtAtMs: 1_790_717_738_233,
          changedFiles: [],
        }),
      ).toThrow(/Required/u);
    });
  });
});
