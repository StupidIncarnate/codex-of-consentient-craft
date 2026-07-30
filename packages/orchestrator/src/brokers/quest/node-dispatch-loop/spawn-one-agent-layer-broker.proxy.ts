import { GetQuestResultStub, QuestStub, WorkItemStub } from '@dungeonmaster/shared/contracts';
import type { QuestWorkItemIdStub, WorkItemStatusStub } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

import { timerSetTimeoutAdapterProxy } from '../../../adapters/timer/set-timeout/timer-set-timeout-adapter.proxy';
import type { ElapsedMsStub } from '../../../contracts/elapsed-ms/elapsed-ms.stub';
import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { questGetBroker } from '../get/quest-get-broker';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

// The overload-retry path re-reads the quest to check whether the dying child signalled back
// during the backoff. quest-get-broker's fs-walk has its own test suite; here it only supplies
// that one status, so it is mocked at the module boundary rather than staged through four
// filesystem proxies.
registerModuleMock({ module: '../get/quest-get-broker' });

const PROCESS_UUID = '00000000-0000-4000-8000-00000000d15b';

type QuestWorkItemId = ReturnType<typeof QuestWorkItemIdStub>;
type WorkItemStatus = ReturnType<typeof WorkItemStatusStub>;
type ElapsedMs = ReturnType<typeof ElapsedMsStub>;

export const spawnOneAgentLayerBrokerProxy = (): {
  setupSpawnEmitsSessionThenExits: (params: { sessionId: string; exitCode: number }) => void;
  setupSpawnExitsWithoutSession: (params: { exitCode: number }) => void;
  setupSpawnEmitsApiOverloadThenExits: (params: { sessionId?: string; exitCode: number }) => void;
  setupModifySucceeds: (params: { times: number }) => void;
  setupModifyRejectsOnce: (params: { error: Error }) => void;
  setupWorkItemStatusOnReread: (params: {
    workItemId: QuestWorkItemId;
    status: WorkItemStatus;
  }) => void;
  getModifyCallInputs: () => readonly unknown[];
  getSpawnedArgs: () => unknown;
  getAllSpawnedArgs: () => readonly unknown[];
  getSpawnedCwd: () => unknown;
  getLastBackoffDelay: () => ElapsedMs | undefined;
  getStderrLines: () => readonly unknown[];
} => {
  const spawnProxy = agentSpawnUnifiedBrokerProxy();
  // Constructed BEFORE the randomUUID spy below: quest-modify's proxy stages randomUUID as a
  // sticky passthrough, and the deterministic processId staging has to be the later registration
  // at the same `[]` address to win.
  const modifyProxy = questModifyBrokerProxy();
  const timerProxy = timerSetTimeoutAdapterProxy();
  // Wired to satisfy dependency discovery; the module mock above supplies the return values.
  questGetBrokerProxy();

  registerSpyOn({ object: crypto, method: 'randomUUID' }).calledWith([]).returns(PROCESS_UUID);

  const stderr: unknown[] = [];
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  // Record-and-swallow: the retry path narrates every decision to stderr, which would bury the
  // test output. `[]` is the honest address — the line text is what a test asserts, via
  // getStderrLines below.
  stderrSpy.calledWith([]).implement(((chunk: unknown) => {
    stderr.push(String(chunk));
    return true;
  }) as never);

  const getMock = registerMock({ fn: questGetBroker });
  // Default: the quest carries no matching work item, so the retry proceeds (the terminal check
  // only short-circuits on a FOUND terminal item). Tests that need the
  // signalled-back-during-backoff branch override with setupWorkItemStatusOnReread.
  getMock.calledWith([]).resolves(GetQuestResultStub({ success: true, quest: QuestStub() }));

  return {
    setupSpawnEmitsSessionThenExits: ({
      sessionId,
      exitCode,
    }: {
      sessionId: string;
      exitCode: number;
    }): void => {
      spawnProxy.setupSpawnAndEmitLines({
        lines: [JSON.stringify({ session_id: sessionId })],
        exitCode,
      });
    },

    setupSpawnExitsWithoutSession: ({ exitCode }: { exitCode: number }): void => {
      spawnProxy.setupSpawnAndEmitLines({ lines: [], exitCode });
    },

    // One attempt that emits the CLI's synthetic 529 line before dying — the exact shape a real
    // overloaded run produces. Omit sessionId for a child that died before its init line.
    setupSpawnEmitsApiOverloadThenExits: ({
      sessionId,
      exitCode,
    }: {
      sessionId?: string;
      exitCode: number;
    }): void => {
      const overloadLine = JSON.stringify({
        type: 'assistant',
        isApiErrorMessage: true,
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'API Error: 529 Overloaded.' }],
        },
      });
      spawnProxy.setupSpawnAndEmitLines({
        lines:
          sessionId === undefined
            ? [overloadLine]
            : [JSON.stringify({ session_id: sessionId }), overloadLine],
        exitCode,
      });
    },

    setupModifySucceeds: ({ times }: { times: number }): void => {
      Array.from({ length: times }).forEach(() => {
        modifyProxy.setupResolveSuccessOnce();
      });
    },

    setupModifyRejectsOnce: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupWorkItemStatusOnReread: ({
      workItemId,
      status,
    }: {
      workItemId: QuestWorkItemId;
      status: WorkItemStatus;
    }): void => {
      getMock.calledWith([]).resolves(
        GetQuestResultStub({
          success: true,
          quest: QuestStub({ workItems: [WorkItemStub({ id: workItemId, status })] }),
        }),
      );
    },

    getModifyCallInputs: (): readonly unknown[] => modifyProxy.getCallInputs(),

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getAllSpawnedArgs: (): readonly unknown[] => spawnProxy.getAllSpawnedArgs(),

    getSpawnedCwd: (): unknown => spawnProxy.getSpawnedCwd(),

    getLastBackoffDelay: (): ElapsedMs | undefined => timerProxy.getRegisteredDelay(),

    getStderrLines: (): readonly unknown[] => [...stderr],
  };
};
