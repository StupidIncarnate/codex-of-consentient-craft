import {
  FlowNodeStub,
  FlowStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';

import { relayTailFanOutTransformer } from './relay-tail-fan-out-transformer';

// Read off the registry rather than retyped, so a text edit there fails these by assertion instead
// of leaving them asserting a string the relay no longer seeds. `as const` makes relayTail a
// fixed-length tuple, so each index is precisely typed and never `undefined`.
const [WARD_ENTRY, FLOWRIDER_ENTRY, GROUNDSTOMPER_ENTRY, SIEGEMASTER_ENTRY] =
  questTypeRegistryStatics.feature.relayTail;

const WEB_PACKAGE = QuestPackageEntryStub({
  name: 'web',
  location: './packages/web',
  changeType: 'edit',
  packageType: 'frontend-react',
});
const TUI_PACKAGE = QuestPackageEntryStub({
  name: 'tui',
  location: './packages/tui',
  changeType: 'edit',
  packageType: 'frontend-ink',
});
const SERVER_PACKAGE = QuestPackageEntryStub({
  name: 'server',
  location: './packages/server',
  changeType: 'edit',
  packageType: 'http-backend',
});

describe('relayTailFanOutTransformer', () => {
  describe("fanOutBy: 'flow'", () => {
    it('VALID: {two flows of both types} => one slice per flow, text suffixed with the flow id, flowIds carrying only that flow', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'send-comment', name: 'Send comment', flowType: 'runtime' }),
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
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: register-lint-rule',
          flowIds: ['register-lint-rule'],
          packageNames: [],
        },
      ]);
    });

    it('EMPTY: {no flows} => still exactly one slice, so the off-map probe families keep an owner', () => {
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
  });

  describe("fanOutBy: 'package'", () => {
    it('VALID: {runtime flow with two single-package nodes} => one slice per package, each carrying that package alone', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'persist', label: 'Persist', packages: ['server'] }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser — package: web',
          flowIds: ['send-comment'],
          packageNames: ['web'],
        },
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser — package: server',
          flowIds: ['send-comment'],
          packageNames: ['server'],
        },
      ]);
    });

    it('VALID: {a node tagged with two packages} => a seam slice is appended owning both sides', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'press-warp', label: 'Press warp', packages: ['web', 'server'] }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser — package: web',
          flowIds: ['send-comment'],
          packageNames: ['web'],
        },
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser — seam: web + server',
          flowIds: ['send-comment'],
          packageNames: ['web', 'server'],
        },
      ]);
    });

    it("VALID: {a decision node carrying NO observables} => its node's package still gets a slice, because terminal and branch units have no observable to route by", () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'ward-green',
                label: 'Ward green?',
                type: 'decision',
                packages: ['server'],
                observables: [],
              }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser — package: server',
          flowIds: ['send-comment'],
          packageNames: ['server'],
        },
      ]);
    });

    it('VALID: {one package tagged on nodes across two runtime flows} => ONE slice carrying both flow ids, never two slices', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'preview', label: 'Preview', packages: ['web'] }),
            ],
          }),
          FlowStub({
            id: 'view-comments',
            name: 'View comments',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'list', label: 'List', packages: ['web'] })],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser — package: web',
          flowIds: ['send-comment', 'view-comments'],
          packageNames: ['web'],
        },
      ]);
    });

    it('VALID: {glue nodes on two runtime flows} => ONE seam slice carrying both flow ids and the union of the spanned packages', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE, TUI_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'press-warp', label: 'Press warp', packages: ['web', 'server'] }),
            ],
          }),
          FlowStub({
            id: 'view-comments',
            name: 'View comments',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'stream-rows',
                label: 'Stream rows',
                packages: ['server', 'tui'],
              }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser — seam: web + server + tui',
          flowIds: ['send-comment', 'view-comments'],
          packageNames: ['web', 'server', 'tui'],
        },
      ]);
    });

    it('VALID: {tagged nodes on an OPERATIONAL flow only} => falls back to one whole-quest slice with no runtime flow to name', () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'register-lint-rule',
            name: 'Register lint rule',
            flowType: 'operational',
            nodes: [FlowNodeStub({ id: 'add-rule', label: 'Add rule', packages: ['server'] })],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: FLOWRIDER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Flowrider: author the flow-perspective test suites below the browser',
          flowIds: [],
          packageNames: [],
        },
      ]);
    });

    it('EMPTY: {runtime flows drawn with no nodes} => one whole-quest slice carrying every runtime flow id', () => {
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
          text: 'Flowrider: author the flow-perspective test suites below the browser',
          flowIds: ['send-comment', 'view-comments'],
          packageNames: [],
        },
      ]);
    });
  });

  describe("fanOutBy: 'e2e-flow'", () => {
    it('VALID: {runtime flow touching a frontend-react package} => one slice for that flow, naming the browser-reachable package', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'persist', label: 'Persist', packages: ['server'] }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: GROUNDSTOMPER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Groundstomper: author the browser walk for this flow — flow: send-comment',
          flowIds: ['send-comment'],
          packageNames: ['web'],
        },
      ]);
    });

    it('VALID: {two browser-reachable package kinds on one flow} => one slice naming both, so a repo with several UI packages is covered', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, TUI_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'mirror', label: 'Mirror', packages: ['tui'] }),
              FlowNodeStub({ id: 'compose-again', label: 'Compose again', packages: ['web'] }),
            ],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: GROUNDSTOMPER_ENTRY, quest });

      expect(result).toStrictEqual([
        {
          text: 'Groundstomper: author the browser walk for this flow — flow: send-comment',
          flowIds: ['send-comment'],
          packageNames: ['web', 'tui'],
        },
      ]);
    });

    it('EMPTY: {runtime flow landing only in an http-backend} => no slice at all, because there is nothing for a browser to walk', () => {
      const quest = QuestStub({
        packagesAffected: [SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'persist', label: 'Persist', packages: ['server'] })],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: GROUNDSTOMPER_ENTRY, quest });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {OPERATIONAL flow touching a frontend-react package} => no slice, the runtime-only exclusion is inherited', () => {
      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'sweep-legacy-imports',
            name: 'Sweep legacy imports',
            flowType: 'operational',
            nodes: [FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] })],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: GROUNDSTOMPER_ENTRY, quest });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {node tagging a package absent from packagesAffected} => no slice, since no packageType resolves for it', () => {
      const quest = QuestStub({
        packagesAffected: [],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] })],
          }),
        ],
      });

      const result = relayTailFanOutTransformer({ entry: GROUNDSTOMPER_ENTRY, quest });

      expect(result).toStrictEqual([]);
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
