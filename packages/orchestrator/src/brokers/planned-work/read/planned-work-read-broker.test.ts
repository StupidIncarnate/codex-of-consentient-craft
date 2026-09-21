import { AbsoluteFilePathStub, OperationItemIdStub } from '@dungeonmaster/shared/contracts';

import { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkReadBroker } from './planned-work-read-broker';
import { plannedWorkReadBrokerProxy } from './planned-work-read-broker.proxy';

describe('plannedWorkReadBroker', () => {
  describe('a plan exists on disk', () => {
    it('VALID: {questFolderPath, operationItemId, a plan written for it} => returns the parsed WorkPlan', async () => {
      const proxy = plannedWorkReadBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/add-auth' });
      const operationItemId = OperationItemIdStub({
        value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
      });
      const plan = WorkPlanStub({ operationItemId });

      proxy.setupPlanFound({ questFolderPath, operationItemId, plan });

      const result = await plannedWorkReadBroker({ questFolderPath, operationItemId });

      expect(result).toStrictEqual(plan);
    });
  });

  describe('no plan has been written yet', () => {
    it('EMPTY: {questFolderPath, operationItemId, no planned-work file on disk} => returns null', async () => {
      const proxy = plannedWorkReadBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/no-plan-yet' });
      const operationItemId = OperationItemIdStub({
        value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      });

      proxy.setupPlanMissing({ questFolderPath, operationItemId });

      const result = await plannedWorkReadBroker({ questFolderPath, operationItemId });

      expect(result).toBe(null);
    });
  });

  describe('error cases', () => {
    it('ERROR: {file accessible but the read itself fails} => throws the read error', async () => {
      const proxy = plannedWorkReadBrokerProxy();
      const questFolderPath = AbsoluteFilePathStub({ value: '/quests/read-fails' });
      const operationItemId = OperationItemIdStub({
        value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
      });

      proxy.setupReadFailure({
        questFolderPath,
        operationItemId,
        error: new Error('EACCES: permission denied'),
      });

      // fsReadFileAdapter rewraps every failure into its own generic Error — the story's own
      // "trap" note — so the message this broker's caller actually sees names the file path, not
      // the underlying EACCES text.
      await expect(plannedWorkReadBroker({ questFolderPath, operationItemId })).rejects.toThrow(
        /Failed to read file at/u,
      );
    });
  });
});
