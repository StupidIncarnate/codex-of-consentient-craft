import { devLogGenericEventFormatTransformer } from './dev-log-generic-event-format-transformer';

describe('devLogGenericEventFormatTransformer', () => {
  it('VALID: {quest-session-linked payload} => shows quest and chat IDs', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        questId: '89362ba3-918c-4408-aeb1-f8f4ce8400cb',
        chatProcessId: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
      },
    });

    expect(result).toBe('proc:e8c8ba78  quest:89362ba3');
  });

  it('VALID: {payload with phase} => shows phase value', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'proc-abc12345-1111-2222-3333-444444444444',
        phase: 'running',
      },
    });

    expect(result).toBe('proc:abc12345  phase:running');
  });

  it('VALID: {payload with role and slotIndex} => shows both', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'proc-abc12345-1111-2222-3333-444444444444',
        role: 'codeweaver',
        slotIndex: 1,
      },
    });

    expect(result).toBe('proc:abc12345  slot:1  role:codeweaver');
  });

  it('VALID: {payload with questions array} => shows count', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        chatProcessId: 'proc-abc12345-1111-2222-3333-444444444444',
        questions: ['q1', 'q2'],
      },
    });

    expect(result).toBe('proc:abc12345  questions:2');
  });

  it('EDGE: {empty payload} => returns empty', () => {
    const result = devLogGenericEventFormatTransformer({ payload: {} });

    expect(result).toBe('');
  });

  it('EDGE: {chat-complete payload from a spawn that never reached its init line} => omits the null parts instead of throwing', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        chatProcessId: 'chat-22c37b1c-5c12-4fc1-82ae-52d3692ed58f',
        exitCode: 1,
        sessionId: null,
        questId: 'fc000003-0000-4000-8000-000000000003',
        workItemId: 'f1fada6c-0000-4000-8000-000000000001',
      },
    });

    expect(result).toBe('proc:22c37b1c  quest:fc000003');
  });

  it('EDGE: {phase, slotIndex and role all null} => omits each null part', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'proc-abc12345-1111-2222-3333-444444444444',
        phase: null,
        role: null,
        slotIndex: null,
      },
    });

    expect(result).toBe('proc:abc12345');
  });

  it('VALID: {smoketest-shaped payload with caseResult} => ignores smoketest-specific fields', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'smoketest-abc12345-1111-2222-3333-444444444444',
        suite: 'mcp',
        phase: 'case-complete',
        caseResult: { caseId: 'mcp-discover', name: 'MCP: discover', passed: true },
      },
    });

    expect(result).toBe('proc:abc12345  phase:case-complete');
  });
});
