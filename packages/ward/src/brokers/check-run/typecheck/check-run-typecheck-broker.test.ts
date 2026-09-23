import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { checkRunTypecheckBroker } from './check-run-typecheck-broker';
import { checkRunTypecheckBrokerProxy } from './check-run-typecheck-broker.proxy';

describe('checkRunTypecheckBroker', () => {
  describe('passing typecheck', () => {
    it('VALID: {tsc exits 0 with listFiles output} => returns pass result with filesCount', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const listFilesOutput = [
        '/home/user/project/packages/ward/node_modules/typescript/lib/lib.es5.d.ts',
        '/home/user/project/packages/ward/src/index.ts',
        '/home/user/project/packages/ward/src/utils.ts',
        '/home/user/project/packages/ward/src/types.ts',
      ].join('\n');
      proxy.setupPass({ projectFolder, stdout: listFilesOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 3,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts', 'src/utils.ts', 'src/types.ts'],
          rawOutput: RawOutputStub({ stdout: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('failing typecheck', () => {
    it('VALID: {tsc exits 1 with errors and listFiles} => returns fail result with parsed errors and filesCount', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/node_modules/typescript/lib/lib.es5.d.ts',
        '/home/user/project/packages/ward/src/index.ts',
        '/home/user/project/packages/ward/src/utils.ts',
        'src/index.ts(10,5): error TS2345: Argument mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [
            ErrorEntryStub({
              filePath: 'src/index.ts',
              line: 10,
              column: 5,
              message: 'TS2345: Argument mismatch.',
              severity: 'error',
            }),
          ],
          testFailures: [],
          filesCount: 2,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts', 'src/utils.ts'],
          rawOutput: RawOutputStub({
            stdout: 'src/index.ts(10,5): error TS2345: Argument mismatch.',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });
  });

  describe('crash handling', () => {
    it('VALID: {tsc exits 1 but parser finds 0 errors} => status stays fail', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = 'error TS5058: The specified path does not exist';
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [],
          filesCount: 0,
          onlyDiscovered: ['discovered.ts'],
          rawOutput: RawOutputStub({ stdout: tscOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('missing tsconfig.json', () => {
    it('VALID: {no tsconfig.json in project folder} => returns skip result with reason', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      proxy.setupNoTsconfig();

      const projectFolder = ProjectFolderStub();

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          filesCount: 0,
          rawOutput: RawOutputStub({ stdout: '', stderr: 'no tsconfig.json', exitCode: 0 }),
        }),
      );
    });
  });

  describe('file-scoped run: an error only in an unnamed file still fails', () => {
    it('VALID: {tsc fails, error only in an unnamed file} => fails and lists it under elsewhereErrors', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/src/index.ts',
        'src/other.ts(5,1): error TS2345: Type mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      const elsewhereError = ErrorEntryStub({
        filePath: 'src/other.ts',
        line: 5,
        column: 1,
        message: 'TS2345: Type mismatch.',
        severity: 'error',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [elsewhereError],
          elsewhereErrors: [elsewhereError],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({
            stdout: 'src/other.ts(5,1): error TS2345: Type mismatch.',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });

    it('VALID: {tsc fails, error in the named file} => lists it first, under errors, nothing elsewhere', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/src/index.ts',
        'src/index.ts(10,5): error TS2345: Argument mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [
            ErrorEntryStub({
              filePath: 'src/index.ts',
              line: 10,
              column: 5,
              message: 'TS2345: Argument mismatch.',
              severity: 'error',
            }),
          ],
          elsewhereErrors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({
            stdout: 'src/index.ts(10,5): error TS2345: Argument mismatch.',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });

    it('VALID: {tsc fails, errors in both the named file and another} => named error lists first, other under elsewhereErrors', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/src/index.ts',
        'src/index.ts(10,5): error TS2345: Argument mismatch.',
        'src/other.ts(5,1): error TS2345: Type mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      const namedError = ErrorEntryStub({
        filePath: 'src/index.ts',
        line: 10,
        column: 5,
        message: 'TS2345: Argument mismatch.',
        severity: 'error',
      });
      const elsewhereError = ErrorEntryStub({
        filePath: 'src/other.ts',
        line: 5,
        column: 1,
        message: 'TS2345: Type mismatch.',
        severity: 'error',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [namedError, elsewhereError],
          elsewhereErrors: [elsewhereError],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({
            stdout: [
              'src/index.ts(10,5): error TS2345: Argument mismatch.',
              'src/other.ts(5,1): error TS2345: Type mismatch.',
            ].join('\n'),
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });

    it('VALID: {tsc exits 0, file-scoped} => passes with no errors named or elsewhere', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const listFilesOutput = [
        '/home/user/project/packages/ward/node_modules/typescript/lib/lib.es5.d.ts',
        '/home/user/project/packages/ward/src/index.ts',
      ].join('\n');
      proxy.setupPass({ projectFolder, stdout: listFilesOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/index.ts' })],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          elsewhereErrors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({ stdout: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('directory-scoped run: an error anywhere in the package still fails', () => {
    // `fileList: []` (a bare package arg such as `-- packages/ward` never reaches this broker as a
    // passthrough entry at all — see `multiPackageLayerBroker`) is exercised by every test above
    // that passes an empty `fileList`, and stays untouched: `namedErrors`/`elsewhereErrors` both
    // fall to their `fileList.length > 0` ternaries' empty branch, same as before this change.

    it('VALID: {tsc fails, error only outside the scoped directory} => fails and lists it under elsewhereErrors', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/src/index.ts',
        'src/other/thing.ts(5,1): error TS2345: Type mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/widgets' })],
      });

      const elsewhereError = ErrorEntryStub({
        filePath: 'src/other/thing.ts',
        line: 5,
        column: 1,
        message: 'TS2345: Type mismatch.',
        severity: 'error',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [elsewhereError],
          elsewhereErrors: [elsewhereError],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({
            stdout: 'src/other/thing.ts(5,1): error TS2345: Type mismatch.',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });

    it('VALID: {tsc fails, error inside the scoped directory} => lists it first, under errors, nothing elsewhere', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/src/index.ts',
        'src/widgets/button.ts(10,5): error TS2345: Argument mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/widgets' })],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [
            ErrorEntryStub({
              filePath: 'src/widgets/button.ts',
              line: 10,
              column: 5,
              message: 'TS2345: Argument mismatch.',
              severity: 'error',
            }),
          ],
          elsewhereErrors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({
            stdout: 'src/widgets/button.ts(10,5): error TS2345: Argument mismatch.',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });

    it('VALID: {tsc fails, errors both inside and outside the scoped directory} => inside error lists first, outside under elsewhereErrors', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/src/index.ts',
        'src/widgets/button.ts(10,5): error TS2345: Argument mismatch.',
        'src/other/thing.ts(5,1): error TS2345: Type mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/widgets' })],
      });

      const insideError = ErrorEntryStub({
        filePath: 'src/widgets/button.ts',
        line: 10,
        column: 5,
        message: 'TS2345: Argument mismatch.',
        severity: 'error',
      });
      const outsideError = ErrorEntryStub({
        filePath: 'src/other/thing.ts',
        line: 5,
        column: 1,
        message: 'TS2345: Type mismatch.',
        severity: 'error',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [insideError, outsideError],
          elsewhereErrors: [outsideError],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({
            stdout: [
              'src/widgets/button.ts(10,5): error TS2345: Argument mismatch.',
              'src/other/thing.ts(5,1): error TS2345: Type mismatch.',
            ].join('\n'),
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });

    it('VALID: {tsc exits 0, directory-scoped} => passes with no errors named or elsewhere', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const listFilesOutput = [
        '/home/user/project/packages/ward/node_modules/typescript/lib/lib.es5.d.ts',
        '/home/user/project/packages/ward/src/index.ts',
      ].join('\n');
      proxy.setupPass({ projectFolder, stdout: listFilesOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/widgets' })],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          elsewhereErrors: [],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({ stdout: '', exitCode: 0 }),
        }),
      );
    });

    // THE SEPARATOR IS THE WHOLE FIX. Scoped to `src/widget`, an error in the SIBLING directory
    // `src/widgets-extra` must not read as "inside the scope" just because the string
    // `src/widgets-extra` starts with `src/widget` — dropping the trailing `/` in the prefix check
    // is exactly the mutation this test exists to catch.
    it('VALID: {tsc fails, error in a same-prefix sibling directory} => is NOT inside the scope, lists under elsewhereErrors', async () => {
      const proxy = checkRunTypecheckBrokerProxy();
      const projectFolder = ProjectFolderStub();
      const tscOutput = [
        '/home/user/project/packages/ward/src/index.ts',
        'src/widgets-extra/panel.ts(3,2): error TS2322: Type mismatch.',
      ].join('\n');
      proxy.setupFail({ projectFolder, stdout: tscOutput });

      const result = await checkRunTypecheckBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'src/widget' })],
      });

      const siblingError = ErrorEntryStub({
        filePath: 'src/widgets-extra/panel.ts',
        line: 3,
        column: 2,
        message: 'TS2322: Type mismatch.',
        severity: 'error',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [siblingError],
          elsewhereErrors: [siblingError],
          testFailures: [],
          filesCount: 1,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: ['src/index.ts'],
          rawOutput: RawOutputStub({
            stdout: 'src/widgets-extra/panel.ts(3,2): error TS2322: Type mismatch.',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });
  });
});
