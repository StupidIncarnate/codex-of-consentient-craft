/**
 * PURPOSE: Maps quest and step statuses to Mantine color names for badges and indicators
 *
 * USAGE:
 * questStatusColorsStatics.status.complete;
 * // Returns 'green'
 */

export const questStatusColorsStatics = {
  status: {
    created: 'gray',
    pending: 'yellow',
    proposed: 'yellow',
    requirements_approved: 'indigo',
    approved: 'green',
    deferred: 'gray',
    ready: 'blue',
    in_progress: 'cyan',
    complete: 'green',
    failed: 'red',
    blocked: 'orange',
    partially_complete: 'teal',
    abandoned: 'red',
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
