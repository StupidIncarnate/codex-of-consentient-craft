import {
  FlowIdStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  PackageNameStub,
  QuestContractEntryStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { questTypeRegistryStatics, textDisplaySymbolsStatics } from '@dungeonmaster/shared/statics';
import { questFlowSliceTransformer } from '@dungeonmaster/shared/transformers';

import { relayTailFanOutTransformer } from './relay-tail-fan-out-transformer';

// The slice's KEY block explains the observable line with an example that has the same shape, so a
// prefix filter over the render picks it up too.
const SLICE_LEGEND_LINES = textDisplaySymbolsStatics.flowSliceLegendLines;

// Read off the registry rather than retyped, so a text edit there fails these by assertion instead
// of leaving them asserting a string the relay no longer seeds. Selected by ROLE rather than by
// position: a positional pick (`relayTail[0]`, `startImplementationOps[0]`) silently starts pointing
// at a different seed the moment the registry gains, loses, or reorders an entry ahead of it — which
// is exactly what happened when `riftcarver` became the new head of `startImplementationOps`. The
// trailing `!` is safe: each predicate matches exactly one seed in the registry, and
// `noUncheckedIndexedAccess` has no way to know that from the predicate alone.
const WARD_ENTRY = questTypeRegistryStatics.feature.relayTail.find(
  (entry) => entry.role === 'ward' && entry.wardMode === 'changed',
)!;
const FLOWRIDER_ENTRY = questTypeRegistryStatics.feature.relayTail.find(
  (entry) => entry.role === 'flowrider',
)!;
const SIEGEMASTER_ENTRY = questTypeRegistryStatics.feature.relayTail.find(
  (entry) => entry.role === 'siegemaster',
)!;
const CODEWEAVER_ENTRY = questTypeRegistryStatics.feature.startImplementationOps.find(
  (entry) => entry.role === 'codeweaver',
)!;

// Every tail seed that fans out at all, so the case list is the registry's own rather than one role
// picked out of it — a third tail operator is covered here the day it is seeded. Used for the cut
// every flow-fanned role makes IDENTICALLY (an all-runtime quest); where the roles diverge, each
// gets its own named case below, because what differs there is the whole point of the test.
const FLOW_SLICED_ENTRIES = questTypeRegistryStatics.feature.relayTail.filter(
  (entry) => 'fanOutBy' in entry,
);

const WEB_PACKAGE = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  changeType: 'edit',
  packageType: 'frontend-react',
});
const SERVER_PACKAGE = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  changeType: 'edit',
  packageType: 'http-backend',
});
const ORCHESTRATOR_PACKAGE = QuestPackageEntryStub({
  name: 'orchestrator',
  location: './packages/orchestrator',
  changeType: 'edit',
  packageType: 'programmatic-service',
});
const SHARED_PACKAGE = QuestPackageEntryStub({
  name: 'shared',
  location: './packages/shared',
  changeType: 'edit',
  packageType: 'library',
});

