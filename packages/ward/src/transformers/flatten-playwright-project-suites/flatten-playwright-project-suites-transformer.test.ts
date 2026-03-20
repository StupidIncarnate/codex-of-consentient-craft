import { flattenPlaywrightProjectSuitesTransformer } from './flatten-playwright-project-suites-transformer';

describe('flattenPlaywrightProjectSuitesTransformer', () => {
  describe('project-wrapped suites', () => {
    it('VALID: {single project with file suites} => returns file suites', () => {
      const result = flattenPlaywrightProjectSuitesTransformer({
        suites: [
          {
            title: 'chromium',
            suites: [
              { title: 'login.spec.ts', suites: [], specs: [{ title: 'logs in' }] },
              { title: 'chat.spec.ts', suites: [], specs: [{ title: 'sends message' }] },
            ],
            specs: [],
          },
        ],
      });

      expect(result).toStrictEqual([
        { title: 'login.spec.ts', suites: [], specs: [{ title: 'logs in' }] },
        { title: 'chat.spec.ts', suites: [], specs: [{ title: 'sends message' }] },
      ]);
    });

    it('VALID: {multiple projects} => returns file suites from all projects', () => {
      const result = flattenPlaywrightProjectSuitesTransformer({
        suites: [
          {
            title: 'chromium',
            suites: [{ title: 'a.spec.ts', suites: [], specs: [] }],
            specs: [],
          },
          {
            title: 'firefox',
            suites: [{ title: 'b.spec.ts', suites: [], specs: [] }],
            specs: [],
          },
        ],
      });

      expect(result).toStrictEqual([
        { title: 'a.spec.ts', suites: [], specs: [] },
        { title: 'b.spec.ts', suites: [], specs: [] },
      ]);
    });
  });

  describe('flat suites (no project wrapping)', () => {
    it('VALID: {file suites at top level} => returns them unchanged', () => {
      const result = flattenPlaywrightProjectSuitesTransformer({
        suites: [{ title: 'login.spec.ts', suites: [], specs: [{ title: 'logs in' }] }],
      });

      expect(result).toStrictEqual([
        { title: 'login.spec.ts', suites: [], specs: [{ title: 'logs in' }] },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {suites: []} => returns empty array', () => {
      const result = flattenPlaywrightProjectSuitesTransformer({ suites: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
