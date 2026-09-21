import { AbsoluteFilePathStub, OperationItemIdStub } from '@dungeonmaster/shared/contracts';

import { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkWriteBroker } from './planned-work-write-broker';
import { plannedWorkWriteBrokerProxy } from './planned-work-write-broker.proxy';

const JSON_INDENT_SPACES = 2;

describe('plannedWorkWriteBroker', () => {
  describe('successful write', () => {
    it('VALID: {questFolderPath, operationItemId, plan} => writes the plan JSON to the tmp path', async () => {
      const proxy = plannedWorkWriteBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/add-auth' });
      const operationItemId = OperationItemIdStub({
        value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      });
      const plan = WorkPlanStub({ operationItemId });

      proxy.setupWriteSucceeds({ questFolderPath, operationItemId });

      await expect(
        plannedWorkWriteBroker({ questFolderPath, operationItemId, plan }),
      ).resolves.toStrictEqual({ success: true });

      expect(proxy.getWrittenContent({ questFolderPath, operationItemId })).toBe(
        JSON.stringify(plan, null, JSON_INDENT_SPACES),
      );
    });

    it('VALID: {questFolderPath, operationItemId, plan} => renames the tmp file onto the final planned-work path', async () => {
      const proxy = plannedWorkWriteBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/fix-bug' });
      const operationItemId = OperationItemIdStub({
        value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      });
      const plan = WorkPlanStub({ operationItemId });

      proxy.setupWriteSucceeds({ questFolderPath, operationItemId });

      await plannedWorkWriteBroker({ questFolderPath, operationItemId, plan });

      expect(proxy.getAllRenames()).toStrictEqual([
        {
          from: `/quests/fix-bug/planned-work/${String(operationItemId)}.json.tmp`,
          to: `/quests/fix-bug/planned-work/${String(operationItemId)}.json`,
        },
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {directory create fails} => throws the mkdir error', async () => {
      const proxy = plannedWorkWriteBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/mkdir-fails' });
      const operationItemId = OperationItemIdStub({
        value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
      });
      const plan = WorkPlanStub({ operationItemId });

      proxy.setupMkdirFailure({
        questFolderPath,
        operationItemId,
        error: new Error('EACCES: permission denied'),
      });

      await expect(
        plannedWorkWriteBroker({ questFolderPath, operationItemId, plan }),
      ).rejects.toThrow(/EACCES/u);
    });

    it('ERROR: {tmp write fails} => throws the write error', async () => {
      const proxy = plannedWorkWriteBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/write-fails' });
      const operationItemId = OperationItemIdStub({
        value: 'd4e5f6a7-58cc-4372-a567-0e02b2c3d479',
      });
      const plan = WorkPlanStub({ operationItemId });

      proxy.setupWriteFailure({
        questFolderPath,
        operationItemId,
        error: new Error('ENOSPC: no space left on device'),
      });

      await expect(
        plannedWorkWriteBroker({ questFolderPath, operationItemId, plan }),
      ).rejects.toThrow(/ENOSPC/u);
    });

    it('ERROR: {rename fails} => throws the rename error', async () => {
      const proxy = plannedWorkWriteBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/rename-fails' });
      const operationItemId = OperationItemIdStub({
        value: 'e5f6a7b8-58cc-4372-a567-0e02b2c3d479',
      });
      const plan = WorkPlanStub({ operationItemId });

      proxy.setupRenameFailure({
        questFolderPath,
        operationItemId,
        error: new Error('EXDEV: cross-device link not permitted'),
      });

      await expect(
        plannedWorkWriteBroker({ questFolderPath, operationItemId, plan }),
      ).rejects.toThrow(/EXDEV/u);
    });
  });
});
