import { questTypeRegistryStatics } from './quest-type-registry-statics';

describe('questTypeRegistryStatics', () => {
  it('VALID: registry => matches the full expected object', () => {
    expect(questTypeRegistryStatics).toStrictEqual({
      feature: {
        intakeSlashCommandFileName: 'dumpster-create.md',
        initialWorkItemRole: 'chaoswhisperer',
        startImplementationOps: [],
        relayTail: [
          { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
          {
            role: 'flowrider',
            text: 'Flowrider: author the flow-perspective test suite over every quest flow',
          },
          {
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA every quest flow and review the flow test suite',
          },
          { role: 'lawbringer', text: 'Lawbringer: standards review across the whole quest diff' },
          { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
          { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
        ],
        roles: [
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
        startImplementationOps: [
          {
            role: 'pesteater',
            text: 'PestEater: reproduce the bug with a failing test first, then fix it',
          },
        ],
        relayTail: [
          { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
          { role: 'lawbringer', text: 'Lawbringer: standards review across the whole quest diff' },
          { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
          { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
        ],
        roles: ['pesteater', 'ward', 'lawbringer', 'blightwarden', 'spiritmender'],
      },
    });
  });

  it('VALID: feature initialWorkItemRole => chaoswhisperer seed at create', () => {
    expect(questTypeRegistryStatics.feature.initialWorkItemRole).toBe('chaoswhisperer');
  });

  it('EMPTY: bug-hunt initialWorkItemRole => null (no create-time seed)', () => {
    expect(questTypeRegistryStatics['bug-hunt'].initialWorkItemRole).toBe(null);
  });
});
