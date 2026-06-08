import { questTypeRegistryStatics } from './quest-type-registry-statics';

describe('questTypeRegistryStatics', () => {
  it('VALID: registry => matches the full expected object', () => {
    expect(questTypeRegistryStatics).toStrictEqual({
      feature: {
        intakeSlashCommandFileName: 'dumpster-create.md',
        initialWorkItemRole: 'chaoswhisperer',
        startGraphKind: 'pathseeker',
        roles: [
          'pathseeker-surface',
          'pathseeker-dedup',
          'pathseeker-assertion-correctness',
          'pathseeker-walk',
          'codeweaver',
          'ward',
          'flowrider',
          'siegemaster',
          'lawbringer',
          'blightwarden',
          'spiritmender',
        ],
      },
      'bug-hunt': {
        intakeSlashCommandFileName: 'dumpster-hunt.md',
        initialWorkItemRole: null,
        startGraphKind: 'bug-hunt',
        roles: ['pesteater', 'ward', 'lawbringer', 'blightwarden'],
      },
    });
  });

  it('VALID: feature initialWorkItemRole => chaoswhisperer seed at create', () => {
    expect(questTypeRegistryStatics.feature.initialWorkItemRole).toBe('chaoswhisperer');
  });

  it('EMPTY: bug-hunt initialWorkItemRole => null (no create-time seed)', () => {
    expect(questTypeRegistryStatics['bug-hunt'].initialWorkItemRole).toBe(null);
  });

  it('VALID: bug-hunt startGraphKind => bug-hunt', () => {
    expect(questTypeRegistryStatics['bug-hunt'].startGraphKind).toBe('bug-hunt');
  });
});
