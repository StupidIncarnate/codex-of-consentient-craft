import { questReachRouteBroker } from './quest-reach-route-broker';
import { questReachRouteBrokerProxy } from './quest-reach-route-broker.proxy';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import {
  GetQuestInputStub,
  GetQuestResultStub,
  ModifyQuestInputStub,
  ModifyQuestResultStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

describe('questReachRouteBroker', () => {
  describe('a single hop on a write-only target', () => {
    it('VALID: {from: created, to: explore_flows} => modifies once and returns the reloaded quest', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth', status: 'created' });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'explore_flows' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      const reloadedQuest = QuestStub({ id: 'add-auth', status: 'explore_flows' });
      proxy.setupReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: true, quest: reloadedQuest }),
      });

      const outcome = await questReachRouteBroker({
        from: 'created',
        to: 'explore_flows',
        target,
        record,
      });

      expect(outcome).toStrictEqual(reloadedQuest);
    });
  });

  describe('several hops on a write-only target', () => {
    it('VALID: {from: created, to: flows_approved} => modifies every intermediate hop in order', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth', status: 'created' });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'explore_flows' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'review_flows' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'flows_approved' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      const reloadedQuest = QuestStub({ id: 'add-auth', status: 'flows_approved' });
      proxy.setupReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: true, quest: reloadedQuest }),
      });

      const outcome = await questReachRouteBroker({
        from: 'created',
        to: 'flows_approved',
        target,
        record,
      });

      expect(outcome).toStrictEqual(reloadedQuest);
    });
  });

  describe('a hop the gate refuses', () => {
    it('ERROR: {questModifyBroker returns success: false for a hop} => throws naming the hop and the gate message', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth', status: 'created' });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'explore_flows' }),
        result: ModifyQuestResultStub({
          success: false,
          error: 'Missing required content for transition to explore_flows',
        }),
      });

      await expect(
        questReachRouteBroker({ from: 'created', to: 'explore_flows', target, record }),
      ).rejects.toThrow(
        /^questReachRouteBroker: could not reach "explore_flows" — Missing required content for transition to explore_flows$/u,
      );
    });
  });

  describe('reaching in_progress on a write-only target', () => {
    it('ERROR: {to: in_progress, target has no baseUrl} => throws naming the missing relay-seed path', async () => {
      questReachRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth', status: 'approved' });

      await expect(
        questReachRouteBroker({ from: 'approved', to: 'in_progress', target, record }),
      ).rejects.toThrow(
        /^questReachRouteBroker: a write-only target cannot walk a quest to "in_progress"/u,
      );
    });
  });

  describe('reaching in_progress on an api-capable target', () => {
    it('VALID: {to: in_progress, target carries baseUrl} => posts to the real start route and returns the reloaded quest', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({ baseUrl: 'http://app.in-process' });
      const record = QuestStub({ id: 'add-auth', status: 'approved' });
      proxy.setupStart({
        url: 'http://app.in-process/api/quests/add-auth/start',
        response: DmHttpResponseStub({ status: 200, body: { success: true } }),
      });
      const reloadedQuest = QuestStub({ id: 'add-auth', status: 'in_progress' });
      proxy.setupReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: true, quest: reloadedQuest }),
      });

      const outcome = await questReachRouteBroker({
        from: 'approved',
        to: 'in_progress',
        target,
        record,
      });

      expect(outcome).toStrictEqual(reloadedQuest);
    });
  });

  describe('a failed reload', () => {
    it('ERROR: {questGetBroker returns success: false after every hop lands} => throws naming the reload error', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth', status: 'created' });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'explore_flows' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      proxy.setupReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: false, error: 'quest add-auth vanished' }),
      });

      await expect(
        questReachRouteBroker({ from: 'created', to: 'explore_flows', target, record }),
      ).rejects.toThrow(
        /^questReachRouteBroker: reload failed after walking to "explore_flows" — quest add-auth vanished$/u,
      );
    });
  });
});
