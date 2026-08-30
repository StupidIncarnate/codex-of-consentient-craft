import { DesignDecisionStub } from '../../contracts/design-decision/design-decision.stub';
import { FlowStub } from '../../contracts/flow/flow.stub';
import { FlowEdgeStub } from '../../contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';
import { QuestStub } from '../../contracts/quest/quest.stub';
import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';
import { QuestPackageEntryStub } from '../../contracts/quest-package-entry/quest-package-entry.stub';
import { SignoffStub } from '../../contracts/signoff/signoff.stub';
import { mcpToolResultStatics } from '../../statics/mcp-tool-result/mcp-tool-result-statics';
import { qaOffMapProbeStatics } from '../../statics/qa-off-map-probe/qa-off-map-probe-statics';
import { questFlowSliceLimitsStatics } from '../../statics/quest-flow-slice-limits/quest-flow-slice-limits-statics';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
import { questFlowSliceTransformer } from './quest-flow-slice-transformer';

const WEB_ENTRY = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  changeType: 'edit',
  packageType: 'frontend-react',
});
const SERVER_ENTRY = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  changeType: 'edit',
  packageType: 'http-backend',
});

// A seam node: it lands in both packages and carries one observable attributed to each.
const LOGIN_PAGE_NODE = FlowNodeStub({
  id: 'login-page' as never,
  label: 'Login page' as never,
  type: 'state',
  packages: ['web' as never, 'server' as never],
  observables: [
    FlowObservableStub({
      id: 'form-renders' as never,
      type: 'ui-state',
      description: 'the form renders with an empty email field' as never,
      package: 'web' as never,
    }),
    FlowObservableStub({
      id: 'session-probe' as never,
      type: 'api-call',
      description: 'GET /api/session answers 401 for an anonymous visitor' as never,
      package: 'server' as never,
    }),
  ],
});
const AUTH_CHECK_NODE = FlowNodeStub({
  id: 'auth-check' as never,
  label: 'Credentials checked' as never,
  type: 'decision',
  packages: ['server' as never],
  observables: [
    FlowObservableStub({
      id: 'rejects-bad-password' as never,
      type: 'api-call',
      description: 'a wrong password answers 401' as never,
      package: 'server' as never,
    }),
  ],
});

const LOGIN_FLOW = FlowStub({
  id: 'login-flow' as never,
  name: 'Log in' as never,
  flowType: 'runtime',
  entryPoint: 'login-page' as never,
  exitPoints: ['Dashboard shown' as never, 'Signup started' as never],
  nodes: [LOGIN_PAGE_NODE, AUTH_CHECK_NODE],
  edges: [
    FlowEdgeStub({
      id: 'submits' as never,
      from: 'login-page' as never,
      to: 'auth-check' as never,
      label: 'submits credentials' as never,
    }),
    FlowEdgeStub({
      id: 'to-signup' as never,
      from: 'login-page' as never,
      to: 'signup-flow:signup-page' as never,
      label: 'no account yet' as never,
    }),
  ],
});

// The sibling flow, which enters LOGIN_FLOW back at its entry node.
const SIGNUP_FLOW = FlowStub({
  id: 'signup-flow' as never,
  name: 'Sign up' as never,
  flowType: 'runtime',
  entryPoint: 'signup-page' as never,
  exitPoints: ['Account created' as never],
  nodes: [
    FlowNodeStub({
      id: 'signup-page' as never,
      label: 'Signup page' as never,
      type: 'state',
      packages: ['web' as never],
      observables: [],
    }),
  ],
  edges: [
    FlowEdgeStub({
      id: 'back-to-login' as never,
      from: 'signup-page' as never,
      to: 'login-flow:login-page' as never,
      label: 'already has an account' as never,
    }),
  ],
});

const LOGIN_CONTRACT = QuestContractEntryStub({
  id: 'login-credentials' as never,
  name: 'LoginCredentials' as never,
  kind: 'data',
  status: 'new',
  source: 'packages/web/src/contracts/login-credentials/login-credentials-contract.ts',
  nodeId: 'login-page' as never,
  properties: [
    {
      name: 'email',
      type: 'EmailAddress',
      description: 'The address typed into the form',
    },
    {
      name: 'attemptsLeft',
      type: 'AttemptCount',
      description: 'How many tries remain before the account locks',
      source: 'packages/server/src/statics/login-attempts/login-attempts-statics.ts',
    },
  ],
});
const SIGNUP_CONTRACT = QuestContractEntryStub({
  id: 'signup-payload' as never,
  name: 'SignupPayload' as never,
  kind: 'data',
  status: 'new',
  source: 'packages/web/src/contracts/signup-payload/signup-payload-contract.ts',
  nodeId: 'signup-page' as never,
  properties: [{ name: 'email', type: 'EmailAddress', description: 'The address signed up with' }],
});

