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
});
