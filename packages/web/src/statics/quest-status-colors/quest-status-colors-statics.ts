/**
 * PURPOSE: Maps quest and step statuses to Mantine color names for badges and indicators
 *
 * USAGE:
 * questStatusColorsStatics.status.complete;
 * // Returns 'green'
 */

export const questStatusColorsStatics = {
  status: {
    pending: 'yellow',
    proposed: 'yellow',
    approved: 'green',
    deferred: 'gray',
    ready: 'blue',
    in_progress: 'cyan',
    complete: 'green',
    failed: 'red',
    blocked: 'orange',
    partially_complete: 'teal',
  },
  contractStatus: {
    new: 'blue',
    existing: 'gray',
    modified: 'orange',
  },
  slotStatus: {
    idle: 'gray',
    running: 'blue',
  },
} as const;
