import { workItemRoleStatics } from '../work-item-role/work-item-role-statics';
import { questFlowStatics } from './quest-flow-statics';

type QuestType = keyof typeof questFlowStatics;

const QUEST_TYPES = Object.keys(questFlowStatics) as QuestType[];

const TERMINAL_ROUTE_TARGETS = ['@complete', '@blocked'];

describe('questFlowStatics', () => {
  it('VALID: graph => matches the full expected object', () => {
    expect(questFlowStatics).toStrictEqual({
      feature: {
        intakeSlashCommandFileName: 'dumpster-create.md',
        initialWorkItemRole: 'chaoswhisperer',
        entry: 'riftcarver',
        families: {
          riftcarver: {
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
            routes: { done: 'codeweaver', wall: '@blocked' },
          },
          codeweaver: {
            role: 'codeweaver',
            text: 'Codeweaver: build this slice',
            fanOutBy: 'implementation',
            locked: false,
            routes: { done: 'flowrider', empty: 'flowrider', wall: '@blocked' },
          },
          flowrider: {
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            fanOutBy: 'flow',
            routes: { done: 'siegemaster', empty: 'siegemaster', wall: '@blocked' },
          },
          siegemaster: {
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            fanOutBy: 'flow',
            routes: { done: 'wardFull', empty: 'wardFull', wall: '@blocked' },
          },
          wardFull: {
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            routes: { done: '@complete', wall: '@blocked' },
          },
          warpgate: {
            role: 'warpgate',
            appendedAtMerge: true,
            routes: { done: '@complete', wall: '@blocked' },
          },
        },
      },
      'bug-hunt': {
        intakeSlashCommandFileName: 'dumpster-hunt.md',
        initialWorkItemRole: 'bughunt',
        entry: 'riftcarver',
        families: {
          riftcarver: {
            role: 'riftcarver',
            text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
            routes: { done: 'codeweaver', wall: '@blocked' },
          },
          codeweaver: {
            role: 'codeweaver',
            text: 'Codeweaver: build this slice',
            fanOutBy: 'implementation',
            locked: false,
            routes: { done: 'flowrider', empty: 'flowrider', wall: '@blocked' },
          },
          flowrider: {
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            fanOutBy: 'flow',
            routes: { done: 'siegemaster', empty: 'siegemaster', wall: '@blocked' },
          },
          siegemaster: {
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow and review its test suite',
            fanOutBy: 'flow',
            routes: { done: 'wardFull', empty: 'wardFull', wall: '@blocked' },
          },
          wardFull: {
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            routes: { done: '@complete', wall: '@blocked' },
          },
          warpgate: {
            role: 'warpgate',
            appendedAtMerge: true,
            routes: { done: '@complete', wall: '@blocked' },
          },
        },
      },
    });
  });

  it('VALID: feature initialWorkItemRole => chaoswhisperer seed at create', () => {
    expect(questFlowStatics.feature.initialWorkItemRole).toBe('chaoswhisperer');
  });

  it('VALID: bug-hunt initialWorkItemRole => bughunt seed at create', () => {
    expect(questFlowStatics['bug-hunt'].initialWorkItemRole).toBe('bughunt');
  });

  it('VALID: every intake role => is a chat role, so its session drives the chat panel', () => {
    const intakeRoles = Object.values(questFlowStatics).map((entry) => entry.initialWorkItemRole);

    const nonChatIntakeRoles = intakeRoles.filter(
      (role) => !workItemRoleStatics.chat.some((chatRole) => chatRole === role),
    );

    expect(nonChatIntakeRoles).toStrictEqual([]);
  });

  // Nothing the relay dispatches has a workspace to run in until riftcarver has carved one, so the
  // family the graph is entered at is an invariant of every quest type rather than a property of one.
  it.each(QUEST_TYPES)('VALID: {questType: %s} => enters the graph at riftcarver', (questType) => {
    expect(questFlowStatics[questType].entry).toBe('riftcarver');
  });

  // A typo here is a quest that silently stalls at a family nothing can route out of.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => every route target is a family key, @complete or @blocked',
    (questType) => {
      const { families } = questFlowStatics[questType];
      const familyKeys = Object.keys(families);

      const danglingTargets = Object.values(families)
        .flatMap((family) => Object.values(family.routes))
        .filter((target) => !familyKeys.some((key) => key === target))
        .filter((target) => !TERMINAL_ROUTE_TARGETS.some((terminal) => terminal === target));

      expect(danglingTargets).toStrictEqual([]);
    },
  );

  // Story 16 mints each routed family's scope as an operationItemContract from `family.role`, and a
  // role that is not a member of the enum throws there rather than here.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => every family role is a known work-item role name',
    (questType) => {
      const unknownRoles = Object.values(questFlowStatics[questType].families)
        .map((family) => family.role)
        .filter((role) => !workItemRoleStatics.names.some((name) => name === role));

      expect(unknownRoles).toStrictEqual([]);
    },
  );

  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => every family declares a non-empty role',
    (questType) => {
      const familiesWithEmptyRole = Object.entries(questFlowStatics[questType].families)
        .filter(([, family]) => family.role.length === 0)
        .map(([key]) => key);

      expect(familiesWithEmptyRole).toStrictEqual([]);
    },
  );

  // `operationItemContract` requires a non-empty `text`, and warpgate is the one family that carries
  // none — its text lives in the orchestrator's warpgateOperationStatics, because a merge is appended
  // at the user's request rather than routed to.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => every family but warpgate declares a non-empty text',
    (questType) => {
      const { warpgate, ...seededFamilies } = questFlowStatics[questType].families;

      const seededWithEmptyText = Object.entries(seededFamilies)
        .filter(([, family]) => family.text.length === 0)
        .map(([key]) => key);

      expect({
        seededWithEmptyText,
        warpgateRole: warpgate.role,
        warpgateDeclaresText: 'text' in warpgate,
      }).toStrictEqual({
        seededWithEmptyText: [],
        warpgateRole: 'warpgate',
        warpgateDeclaresText: false,
      });
    },
  );

  // Two ward families would need a second field to tell them apart at the mint site; one does not.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => wardFull is the only family whose role is ward',
    (questType) => {
      const wardFamilies = Object.entries(questFlowStatics[questType].families)
        .filter(([, family]) => family.role === 'ward')
        .map(([key]) => key);

      expect(wardFamilies).toStrictEqual(['wardFull']);
    },
  );

  // The exact `fanOutBy` values are pinned by the full-value assertion above; this pins WHICH
  // families carry one at all, so a family that grows into N scopes can never do it by a role-name
  // match at the mint site instead of by declaring it here.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => declares a fan-out on exactly the three code-changing families',
    (questType) => {
      const declaresFanOut = Object.entries(questFlowStatics[questType].families)
        .filter(([, family]) => 'fanOutBy' in family)
        .map(([key]) => key);

      expect(declaresFanOut).toStrictEqual(['codeweaver', 'flowrider', 'siegemaster']);
    },
  );

  // No `fanOutBy` => exactly one scope; no `locked` => it defaults TRUE, which is what enrols the
  // carve in its pt budget so a repair loop that cannot converge halts instead of running forever.
  it.each(QUEST_TYPES)(
    'VALID: {questType: %s} => the riftcarver family declares neither fanOutBy nor locked',
    (questType) => {
      const { riftcarver } = questFlowStatics[questType].families;

      expect({
        declaresFanOut: 'fanOutBy' in riftcarver,
        declaresLocked: 'locked' in riftcarver,
      }).toStrictEqual({ declaresFanOut: false, declaresLocked: false });
    },
  );

  // A bug-hunt intake writes flows and observables exactly as a feature intake does, so the same
  // operators verify them. The two types differ ONLY in their intake, and this is what holds the
  // graph itself together.
  it('VALID: {both quest types} => hold identical entry and families', () => {
    const { feature } = questFlowStatics;
    const bugHunt = questFlowStatics['bug-hunt'];

    expect({ entry: bugHunt.entry, families: bugHunt.families }).toStrictEqual({
      entry: feature.entry,
      families: feature.families,
    });
  });
});
