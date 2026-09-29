import { questReachRouteBroker } from './quest-reach-route-broker';
import { questReachRouteBrokerProxy } from './quest-reach-route-broker.proxy';
import { DmHttpResponseStub } from '../../../contracts/dm-http-response/dm-http-response.stub';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { questGateContentDefaultsStatics } from '../../../statics/quest-gate-content-defaults/quest-gate-content-defaults-statics';
import {
  GetQuestInputStub,
  GetQuestResultStub,
  GuildListItemStub,
  ModifyQuestInputStub,
  ModifyQuestResultStub,
  OperationItemStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';
const HOME = '/tmp/dm-home';
const QUEST_FILE_PATH = `${HOME}/guilds/${GUILD_ID}/quests/add-auth/quest.json`;
const OUTBOX_PATH = `${HOME}/event-outbox.jsonl`;

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

  // A played dispatcher runs the relay START just seeded — a real riftcarver, against a seeded
  // quest in a lane home with no git repo — so every START a recipe sends asks the route not to.
  describe('the START request itself', () => {
    it('VALID: {to: in_progress, target.request} => posts {play: false} to the start route', async () => {
      const proxy = questReachRouteBrokerProxy();
      const calls: unknown[] = [];
      const target = DmTargetStub({
        baseUrl: 'http://app.in-process',
        request: async (args: { method: string; path: string; body?: unknown }) => {
          calls.push(args);
          return Promise.resolve(DmHttpResponseStub({ status: 200, body: { success: true } }));
        },
      });
      const record = QuestStub({ id: 'add-auth', status: 'approved' });
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

      expect(calls).toStrictEqual([
        { method: 'POST', path: '/api/quests/add-auth/start', body: { play: false } },
      ]);
      expect(outcome).toStrictEqual(reloadedQuest);
    });

    it('VALID: {to: in_progress, START seeded a riftcarver item} => keeps the seeded riftcarver item, never persists', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({
        home: HOME,
        claudeHome: HOME,
        baseUrl: 'http://app.in-process',
        request: async () =>
          Promise.resolve(DmHttpResponseStub({ status: 200, body: { success: true } })),
      });
      const record = QuestStub({ id: 'add-auth', status: 'approved' });
      const reloadedQuest = QuestStub({
        id: 'add-auth',
        status: 'in_progress',
        operations: [
          OperationItemStub({
            id: '22222222-0000-4000-8000-000000000002',
            role: 'riftcarver',
            status: 'in_progress',
          }),
        ],
      });
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

      expect(proxy.pathsTouched()).toStrictEqual([]);
      expect(outcome).toStrictEqual(reloadedQuest);
    });
  });

  // A walk that carries on past `in_progress` never carved the quest, so what START seeded for the
  // entry family is dropped straight after it lands — otherwise a `complete` quest holds a pending
  // carve step.
  describe('walking past in_progress to complete', () => {
    it('VALID: {from: approved, to: complete, START seeded riftcarver} => drops the riftcarver operation and its carve work item, keeps the rest, then walks on', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({
        home: HOME,
        claudeHome: HOME,
        baseUrl: 'http://app.in-process',
        request: async () =>
          Promise.resolve(DmHttpResponseStub({ status: 200, body: { success: true } })),
      });
      const record = QuestStub({ id: 'add-auth', folder: 'add-auth', status: 'approved' });
      const intakeOperation = OperationItemStub({
        id: '22222222-0000-4000-8000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
      });
      const riftcarverOperation = OperationItemStub({
        id: '22222222-0000-4000-8000-000000000002',
        role: 'riftcarver',
        status: 'in_progress',
      });
      const intakeWorkItem = WorkItemStub({
        id: '33333333-0000-4000-8000-000000000001',
        role: 'chaoswhisperer',
        status: 'complete',
        relatedDataItems: ['operations/22222222-0000-4000-8000-000000000001'],
      });
      const carveWorkItem = WorkItemStub({
        id: '33333333-0000-4000-8000-000000000002',
        role: 'riftcarver',
        status: 'pending',
        spawnerType: 'command',
        relatedDataItems: ['operations/22222222-0000-4000-8000-000000000002'],
      });
      const startedQuest = QuestStub({
        id: 'add-auth',
        folder: 'add-auth',
        status: 'in_progress',
        operations: [intakeOperation, riftcarverOperation],
        workItems: [intakeWorkItem, carveWorkItem],
      });
      proxy.setupReloadOnce({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: true, quest: startedQuest }),
      });
      proxy.setupPersist({
        guild: GuildListItemStub({ id: GUILD_ID }),
        quest: startedQuest,
        questFilePath: QUEST_FILE_PATH,
        outboxPath: OUTBOX_PATH,
      });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'complete' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      const completedQuest = QuestStub({
        id: 'add-auth',
        folder: 'add-auth',
        status: 'complete',
        operations: [intakeOperation],
        workItems: [intakeWorkItem],
      });
      proxy.setupReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: true, quest: completedQuest }),
      });

      const outcome = await questReachRouteBroker({
        from: 'approved',
        to: 'complete',
        target,
        record,
      });

      expect(
        JSON.parse(String(proxy.getWrittenQuest({ questFilePath: QUEST_FILE_PATH }))),
      ).toStrictEqual(
        JSON.parse(
          JSON.stringify({
            ...startedQuest,
            operations: [intakeOperation],
            workItems: [intakeWorkItem],
          }),
        ),
      );
      expect(outcome).toStrictEqual(completedQuest);
    });

    it('EMPTY: {to: complete, START seeded no riftcarver item} => persists nothing and walks on', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({
        home: HOME,
        claudeHome: HOME,
        baseUrl: 'http://app.in-process',
        request: async () =>
          Promise.resolve(DmHttpResponseStub({ status: 200, body: { success: true } })),
      });
      const record = QuestStub({ id: 'add-auth', status: 'approved' });
      proxy.setupReloadOnce({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({
          success: true,
          quest: QuestStub({ id: 'add-auth', status: 'in_progress' }),
        }),
      });
      proxy.setupModifyHop({
        input: ModifyQuestInputStub({ questId: 'add-auth', status: 'complete' }),
        result: ModifyQuestResultStub({ success: true }),
      });
      const completedQuest = QuestStub({ id: 'add-auth', status: 'complete' });
      proxy.setupReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: true, quest: completedQuest }),
      });

      const outcome = await questReachRouteBroker({
        from: 'approved',
        to: 'complete',
        target,
        record,
      });

      expect(proxy.pathsTouched()).toStrictEqual([]);
      expect(outcome).toStrictEqual(completedQuest);
    });

    it('ERROR: {to: complete, the reload after START fails} => throws naming the reload error', async () => {
      const proxy = questReachRouteBrokerProxy();
      const target = DmTargetStub({
        baseUrl: 'http://app.in-process',
        request: async () =>
          Promise.resolve(DmHttpResponseStub({ status: 200, body: { success: true } })),
      });
      const record = QuestStub({ id: 'add-auth', status: 'approved' });
      proxy.setupReload({
        input: GetQuestInputStub({ questId: 'add-auth' }),
        result: GetQuestResultStub({ success: false, error: 'Quest not found: add-auth' }),
      });

      await expect(
        questReachRouteBroker({ from: 'approved', to: 'complete', target, record }),
      ).rejects.toThrow(
        /^questReachRouteBroker: reload failed after START on the way to "complete" — Quest not found: add-auth$/u,
      );
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

    it('VALID: {extraFields with content, the content call left unstaged} => the walk genuinely attempts that exact modify call, proven by registerMock refusing an address nothing staged', async () => {
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

      await expect(
        questReachRouteBroker({
          from: 'created',
          to: 'review_flows',
          target,
          record,
          extraFields: {
            flows: questGateContentDefaultsStatics.flows,
            packagesAffected: questGateContentDefaultsStatics.packagesAffected,
          },
        }),
        // Anchored on the actual CONTENT payload (packagesAffected naming hydration-recipes-seed,
        // from questGateContentDefaultsStatics) — not just the generic "nothing set up" prefix
        // every unmatched call shares, which a DIFFERENT missing stage (the reload, never staged in
        // this test either) would also throw, and never on the mock's own generic
        // "mockConstructor" label, which carries no information about which real function it wraps.
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call.*"packagesAffected".*hydration-recipes-seed/su,
      );
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
