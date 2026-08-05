import { workItemRoleStatics } from '../work-item-role/work-item-role-statics';
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
        initialWorkItemRole: 'bughunt',
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

  it('VALID: bug-hunt initialWorkItemRole => bughunt seed at create', () => {
    expect(questTypeRegistryStatics['bug-hunt'].initialWorkItemRole).toBe('bughunt');
  });

  it('VALID: every intake role => is a chat role, so its session drives the chat panel', () => {
    const intakeRoles = Object.values(questTypeRegistryStatics).map(
      (entry) => entry.initialWorkItemRole,
    );

    const nonChatIntakeRoles = intakeRoles.filter(
      (role) => !workItemRoleStatics.chat.some((chatRole) => chatRole === role),
    );

    expect(nonChatIntakeRoles).toStrictEqual([]);
  });
});
