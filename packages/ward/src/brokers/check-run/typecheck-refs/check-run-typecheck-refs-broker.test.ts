import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';

import { checkRunTypecheckRefsBroker } from './check-run-typecheck-refs-broker';
import { checkRunTypecheckRefsBrokerProxy } from './check-run-typecheck-refs-broker.proxy';

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

const rootPath = AbsoluteFilePathStub({ value: '/repo' });

describe('checkRunTypecheckRefsBroker', () => {
  describe('empty projectFolders', () => {
    it('EMPTY: {projectFolders: []} => returns empty map without spawning tsc', async () => {
      checkRunTypecheckRefsBrokerProxy();

      const result = await checkRunTypecheckRefsBroker({
        rootPath,
        projectFolders: [],
      });

      expect(result.size).toBe(0);
    });
  });

  describe('two packages, both pass', () => {
    it('VALID: {clean tsc -b output for two packages} => both get status pass and empty errors', async () => {
      const proxy = checkRunTypecheckRefsBrokerProxy();
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });
      const orchestrator = ProjectFolderStub({
        name: 'orchestrator',
        path: '/repo/packages/orchestrator',
      });

      proxy.setupTscBOutput({ output: '', exitCode: 0 });

      const result = await checkRunTypecheckRefsBroker({
        rootPath,
        projectFolders: [shared, orchestrator],
      });

      expect(result.get(shared.path)).toStrictEqual(
        ProjectResultStub({
          projectFolder: shared,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 1,
          discoveredCount: 1,
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 0 }),
        }),
      );

      expect(result.get(orchestrator.path)).toStrictEqual(
        ProjectResultStub({
          projectFolder: orchestrator,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 1,
          discoveredCount: 1,
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 0 }),
        }),
      );
    });
  });

  describe('two packages, one has type error', () => {
    it('VALID: {type error in orchestrator} => orchestrator gets status fail, shared stays pass', async () => {
      const proxy = checkRunTypecheckRefsBrokerProxy();
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });
      const orchestrator = ProjectFolderStub({
        name: 'orchestrator',
        path: '/repo/packages/orchestrator',
      });

      const output = [
        "packages/orchestrator/src/bar.ts(5,1): error TS2322: Type 'string' is not assignable to type 'number'.",
      ].join('\n');

      proxy.setupTscBOutput({ output, exitCode: 1 });

      const result = await checkRunTypecheckRefsBroker({
        rootPath,
        projectFolders: [shared, orchestrator],
      });

      expect(result.get(shared.path)).toStrictEqual(
        ProjectResultStub({
          projectFolder: shared,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 1,
          discoveredCount: 1,
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 1 }),
        }),
      );

      expect(result.get(orchestrator.path)).toStrictEqual(
        ProjectResultStub({
          projectFolder: orchestrator,
          status: 'fail',
          errors: [
            ErrorEntryStub({
              filePath: 'packages/orchestrator/src/bar.ts',
              line: 5,
              column: 1,
              message: "TS2322: Type 'string' is not assignable to type 'number'.",
              severity: 'error',
            }),
          ],
          testFailures: [],
          filesCount: 1,
          discoveredCount: 1,
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('errors outside any package', () => {
    it('VALID: {error filePath outside all packages} => does not crash, unmatched errors not in any package result', async () => {
      const proxy = checkRunTypecheckRefsBrokerProxy();
      const shared = ProjectFolderStub({ name: 'shared', path: '/repo/packages/shared' });

      const output = ['/other/path/file.ts(3,1): error TS2322: Type error.'].join('\n');

      proxy.setupTscBOutput({ output, exitCode: 1 });

      const result = await checkRunTypecheckRefsBroker({
        rootPath,
        projectFolders: [shared],
      });

      expect(result.get(shared.path)).toStrictEqual(
        ProjectResultStub({
          projectFolder: shared,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 1,
          discoveredCount: 1,
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 1 }),
        }),
      );
    });
  });
});
