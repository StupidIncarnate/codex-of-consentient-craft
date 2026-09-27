/**
 * PURPOSE: A real `SetupServerApi`, built through the real `setupServer()` — for a caller staging
 * this subpath's own value instead of hand-typing a fake server. Built with no handlers and never
 * `.listen()`ed, so constructing it has no process-wide side effect.
 *
 * USAGE:
 * const server = SetupServerStub();
 * // Returns a real, unlistened msw/node SetupServerApi
 */
import { setupServer } from 'msw/node';
import type { SetupServerApi } from 'msw/node';

export const SetupServerStub = (): SetupServerApi => setupServer();
