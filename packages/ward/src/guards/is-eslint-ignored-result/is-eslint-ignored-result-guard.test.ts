import { EslintJsonReportEntryStub } from '../../contracts/eslint-json-report-entry/eslint-json-report-entry.stub';
import { isEslintIgnoredResultGuard } from './is-eslint-ignored-result-guard';

describe('isEslintIgnoredResultGuard', () => {
  // Verbatim from a live run: `npm run ward -- --only lint -- packages/web/src/jest-dom.d.ts`, whose
  // rawOutput.stdout carried exactly this message while the summary said `1 files passed`.
  describe('a path eslint declined to lint', () => {
    it('VALID: {matching ignore pattern warning} => returns true', () => {
      const entry = EslintJsonReportEntryStub({
        filePath: '/project/packages/web/src/jest-dom.d.ts',
        messages: [
          {
            ruleId: null,
            severity: 1,
            message:
              'File ignored because of a matching ignore pattern. Use "--no-ignore" to disable file ignore settings or use "--no-warn-ignored" to suppress this warning.',
          },
        ],
      });

      expect(isEslintIgnoredResultGuard({ entry })).toBe(true);
    });

    // The PREFIX is what the guard keys on, because eslint spells several of these and appends flag
    // advice that has changed between minors.
    it('VALID: {ignored by default warning} => returns true', () => {
      const entry = EslintJsonReportEntryStub({
        filePath: '/project/node_modules/x.js',
        messages: [{ ruleId: null, severity: 1, message: 'File ignored by default.' }],
      });

      expect(isEslintIgnoredResultGuard({ entry })).toBe(true);
    });
  });

  describe('a file eslint read', () => {
    it('VALID: {clean file with no messages} => returns false', () => {
      const entry = EslintJsonReportEntryStub({
        filePath: '/project/src/index.ts',
        messages: [],
      });

      expect(isEslintIgnoredResultGuard({ entry })).toBe(false);
    });

    it('VALID: {one rule violation} => returns false', () => {
      const entry = EslintJsonReportEntryStub({
        filePath: '/project/src/index.ts',
        messages: [
          { ruleId: 'no-unused-vars', severity: 2, message: 'Unused var', line: 10, column: 5 },
        ],
      });

      expect(isEslintIgnoredResultGuard({ entry })).toBe(false);
    });

    // A PARSE ERROR IS ALSO ruleId-LESS, and it is a finding about a file eslint DID open — which is
    // why the message prefix decides this and `ruleId === null` alone does not.
    it('VALID: {fatal parse error with no ruleId} => returns false', () => {
      const entry = EslintJsonReportEntryStub({
        filePath: '/project/src/broken.ts',
        messages: [
          {
            ruleId: null,
            severity: 2,
            message: "Parsing error: ')' expected.",
            line: 3,
            column: 1,
          },
        ],
      });

      expect(isEslintIgnoredResultGuard({ entry })).toBe(false);
    });

    it('VALID: {ignore warning alongside a second message} => returns false', () => {
      const entry = EslintJsonReportEntryStub({
        filePath: '/project/src/index.ts',
        messages: [
          { ruleId: null, severity: 1, message: 'File ignored by default.' },
          { ruleId: 'no-unused-vars', severity: 2, message: 'Unused var', line: 1, column: 1 },
        ],
      });

      expect(isEslintIgnoredResultGuard({ entry })).toBe(false);
    });

    // ESLint omits `message` on nothing it emits today, so this branch guards the contract's own
    // optionality rather than a shape seen in the wild.
    it('EDGE: {ruleId-less message with no text} => returns false', () => {
      const entry = EslintJsonReportEntryStub({
        filePath: '/project/src/index.ts',
        messages: [{ ruleId: null, severity: 1 }],
      });

      expect(isEslintIgnoredResultGuard({ entry })).toBe(false);
    });
  });

  describe('shapes that are not an eslint result entry', () => {
    it('EMPTY: {entry with no messages array} => returns false', () => {
      expect(isEslintIgnoredResultGuard({ entry: { filePath: '/project/src/index.ts' } })).toBe(
        false,
      );
    });

    it('EMPTY: {entry: null} => returns false', () => {
      expect(isEslintIgnoredResultGuard({ entry: null })).toBe(false);
    });

    it('EMPTY: {entry omitted} => returns false', () => {
      expect(isEslintIgnoredResultGuard({})).toBe(false);
    });
  });
});
