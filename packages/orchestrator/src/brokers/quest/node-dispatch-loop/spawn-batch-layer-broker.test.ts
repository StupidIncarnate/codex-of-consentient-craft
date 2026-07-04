import { AdapterResultStub, GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SpawnInstructionStub } from '../../../contracts/spawn-instruction/spawn-instruction.stub';
import { spawnBatchLayerBroker } from './spawn-batch-layer-broker';
import { spawnBatchLayerBrokerProxy } from './spawn-batch-layer-broker.proxy';

const SESSION_ID = '9c4d8f1c-3e38-48c9-bdec-22b61883b473';

describe('spawnBatchLayerBroker', () => {
  describe('happy path', () => {
    it('VALID: {one instruction, session emitted} => pre-stamps in_progress, spawns in guild cwd, stamps sessionId', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupQuestContext({
        questId: instruction.questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      const result = await spawnBatchLayerBroker({ agents: [instruction] });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getModifyCallInputs()).toStrictEqual([
        {
          questId: instruction.questId,
          workItems: [
            {
              id: instruction.workItemId,
              status: 'in_progress',
              startedAt: '2024-01-15T10:00:00.000Z',
            },
          ],
        },
        {
          questId: instruction.questId,
          workItems: [
            {
              id: instruction.workItemId,
              sessionId: SESSION_ID,
            },
          ],
        },
      ]);
      expect(proxy.getSpawnedCwd()).toBe('/home/user/my-project');
    });

    it('VALID: {instruction without model override} => spawns with the role-mapped model in CLI args', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const instruction = SpawnInstructionStub({ role: 'codeweaver' });
      proxy.setupQuestContext({
        questId: instruction.questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      await spawnBatchLayerBroker({ agents: [instruction] });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        instruction.taskPrompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'opus',
        '--settings',
        '{"hooks":{}}',
      ]);
    });

    it('VALID: {instruction with model: haiku} => spawns with the override model in CLI args', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const instruction = SpawnInstructionStub({ model: 'haiku' as never });
      proxy.setupQuestContext({
        questId: instruction.questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      await spawnBatchLayerBroker({ agents: [instruction] });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        '-p',
        instruction.taskPrompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--model',
        'haiku',
        '--settings',
        '{"hooks":{}}',
      ]);
    });

    it('VALID: {registerProcess provided} => registers the child with processId and kill handle', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupQuestContext({
        questId: instruction.questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });
      const registerProcess = jest.fn();

      await spawnBatchLayerBroker({ agents: [instruction], registerProcess });

      expect(registerProcess.mock.calls).toStrictEqual([
        [
          {
            processId: 'node-dispatch-00000000-0000-4000-8000-00000000d15b',
            questId: instruction.questId,
            questWorkItemId: instruction.workItemId,
            kill: expect.any(Function),
          },
        ],
      ]);
    });

    it('VALID: {two instructions on the same quest} => resolves the guild context once', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const first = SpawnInstructionStub({ questId });
      const second = SpawnInstructionStub({
        questId,
        workItemId: 'cccccccc-1111-4222-9333-444444444444' as never,
        role: 'lawbringer',
      });
      proxy.setupQuestContext({
        questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifySucceeds({ times: 4 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 0 });

      await spawnBatchLayerBroker({ agents: [first, second] });

      expect(proxy.getFindQuestPathCalls()).toStrictEqual([{ questId }]);
    });
  });

  describe('degraded paths', () => {
    it('EMPTY: {child exits without emitting a session line} => only the pre-stamp modify happens', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupQuestContext({
        questId: instruction.questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifySucceeds({ times: 1 });
      proxy.setupSpawnExitsWithoutSession({ exitCode: 0 });

      const result = await spawnBatchLayerBroker({ agents: [instruction] });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getModifyCallInputs()).toStrictEqual([
        {
          questId: instruction.questId,
          workItems: [
            {
              id: instruction.workItemId,
              status: 'in_progress',
              startedAt: '2024-01-15T10:00:00.000Z',
            },
          ],
        },
      ]);
    });

    it('VALID: {child exits non-zero} => batch still resolves ok (terminal status owned by signal-back)', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupQuestContext({
        questId: instruction.questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifySucceeds({ times: 2 });
      proxy.setupSpawnEmitsSessionThenExits({ sessionId: SESSION_ID, exitCode: 1 });

      const result = await spawnBatchLayerBroker({ agents: [instruction] });

      expect(result).toStrictEqual(AdapterResultStub());
    });

    it('ERROR: {pre-stamp modify rejects} => child is never spawned and batch resolves ok', async () => {
      const proxy = spawnBatchLayerBrokerProxy();
      const instruction = SpawnInstructionStub();
      proxy.setupQuestContext({
        questId: instruction.questId,
        guildId: GuildIdStub(),
        guildPath: '/home/user/my-project',
      });
      proxy.setupModifyRejectsOnce({ error: new Error('quest.json locked') });

      const result = await spawnBatchLayerBroker({ agents: [instruction] });

      expect(result).toStrictEqual(AdapterResultStub());
      expect(proxy.getSpawnedArgs()).toBe(undefined);
    });
  });
});
