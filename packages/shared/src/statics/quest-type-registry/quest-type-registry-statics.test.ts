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
        startImplementationOps: [
          {
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
          },
          {
            role: 'codeweaver',
            text: 'Codeweaver: build this slice',
            fanOutBy: 'implementation',
            locked: false,
          },
        ],
        relayTail: [
          { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
          {
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            fanOutBy: 'flow',
          },
          {
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            fanOutBy: 'flow',
          },
          { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
        ],
        roles: ['riftcarver', 'codeweaver', 'ward', 'flowrider', 'siegemaster', 'spiritmender'],
      },
      'bug-hunt': {
        intakeSlashCommandFileName: 'dumpster-hunt.md',
        initialWorkItemRole: 'bughunt',
        startImplementationOps: [
          {
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight build',
          },
          {
            role: 'codeweaver',
            text: 'Codeweaver: build this slice',
            fanOutBy: 'implementation',
            locked: false,
          },
        ],
        relayTail: [
          { role: 'ward', text: 'Ward gate (changed files)', wardMode: 'changed' },
          {
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            fanOutBy: 'flow',
          },
          {
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            fanOutBy: 'flow',
          },
          { role: 'ward', text: 'Ward gate (full monorepo)', wardMode: 'full' },
        ],
        roles: ['riftcarver', 'codeweaver', 'ward', 'flowrider', 'siegemaster', 'spiritmender'],
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
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} relayTail => declares a fan-out on exactly the two tail operators',
    (questType) => {
      const declaresFanOut = questTypeRegistryStatics[questType].relayTail
        .filter((entry) => 'fanOutBy' in entry)
        .map((entry) => entry.role);

      expect(declaresFanOut).toStrictEqual(['flowrider', 'siegemaster']);
    },
  );

  // Nothing the relay dispatches has a workspace to run in until riftcarver has carved one, so its
  // position is an invariant of every quest type rather than a property of either one.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => seeds riftcarver as the FIRST implementation operation',
    (questType) => {
      const implRoles = questTypeRegistryStatics[questType].startImplementationOps.map(
        (seed) => seed.role,
      );

      expect(implRoles[0]).toBe('riftcarver');
    },
  );

  // No `fanOutBy` => exactly one item; no `locked` => it defaults TRUE, which is what enrols the
  // carve in its pt budget so a repair loop that cannot converge halts instead of running forever.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => the riftcarver seed declares neither fanOutBy nor locked',
    (questType) => {
      const riftcarverSeeds = questTypeRegistryStatics[questType].startImplementationOps.filter(
        (seed) => seed.role === 'riftcarver',
      );

      expect(
        riftcarverSeeds.map((seed) => ({
          declaresFanOut: 'fanOutBy' in seed,
          declaresLocked: 'locked' in seed,
        })),
      ).toStrictEqual([{ declaresFanOut: false, declaresLocked: false }]);
    },
  );

  // A bug-hunt intake writes flows and observables exactly as a feature intake does, so the same
  // three operators verify them. The two types differ ONLY in their intake — everything the relay
  // seeds after riftcarver is identical, and this is what holds them together.
  it('VALID: {both quest types} => seed the same implementation ops, tail and roles', () => {
    const { feature } = questTypeRegistryStatics;
    const bugHunt = questTypeRegistryStatics['bug-hunt'];

    expect({
      startImplementationOps: bugHunt.startImplementationOps,
      relayTail: bugHunt.relayTail,
      roles: bugHunt.roles,
    }).toStrictEqual({
      startImplementationOps: feature.startImplementationOps,
      relayTail: feature.relayTail,
      roles: feature.roles,
    });
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
