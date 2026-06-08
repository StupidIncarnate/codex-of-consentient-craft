/**
 * PURPOSE: Handles agent signal types and updates work item status via WorkTracker.
 * Routes on the explicit { questId, workItemId } supplied by the caller — the
 * caller is responsible for sourcing these from the signal-back input rather
 * than from slot/process state.
 *
 * USAGE:
 * const result = await handleSignalLayerBroker({signal, questId, workItemId, workTracker, role});
 * // Returns HandleSignalResult to drive orchestration loop decisions
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../../contracts/agent-role/agent-role-contract';
import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import type { WorkItemId } from '../../../contracts/work-item-id/work-item-id-contract';
import type { WorkTracker } from '../../../contracts/work-tracker/work-tracker-contract';

// NOTE: post-walk-hook wiring lives in `QuestHandleSignalBackResponder` (responders/quest/handle-signal-back),
// which fires when sub-agents call the `signal-back` MCP tool under the `/dumpster-launch` model.
// This in-process handler is keyed on `AgentRole` which does not include `pathseeker-walk`; the
// new pathseeker-* roles dispatch via `get-next-step` and never enter the slot-manager loop.

type SignalSummary = NonNullable<StreamSignal['summary']>;

// Static failure routing: role that failed → role that gets spawned
// Most failures route to pathseeker for replanning (drain+skip wipes pending items)
// Lawbringer routes to spiritmender (targeted code fix using same file paths)
// PathSeeker itself failing bubbles to the user (terminal)
// Blightwarden routes to pathseeker (mirrors siegemaster; failed-replan handling is in run-blightwarden-layer-broker)
// The four pathseeker-* variants are dispatched via the MCP `/dumpster-launch` path and never enter the
// slot-manager loop; their failures bubble to the user (terminal) for parity with the monolithic pathseeker.
const FAILURE_ROLE_MAP: Record<AgentRole, AgentRole | null> = {
  codeweaver: 'pathseeker',
  siegemaster: 'pathseeker',
  // Flowrider authors flows/startup files + their flow tests and fixes inline; a `failed` signal
  // means a genuinely unfixable issue, so it BLOCKS (terminal). The live block path is
  // QuestHandleSignalBackResponder; in this legacy slot-manager loop null => bubble_to_user.
  flowrider: null,
  lawbringer: 'spiritmender',
  spiritmender: 'pathseeker',
  pathseeker: null,
  'pathseeker-surface': null,
  'pathseeker-dedup': null,
  'pathseeker-assertion-correctness': null,
  'pathseeker-walk': null,
  // Blightwarden minions dispatch via the MCP `/dumpster-launch` path and never enter the
  // slot-manager loop; their failures are non-blocking (recorded in the minion's report) and
  // handled by QuestHandleSignalBackResponder, so they bubble to the user here for parity.
  'blightwarden-security-minion': null,
  'blightwarden-dedup-minion': null,
  'blightwarden-perf-minion': null,
  'blightwarden-integrity-minion': null,
  'blightwarden-dead-code-minion': null,
  blightwarden: 'pathseeker',
  // PestEater dispatches via the MCP `/dumpster-launch` path and never enters the slot-manager
  // loop; its failures bubble to the user (terminal), matching the pathseeker-* variants.
  pesteater: null,
};

type HandleSignalResult =
  | { action: 'continue' }
  | { action: 'spawn_role'; targetRole: AgentRole; summary?: SignalSummary }
  | { action: 'bubble_to_user'; summary?: SignalSummary };

export const handleSignalLayerBroker = async ({
  signal,
  questId: _questId,
  workItemId,
  workTracker,
  role,
}: {
  signal: StreamSignal;
  questId: QuestId;
  workItemId: WorkItemId;
  workTracker: WorkTracker;
  role: AgentRole;
}): Promise<HandleSignalResult> => {
  // questId is required so the caller routes on the explicit id supplied by the
  // signal-back input rather than inferring from slot/process state. Future steps
  // will fan this out to per-quest WorkTracker selection; for now the workTracker
  // is already scoped to the active quest by the orchestration loop.
  switch (signal.signal) {
    case 'complete': {
      await workTracker.markCompleted({ workItemId });
      return { action: 'continue' };
    }

    case 'failed':
    case 'failed-replan': {
      // 'failed-replan' is only emitted by blightwarden, which has its own layer broker that
      // intercepts the signal directly (run-blightwarden-layer-broker). If it ever reaches
      // this slot-manager handler, treat it identically to 'failed' — mark failed + route
      // to the FAILURE_ROLE_MAP target (pathseeker for blightwarden).
      await workTracker.markFailed({ workItemId });

      const targetRole = FAILURE_ROLE_MAP[role];

      if (targetRole === null) {
        return {
          action: 'bubble_to_user',
          ...(signal.summary === undefined ? {} : { summary: signal.summary }),
        };
      }

      return {
        action: 'spawn_role',
        targetRole,
        ...(signal.summary === undefined ? {} : { summary: signal.summary }),
      };
    }

    default: {
      const exhaustiveCheck: never = signal.signal;
      throw new Error(`Unhandled signal type: ${String(exhaustiveCheck)}`);
    }
  }
};
