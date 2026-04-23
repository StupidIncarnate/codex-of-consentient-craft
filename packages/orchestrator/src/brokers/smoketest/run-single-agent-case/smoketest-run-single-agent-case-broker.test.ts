import { ExitCodeStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { smoketestRunSingleAgentCaseBroker } from './smoketest-run-single-agent-case-broker';
import { smoketestRunSingleAgentCaseBrokerProxy } from './smoketest-run-single-agent-case-broker.proxy';

const SIGNAL_BACK_COMPLETE_LINE = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_01',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'complete', summary: 'smoketest-complete' },
      },
    ],
  },
});

const SIGNAL_BACK_FAILED_LINE = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_02',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'failed', summary: 'smoketest-failed' },
      },
    ],
  },
});

const SIGNAL_BACK_FAILED_REPLAN_LINE = JSON.stringify({
  type: 'assistant',
  message: {
    role: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'toolu_03',
        name: 'mcp__dungeonmaster__signal-back',
        input: { signal: 'failed-replan', summary: 'smoketest-failed-replan' },
      },
    ],
  },
});

describe('smoketestRunSingleAgentCaseBroker', () => {
  it('VALID: {agent emits signal-back complete} => returns passed=true', async () => {
    const proxy = smoketestRunSingleAgentCaseBrokerProxy();
    proxy.setupSpawnAutoLines({
      lines: [SIGNAL_BACK_COMPLETE_LINE],
      exitCode: ExitCodeStub({ value: 0 }),
    });

    const result = await smoketestRunSingleAgentCaseBroker({
      caseId: 'probe-case',
      name: 'Probe Case',
      prompt: PromptTextStub({ value: 'do nothing' }),
      expectedSignal: 'complete',
      startPath: FilePathStub({ value: '/tmp/smoketest-test' }),
    });

    expect({ caseId: result.caseId, name: result.name, passed: result.passed }).toStrictEqual({
      caseId: 'probe-case',
      name: 'Probe Case',
      passed: true,
    });
  });

  it('VALID: {agent emits signal-back failed} => returns passed=false with scripted summary', async () => {
    const proxy = smoketestRunSingleAgentCaseBrokerProxy();
    proxy.setupSpawnAutoLines({
      lines: [SIGNAL_BACK_FAILED_LINE],
      exitCode: ExitCodeStub({ value: 0 }),
    });

    const result = await smoketestRunSingleAgentCaseBroker({
      caseId: 'signal-failed',
      name: 'Signal: failed',
      prompt: PromptTextStub({ value: 'emit failed' }),
      expectedSignal: 'complete',
      startPath: FilePathStub({ value: '/tmp/smoketest-test' }),
    });

    expect({ passed: result.passed, summary: result.summary }).toStrictEqual({
      passed: false,
      summary: 'smoketest-failed',
    });
  });

  it('VALID: {signals suite expects failed, agent emits failed} => passed=true', async () => {
    const proxy = smoketestRunSingleAgentCaseBrokerProxy();
    proxy.setupSpawnAutoLines({
      lines: [SIGNAL_BACK_FAILED_LINE],
      exitCode: ExitCodeStub({ value: 0 }),
    });

    const result = await smoketestRunSingleAgentCaseBroker({
      caseId: 'signal-failed-as-expected',
      name: 'Signal: failed (expected)',
      prompt: PromptTextStub({ value: 'emit failed' }),
      expectedSignal: 'failed',
      startPath: FilePathStub({ value: '/tmp/smoketest-test' }),
    });

    expect({ passed: result.passed, summary: result.summary }).toStrictEqual({
      passed: true,
      summary: 'smoketest-failed',
    });
  });

  it('VALID: {agent emits signal-back failed-replan} => returns passed=false with scripted summary', async () => {
    const proxy = smoketestRunSingleAgentCaseBrokerProxy();
    proxy.setupSpawnAutoLines({
      lines: [SIGNAL_BACK_FAILED_REPLAN_LINE],
      exitCode: ExitCodeStub({ value: 0 }),
    });

    const result = await smoketestRunSingleAgentCaseBroker({
      caseId: 'signal-failed-replan',
      name: 'Signal: failed-replan',
      prompt: PromptTextStub({ value: 'emit failed-replan' }),
      expectedSignal: 'complete',
      startPath: FilePathStub({ value: '/tmp/smoketest-test' }),
    });

    expect({ passed: result.passed, summary: result.summary }).toStrictEqual({
      passed: false,
      summary: 'smoketest-failed-replan',
    });
  });

  it('VALID: {agent exits without emitting signal-back} => errorMessage set and passed=false', async () => {
    const proxy = smoketestRunSingleAgentCaseBrokerProxy();
    proxy.setupSpawnAutoLines({
      lines: [],
      exitCode: ExitCodeStub({ value: 0 }),
    });

    const result = await smoketestRunSingleAgentCaseBroker({
      caseId: 'silent-case',
      name: 'Silent Case',
      prompt: PromptTextStub({ value: 'do nothing at all' }),
      expectedSignal: 'complete',
      startPath: FilePathStub({ value: '/tmp/smoketest-test' }),
    });

    expect(result.passed).toBe(false);
    expect(result.errorMessage?.startsWith('Agent exited without emitting a signal')).toBe(true);
  });

  it('VALID: {agent emits two signal-back tool uses in sequence} => last-seen signal wins in result', async () => {
    const proxy = smoketestRunSingleAgentCaseBrokerProxy();
    proxy.setupSpawnAutoLines({
      lines: [SIGNAL_BACK_FAILED_LINE, SIGNAL_BACK_COMPLETE_LINE],
      exitCode: ExitCodeStub({ value: 0 }),
    });

    const result = await smoketestRunSingleAgentCaseBroker({
      caseId: 'double-signal-case',
      name: 'Double Signal Case',
      prompt: PromptTextStub({ value: 'emit twice' }),
      expectedSignal: 'complete',
      startPath: FilePathStub({ value: '/tmp/smoketest-test' }),
    });

    expect({ passed: result.passed, summary: result.summary }).toStrictEqual({
      passed: true,
      summary: 'smoketest-complete',
    });
  });
});
