import { workPlanFileEntryContract } from './work-plan-file-entry-contract';
import { WorkPlanFileEntryStub } from './work-plan-file-entry.stub';

describe('workPlanFileEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {no overrides} => parses a product file with no proves key', () => {
      expect(WorkPlanFileEntryStub()).toStrictEqual({
        path: './packages/web/src/widgets/comment-badge/comment-badge-widget.tsx',
        change: 'new',
        in: '{ count: number }',
        out: 'ReactElement',
      });
    });

    it('VALID: {change: edit, proves a real unit id} => parses a test file row', () => {
      expect(
        WorkPlanFileEntryStub({
          path: './packages/web/src/widgets/comment-badge/comment-badge-widget.test.tsx',
          change: 'edit',
          proves: ['send-flow:observable:check-badge-count-text'],
        }),
      ).toStrictEqual({
        path: './packages/web/src/widgets/comment-badge/comment-badge-widget.test.tsx',
        change: 'edit',
        in: '{ count: number }',
        out: 'ReactElement',
        proves: ['send-flow:observable:check-badge-count-text'],
      });
    });
  });

  describe('path forms', () => {
    it('VALID: {path: bare repo-relative} => parses unchanged', () => {
      expect(
        WorkPlanFileEntryStub({ path: 'packages/web/src/widgets/comment-badge/x.tsx' }).path,
      ).toBe('packages/web/src/widgets/comment-badge/x.tsx');
    });

    it('VALID: {path: absolute POSIX} => parses unchanged', () => {
      expect(WorkPlanFileEntryStub({ path: '/repo/packages/web/src/x.tsx' }).path).toBe(
        '/repo/packages/web/src/x.tsx',
      );
    });

    it('VALID: {path: absolute Windows} => parses unchanged', () => {
      expect(WorkPlanFileEntryStub({ path: 'C:\\repo\\packages\\web\\x.tsx' }).path).toBe(
        'C:\\repo\\packages\\web\\x.tsx',
      );
    });
  });

  describe('invalid entries', () => {
    it('EMPTY: {empty object} => refused', () => {
      expect(workPlanFileEntryContract.safeParse({}).success).toBe(false);
    });

    it('INVALID: {path: empty string} => refused', () => {
      expect(() => WorkPlanFileEntryStub({ path: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('INVALID: {path with a .. segment} => refused, naming the accepted forms', () => {
      expect(() => WorkPlanFileEntryStub({ path: '../server/src/x.ts' })).toThrow(
        /Path must be absolute, .\/-relative or repo-relative \(packages\/<package>\/…\), with no \.\. segment/u,
      );
    });

    it('INVALID: {change: rename} => refused', () => {
      expect(() => WorkPlanFileEntryStub({ change: 'rename' })).toThrow(/Invalid option/u);
    });

    it('INVALID: {proves naming a bare unit id} => refused, since unit ids are flow-scoped', () => {
      expect(() => WorkPlanFileEntryStub({ proves: ['obs-3'] })).toThrow(/Invalid/u);
    });

    it('EMPTY: {in: empty string} => refused', () => {
      expect(() => WorkPlanFileEntryStub({ in: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });
  });

  describe('omitting proves, which is what a flowrider harness row needs', () => {
    it('VALID: {omit proves} => the narrowed shape refuses a proves key', () => {
      const harnessContract = workPlanFileEntryContract.omit({ proves: true }).strict();

      expect(
        harnessContract.safeParse({
          path: './packages/web/test/harnesses/send/send.harness.ts',
          change: 'new',
          in: '{ page: Page }',
          out: 'SendHarness',
          proves: ['send-flow:terminal:batch-sent'],
        }).success,
      ).toBe(false);
    });
  });
});
