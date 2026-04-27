/**
 * PURPOSE: Maps orchestration event types to display icons for dev log output
 *
 * USAGE:
 * Reflect.get(devLogEventIconsStatics, 'chat-output');
 * // Returns '◂ '
 */

export const devLogEventIconsStatics = {
  icons: {
    'chat-output': '◂ ',
    'chat-complete': '✓ ',
    'chat-history-complete': '✓ ',
    'chat-session-started': '🔗',
    'quest-session-linked': '🔗',
    'clarification-request': '? ',
    'phase-change': '⚡',
    'slot-update': '⚡',
    'progress-update': '⚡',
    'process-complete': '✓ ',
    'process-failed': '✗ ',
  },
} as const;
