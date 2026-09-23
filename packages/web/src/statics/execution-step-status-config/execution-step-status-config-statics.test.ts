import { workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { executionStepStatusConfigStatics } from './execution-step-status-config-statics';

describe('executionStepStatusConfigStatics', () => {
  it('VALID: roleColors => is keyed by exactly the shared work-item role tuple, in order', () => {
    const colorsInStaticsOrder = workItemRoleStatics.names.map(
      (role) => executionStepStatusConfigStatics.roleColors[role],
    );

    expect(colorsInStaticsOrder).toStrictEqual(
      Object.values(executionStepStatusConfigStatics.roleColors),
    );
  });

  it('VALID: exported value => matches expected shape', () => {
    expect(executionStepStatusConfigStatics).toStrictEqual({
      roleColors: {
        chaoswhisperer: 'primary',
        bughunt: 'primary',
        tavernkeeper: 'primary',
        riftcarver: 'loot-rare',
        codeweaver: 'primary',
        ward: 'warning',
        spiritmender: 'primary',
        flowrider: 'primary',
        siegemaster: 'primary',
        warpgate: 'primary',
      },
      stepColors: {
        plan: 'text',
        work: 'primary',
        repair: 'primary',
        fixHappy: 'primary',
        fixAdversarial: 'primary',
        recipe: 'primary',
        read: 'primary',
        merge: 'primary',
        review: 'loot-gold',
        happyWalk: 'loot-gold',
        adversarial: 'loot-gold',
        ward: 'warning',
        gate: 'warning',
        carve: 'loot-rare',
        commit: 'loot-rare',
        sweepIn: 'loot-rare',
        sweepOut: 'loot-rare',
      },
      statusConfig: {
        queued: { label: 'QUEUED', color: 'text-dim', symbol: '···' },
        pending: { label: 'PENDING', color: 'text-dim', symbol: '···' },
        in_progress: { label: 'RUNNING', color: 'primary', symbol: '▶' },
        complete: { label: 'DONE', color: 'success', symbol: '✓' },
        failed: { label: 'FAILED', color: 'danger', symbol: '✗' },
        blocked: { label: 'BLOCKED', color: 'warning', symbol: '■' },
        skipped: { label: 'SKIPPED', color: 'text-dim', symbol: '⊘' },
      },
    });
  });

  it('VALID: stepColors => is keyed by exactly every step name declared across every family in agentFlowStatics, with no cross-package check possible (see DECISIONS)', () => {
    // agentFlowStatics lives in @dungeonmaster/orchestrator, which `web` carries no dependency on
    // (packages/web/package.json has no @dungeonmaster/orchestrator entry, in either dependencies
    // or devDependencies) — so this list is a hand-copy, cross-checked by reading
    // packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts directly, not derived by
    // import. Re-copy it from that file whenever a step is added, renamed or removed there.
    const stepNamesInAgentFlowStatics = [
      'plan',
      'work',
      'review',
      'commit',
      'ward',
      'repair',
      'recipe',
      'sweepIn',
      'read',
      'happyWalk',
      'fixHappy',
      'adversarial',
      'fixAdversarial',
      'sweepOut',
      'gate',
      'carve',
      'merge',
    ];

    expect(Object.keys(executionStepStatusConfigStatics.stepColors).sort()).toStrictEqual(
      stepNamesInAgentFlowStatics.slice().sort(),
    );
  });
});
