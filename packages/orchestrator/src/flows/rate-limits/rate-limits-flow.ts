/**
 * PURPOSE: Orchestration flow for rate-limits — bootstrap wiring and snapshot reads
 *
 * USAGE:
 * RateLimitsFlow.bootstrap();
 * RateLimitsFlow.get();
 * // Returns: RateLimitsSnapshot | null
 */

import type { AdapterResult, RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

import { RateLimitsBootstrapResponder } from '../../responders/rate-limits/bootstrap/rate-limits-bootstrap-responder';
import { RateLimitsGetResponder } from '../../responders/rate-limits/get/rate-limits-get-responder';

export const RateLimitsFlow = {
  bootstrap: (): AdapterResult => RateLimitsBootstrapResponder(),

  get: (): RateLimitsSnapshot | null => RateLimitsGetResponder(),
};
