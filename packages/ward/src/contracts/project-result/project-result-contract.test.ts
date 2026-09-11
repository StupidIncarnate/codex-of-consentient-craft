import { projectResultContract } from './project-result-contract';
import { ProjectResultStub } from './project-result.stub';
import { OpenHandleStub } from '../open-handle/open-handle.stub';

describe('projectResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {passing result with no errors} => parses successfully', () => {
      const result = projectResultContract.parse(ProjectResultStub());

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
        filesCount: 0,
        discoveredCount: 0,
        onlyDiscovered: [],
        onlyProcessed: [],
        fileTimings: [],
        passingTests: [],
        openHandles: [],
        durationMs: 0,
      });
    });

    it('VALID: {failing result with errors} => parses successfully', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({
          status: 'fail',
          errors: [
            {
              filePath: 'src/index.ts',
              line: 5,
              column: 1,
              message: 'Error found',
              severity: 'error',
            },
          ],
          rawOutput: { stdout: '', stderr: 'Error', exitCode: 1 },
        }),
      );

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'fail',
        errors: [
          {
            filePath: 'src/index.ts',
            line: 5,
            column: 1,
            message: 'Error found',
            severity: 'error',
          },
        ],
        testFailures: [],
        rawOutput: { stdout: '', stderr: 'Error', exitCode: 1 },
        filesCount: 0,
        discoveredCount: 0,
        onlyDiscovered: [],
        onlyProcessed: [],
        fileTimings: [],
        passingTests: [],
        openHandles: [],
        durationMs: 0,
      });
    });

    it('VALID: {with test failures} => parses successfully', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({
          status: 'fail',
          testFailures: [
            {
              suitePath: 'src/index.test.ts',
              testName: 'should work',
              message: 'Failed',
            },
          ],
        }),
      );

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'fail',
        errors: [],
        testFailures: [
          {
            suitePath: 'src/index.test.ts',
            testName: 'should work',
            message: 'Failed',
          },
        ],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
        filesCount: 0,
        discoveredCount: 0,
        onlyDiscovered: [],
        onlyProcessed: [],
        fileTimings: [],
        passingTests: [],
        openHandles: [],
        durationMs: 0,
      });
    });

    it('VALID: {skip status} => parses successfully', () => {
      const result = projectResultContract.parse(ProjectResultStub({ status: 'skip' }));

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'skip',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
        filesCount: 0,
        discoveredCount: 0,
        onlyDiscovered: [],
        onlyProcessed: [],
        fileTimings: [],
        passingTests: [],
        openHandles: [],
        durationMs: 0,
      });
    });
  });

  describe('filesCount defaults', () => {
    it('VALID: {filesCount omitted} => defaults to 0', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.filesCount).toBe(0);
    });

    it('VALID: {filesCount provided} => preserves value', () => {
      const result = projectResultContract.parse(ProjectResultStub({ filesCount: 42 }));

      expect(result.filesCount).toBe(42);
    });
  });

  describe('discoveredCount defaults', () => {
    it('VALID: {discoveredCount omitted} => defaults to 0', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.discoveredCount).toBe(0);
    });

    it('VALID: {discoveredCount provided} => preserves value', () => {
      const result = projectResultContract.parse(ProjectResultStub({ discoveredCount: 15 }));

      expect(result.discoveredCount).toBe(15);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {status: "unknown"} => throws validation error', () => {
      expect(() =>
        projectResultContract.parse({
          projectFolder: { name: 'ward', path: '/path' },
          status: 'unknown',
          errors: [],
          testFailures: [],
          rawOutput: { stdout: '', stderr: '', exitCode: 0 },
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {missing all fields} => throws validation error', () => {
      expect(() => projectResultContract.parse({})).toThrow(/Required/u);
    });

    it('INVALID: {filesCount: -1} => throws validation error', () => {
      expect(() =>
        projectResultContract.parse({
          projectFolder: { name: 'ward', path: '/path' },
          status: 'pass',
          errors: [],
          testFailures: [],
          rawOutput: { stdout: '', stderr: '', exitCode: 0 },
          filesCount: -1,
        }),
      ).toThrow(/too_small/u);
    });
  });

  describe('fileTimings defaults', () => {
    it('VALID: {fileTimings omitted} => defaults to empty array', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.fileTimings).toStrictEqual([]);
    });

    it('VALID: {fileTimings provided} => preserves value', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({
          fileTimings: [{ filePath: 'src/index.ts', durationMs: 150 }],
        }),
      );

      expect(result.fileTimings).toStrictEqual([
        {
          filePath: 'src/index.ts',
          durationMs: 150,
          testMs: 0,
          slowestTestMs: 0,
          testCount: 0,
          rulesMs: 0,
        },
      ]);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid project result', () => {
      const result = ProjectResultStub();

      expect(result).toStrictEqual({
        projectFolder: { name: 'ward', path: '/home/user/project/packages/ward' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
        filesCount: 0,
        discoveredCount: 0,
        onlyDiscovered: [],
        onlyProcessed: [],
        fileTimings: [],
        passingTests: [],
        openHandles: [],
        durationMs: 0,
      });
    });
  });

  describe('onlyDiscovered defaults', () => {
    it('VALID: {onlyDiscovered omitted} => defaults to empty array', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.onlyDiscovered).toStrictEqual([]);
    });

    it('VALID: {onlyDiscovered provided} => preserves value', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({ onlyDiscovered: ['src/extra.ts'] }),
      );

      expect(result.onlyDiscovered).toStrictEqual(['src/extra.ts']);
    });
  });

  describe('passingTests defaults', () => {
    it('VALID: {passingTests omitted} => defaults to empty array', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.passingTests).toStrictEqual([]);
    });

    it('VALID: {passingTests provided} => preserves value', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({
          passingTests: [
            { suitePath: 'src/foo.test.ts', testName: 'VALID: {x} => y', durationMs: 12 },
          ],
        }),
      );

      expect(result.passingTests).toStrictEqual([
        { suitePath: 'src/foo.test.ts', testName: 'VALID: {x} => y', durationMs: 12 },
      ]);
    });
  });

  describe('onlyProcessed defaults', () => {
    it('VALID: {onlyProcessed omitted} => defaults to empty array', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.onlyProcessed).toStrictEqual([]);
    });

    it('VALID: {onlyProcessed provided} => preserves value', () => {
      const result = projectResultContract.parse(
        ProjectResultStub({ onlyProcessed: ['@types/error-cause.d.ts'] }),
      );

      expect(result.onlyProcessed).toStrictEqual(['@types/error-cause.d.ts']);
    });
  });

  describe('durationMs defaults', () => {
    it('VALID: {durationMs omitted} => defaults to 0', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.durationMs).toBe(0);
    });

    it('VALID: {durationMs provided} => preserves value', () => {
      const result = projectResultContract.parse(ProjectResultStub({ durationMs: 4200 }));

      expect(result.durationMs).toBe(4200);
    });
  });

  describe('openHandles defaults', () => {
    it('VALID: {openHandles omitted} => defaults to empty array', () => {
      const result = projectResultContract.parse({
        projectFolder: { name: 'ward', path: '/path' },
        status: 'pass',
        errors: [],
        testFailures: [],
        rawOutput: { stdout: '', stderr: '', exitCode: 0 },
      });

      expect(result.openHandles).toStrictEqual([]);
    });

    it('VALID: {openHandles provided} => preserves value', () => {
      const openHandle = OpenHandleStub({
        name: 'Error',
        message: 'TCPSERVERWRAP',
        stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
      });

      const result = projectResultContract.parse(ProjectResultStub({ openHandles: [openHandle] }));

      expect(result.openHandles).toStrictEqual([
        {
          name: 'Error',
          message: 'TCPSERVERWRAP',
          stack: 'at Server.listen (src/startup/start-server.ts:12:5)',
        },
      ]);
    });
  });
});
