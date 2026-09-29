import { questReachRouteBroker } from './quest-reach-route-broker';
import { questReachRouteBrokerProxy } from './quest-reach-route-broker.proxy';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { questGateContentDefaultsStatics } from '../../../statics/quest-gate-content-defaults/quest-gate-content-defaults-statics';
import { GetQuestInputStub } from '@dungeonmaster/shared/contracts/get-quest-input/get-quest-input.stub';
import { GetQuestResultStub } from '@dungeonmaster/shared/contracts/get-quest-result/get-quest-result.stub';
import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts/modify-quest-input/modify-quest-input.stub';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

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

  describe('extraFields carrying gate content past explore_flows (DEF-71)', () => {
    it('VALID: {extraFields: {flows, packagesAffected}} => applies them once via a real modify call right after reaching explore_flows, then keeps walking', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({});
      const record = QuestStub({ id: 'add-auth', status: 'created' });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'explore_flows' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({
          questId: 'add-auth',
          // `questGateContentDefaultsStatics` is declared `as const`, so its arrays are deeply
          // `readonly` — a JSON round-trip strips that back to the mutable shape the stub's own
          // argument type expects, the same technique `guild-with-three-quests`'s own integration
          // test uses for the identical reason.
          flows: JSON.parse(JSON.stringify(questGateContentDefaultsStatics.flows)),
          packagesAffected: JSON.parse(
            JSON.stringify(questGateContentDefaultsStatics.packagesAffected),
          ),
        }),
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
        extraFields: {
          flows: questGateContentDefaultsStatics.flows,
          packagesAffected: questGateContentDefaultsStatics.packagesAffected,
        },
      });

      expect(outcome).toStrictEqual(reloadedQuest);
    });

    it('VALID: {extraFields with content, the content call left unstaged} => the walk genuinely attempts that exact modify call, proven by the recorded modify inputs', async () => {
      // Every OTHER call this walk makes is staged; the content-application call at explore_flows
      // deliberately is not. If the broker actually calls questModifyBroker with the gate-content
      // fields (the real, unmutated behaviour), that call has no matching address and registerMock
      // throws unconditionally — proving the call was attempted rather than merely leaving the
      // final outcome unchanged (which a call that never fired would ALSO produce, since every
      // hop's own status-modify stub is unconditionally staged regardless).
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

      await questReachRouteBroker({
        from: 'created',
        to: 'review_flows',
        target,
        record,
        extraFields: {
          flows: questGateContentDefaultsStatics.flows,
          packagesAffected: questGateContentDefaultsStatics.packagesAffected,
        },
      }).catch((error: unknown) => error);

      const carriesContent = proxy
        .getModifyInputs()
        .map((input) => JSON.stringify(input).includes('hydration-recipes-seed'));

      expect(carriesContent.filter(Boolean)).toStrictEqual([true]);
    });

    it('VALID: {extraFields: {flows: []}} => an empty array supplies no content, so no extra modify call happens', async () => {
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
        extraFields: { flows: [] },
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
