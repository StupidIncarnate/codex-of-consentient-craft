import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';

import { SpawnInstructionStub } from '../../../contracts/spawn-instruction/spawn-instruction.stub';
import { sessionEndLayerBroker } from './session-end-layer-broker';
import { sessionEndLayerBrokerProxy } from './session-end-layer-broker.proxy';

const SESSION_ID = SessionIdStub({ value: '9f4961d5-5414-4ebf-b169-e9e6d47c76cb' });

describe('sessionEndLayerBroker', () => {
  it('VALID: {wallReason read off stdout} => records it, names it on stderr, and returns false without re-reading', async () => {
    const proxy = sessionEndLayerBrokerProxy();
    const instruction = SpawnInstructionStub({ role: 'spiritmender' });
    proxy.setupWallRecordSucceeds({
      questId: instruction.questId,
      workItemId: instruction.workItemId,
    });

    const result = await sessionEndLayerBroker({
      instruction,
      sessionId: SESSION_ID,
      nudgesSpent: 0,
      wallReason: 'the dungeonmaster MCP server did not connect in this session (status: failed)',
    });

    expect({
      result,
      walls: proxy.getWallRecordInputs(),
      stderr: proxy.getStderrLines(),
    }).toStrictEqual({
      result: false,
      walls: [
        {
          questId: instruction.questId,
          workItemId: instruction.workItemId,
          reason: 'the dungeonmaster MCP server did not connect in this session (status: failed)',
        },
      ],
      stderr: [
        `[node-dispatch] spiritmender work item ${instruction.workItemId} hit a wall it could not report: the dungeonmaster MCP server did not connect in this session (status: failed)\n`,
      ],
    });
  });

  it('VALID: {work item complete} => returns false and records nothing, since the session signalled', async () => {
    const proxy = sessionEndLayerBrokerProxy();
    const instruction = SpawnInstructionStub({ role: 'spiritmender' });
    proxy.setupWorkItemStatus({
      questId: instruction.questId,
      workItemId: instruction.workItemId,
      status: 'complete',
    });

    const result = await sessionEndLayerBroker({
      instruction,
      sessionId: SESSION_ID,
      nudgesSpent: 0,
    });

    expect({
      result,
      walls: proxy.getWallRecordInputs(),
      stderr: proxy.getStderrLines(),
    }).toStrictEqual({ result: false, walls: [], stderr: [] });
  });

  it('EMPTY: {work item not on the quest} => returns false and records nothing', async () => {
    const proxy = sessionEndLayerBrokerProxy();
    const instruction = SpawnInstructionStub({ role: 'spiritmender' });
    proxy.setupWorkItemAbsent({ questId: instruction.questId });

    const result = await sessionEndLayerBroker({
      instruction,
      sessionId: SESSION_ID,
      nudgesSpent: 0,
    });

    expect({ result, walls: proxy.getWallRecordInputs() }).toStrictEqual({
      result: false,
      walls: [],
    });
  });

  it('VALID: {still in_progress, no nudge spent} => returns true and says it is resuming once', async () => {
    const proxy = sessionEndLayerBrokerProxy();
    const instruction = SpawnInstructionStub({ role: 'spiritmender' });
    proxy.setupWorkItemStatus({
      questId: instruction.questId,
      workItemId: instruction.workItemId,
      status: 'in_progress',
    });

    const result = await sessionEndLayerBroker({
      instruction,
      sessionId: SESSION_ID,
      nudgesSpent: 0,
    });

    expect({
      result,
      walls: proxy.getWallRecordInputs(),
      stderr: proxy.getStderrLines(),
    }).toStrictEqual({
      result: true,
      walls: [],
      stderr: [
        `[node-dispatch] spiritmender work item ${instruction.workItemId} ended its turn without signalling — resuming it once to say so\n`,
      ],
    });
  });

  it('VALID: {still in_progress after the nudge} => returns false and records a wall naming the session', async () => {
    const proxy = sessionEndLayerBrokerProxy();
    const instruction = SpawnInstructionStub({ role: 'spiritmender' });
    proxy.setupWorkItemStatus({
      questId: instruction.questId,
      workItemId: instruction.workItemId,
      status: 'in_progress',
    });

    const result = await sessionEndLayerBroker({
      instruction,
      sessionId: SESSION_ID,
      nudgesSpent: 1,
    });

    const reason =
      'the spiritmender session ended 2 turns without signalling or naming a wall, including one after it was told it had not signalled — read its transcript (session 9f4961d5-5414-4ebf-b169-e9e6d47c76cb) for why it stopped';

    expect({
      result,
      walls: proxy.getWallRecordInputs(),
      stderr: proxy.getStderrLines(),
    }).toStrictEqual({
      result: false,
      walls: [{ questId: instruction.questId, workItemId: instruction.workItemId, reason }],
      stderr: [
        `[node-dispatch] spiritmender work item ${instruction.workItemId} recorded as a wall: ${reason}\n`,
      ],
    });
  });

  it('EMPTY: {still in_progress, no session captured} => returns false and records a wall, since there is nothing to resume', async () => {
    const proxy = sessionEndLayerBrokerProxy();
    const instruction = SpawnInstructionStub({ role: 'spiritmender' });
    proxy.setupWorkItemStatus({
      questId: instruction.questId,
      workItemId: instruction.workItemId,
      status: 'in_progress',
    });

    const result = await sessionEndLayerBroker({
      instruction,
      sessionId: undefined,
      nudgesSpent: 0,
    });

    expect({ result, walls: proxy.getWallRecordInputs() }).toStrictEqual({
      result: false,
      walls: [
        {
          questId: instruction.questId,
          workItemId: instruction.workItemId,
          reason:
            'the spiritmender session exited cleanly without signalling and before it reported a session id, so there is nothing to resume',
        },
      ],
    });
  });
});
