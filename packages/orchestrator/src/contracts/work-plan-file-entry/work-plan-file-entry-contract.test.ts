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

  describe('invalid entries', () => {
    it('EMPTY: {empty object} => refused', () => {
      expect(workPlanFileEntryContract.safeParse({}).success).toBe(false);
    });

    it('INVALID: {path with no ./ prefix} => refused, since filePathContract takes absolute or ./-relative only', () => {
      expect(() =>
        WorkPlanFileEntryStub({ path: 'packages/web/src/widgets/comment-badge/x.tsx' }),
      ).toThrow(/Path must be absolute \(start with \/ or C:/u);
    });

    it('INVALID: {change: rename} => refused', () => {
      expect(() => WorkPlanFileEntryStub({ change: 'rename' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {proves naming a bare unit id} => refused, since unit ids are flow-scoped', () => {
      expect(() => WorkPlanFileEntryStub({ proves: ['obs-3'] })).toThrow(/Invalid/u);
    });

    it('EMPTY: {in: empty string} => refused', () => {
      expect(() => WorkPlanFileEntryStub({ in: '' })).toThrow(
        /String must contain at least 1 character/u,
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
