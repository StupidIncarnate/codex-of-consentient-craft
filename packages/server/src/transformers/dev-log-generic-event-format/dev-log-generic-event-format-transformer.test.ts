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
});
