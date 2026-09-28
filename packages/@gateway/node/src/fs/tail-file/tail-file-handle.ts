/**
 * PURPOSE: The shape `tailFile` works with, declared on its own so a caller names it through
 * `#gateway/node/fs` without importing the function.
 *
 * USAGE:
 * import type { TailFileHandle } from '#gateway/node/fs';
 */

export interface TailFileHandle {
  stop: () => void;
  initialDrain: Promise<void>;
}
