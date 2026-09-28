import { violationsCheckNewBroker } from './violations-check-new-broker';
import { violationsCheckNewBrokerProxy } from './violations-check-new-broker.proxy';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { ViolationCountStub } from '../../../contracts/violation-count/violation-count.stub';
import { ViolationDetailStub } from '../../../contracts/violation-detail/violation-detail.stub';

describe('violationsCheckNewBroker', () => {
  describe('input validation', () => {
    it('VALID: {toolInput: valid file_path} => returns no new violations when no changes', async () => {
      violationsCheckNewBrokerProxy();
      const toolInput = WriteToolInputStub({
        content: 'test',
        file_path: FilePathStub({ value: '/test/file.ts' }),
      });

      const result = await violationsCheckNewBroker({
        toolInput,
        cwd: FilePathStub({ value: '/test/project' }),
      });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
    });
  });

  describe('ESLint-ignored paths', () => {
    it('VALID: {file ignored by project config} => skips linting and returns no violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      proxy.setPathIgnored({ ignored: true });
      proxy.setupViolationCheck({ hasViolations: true });

      const toolInput = WriteToolInputStub({
        content: 'const x = new;',
        file_path: FilePathStub({ value: '/test/project/smoke-repo/fixture.ts' }),
      });

      const result = await violationsCheckNewBroker({
        toolInput,
        cwd: FilePathStub({ value: '/test/project' }),
      });

      expect(result).toStrictEqual({
        hasNewViolations: false,
        newViolations: [],
      });
    });

    it('VALID: {file ignored by project config, but DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS=true} => does not skip ignored file and detects violations', async () => {
      const proxy = violationsCheckNewBrokerProxy();
      proxy.setLintIgnoredPaths({ enabled: true });
      proxy.setPathIgnored({ ignored: true });
      proxy.setupViolationCheck({ hasViolations: true });

      const toolInput = WriteToolInputStub({
        content: 'const x = new;',
        file_path: FilePathStub({ value: '/test/project/smoke-repo/fixture.ts' }),
      });

      const result = await violationsCheckNewBroker({
        toolInput,
        cwd: FilePathStub({ value: '/test/project' }),
      });

      expect(result).toStrictEqual({
        hasNewViolations: true,
        newViolations: [
          ViolationCountStub({
            ruleId: 'no-console',
            count: 1,
            details: [
              ViolationDetailStub({
                ruleId: 'no-console',
                line: 1,
                column: 1,
                message: 'Unexpected console statement',
              }),
            ],
          }),
        ],
        message:
          '🛑 New code quality violations detected:\n' +
          '  ❌ Code Quality Issue: 1 violation\n' +
          '     This rule violation should be fixed to maintain code quality.\n' +
          '     Line 1:1 - Unexpected console statement\n\n' +
          'Your edit was NOT applied — the file is unchanged. Re-submit the ENTIRE corrected edit, not a surgical follow-up (nothing was written, so a patch targeting your intended new text will not match). These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
      });
    });
  });
});