const QUEST = QuestStub({
  id: 'add-auth' as never,
  title: 'Add Authentication' as never,
  status: 'in_progress',
  questType: 'feature',
  userRequest: 'Let people log in and sign up' as never,
  packagesAffected: [WEB_ENTRY, SERVER_ENTRY],
  flows: [LOGIN_FLOW, SIGNUP_FLOW],
  contracts: [LOGIN_CONTRACT, SIGNUP_CONTRACT],
  designDecisions: [
    DesignDecisionStub({
      id: 'jwt-over-sessions' as never,
      title: 'Use JWT rather than server sessions' as never,
      rationale: 'The API is stateless behind a CDN' as never,
      relatedNodeIds: ['auth-check' as never],
    }),
    DesignDecisionStub({
      id: 'signup-double-opt-in' as never,
      title: 'Signup confirms by email' as never,
      rationale: 'Bots register faster than humans do' as never,
      relatedNodeIds: ['signup-page' as never],
    }),
    DesignDecisionStub({
      id: 'no-third-party-auth' as never,
      title: 'No third-party identity provider' as never,
      rationale: 'The user asked for a self-hosted login' as never,
      relatedNodeIds: [],
    }),
  ],
});

const SIGNED_QUEST = QuestStub({
  ...QUEST,
  flows: [
    FlowStub({
      ...LOGIN_FLOW,
      nodes: [
        FlowNodeStub({
          ...LOGIN_PAGE_NODE,
          observables: [],
          flowriderSignoff: SignoffStub(),
        }),
      ],
      edges: [
        FlowEdgeStub({
          id: 'submits' as never,
          from: 'login-page' as never,
          to: 'auth-check' as never,
          label: 'submits credentials' as never,
          siegemasterSignoff: SignoffStub({
            verdict: 'unconfirmable',
            question: 'Which seeded account should the wrong-password walk use?',
          }),
        }),
      ],
    }),
  ],
});

