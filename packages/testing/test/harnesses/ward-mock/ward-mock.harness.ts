/**
 * PURPOSE: Wraps ward mock queue helpers with lifecycle hooks for E2E tests
 *
 * USAGE:
 * const ward = wardMockHarness();
 * // beforeEach: clears queue
 * ward.queueResponse({ response: wardResponseData });
 */
import {
  queueWardResponse,
  clearWardQueue,
} from '../../../e2e/web/harness/ward-mock/queue-helpers';

import type { WardResponse } from '../../../e2e/web/harness/ward-mock/types';

export const wardMockHarness = (): {
  beforeEach: () => void;
  queueResponse: (params: { response: WardResponse }) => void;
  clearQueue: () => void;
} => ({
  beforeEach: (): void => {
    clearWardQueue();
  },
  queueResponse: ({ response }: { response: WardResponse }): void => {
    queueWardResponse({ response });
  },
  clearQueue: (): void => {
    clearWardQueue();
  },
});
