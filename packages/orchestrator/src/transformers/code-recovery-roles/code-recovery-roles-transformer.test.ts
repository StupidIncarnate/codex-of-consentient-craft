import { codeRecoveryRolesTransformer } from './code-recovery-roles-transformer';

describe('codeRecoveryRolesTransformer', () => {
  it('VALID: derived list => every role that routes failed→spiritmender / failed-replan→pathseeker', () => {
    // Derived by exclusion from workItemRoleContract, so adding a new role lands it here
    // automatically (recovery-first) and the signal-back routing it.each picks it up. The full
    // list pins BOTH the inclusions (blightwarden synthesizer, deprecated pathseeker sub-roles) and
    // the exclusions (chaoswhisperer/glyphsmith interactive, ward command, pathseeker planner,
    // spiritmender fixer, the five report-only minions).
    expect(codeRecoveryRolesTransformer()).toStrictEqual([
      'pathseeker-surface',
      'pathseeker-dedup',
      'pathseeker-assertion-correctness',
      'pathseeker-walk',
      'codeweaver',
      'flowrider',
      'siegemaster',
      'lawbringer',
      'blightwarden',
      'pesteater',
    ]);
  });
});
