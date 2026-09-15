/**
 * PURPOSE: True when a step failure's rendered `error` text names a timeout — the one signal
 * `runExecuteBroker` has for telling `status: 'timeout'` apart from `status: 'failed'`, since no
 * step broker throws a dedicated timeout error class of its own; whatever the underlying Playwright
 * action (or a future settle ceiling) reports propagates verbatim through `stepDispatchBroker`, and
 * this guard reads it back. Regex literals are only allowed in guards/contracts/transformers, so the
 * check lives here rather than inline in `runExecuteBroker`.
 *
 * USAGE:
 * isTimeoutMessageGuard({ message: ContentTextStub({ value: 'page.goto: Timeout 30000ms exceeded.' }) });
 * // Returns true
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

const TIMEOUT_MESSAGE_PATTERN = /timeout/iu;

export const isTimeoutMessageGuard = ({ message }: { message?: ContentText }): boolean => {
  if (!message) {
    return false;
  }

  return TIMEOUT_MESSAGE_PATTERN.test(message);
};
