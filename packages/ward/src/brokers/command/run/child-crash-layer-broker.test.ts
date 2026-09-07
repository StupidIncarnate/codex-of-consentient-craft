import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { isCrashedProjectResultGuard } from '../../../guards/is-crashed-project-result/is-crashed-project-result-guard';

import { childCrashLayerBroker } from './child-crash-layer-broker';
import { childCrashLayerBrokerProxy } from './child-crash-layer-broker.proxy';

describe('childCrashLayerBroker', () => {
  describe('builds crashed checks', () => {
    it('VALID: {two check types} => returns one failing check per type', () => {
      childCrashLayerBrokerProxy();
      const projectFolder = ProjectFolderStub({ name: 'server' });

      const result = childCrashLayerBroker({
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
      childCrashLayerBrokerProxy();
      const projectFolder = ProjectFolderStub({ name: 'server' });

      const result = childCrashLayerBroker({
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
      childCrashLayerBrokerProxy();

      const result = childCrashLayerBroker({
        projectFolder: ProjectFolderStub(),
        checkTypes: ['lint'],
        exitCode: null,
        output: ErrorMessageStub({ value: '' }),
      });

      expect(result[0]?.projectResults[0]?.rawOutput.exitCode).toBe(1);
    });
  });
});
