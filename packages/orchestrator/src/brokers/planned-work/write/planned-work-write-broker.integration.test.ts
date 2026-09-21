/**
 * PURPOSE: Integration coverage proving plannedWorkWriteBroker and plannedWorkReadBroker round-trip
 * through a REAL minted quest folder on disk — not a bare temp dir and not a mocked fs boundary.
 * Covers the directory-creation-on-first-write, second-write-overwrite and missing-file-is-null
 * cases the unit suites (mocked) cannot prove for real.
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/src/brokers/planned-work/write/planned-work-write-broker.integration.test.ts
 */

import { BaseNameStub, installTestbedCreateBroker } from '@dungeonmaster/testing';
import { OperationItemIdStub } from '@dungeonmaster/shared/contracts';
import { locationsPlannedWorkPathFindBroker } from '@dungeonmaster/shared/brokers';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { orchestrationQuestHarness } from '../../../../test/harnesses/orchestration-quest/orchestration-quest.harness';
import { plannedWorkDiskHarness } from '../../../../test/harnesses/planned-work-disk/planned-work-disk.harness';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkReadBroker } from '../read/planned-work-read-broker';
import { plannedWorkWriteBroker } from './planned-work-write-broker';

describe('plannedWorkWriteBroker + plannedWorkReadBroker (integration — real disk)', () => {
  const quest = orchestrationQuestHarness();
  const disk = plannedWorkDiskHarness();

  it('VALID: {a plan written then read} => comes back identical, through a real minted quest folder', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'planned-work-roundtrip' }),
    });
    const { questId } = await quest.createGuildAndQuest({ testbed });
    const { questPath: questFolderPath } = await questFindQuestPathBroker({ questId });
    const operationItemId = OperationItemIdStub({ value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });
    const plan = WorkPlanStub({ operationItemId });

    await plannedWorkWriteBroker({ questFolderPath, operationItemId, plan });
    const result = await plannedWorkReadBroker({ questFolderPath, operationItemId });

    await quest.afterEach();
    testbed.cleanup();

    expect(result).toStrictEqual(plan);
  });

  it('EMPTY: {a freshly minted quest with no plan ever written} => reading returns null, not a throw and not {}', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'planned-work-missing' }),
    });
    const { questId } = await quest.createGuildAndQuest({ testbed });
    const { questPath: questFolderPath } = await questFindQuestPathBroker({ questId });
    const operationItemId = OperationItemIdStub({ value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479' });

    const result = await plannedWorkReadBroker({ questFolderPath, operationItemId });

    await quest.afterEach();
    testbed.cleanup();

    expect(result).toBe(null);
  });

  it('VALID: {the first write on a fresh quest} => planned-work/ does not exist before the write and exists after', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'planned-work-mkdir' }),
    });
    const { questId } = await quest.createGuildAndQuest({ testbed });
    const { questPath: questFolderPath } = await questFindQuestPathBroker({ questId });
    const operationItemId = OperationItemIdStub({ value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479' });
    const plan = WorkPlanStub({ operationItemId });

    const existedBefore = disk.dirExists({ questFolderPath });
    await plannedWorkWriteBroker({ questFolderPath, operationItemId, plan });
    const existsAfter = disk.dirExists({ questFolderPath });

    await quest.afterEach();
    testbed.cleanup();

    expect(existedBefore).toBe(false);
    expect(existsAfter).toBe(true);
  });

  it('VALID: {a second write to the same operationItemId} => overwrites cleanly — the mkdir call does not throw on a directory that already exists', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'planned-work-overwrite' }),
    });
    const { questId } = await quest.createGuildAndQuest({ testbed });
    const { questPath: questFolderPath } = await questFindQuestPathBroker({ questId });
    const operationItemId = OperationItemIdStub({ value: 'd4e5f6a7-58cc-4372-a567-0e02b2c3d479' });
    const firstPlan = WorkPlanStub({ operationItemId, flowId: 'send-flow' });
    const secondPlan = WorkPlanStub({ operationItemId, flowId: null });

    await plannedWorkWriteBroker({ questFolderPath, operationItemId, plan: firstPlan });
    await plannedWorkWriteBroker({ questFolderPath, operationItemId, plan: secondPlan });
    const result = await plannedWorkReadBroker({ questFolderPath, operationItemId });

    await quest.afterEach();
    testbed.cleanup();

    expect(result).toStrictEqual(secondPlan);
  });

  it('VALID: {the resolved directory} => composes from locationsPlannedWorkPathFindBroker + locationsStatics.quest.plannedWorkDir, not a literal', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'planned-work-resolver' }),
    });
    const { questId } = await quest.createGuildAndQuest({ testbed });
    const { questPath: questFolderPath } = await questFindQuestPathBroker({ questId });
    const operationItemId = OperationItemIdStub({ value: 'e5f6a7b8-58cc-4372-a567-0e02b2c3d479' });
    const plan = WorkPlanStub({ operationItemId });

    await plannedWorkWriteBroker({ questFolderPath, operationItemId, plan });
    const resolvedDir = locationsPlannedWorkPathFindBroker({ questFolderPath });
    const onDisk = disk.finalFileExists({ questFolderPath, operationItemId });

    await quest.afterEach();
    testbed.cleanup();

    expect(String(resolvedDir)).toBe(
      `${String(questFolderPath)}/${locationsStatics.quest.plannedWorkDir}`,
    );
    expect(onDisk).toBe(true);
  });

  it('VALID: {a completed write} => no .tmp file survives, and the final json holds the complete, non-truncated plan', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'planned-work-atomic' }),
    });
    const { questId } = await quest.createGuildAndQuest({ testbed });
    const { questPath: questFolderPath } = await questFindQuestPathBroker({ questId });
    const operationItemId = OperationItemIdStub({ value: 'f6a7b8c9-58cc-4372-a567-0e02b2c3d479' });
    const plan = WorkPlanStub({ operationItemId });

    await plannedWorkWriteBroker({ questFolderPath, operationItemId, plan });
    const tmpStillExists = disk.tmpFileExists({ questFolderPath, operationItemId });
    const finalContents = disk.readFinalFileRaw({ questFolderPath, operationItemId });

    await quest.afterEach();
    testbed.cleanup();

    expect(tmpStillExists).toBe(false);
    expect(finalContents).toStrictEqual(plan);
  });
});
