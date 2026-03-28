import { devLogEventIconsStatics } from './dev-log-event-icons-statics';

describe('devLogEventIconsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(devLogEventIconsStatics).toStrictEqual({
      icons: {
        'chat-output': '◂ ',
        'chat-complete': '✓ ',
        'chat-history-complete': '✓ ',
        'quest-session-linked': '🔗',
        'clarification-request': '? ',
        'chat-patch': '⚡',
        'phase-change': '⚡',
        'slot-update': '⚡',
        'progress-update': '⚡',
        'process-complete': '✓ ',
        'process-failed': '✗ ',
      },
    });
  });
});
