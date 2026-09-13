/**
 * PURPOSE: Turns a live hold into the sentence /dumpster-launch prints when its poll comes back
 *   idle. Reach for this over the hold's own `detail`, which says only what tripped the guardrail:
 *   the session reading this has to decide whether to keep polling, so the sentence carries WHEN as
 *   well as WHY.
 *
 * USAGE:
 * dispatchHoldToIdleReasonTransformer({ hold });
 * // Returns: a branded IdleReason naming the cause and the resume time
 */

import type { DispatchHold } from '@dungeonmaster/shared/contracts';

import { idleReasonContract } from '../../contracts/idle-reason/idle-reason-contract';
import type { IdleReason } from '../../contracts/idle-reason/idle-reason-contract';

export const dispatchHoldToIdleReasonTransformer = ({ hold }: { hold: DispatchHold }): IdleReason =>
  idleReasonContract.parse(
    `rate-limit guardrail: ${hold.detail}. Dispatch resumes at ${hold.resumeAt}.`,
  );