describe('relayTailFanOutTransformer', () => {
  describe("fanOutBy: 'flow'", () => {
    // The cut every flow-fanned role makes identically: a quest whose flows are all `runtime` is
    // eligible for every track, so each seed becomes one item per flow whatever its own flowTypes.
    it.each(FLOW_SLICED_ENTRIES)(
      'VALID: {two runtime flows, $role} => one slice per flow, text suffixed with the flow id, flowIds carrying only that flow',
      (entry) => {
        const quest = QuestStub({
          flows: [
            FlowStub({ id: 'send-comment', name: 'Send comment', flowType: 'runtime' }),
            FlowStub({ id: 'view-comments', name: 'View comments', flowType: 'runtime' }),
          ],
        });

        const result = relayTailFanOutTransformer({ entry, quest });

        expect(result).toStrictEqual([
          {
            text: `${entry.text} — flow: send-comment`,
            flowIds: ['send-comment'],
            packageNames: [],
          },
          {
            text: `${entry.text} — flow: view-comments`,
            flowIds: ['view-comments'],
            packageNames: [],
          },
        ]);
      },
    );

    it('VALID: {two runtime flows and one operational, siegemaster} => a slice for all THREE, because its track is measured over both flow types', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'send-comment', name: 'Send comment', flowType: 'runtime' }),
          FlowStub({ id: 'view-comments', name: 'View comments', flowType: 'runtime' }),
          FlowStub({
            id: 'register-lint-rule',
            name: 'Register lint rule',
            flowType: 'operational',
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: SIEGEMASTER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: send-comment',
          flowIds: ['send-comment'],
          packageNames: [],
        },
        {
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: view-comments',
          flowIds: ['view-comments'],
          packageNames: [],
        },
        {
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: register-lint-rule',
          flowIds: ['register-lint-rule'],
          packageNames: [],
        },
      ]);
    });

    // The ledger cut has to match the gate: `signoffTrackEligibilityStatics.byTrack.flowrider`
    // measures `runtime` alone, so an item minted over the operational flow would carry a
    // denominator of zero units its own track could ever sign.
    it('VALID: {two runtime flows and one operational, flowrider} => a slice for the TWO runtime flows only, the operational one dropped', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'send-comment', name: 'Send comment', flowType: 'runtime' }),
          FlowStub({ id: 'view-comments', name: 'View comments', flowType: 'runtime' }),
          FlowStub({
            id: 'register-lint-rule',
            name: 'Register lint rule',
            flowType: 'operational',
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Flowrider: author the test suites that prove this flow — flow: send-comment',
          flowIds: ['send-comment'],
          packageNames: [],
        },
        {
          text: 'Flowrider: author the test suites that prove this flow — flow: view-comments',
          flowIds: ['view-comments'],
          packageNames: [],
        },
      ]);
    });

    it('EMPTY: {every flow operational, flowrider} => NO slice at all, because every flow is a type its track cannot sign a single unit of', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'register-lint-rule',
            name: 'Register lint rule',
            flowType: 'operational',
          }),
          FlowStub({
            id: 'sweep-legacy-imports',
            name: 'Sweep legacy imports',
            flowType: 'operational',
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {every flow operational, siegemaster} => still one slice per flow, because its track measures operational flows too', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'register-lint-rule',
            name: 'Register lint rule',
            flowType: 'operational',
          }),
          FlowStub({
            id: 'sweep-legacy-imports',
            name: 'Sweep legacy imports',
            flowType: 'operational',
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: SIEGEMASTER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: register-lint-rule',
          flowIds: ['register-lint-rule'],
          packageNames: [],
        },
        {
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: sweep-legacy-imports',
          flowIds: ['sweep-legacy-imports'],
          packageNames: [],
        },
      ]);
    });

    it('EMPTY: {no flows, siegemaster} => exactly one whole-quest slice, so the off-map probe families its unitKinds own keep an owner', () => {
      const quest = QuestStub({ flows: [] });

      const result = relayTailFanOutTransformer({ entry: SIEGEMASTER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Siegemaster: manual-QA this flow and review its test suite',
          flowIds: [],
          packageNames: [],
        },
      ]);
    });

    it('EMPTY: {no flows, flowrider} => NO slice at all, because `off-map` is absent from its unitKinds and nothing else is left to prove', () => {
      const quest = QuestStub({ flows: [] });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([]);
    });
  });

  describe("fanOutBy: 'implementation'", () => {
    // Membership is "this package TAGS a node in this flow". Awarding a glue node to a single owner
    // minted nothing for the other side whenever that node was its ONLY node in the flow —
    // measured on a real quest as four observables reaching no session's scope at all.
    it('VALID: {a glue node that is the consumer’s ONLY node in the flow} => BOTH packages get an item carrying that flow', () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE, WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'quest-start-worktree',
            name: 'Quest start worktree',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'stamp-git-context',
                label: 'Stamp git context',
                packages: ['server'],
              }),
              FlowNodeStub({
                id: 'quest-running',
                label: 'Quest running',
                packages: ['server', 'web'],
              }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — package: server · flow: quest-start-worktree',
          flowIds: ['quest-start-worktree'],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — package: web · flow: quest-start-worktree',
          flowIds: ['quest-start-worktree'],
          packageNames: ['web'],
        },
      ]);
    });

    // The cell rule itself: a package tagged on two flows is TWO items, one per flow, and the
    // contract it owns mints no third. A codeweaver session builds one package's half of one flow,
    // which is what its prompt says; an item carrying both flows makes that sentence false and
    // hands one session two unrelated pieces of work.
    it('VALID: {one package tagged on two flows and owning a contract} => ONE item PER FLOW, and no extra item for the contract', () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'flow-a',
            name: 'Flow A',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'node-a', label: 'Node A', packages: ['server'] })],
          }),
          FlowStub({
            id: 'flow-b',
            name: 'Flow B',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'node-b', label: 'Node B', packages: ['server'] })],
          }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'session-token',
            name: 'SessionToken',
            kind: 'data',
            status: 'new',
            source: 'packages/server/src/contracts/session-token/session-token-contract.ts',
            nodeId: 'node-a',
            properties: [
              {
                name: 'value',
                type: 'SessionTokenValue',
                description: 'The signed token, opaque to the browser',
              },
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — package: server · flow: flow-a',
          flowIds: ['flow-a'],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — package: server · flow: flow-b',
          flowIds: ['flow-b'],
          packageNames: ['server'],
        },
      ]);
    });

    // A package that tags nodes gets CELLS AND NOTHING ELSE — no flow-less foundation item beside
    // them. Its contracts reach it through the `packageName`-only `get-quest` call, which routes by
    // path. The one flow-less item that survives belongs to a package that tags NO node anywhere:
    // without it those contracts have no owner at all.
    it('VALID: {a contract-owning package that tags no node, beside a package that tags two flows} => two cells and exactly ONE flow-less item', () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE, SHARED_PACKAGE],
        flows: [
          FlowStub({
            id: 'flow-a',
            name: 'Flow A',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'node-a', label: 'Node A', packages: ['server'] })],
          }),
          FlowStub({
            id: 'flow-b',
            name: 'Flow B',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'node-b', label: 'Node B', packages: ['server'] })],
          }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'quest-status',
            name: 'QuestStatus',
            kind: 'data',
            status: 'new',
            source: 'packages/shared/src/contracts/quest-status/quest-status-contract.ts',
            nodeId: 'node-a',
            properties: [
              {
                name: 'value',
                type: 'QuestStatusValue',
                description: 'The status enum every package reads',
              },
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — package: shared',
          flowIds: [],
          packageNames: ['shared'],
        },
        {
          text: 'Codeweaver: build this slice — package: server · flow: flow-a',
          flowIds: ['flow-a'],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — package: server · flow: flow-b',
          flowIds: ['flow-b'],
          packageNames: ['server'],
        },
      ]);
    });

    // The reason the cell matters, asserted end to end: an observable that reaches no session's
    // flow slice reaches nobody. The observation point is `questFlowSliceTransformer`, which is what
    // `get-quest({ questId, flowId, packageName })` hands the codeweaver that owns the cell — it
    // renders that package's own observables verbatim and collapses every other package's.
    it('VALID: {both halves of a glue node’s observables} => each reaches the Must satisfy block of its own package’s cell', () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE, WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'quest-start-worktree',
            name: 'Quest start worktree',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'quest-running',
                label: 'Quest running',
                packages: ['server', 'web'],
                observables: [
                  FlowObservableStub({
                    id: 'worktree-created',
                    type: 'file-exists',
                    description: 'the worktree directory exists on disk',
                    package: 'server',
                  }),
                  FlowObservableStub({
                    id: 'execution-panel-live',
                    type: 'ui-state',
                    description: 'the execution panel streams the running quest',
                    package: 'web',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const ownObservables = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest }).flatMap(
        (slice) =>
          String(
            questFlowSliceTransformer({
              quest,
              flowId: FlowIdStub({ value: String(slice.flowIds[0]) }),
              packageName: PackageNameStub({ value: String(slice.packageNames[0]) }),
            }),
          )
            .split('\n')
            .filter((line) => !SLICE_LEGEND_LINES.some((legend) => legend === line))
            .filter((line) => /^\s+● #/u.test(line))
            .map((line) => `${String(slice.packageNames[0])}${line}`),
      );

      expect(ownObservables).toStrictEqual([
        'server  ● #worktree-created {server} the worktree directory exists on disk [file-exists]',
        'web  ● #execution-panel-live {web} the execution panel streams the running quest [ui-state]',
      ]);
    });

    // A contract's `source` is one-to-one, but a contract is one-to-many. This one is anchored in
    // server and its second property's real file lives in web; routing the whole contract by the
    // contract's own path hands both properties to server and no web session ever sees the second.
    it('VALID: {a contract property declaring its own source in another package} => that package gets an item too, on contracts alone', () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE, WEB_PACKAGE],
        flows: [],
        contracts: [
          QuestContractEntryStub({
            id: 'status-keyed-statics-fanout',
            name: 'StatusKeyedStaticsFanout',
            kind: 'data',
            status: 'modified',
            source:
              'packages/server/src/statics/quest-hydrate-strategy/quest-hydrate-strategy-statics.ts',
            nodeId: 'warpgate-row',
            properties: [
              {
                name: 'questHydrateStrategyStatics.strategies',
                type: 'HydrateStrategyMap',
                description: 'Both new statuses need an entry or the key-set equality test fails',
              },
              {
                name: 'questGateSectionsStatics.sections',
                type: 'GateSectionMap',
                description: 'Sixteen literal keys read by index with a QuestStatus',
                source:
                  'packages/web/src/statics/quest-gate-sections/quest-gate-sections-statics.ts',
              },
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — package: server',
          flowIds: [],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — package: web',
          flowIds: [],
          packageNames: ['web'],
        },
      ]);
    });

    it("VALID: {a property with no source of its own} => it inherits the contract's, minting only that one item", () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE, WEB_PACKAGE],
        flows: [],
        contracts: [
          QuestContractEntryStub({
            id: 'session-token',
            name: 'SessionToken',
            kind: 'data',
            status: 'new',
            source: 'packages/server/src/contracts/session-token/session-token-contract.ts',
            nodeId: 'submit-credentials',
            properties: [
              {
                name: 'value',
                type: 'SessionTokenValue',
                description: 'The signed token, opaque to the browser',
              },
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — package: server',
          flowIds: [],
          packageNames: ['server'],
        },
      ]);
    });

    // The shape of a real quest, `1be07040-b9ec-476c-a439-0b4fbb0123cd`: three runtime flows, the
    // first tagged by `web` alone and the other two by all four packages, with `shared` and `web`
    // also owning contracts. That is NINE cells and no flow-less item, because every package that
    // owns a contract here also tags a node somewhere. The pairs are asserted whole rather than
    // counted: a rule that merged a package's flows back together, or that dropped `shared`'s
    // library tier to the end, keeps the count and changes the pairing.
    it('VALID: {three flows, one web-only and two tagged by all four packages} => exactly nine (package, flow) cells, library tier first and flow declaration order within each package', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE, ORCHESTRATOR_PACKAGE, SHARED_PACKAGE],
        packageGraph: [],
        flows: [
          FlowStub({
            id: 'paste-image-into-composer',
            name: 'Paste image into composer',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'paste-fired', label: 'Paste fired', packages: ['web'] }),
              FlowNodeStub({
                id: 'insert-thumbnail',
                label: 'Insert thumbnail',
                packages: ['web'],
              }),
            ],
          }),
          FlowStub({
            id: 'send-message-with-images',
            name: 'Send message with images',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'send-pressed', label: 'Send pressed', packages: ['web'] }),
              FlowNodeStub({
                id: 'resolve-images-dir',
                label: 'Resolve images dir',
                packages: ['server', 'shared'],
              }),
              FlowNodeStub({
                id: 'forward-to-orchestrator',
                label: 'Forward to orchestrator',
                packages: ['server', 'orchestrator'],
              }),
              FlowNodeStub({
                id: 'build-prompt',
                label: 'Build prompt',
                packages: ['orchestrator', 'shared'],
              }),
            ],
          }),
          FlowStub({
            id: 'render-images-in-transcript',
            name: 'Render images in transcript',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'open-chat-view', label: 'Open chat view', packages: ['web'] }),
              FlowNodeStub({
                id: 'request-bytes',
                label: 'Request bytes',
                packages: ['web', 'server'],
              }),
              FlowNodeStub({
                id: 'replay-user-line',
                label: 'Replay user line',
                packages: ['server', 'orchestrator'],
              }),
              FlowNodeStub({
                id: 'normalise-for-comparison',
                label: 'Normalise for comparison',
                packages: ['web', 'shared'],
              }),
            ],
          }),
        ],
        contracts: [
          QuestContractEntryStub({
            id: 'pasted-image-statics',
            name: 'PastedImageStatics',
            kind: 'data',
            status: 'new',
            source: 'packages/shared/src/statics/pasted-image/pasted-image-statics.ts',
            nodeId: 'insert-thumbnail',
            properties: [
              {
                name: 'draftImageStoreName',
                type: 'DraftImageStoreName',
                description: 'The IndexedDB store the composer drafts land in',
                source: 'packages/web/src/statics/web-config/web-config-statics.ts',
              },
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest });

      expect(
        result.map((slice) => ({ flowIds: slice.flowIds, packageNames: slice.packageNames })),
      ).toStrictEqual([
        { flowIds: ['send-message-with-images'], packageNames: ['shared'] },
        { flowIds: ['render-images-in-transcript'], packageNames: ['shared'] },
        { flowIds: ['send-message-with-images'], packageNames: ['orchestrator'] },
        { flowIds: ['render-images-in-transcript'], packageNames: ['orchestrator'] },
        { flowIds: ['send-message-with-images'], packageNames: ['server'] },
        { flowIds: ['render-images-in-transcript'], packageNames: ['server'] },
        { flowIds: ['paste-image-into-composer'], packageNames: ['web'] },
        { flowIds: ['send-message-with-images'], packageNames: ['web'] },
        { flowIds: ['render-images-in-transcript'], packageNames: ['web'] },
      ]);
    });

    it('VALID: {the same three-flow quest} => every cell text names its package AND its flow, so each cell buys its own pt chain', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SHARED_PACKAGE],
        packageGraph: [],
        flows: [
          FlowStub({
            id: 'paste-image-into-composer',
            name: 'Paste image into composer',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'paste-fired', label: 'Paste fired', packages: ['web'] })],
          }),
          FlowStub({
            id: 'send-message-with-images',
            name: 'Send message with images',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'build-prompt',
                label: 'Build prompt',
                packages: ['web', 'shared'],
              }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: CODEWEAVER_ENTRY, quest });

      expect(result.map((slice) => String(slice.text))).toStrictEqual([
        'Codeweaver: build this slice — package: shared · flow: send-message-with-images',
        'Codeweaver: build this slice — package: web · flow: paste-image-into-composer',
        'Codeweaver: build this slice — package: web · flow: send-message-with-images',
      ]);
    });
  });

  describe('no fanOutBy', () => {
    it('VALID: {an entry that states no fan-out} => exactly one whole-quest slice, untouched by flows or packages', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] })],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: WARD_ENTRY, quest });

      expect(result).toStrictEqual([
        { text: 'Ward gate (changed files)', flowIds: [], packageNames: [] },
      ]);
    });
  });
});