// The worst measured case: the flowrider / siegemaster view of a flow carrying 18 nodes, 19 edges
// and 47 observables, on a quest with 12 contracts and 33 design decisions. That view is the worst
// because no package narrows it — every observable renders verbatim AND the off-map families render.
const SCALE_OBSERVABLE_COUNTS = [13, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
const SCALE_NODES = SCALE_OBSERVABLE_COUNTS.map((observableCount, index) =>
  FlowNodeStub({
    id: `node-${String(index)}` as never,
    label: `A node whose label is about as long as a real one gets ${String(index)}` as never,
    type: 'action',
    packages: ['web' as never, 'server' as never],
    observables: Array.from({ length: observableCount }, (_unused, obsIndex) =>
      FlowObservableStub({
        id: `node-${String(index)}-obs-${String(obsIndex)}` as never,
        type: 'api-call',
        description:
          `the response body carries the ordered image paths and the composer clears, measured at node ${String(index)} observable ${String(obsIndex)}` as never,
        package: 'web' as never,
      }),
    ),
  }),
);
const SCALE_EDGES = [
  ...Array.from({ length: 17 }, (_unused, index) =>
    FlowEdgeStub({
      id: `edge-${String(index)}` as never,
      from: `node-${String(index)}` as never,
      to: `node-${String(index + 1)}` as never,
      label: `a branch label as long as a real decision branch gets ${String(index)}` as never,
    }),
  ),
  FlowEdgeStub({
    id: 'edge-back' as never,
    from: 'node-17' as never,
    to: 'node-0' as never,
    label: 'retries from the top' as never,
  }),
  FlowEdgeStub({
    id: 'edge-out' as never,
    from: 'node-17' as never,
    to: 'signup-flow:signup-page' as never,
    label: 'hands off to the sibling flow' as never,
  }),
];
const SCALE_QUEST = QuestStub({
  ...QUEST,
  flows: [
    FlowStub({
      id: 'send-message-with-images' as never,
      name: 'Send a message carrying images' as never,
      entryPoint: 'node-0' as never,
      exitPoints: ['Composer cleared' as never],
      nodes: SCALE_NODES,
      edges: SCALE_EDGES,
    }),
    SIGNUP_FLOW,
  ],
  contracts: Array.from({ length: 12 }, (_unused, index) =>
    QuestContractEntryStub({
      id: `contract-${String(index)}` as never,
      name: `ContractNumber${String(index)}` as never,
      source: `packages/web/src/contracts/contract-${String(index)}/contract-${String(index)}-contract.ts`,
      nodeId: `node-${String(index)}` as never,
      properties: Array.from({ length: 6 }, (_ignored, propIndex) => ({
        name: `propertyNumber${String(propIndex)}`,
        type: 'BrandedValue',
        description:
          'The property description carries a whole requirement sentence, because that sentence is the requirement',
      })),
    }),
  ),
  designDecisions: Array.from({ length: 33 }, (_unused, index) =>
    DesignDecisionStub({
      id: `decision-${String(index)}` as never,
      title: `A decision title about as long as a real one ${String(index)}` as never,
      rationale:
        `The rationale runs a couple of sentences, because it has to carry why the alternative was refused as well as what was chosen — decision ${String(index)}` as never,
      relatedNodeIds: index < 24 ? [`node-${String(index % 18)}` as never] : [],
    }),
  ),
});

const OVERSIZED_QUEST = QuestStub({
  ...QUEST,
  designDecisions: Array.from({ length: 400 }, (_unused, index) =>
    DesignDecisionStub({
      id: `decision-${String(index)}` as never,
      title: `A decision title ${String(index)}` as never,
      rationale: 'x'.repeat(500) as never,
      relatedNodeIds: [],
    }),
  ),
});

const HEADER_LINES = [
  '# Quest: Add Authentication',
  'Quest ID: add-auth | Status: in_progress | Type: feature',
  'Packages affected (whole quest): web (edit, frontend-react), server (edit, http-backend)',
  '',
  'Original user request (the intent behind the flows):',
  'Let people log in and sign up',
];

const OFF_MAP_LINES = Object.entries(qaOffMapProbeStatics.byFamily).map(
  ([family, probe]) => `${family}: ${probe}`,
);
const [FIRST_OFF_MAP_LINE = ''] = OFF_MAP_LINES;

// The KEY block names the same symbols the graph draws with, so a prefix filter over the render
// picks its lines up too. Every filter below subtracts it first.
const LEGEND_LINES = textDisplaySymbolsStatics.flowSliceLegendLines;

const CONTRACT_HEADER_PREFIXES = ['#login-credentials', '  email'];
const GRAPH_AND_OBSERVABLE_PREFIXES = ['[#', '> '];
const GRAPH_AND_EDGE_PREFIXES = ['[#', '→'];
const OWNERSHIP_LINE_PREFIXES = ['The WHOLE flow', 'Your package:'];
const TRUNCATION_PREFIX = `[TRUNCATED at the ${String(questFlowSliceLimitsStatics.maxRenderChars)}-character ceiling`;

describe('questFlowSliceTransformer', () => {
  describe('a codeweaver slice — one flow, one package', () => {
    it('VALID: {flowId, packageName: web} => renders the whole slice, marking web and collapsing the rest', () => {
      const result = questFlowSliceTransformer({
        quest: QUEST,
        flowId: 'login-flow' as never,
        packageName: 'web' as never,
      });

      expect(String(result).split('\n')).toStrictEqual([
        ...HEADER_LINES,
        '',
        '## Other flows on this quest — ids and names only, NOT your scope',
        '#signup-flow — "Sign up" (runtime) — you tag nodes here',
        '',
        ...textDisplaySymbolsStatics.flowSliceLegendLines,
        '',
        '## Flow: #login-flow — "Log in"',
        'Type: runtime',
        'Entry: login-page',
        'Exits: Dashboard shown | Signup started',
        "Your package: web. Its nodes carry ◀ YOURS; another package's observables are collapsed to a count. The graph is NOT filtered — the nodes between yours are how yours connect.",
        '',
        '[#login-page] Login page (state) {web, server} ◀ YOURS',
        '  > #form-renders: the form renders with an empty email field [ui-state]',
        '  > (1 observable(s) attributed to server — not yours)',
        '  →"submits credentials" [#auth-check]',
        '  →"no account yet" signup-flow:signup-page ↗ cross-flow',
        '    target: [#signup-page] Signup page (state) {web} in flow #signup-flow "Sign up"',
        '    Your scope ENDS at the hand-off: prove the edge fires and the target flow is entered, not what it does next.',
        '  [#auth-check] Credentials checked (decision) {server}',
        '    > (1 observable(s) attributed to server — not yours)',
        '    (terminal)',
        '',
        '### Edges arriving from another flow',
        '→"already has an account" into [#login-page]',
        '  source: [#signup-page] Signup page (state) {web} in flow #signup-flow "Sign up"',
        '  Another flow enters yours here. Treat the arriving node as GIVEN; do not re-prove it.',
        '',
        '## Contracts on this flow — every property description is a requirement',
        '#login-credentials — LoginCredentials (data, new) [→ packages/web/src/contracts/login-credentials/login-credentials-contract.ts] on node #login-page',
        '  email: EmailAddress — The address typed into the form',
        '',
        '## Design decisions governing these nodes',
        '#jwt-over-sessions: "Use JWT rather than server sessions"',
        '  Rationale: The API is stateless behind a CDN',
        '  Relates to: #auth-check',
        '',
        '## Design decisions for the whole quest — no node named, so they bind every flow',
        '#no-third-party-auth: "No third-party identity provider"',
        '  Rationale: The user asked for a self-hosted login',
      ]);
    });

    it('VALID: {flowId, packageName: server} => the contract renders for the ONE property whose own source lands in server', () => {
      const result = questFlowSliceTransformer({
        quest: QUEST,
        flowId: 'login-flow' as never,
        packageName: 'server' as never,
      });

      expect(
        String(result)
          .split('\n')
          .filter((line) => CONTRACT_HEADER_PREFIXES.some((prefix) => line.startsWith(prefix))),
      ).toStrictEqual([
        '#login-credentials — LoginCredentials (data, new) [→ packages/web/src/contracts/login-credentials/login-credentials-contract.ts] on node #login-page',
      ]);
    });

    it('VALID: {flowId, packageName: server} => that property carries its own source path beside its description', () => {
      const result = questFlowSliceTransformer({
        quest: QUEST,
        flowId: 'login-flow' as never,
        packageName: 'server' as never,
      });

      expect(
        String(result)
          .split('\n')
          .filter((line) => line.startsWith('  attemptsLeft')),
      ).toStrictEqual([
        '  attemptsLeft: AttemptCount [packages/server/src/statics/login-attempts/login-attempts-statics.ts] — How many tries remain before the account locks',
      ]);
    });

    it('VALID: {flowId, packageName} => the quest-wide decision renders even though it names no node', () => {
      const result = questFlowSliceTransformer({
        quest: QUEST,
        flowId: 'login-flow' as never,
        packageName: 'web' as never,
      });

      expect(
        String(result)
          .split('\n')
          .filter((line) => line.startsWith('#no-third-party-auth')),
      ).toStrictEqual(['#no-third-party-auth: "No third-party identity provider"']);
    });

    it('VALID: {flowId, packageName} => no off-map probe families, which carry no codeweaver column', () => {
      const result = questFlowSliceTransformer({
        quest: QUEST,
        flowId: 'login-flow' as never,
        packageName: 'web' as never,
      });

      expect(
        String(result)
          .split('\n')
          .filter((line) => OFF_MAP_LINES.includes(line)),
      ).toStrictEqual([]);
    });
  });

  describe('a flowrider / siegemaster slice — one flow, every package', () => {
    it('VALID: {flowId, no packageName} => every observable renders verbatim and no node is marked', () => {
      const result = questFlowSliceTransformer({ quest: QUEST, flowId: 'login-flow' as never });

      expect(
        String(result)
          .split('\n')
          .filter((line) => !LEGEND_LINES.some((legend) => legend === line))
          .filter((line) =>
            GRAPH_AND_OBSERVABLE_PREFIXES.some((prefix) => line.trimStart().startsWith(prefix)),
          ),
      ).toStrictEqual([
        '[#login-page] Login page (state) {web, server}',
        '  > #form-renders: the form renders with an empty email field [ui-state]',
        '  > #session-probe: GET /api/session answers 401 for an anonymous visitor [api-call]',
        '  [#auth-check] Credentials checked (decision) {server}',
        '    > #rejects-bad-password: a wrong password answers 401 [api-call]',
      ]);
    });

    it('VALID: {flowId, no packageName} => the seven off-map probe families render last, with their probes', () => {
      const result = questFlowSliceTransformer({ quest: QUEST, flowId: 'login-flow' as never });
      const lines = String(result).split('\n');

      expect(lines.slice(lines.indexOf(FIRST_OFF_MAP_LINE))).toStrictEqual(OFF_MAP_LINES);
    });

    it('VALID: {flowId, no packageName} => the whole flow is declared theirs', () => {
      const result = questFlowSliceTransformer({ quest: QUEST, flowId: 'login-flow' as never });

      expect(
        String(result)
          .split('\n')
          .filter((line) => OWNERSHIP_LINE_PREFIXES.some((prefix) => line.startsWith(prefix))),
      ).toStrictEqual(['The WHOLE flow is yours — every node, whatever package it lands in.']);
    });
  });

  describe('sign-offs already recorded', () => {
    it('VALID: {a node and an edge signed} => the marks ride their own lines', () => {
      const result = questFlowSliceTransformer({
        quest: SIGNED_QUEST,
        flowId: 'login-flow' as never,
      });

      expect(
        String(result)
          .split('\n')
          .filter((line) => !LEGEND_LINES.some((legend) => legend === line))
          .filter((line) =>
            GRAPH_AND_EDGE_PREFIXES.some((prefix) => line.trimStart().startsWith(prefix)),
          ),
      ).toStrictEqual([
        '[#login-page] Login page (state) {web, server} [F✓]',
        '  →"submits credentials" auth-check ↗ cross-flow [S?]',
      ]);
    });
  });

  describe('the foundation view — a package with no flow named', () => {
    it('VALID: {packageName only} => every contract that package owns, and which flows it tags nodes in', () => {
      const result = questFlowSliceTransformer({ quest: QUEST, packageName: 'web' as never });

      expect(String(result).split('\n')).toStrictEqual([
        ...HEADER_LINES,
        '',
        '## Flows on this quest — fetch each one you own with get-quest({ questId, flowId })',
        '#login-flow — "Log in" (runtime) — you tag nodes here',
        '#signup-flow — "Sign up" (runtime) — you tag nodes here',
        '',
        '## Contracts you own — every property description is a requirement',
        '#login-credentials — LoginCredentials (data, new) [→ packages/web/src/contracts/login-credentials/login-credentials-contract.ts] on node #login-page',
        '  email: EmailAddress — The address typed into the form',
        '#signup-payload — SignupPayload (data, new) [→ packages/web/src/contracts/signup-payload/signup-payload-contract.ts] on node #signup-page',
        '  email: EmailAddress — The address signed up with',
        '',
        // `jwt-over-sessions` relates to #auth-check, which no contract web owns is anchored to —
        // so it belongs to server's foundation view, not this one.
        '## Design decisions governing these nodes',
        '#signup-double-opt-in: "Signup confirms by email"',
        '  Rationale: Bots register faster than humans do',
        '  Relates to: #signup-page',
        '',
        '## Design decisions for the whole quest — no node named, so they bind every flow',
        '#no-third-party-auth: "No third-party identity provider"',
        '  Rationale: The user asked for a self-hosted login',
      ]);
    });
  });

  describe('a flow id that is not on the quest', () => {
    it('INVALID: {flowId: "checkout-flow"} => names the flows that DO exist rather than only the miss', () => {
      const result = questFlowSliceTransformer({ quest: QUEST, flowId: 'checkout-flow' as never });

      expect(String(result).split('\n')).toStrictEqual([
        ...HEADER_LINES,
        '',
        '## No flow #checkout-flow on this quest. Its flows are: #login-flow, #signup-flow',
      ]);
    });
  });

  describe('scale — the largest flow of a real quest', () => {
    it('VALID: {18 nodes, 47 observables, 12 contracts, 33 decisions} => renders under maxVerbatimChars', () => {
      const result = questFlowSliceTransformer({
        quest: SCALE_QUEST,
        flowId: 'send-message-with-images' as never,
      });

      expect(String(result).length).toBeLessThan(mcpToolResultStatics.maxVerbatimChars);
    });
  });

  describe('the character ceiling', () => {
    it('EDGE: {a flow whose prose runs past maxRenderChars} => cuts on a line boundary and says so', () => {
      const result = questFlowSliceTransformer({
        quest: OVERSIZED_QUEST,
        flowId: 'login-flow' as never,
      });
      const lines = String(result).split('\n');

      expect([
        String(result).length < mcpToolResultStatics.maxVerbatimChars,
        lines.slice(-1).map((line) => line.startsWith(TRUNCATION_PREFIX)),
      ]).toStrictEqual([true, [true]]);
    });
  });
});
