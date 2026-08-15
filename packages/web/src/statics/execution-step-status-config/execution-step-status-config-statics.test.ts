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
        glyphsmith: 'primary',
        bughunt: 'primary',
        tavernkeeper: 'primary',
        riftcarver: 'loot-rare',
        codeweaver: 'primary',
        ward: 'warning',
        spiritmender: 'primary',
        flowrider: 'primary',
        groundstomper: 'primary',
        siegemaster: 'primary',
        blightscout: 'primary',
        pesteater: 'primary',
        warpgate: 'primary',
      },
      statusConfig: {
        queued: { label: 'QUEUED', color: 'text-dim', symbol: '···' },
        pending: { label: 'PENDING', color: 'text-dim', symbol: '···' },
        in_progress: { label: 'RUNNING', color: 'primary', symbol: '▶' },
        complete: { label: 'DONE', color: 'success', symbol: '✓' },
        failed: { label: 'FAILED', color: 'danger', symbol: '✗' },
        partially_complete: { label: 'PARTIAL', color: 'warning', symbol: '◇' },
        blocked: { label: 'BLOCKED', color: 'warning', symbol: '■' },
        skipped: { label: 'SKIPPED', color: 'text-dim', symbol: '⊘' },
      },
    });
  });
});
