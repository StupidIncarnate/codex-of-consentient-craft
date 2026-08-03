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
            text: 'Flowrider: author the flow-perspective test suites across every quest flow',
          },
          {
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
          },
          { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
          { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
        ],
        roles: ['codeweaver', 'ward', 'flowrider', 'siegemaster', 'blightwarden', 'spiritmender'],
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
          { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
          { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
        ],
        roles: ['pesteater', 'ward', 'blightwarden', 'spiritmender'],
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
