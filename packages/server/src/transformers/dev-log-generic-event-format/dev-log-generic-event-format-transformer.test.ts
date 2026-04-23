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

  it('VALID: {smoketest started} => shows suite, phase, total', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'smoketest-abc12345-1111-2222-3333-444444444444',
        suite: 'mcp',
        phase: 'started',
        total: 16,
      },
    });

    expect(result).toBe('proc:abc12345  suite:mcp  phase:started  total:16');
  });

  it('VALID: {smoketest case-started} => shows caseId', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'smoketest-abc12345-1111-2222-3333-444444444444',
        suite: 'mcp',
        phase: 'case-started',
        caseId: 'mcp-discover',
      },
    });

    expect(result).toBe('proc:abc12345  suite:mcp  phase:case-started  case:mcp-discover');
  });

  it('VALID: {smoketest case-complete passed} => shows case + pass flag', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'smoketest-abc12345-1111-2222-3333-444444444444',
        suite: 'mcp',
        phase: 'case-complete',
        caseResult: { caseId: 'mcp-discover', name: 'MCP: discover', passed: true },
      },
    });

    expect(result).toBe(
      'proc:abc12345  suite:mcp  phase:case-complete  case:mcp-discover  verified',
    );
  });

  it('VALID: {smoketest case-complete failed} => shows case + FAIL flag', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'smoketest-abc12345-1111-2222-3333-444444444444',
        suite: 'signals',
        phase: 'case-complete',
        caseResult: { caseId: 'signal-failed', name: 'Signal: failed', passed: false },
      },
    });

    expect(result).toBe(
      'proc:abc12345  suite:signals  phase:case-complete  case:signal-failed  FAILED',
    );
  });

  it('VALID: {smoketest complete summary} => shows passed/total', () => {
    const result = devLogGenericEventFormatTransformer({
      payload: {
        processId: 'smoketest-abc12345-1111-2222-3333-444444444444',
        suite: 'mcp',
        phase: 'complete',
        total: 16,
        passed: 15,
      },
    });

    expect(result).toBe('proc:abc12345  suite:mcp  phase:complete  passed:15/16');
  });
});
