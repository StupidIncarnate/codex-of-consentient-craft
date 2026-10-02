import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { SiegeInstanceIdStub } from '@dungeonmaster/shared/contracts/siege-instance-id/siege-instance-id.stub';

import { laneKillBrokerProxy } from './lane-kill-broker.proxy';

const WORKTREE_PATH = '/repo/worktrees/add-auth';

describe('laneKillBroker', () => {
  describe('a live instance', () => {
    it('VALID: {stopped: true} => returns { stopped: true }', async () => {
      const proxy = laneKillBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupStopped({ quest, stopped: true });

      const result = await proxy.callBroker({
        questId: quest.id,
        instanceId: SiegeInstanceIdStub(),
      });

      expect(result).toStrictEqual({ stopped: true });
    });
  });

  describe('an already-dead instance', () => {
    it('VALID: {orphan reap, stopped: true} => returns { stopped: true } — safe to call twice', async () => {
      const proxy = laneKillBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupStopped({ quest, stopped: true });
      proxy.setupStopped({ quest, stopped: true });

      const first = await proxy.callBroker({
        questId: quest.id,
        instanceId: SiegeInstanceIdStub(),
      });
      const second = await proxy.callBroker({
        questId: quest.id,
        instanceId: SiegeInstanceIdStub(),
      });

      expect({ first, second }).toStrictEqual({
        first: { stopped: true },
        second: { stopped: true },
      });
    });
  });

  describe('the instance id reaching the loaded module', () => {
    it('VALID: {instanceId} => calls instanceKillBroker with the stringified id', async () => {
      const proxy = laneKillBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupStopped({ quest, stopped: true });
      const instanceId = SiegeInstanceIdStub();

      await proxy.callBroker({ questId: quest.id, instanceId });

      expect(proxy.getKilledInstanceIds()).toStrictEqual([String(instanceId)]);
    });
  });

  describe('the checkout the lane is killed from', () => {
    it('VALID: {quest worktreePath differs from the process cwd} => siegelense is loaded from the worktree and instanceKillBroker receives repoRoot = the worktree', async () => {
      const proxy = laneKillBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        worktreePath: WORKTREE_PATH,
      });
      proxy.setupStopped({ quest, stopped: true });
      const instanceId = SiegeInstanceIdStub();

      const result = await proxy.callBroker({ questId: quest.id, instanceId });

      expect({ result, calls: proxy.getKillCalls() }).toStrictEqual({
        result: { stopped: true },
        calls: [{ instanceId: String(instanceId), repoRoot: WORKTREE_PATH }],
      });
    });

    it('VALID: {quest has no worktree} => siegelense is loaded from the repo root and instanceKillBroker receives repoRoot = the repo root', async () => {
      const proxy = laneKillBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupStopped({ quest, stopped: true, repoRoot: '/home/testuser' });
      const instanceId = SiegeInstanceIdStub();

      await proxy.callBroker({ questId: quest.id, instanceId });

      expect(proxy.getKillCalls()).toStrictEqual([
        { instanceId: String(instanceId), repoRoot: '/home/testuser' },
      ]);
    });

    it('ERROR: {quest worktree directory is gone} => throws naming the quest and the recorded path, kills nothing', async () => {
      const proxy = laneKillBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        worktreePath: WORKTREE_PATH,
      });
      proxy.setupMissingWorktree({ quest });

      await expect(
        proxy.callBroker({ questId: quest.id, instanceId: SiegeInstanceIdStub() }),
      ).rejects.toThrow(
        /^Cannot kill a lane for quest add-auth: worktree not found: \/repo\/worktrees\/add-auth$/u,
      );
      expect(proxy.getKillCalls()).toStrictEqual([]);
    });
  });

  describe('module resolution failure', () => {
    it('ERROR: {module not found} => the error names the package rather than the specifier', async () => {
      const proxy = laneKillBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
      proxy.setupImportFailure({
        quest,
        error: new Error("Cannot find module '/repo/packages/siegelense/dist/brokers.js'"),
      });

      await expect(
        proxy.callBroker({ questId: quest.id, instanceId: SiegeInstanceIdStub() }),
      ).rejects.toThrow(
        /^Failed to load @dungeonmaster\/siegelense\/brokers: Cannot find module '\/repo\/packages\/siegelense\/dist\/brokers\.js'$/u,
      );
    });
  });
});
