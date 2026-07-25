import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { isCrashedProjectResultGuard } from '../../../guards/is-crashed-project-result/is-crashed-project-result-guard';

import { commandRunLayerChildCrashBroker } from './command-run-layer-child-crash-broker';
import { commandRunLayerChildCrashBrokerProxy } from './command-run-layer-child-crash-broker.proxy';

describe('commandRunLayerChildCrashBroker', () => {
  describe('builds crashed checks', () => {
    it('VALID: {two check types} => returns one failing check per type', () => {
      commandRunLayerChildCrashBrokerProxy();
      const projectFolder = ProjectFolderStub({ name: 'server' });

      const result = commandRunLayerChildCrashBroker({
        projectFolder,
        checkTypes: ['lint', 'unit'],
        exitCode: ExitCodeStub({ value: 1 }),
        output: ErrorMessageStub({ value: 'boom' }),
      });

      expect(result.map((check) => [check.checkType, check.status])).toStrictEqual([
        ['lint', 'fail'],
        ['unit', 'fail'],
      ]);
    });

    it('VALID: {child output} => project result reads as a crash carrying the output tail', () => {
      commandRunLayerChildCrashBrokerProxy();
      const projectFolder = ProjectFolderStub({ name: 'server' });

      const result = commandRunLayerChildCrashBroker({
        projectFolder,
        checkTypes: ['lint'],
        exitCode: ExitCodeStub({ value: 137 }),
        output: ErrorMessageStub({ value: 'partial output' }),
      });

      const projectResult = result[0]?.projectResults[0];

      expect(isCrashedProjectResultGuard({ projectResult })).toBe(true);
      expect(projectResult?.rawOutput.stdout).toBe('partial output');
      expect(projectResult?.rawOutput.stderr).toBe(
        'ward child process for server exited with code 137 and wrote no readable result file',
      );
      expect(projectResult?.rawOutput.exitCode).toBe(137);
    });

    it('EDGE: {null exit code} => records the failing exit code', () => {
      commandRunLayerChildCrashBrokerProxy();

      const result = commandRunLayerChildCrashBroker({
        projectFolder: ProjectFolderStub(),
        checkTypes: ['lint'],
        exitCode: null,
        output: ErrorMessageStub({ value: '' }),
      });

      expect(result[0]?.projectResults[0]?.rawOutput.exitCode).toBe(1);
    });
  });
});
