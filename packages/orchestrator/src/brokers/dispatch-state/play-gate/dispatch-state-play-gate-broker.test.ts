import {
  DispatchStateStub,
  GuildListItemStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { dispatchStatePlayGateBroker } from './dispatch-state-play-gate-broker';
import { dispatchStatePlayGateBrokerProxy } from './dispatch-state-play-gate-broker.proxy';

const NOW = '2024-01-15T10:00:00.000Z';

describe('dispatchStatePlayGateBroker', () => {
  describe('force', () => {
    it('VALID: {force: true} => allowed without consulting state or quests', async () => {
      dispatchStatePlayGateBrokerProxy();

      const result = await dispatchStatePlayGateBroker({ force: true });

      expect(result).toStrictEqual({ allowed: true });
    });
  });

  describe('MCP heartbeat gate', () => {
    it('INVALID: {heartbeat 1 minute old} => refused with heartbeat reason', async () => {
      const proxy = dispatchStatePlayGateBrokerProxy();
      jest.useFakeTimers().setSystemTime(new Date(NOW));
      proxy.setupDispatchState({
        state: DispatchStateStub({ mcpHeartbeatAt: '2024-01-15T09:59:00.000Z' }),
      });

      const result = await dispatchStatePlayGateBroker({});

      jest.useRealTimers();

      expect(result).toStrictEqual({
        allowed: false,
        reason: orchestrationDispatchStatics.exclusivity.heartbeatRefusalReason,
      });
    });

    it('VALID: {heartbeat 10 minutes old, no guilds} => allowed', async () => {
      const proxy = dispatchStatePlayGateBrokerProxy();
      jest.useFakeTimers().setSystemTime(new Date(NOW));
      proxy.setupDispatchState({
        state: DispatchStateStub({ mcpHeartbeatAt: '2024-01-15T09:50:00.000Z' }),
      });
      proxy.setupGuilds({ items: [] });

      const result = await dispatchStatePlayGateBroker({});

      jest.useRealTimers();

      expect(result).toStrictEqual({ allowed: true });
    });
  });

  describe('in-flight MCP agent gate', () => {
    it('INVALID: {active quest with in_progress item carrying agentId} => refused with in-flight reason', async () => {
      const proxy = dispatchStatePlayGateBrokerProxy();
      const guild = GuildListItemStub();
      proxy.setupDispatchState({ state: DispatchStateStub() });
      proxy.setupGuilds({ items: [guild] });
      proxy.setupQuests({
        guildId: guild.id,
        quests: [
          QuestStub({
            status: 'in_progress',
            workItems: [
              WorkItemStub({
                status: 'in_progress',
                sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' as never,
                agentId: 'a0a7f82d9619a1800' as never,
              }),
            ],
          }),
        ],
      });

      const result = await dispatchStatePlayGateBroker({});

      expect(result).toStrictEqual({
        allowed: false,
        reason: orchestrationDispatchStatics.exclusivity.inFlightRefusalReason,
      });
    });

    it('VALID: {in_progress item without agentId (node-dispatched)} => allowed', async () => {
      const proxy = dispatchStatePlayGateBrokerProxy();
      const guild = GuildListItemStub();
      proxy.setupDispatchState({ state: DispatchStateStub() });
      proxy.setupGuilds({ items: [guild] });
      proxy.setupQuests({
        guildId: guild.id,
        quests: [
          QuestStub({
            status: 'in_progress',
            workItems: [
              WorkItemStub({
                status: 'in_progress',
                sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' as never,
              }),
            ],
          }),
        ],
      });

      const result = await dispatchStatePlayGateBroker({});

      expect(result).toStrictEqual({ allowed: true });
    });

    it('VALID: {agentId item on a blocked quest} => allowed (only active quests are scanned)', async () => {
      const proxy = dispatchStatePlayGateBrokerProxy();
      const guild = GuildListItemStub();
      proxy.setupDispatchState({ state: DispatchStateStub() });
      proxy.setupGuilds({ items: [guild] });
      proxy.setupQuests({
        guildId: guild.id,
        quests: [
          QuestStub({
            status: 'blocked',
            workItems: [
              WorkItemStub({
                status: 'in_progress',
                agentId: 'a0a7f82d9619a1800' as never,
              }),
            ],
          }),
        ],
      });

      const result = await dispatchStatePlayGateBroker({});

      expect(result).toStrictEqual({ allowed: true });
    });

    it('VALID: {invalid guild is skipped} => allowed without scanning its quests', async () => {
      const proxy = dispatchStatePlayGateBrokerProxy();
      proxy.setupDispatchState({ state: DispatchStateStub() });
      proxy.setupGuilds({ items: [GuildListItemStub({ valid: false })] });

      const result = await dispatchStatePlayGateBroker({});

      expect(result).toStrictEqual({ allowed: true });
    });
  });
});
