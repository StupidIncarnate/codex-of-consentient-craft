import { violationsFixAndReportBroker } from './violations-fix-and-report-broker';
import { violationsFixAndReportBrokerProxy } from './violations-fix-and-report-broker.proxy';
import { EditToolInputStub } from '../../../contracts/edit-tool-input/edit-tool-input.stub';
import { WriteToolInputStub } from '../../../contracts/write-tool-input/write-tool-input.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('violationsFixAndReportBroker', () => {
  describe('with no violations after fix', () => {
    it('VALID: {toolInput: Edit} => returns empty violations and success message', async () => {
      const proxy = violationsFixAndReportBrokerProxy();
      proxy.setupFixAndReport({ hasViolations: false });

      const toolInput = EditToolInputStub({
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      });
      const cwd = FilePathStub({ value: '/test' });

      const result = await violationsFixAndReportBroker({ toolInput, cwd });

      expect(result.violations).toStrictEqual([
        {
          filePath: '/test/file.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
      expect(result.message).toBe('All violations auto-fixed successfully');
    });

    it('VALID: {toolInput: Write} => returns empty violations and success message', async () => {
      const proxy = violationsFixAndReportBrokerProxy();
      proxy.setupFixAndReport({ hasViolations: false });

      const toolInput = WriteToolInputStub({
        file_path: '/test/file.ts',
        content: 'const x = 1;',
      });
      const cwd = FilePathStub({ value: '/test' });

      const result = await violationsFixAndReportBroker({ toolInput, cwd });

      expect(result.violations).toStrictEqual([
        {
          filePath: '/test/file.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
      expect(result.message).toBe('All violations auto-fixed successfully');
    });
  });

  describe('with violations remaining after fix', () => {
    it('VALID: {toolInput: Edit, hasViolations: true} => returns violations with formatted message', async () => {
      const proxy = violationsFixAndReportBrokerProxy();
      proxy.setupFixAndReport({ hasViolations: true });

      const toolInput = EditToolInputStub({
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      });
      const cwd = FilePathStub({ value: '/test' });

      const result = await violationsFixAndReportBroker({ toolInput, cwd });

      expect(result.violations).toStrictEqual([
        {
          filePath: '/test/file.ts',
          messages: [
            {
              ruleId: 'no-console',
              severity: 2,
              message: 'Unexpected console statement',
              line: 1,
              column: 1,
            },
          ],
          errorCount: 1,
          warningCount: 0,
        },
      ]);
      expect(result.message).toMatch(/Unexpected console statement/iu);
    });
  });

  describe('without cwd parameter', () => {
    it('VALID: {toolInput: Edit, no cwd} => uses process.cwd() as default', async () => {
      const proxy = violationsFixAndReportBrokerProxy();
      proxy.setupFixAndReport({ hasViolations: false });

      const toolInput = EditToolInputStub({
        file_path: '/test/file.ts',
        old_string: 'old',
        new_string: 'new',
      });

      const result = await violationsFixAndReportBroker({ toolInput });

      expect(result.violations).toStrictEqual([
        {
          filePath: '/test/file.ts',
          messages: [],
          errorCount: 0,
          warningCount: 0,
        },
      ]);
    });
  });
});
