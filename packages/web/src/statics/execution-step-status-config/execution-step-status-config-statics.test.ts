import { executionStepStatusConfigStatics } from './execution-step-status-config-statics';

describe('executionStepStatusConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(executionStepStatusConfigStatics).toStrictEqual({
      roleColors: {
        chaoswhisperer: 'primary',
        glyphsmith: 'primary',
        pathseeker: 'primary',
        codeweaver: 'primary',
        ward: 'warning',
        spiritmender: 'primary',
        siegemaster: 'primary',
        lawbringer: 'primary',
        blightwarden: 'primary',
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
