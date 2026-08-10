import { devLogProcLabelTransformer } from './dev-log-proc-label-transformer';

describe('devLogProcLabelTransformer', () => {
  it('VALID: {chatProcessId present} => returns proc label from chatProcessId', () => {
    const result = devLogProcLabelTransformer({
      payload: { chatProcessId: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f' },
    });

    expect(result).toBe('proc:e8c8ba78');
  });

  it('VALID: {processId present, no chatProcessId} => returns proc label from processId', () => {
    const result = devLogProcLabelTransformer({
      payload: { processId: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82' },
    });

    expect(result).toBe('proc:1925f6f6');
  });

  it('VALID: {both present} => prefers chatProcessId', () => {
    const result = devLogProcLabelTransformer({
      payload: {
        chatProcessId: 'replay-e8c8ba78-4e77-4ec4-944a-414c2cc8864f',
        processId: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82',
      },
    });

    expect(result).toBe('proc:e8c8ba78');
  });

  it('EDGE: {empty payload} => returns empty string', () => {
    const result = devLogProcLabelTransformer({ payload: {} });

    expect(result).toBe('');
  });

  it('EDGE: {sessionId: null, exitCode: null} => returns proc label instead of throwing', () => {
    const result = devLogProcLabelTransformer({
      payload: {
        chatProcessId: 'chat-22c37b1c-5c12-4fc1-82ae-52d3692ed58f',
        exitCode: null,
        sessionId: null,
      },
    });

    expect(result).toBe('proc:22c37b1c');
  });

  it('EDGE: {chatProcessId: null, processId present} => falls through to processId', () => {
    const result = devLogProcLabelTransformer({
      payload: {
        chatProcessId: null,
        processId: 'proc-recovery-1925f6f6-e4b2-48fa-8b80-77e62301cc82',
      },
    });

    expect(result).toBe('proc:1925f6f6');
  });
});
