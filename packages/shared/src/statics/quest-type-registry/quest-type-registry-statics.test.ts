import { workItemRoleStatics } from '../work-item-role/work-item-role-statics';
import { questTypeRegistryStatics } from './quest-type-registry-statics';

type QuestType = keyof typeof questTypeRegistryStatics;

const QUEST_TYPES = Object.keys(questTypeRegistryStatics) as QuestType[];

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
            text: 'Flowrider: author the flow-perspective test suites below the browser',
            fanOutBy: 'package',
          },
          {
            role: 'groundstomper',
            text: 'Groundstomper: author the browser walk for this flow',
            fanOutBy: 'e2e-flow',
          },
          {
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            fanOutBy: 'flow',
          },
          { role: 'blightwarden', text: 'Blightwarden: cross-cutting audit across the whole diff' },
          { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
        ],
        roles: [
          'codeweaver',
          'ward',
          'flowrider',
          'groundstomper',
          'siegemaster',
          'blightwarden',
          'spiritmender',
        ],
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

  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => every relayTail role is one of that type’s declared roles',
    (questType) => {
      const entry = questTypeRegistryStatics[questType];
      const undeclared = entry.relayTail
        .map((seed) => seed.role)
        .filter((role) => !entry.roles.some((declared) => declared === role));

      expect(undeclared).toStrictEqual([]);
    },
  );

  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => every declared role is a known work-item role name',
    (questType) => {
      const unknown = questTypeRegistryStatics[questType].roles.filter(
        (role) => !workItemRoleStatics.names.some((name) => name === role),
      );

      expect(unknown).toStrictEqual([]);
    },
  );

  // The exact `fanOutBy` values are pinned by the full-value assertion above; this pins WHICH roles
  // carry one at all, so a seed that grows into N items can never do it by a role-name match at the
  // seed site instead of by declaring it here.
  it('VALID: feature relayTail => declares a fan-out on exactly the three operator roles', () => {
    const declaresFanOut = questTypeRegistryStatics.feature.relayTail
      .filter((entry) => 'fanOutBy' in entry)
      .map((entry) => entry.role);

    expect(declaresFanOut).toStrictEqual(['flowrider', 'groundstomper', 'siegemaster']);
  });

  it('VALID: bug-hunt relayTail => declares no fan-out, so every tail seed is exactly one item', () => {
    const declaresFanOut = questTypeRegistryStatics['bug-hunt'].relayTail
      .filter((entry) => 'fanOutBy' in entry)
      .map((entry) => entry.role);

    expect(declaresFanOut).toStrictEqual([]);
  });

  // PestEater writes the reproducing e2e itself, so a bug-hunt groundstomper item would own scope
  // that is already claimed — and its relay carries neither operator role for one to sit between.
  it('VALID: bug-hunt => seeds no groundstomper, flowrider, or siegemaster item', () => {
    const entry = questTypeRegistryStatics['bug-hunt'];
    const tailRoles = entry.relayTail.map((seed) => seed.role);
    const implRoles = entry.startImplementationOps.map((seed) => seed.role);
    const operatorRoles = ['groundstomper', 'flowrider', 'siegemaster'];

    expect({
      tail: tailRoles.filter((role) => operatorRoles.includes(role)),
      implementation: implRoles.filter((role) => operatorRoles.includes(role)),
      declared: entry.roles.filter((role) => operatorRoles.includes(role)),
    }).toStrictEqual({ tail: [], implementation: [], declared: [] });
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
