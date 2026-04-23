import {
  FilePathStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  TimeoutMsStub,
  WorkItemRoleStub,
} from '@dungeonmaster/shared/contracts';

import { SmoketestScenarioStub } from '../../../contracts/smoketest-scenario/smoketest-scenario.stub';
import { smoketestRunOrchestrationCaseBroker } from './smoketest-run-orchestration-case-broker';
import { smoketestRunOrchestrationCaseBrokerProxy } from './smoketest-run-orchestration-case-broker.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;
type Role = ReturnType<typeof WorkItemRoleStub>;
type ProcessId = ReturnType<typeof ProcessIdStub>;

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

const noopSubscribe = (_handler: QuestModifiedHandler): void => {
  // no-op
};
const noopUnsubscribe = (_handler: QuestModifiedHandler): void => {
  // no-op
};

const noopRegister = (_params: {
  questId: QuestId;
  scripts: Readonly<Partial<Record<Role, readonly string[]>>>;
}): void => {
  // no-op
};
const noopUnregister = (_params: { questId: QuestId }): void => {
  // no-op
};
const noopDispense = (_params: { questId: QuestId; role: Role }): null => null;
const unreachableStartQuest = async (): Promise<ProcessId> =>
  Promise.resolve(ProcessIdStub({ value: 'never-called' }));

const WI_PROBE = QuestWorkItemIdStub({ value: 'dddddddd-dddd-dddd-dddd-dddddddddd01' });

describe('smoketestRunOrchestrationCaseBroker', () => {
  describe('hydration failure', () => {
    it('ERROR: {questHydrateBroker throws} => returns passed=false with errorMessage', async () => {
      smoketestRunOrchestrationCaseBrokerProxy();
      const scenario = SmoketestScenarioStub();

      const result = await smoketestRunOrchestrationCaseBroker({
        scenario,
        guildId: GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }),
        startPath: FilePathStub({ value: '/tmp/smoketest-start' }),
        timeoutMs: TimeoutMsStub({ value: 1_000 }),
        register: noopRegister,
        unregister: noopUnregister,
        dispense: noopDispense,
        subscribe: noopSubscribe,
        unsubscribe: noopUnsubscribe,
        startQuest: unreachableStartQuest,
      });

      expect({
        caseId: result.caseId,
        name: result.name,
        passed: result.passed,
        hasErrorMessage: typeof result.errorMessage === 'string',
      }).toStrictEqual({
        caseId: scenario.caseId,
        name: scenario.name,
        passed: false,
        hasErrorMessage: true,
      });
    });
  });

  describe('cleanup on error path', () => {
    it('ERROR: {hydrate fails before driver starts} => does not leave a subscribed handler on the event bus', async () => {
      const proxy = smoketestRunOrchestrationCaseBrokerProxy();
      const scenario = SmoketestScenarioStub();

      await smoketestRunOrchestrationCaseBroker({
        scenario,
        guildId: GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }),
        startPath: FilePathStub({ value: '/tmp/smoketest-start' }),
        timeoutMs: TimeoutMsStub({ value: 1_000 }),
        register: noopRegister,
        unregister: noopUnregister,
        dispense: noopDispense,
        subscribe: proxy.subscribe,
        unsubscribe: proxy.unsubscribe,
        startQuest: unreachableStartQuest,
      });

      expect(proxy.isHandlerSubscribed()).toBe(false);
    });
  });

  describe('register / unregister are wired', () => {
    it('ERROR: {hydrate fails before register} => neither register nor unregister is called', async () => {
      smoketestRunOrchestrationCaseBrokerProxy();
      const scenario = SmoketestScenarioStub();
      const registerCalls: QuestId[] = [];
      const unregisterCalls: QuestId[] = [];

      await smoketestRunOrchestrationCaseBroker({
        scenario,
        guildId: GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }),
        startPath: FilePathStub({ value: '/tmp/smoketest-start' }),
        timeoutMs: TimeoutMsStub({ value: 1_000 }),
        register: ({ questId }) => {
          registerCalls.push(questId);
        },
        unregister: ({ questId }) => {
          unregisterCalls.push(questId);
        },
        dispense: noopDispense,
        subscribe: noopSubscribe,
        unsubscribe: noopUnsubscribe,
        startQuest: unreachableStartQuest,
      });

      expect({
        registers: registerCalls.length,
        unregisters: unregisterCalls.length,
      }).toStrictEqual({ registers: 0, unregisters: 0 });
    });
  });

  describe('probe consistency', () => {
    it('VALID: {stub identifiers and branded ids round-trip} => typed values remain strings', () => {
      expect({
        probeRole: typeof WorkItemRoleStub({ value: 'codeweaver' }),
        probeQuestId: typeof QuestIdStub({ value: 'probe-quest' }),
        probeWorkItemId: typeof WI_PROBE,
      }).toStrictEqual({
        probeRole: 'string',
        probeQuestId: 'string',
        probeWorkItemId: 'string',
      });
    });
  });
});
