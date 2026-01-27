import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { wardRunBroker } from './ward-run-broker';
import { wardRunBrokerProxy } from './ward-run-broker.proxy';
import { ExecResultStub } from '../../../contracts/exec-result/exec-result.stub';

describe('wardRunBroker', () => {
  describe('ward passes', () => {
    it('VALID: {ward succeeds with no errors} => returns success true with empty errors', async () => {
      const { execProxy } = wardRunBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      execProxy.resolves({
        result: ExecResultStub({
          stdout: 'All checks passed',
          stderr: '',
          exitCode: 0,
        }),
      });

      const result = await wardRunBroker({ projectPath });

      expect(result).toStrictEqual({
        success: true,
        output: 'All checks passed',
        errors: [],
      });
    });
  });

  describe('ward fails with errors', () => {
    it('VALID: {ward fails with TypeScript errors} => returns success false with parsed errors', async () => {
      const { execProxy } = wardRunBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      execProxy.resolves({
        result: ExecResultStub({
          stdout: '/home/user/project/src/file.ts:10:5 - error TS2304: Cannot find name',
          stderr: '',
          exitCode: 1,
        }),
      });

      const result = await wardRunBroker({ projectPath });

      expect(result).toStrictEqual({
        success: false,
        output: '/home/user/project/src/file.ts:10:5 - error TS2304: Cannot find name',
        errors: [
          {
            filePath: '/home/user/project/src/file.ts',
            errors: ['error TS2304: Cannot find name'],
          },
        ],
      });
    });

    it('VALID: {ward fails with multiple file errors} => returns all errors grouped by file', async () => {
      const { execProxy } = wardRunBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      execProxy.resolves({
        result: ExecResultStub({
          stdout: `/home/user/project/src/file1.ts:10:5 - error TS2304: Cannot find name
/home/user/project/src/file2.ts:20:3 - error TS7006: Parameter has any type`,
          stderr: '',
          exitCode: 1,
        }),
      });

      const result = await wardRunBroker({ projectPath });

      expect(result).toStrictEqual({
        success: false,
        output: `/home/user/project/src/file1.ts:10:5 - error TS2304: Cannot find name
/home/user/project/src/file2.ts:20:3 - error TS7006: Parameter has any type`,
        errors: [
          {
            filePath: '/home/user/project/src/file1.ts',
            errors: ['error TS2304: Cannot find name'],
          },
          {
            filePath: '/home/user/project/src/file2.ts',
            errors: ['error TS7006: Parameter has any type'],
          },
        ],
      });
    });
  });

  describe('ward with stderr', () => {
    it('VALID: {errors in stderr} => combines stdout and stderr for parsing', async () => {
      const { execProxy } = wardRunBrokerProxy();
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/project' });

      execProxy.resolves({
        result: ExecResultStub({
          stdout: '',
          stderr: '/home/user/project/src/file.ts:5:1 - Missing semicolon',
          exitCode: 1,
        }),
      });

      const result = await wardRunBroker({ projectPath });

      expect(result).toStrictEqual({
        success: false,
        output: '/home/user/project/src/file.ts:5:1 - Missing semicolon',
        errors: [
          {
            filePath: '/home/user/project/src/file.ts',
            errors: ['Missing semicolon'],
          },
        ],
      });
    });
  });
});
