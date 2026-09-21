import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { familyScopesMintTransformer } from './family-scopes-mint-transformer';
import { familyScopesMintTransformerProxy } from './family-scopes-mint-transformer.proxy';
import { signoffOutstandingTransformer } from '../signoff-outstanding/signoff-outstanding-transformer';

const UUIDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
] as const;

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
const CLI_PACKAGE = QuestPackageEntryStub({
  name: 'cli',
  location: './packages/cli',
  changeType: 'edit',
  packageType: 'cli-tool',
});

describe('familyScopesMintTransformer', () => {
  describe('a family with nothing to fan out, beside one that keeps a whole-quest scope anyway', () => {
    // The two families diverge on ONE statics field — siegemaster's `unitKinds` carries `off-map`
    // and flowrider's does not — so a case covering only flowrider would miss it.
    it('EMPTY: {quest with no flows, flowrider} => ZERO scopes, because nothing is left for its track to prove', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const result = familyScopesMintTransformer({
        quest: QuestStub({ flows: [] }),
        family: 'flowrider',
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {the SAME quest, siegemaster} => exactly ONE scope carrying flowIds: [], so the off-map probe families keep an owner', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const result = familyScopesMintTransformer({
        quest: QuestStub({ flows: [] }),
        family: 'siegemaster',
      });

      expect(result).toStrictEqual([
        OperationItemStub({
          id: '00000000-0000-4000-8000-000000000001',
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite',
          status: 'pending',
          locked: true,
          flowIds: [],
          packageNames: [],
        }),
      ]);
    });

    it('EMPTY: {quest whose every flow is operational, flowrider} => ZERO scopes, because flowrider measures runtime flows alone', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const result = familyScopesMintTransformer({
        quest: QuestStub({
          flows: [
            FlowStub({ id: 'register-lint-rule', name: 'Register rule', flowType: 'operational' }),
            FlowStub({ id: 'sweep-imports', name: 'Sweep imports', flowType: 'operational' }),
          ],
        }),
        family: 'flowrider',
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('the fan-out rule is untouched — only when it runs', () => {
    // The same fixture and the same expected cells `questBuildRelayGraphBroker` produces today:
    // three packages across two flows, ordered by package KIND tier, then graph depth, then name,
    // with one package's cells in flow declaration order.
    it('VALID: {three packages across two flows, codeweaver} => one scope per (package, flow) cell, in the tier-ranked order the relay seeds today', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE, CLI_PACKAGE],
        flows: [
          FlowStub({
            id: 'repro-crash',
            name: 'Repro crash',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] }),
              FlowNodeStub({ id: 'persist', label: 'Persist', packages: ['web', 'server'] }),
            ],
          }),
          FlowStub({
            id: 'expected-behaviour',
            name: 'Expected behaviour',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'invoke', label: 'Invoke', packages: ['cli', 'web'] })],
          }),
        ],
      });

      const result = familyScopesMintTransformer({ quest, family: 'codeweaver' });

      expect(
        result.map(({ text, flowIds, packageNames }) => ({ text, flowIds, packageNames })),
      ).toStrictEqual([
        {
          text: 'Codeweaver: build this slice — package: server · flow: repro-crash',
          flowIds: ['repro-crash'],
          packageNames: ['server'],
        },
        {
          text: 'Codeweaver: build this slice — package: web · flow: repro-crash',
          flowIds: ['repro-crash'],
          packageNames: ['web'],
        },
        {
          text: 'Codeweaver: build this slice — package: web · flow: expected-behaviour',
          flowIds: ['expected-behaviour'],
          packageNames: ['web'],
        },
        {
          text: 'Codeweaver: build this slice — package: cli · flow: expected-behaviour',
          flowIds: ['expected-behaviour'],
          packageNames: ['cli'],
        },
      ]);
    });
  });

  describe('the spine-packages fallback and its COMMAND carve-out', () => {
    it('VALID: {tagged nodes on a runtime flow, siegemaster} => each scope declaring no packages of its own inherits every package the flow nodes tag', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

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

      const result = familyScopesMintTransformer({ quest, family: 'siegemaster' });

      expect(result).toStrictEqual([
        OperationItemStub({
          id: '00000000-0000-4000-8000-000000000001',
          role: 'siegemaster',
          text: 'Siegemaster: manual-QA this flow and review its test suite — flow: send-comment',
          status: 'pending',
          locked: true,
          flowIds: ['send-comment'],
          packageNames: ['web', 'server'],
        }),
      ]);
    });

    it('VALID: {the SAME quest, riftcarver} => ONE scope declaring NO packages, because a command has no prompt to narrow', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

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

      const result = familyScopesMintTransformer({ quest, family: 'riftcarver' });

      expect(result).toStrictEqual([
        OperationItemStub({
          id: '00000000-0000-4000-8000-000000000001',
          role: 'riftcarver',
          text: 'Riftcarver: carve the quest branch, worktree and preflight typecheck',
          status: 'pending',
          locked: true,
          flowIds: [],
          packageNames: [],
        }),
      ]);
    });
  });

  describe('wardFull, the one family whose key is not its role name', () => {
    it("VALID: {family: 'wardFull'} => one scope carrying role 'ward' and the full-monorepo text", () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const result = familyScopesMintTransformer({
        quest: QuestStub({ flows: [] }),
        family: 'wardFull',
      });

      expect(result).toStrictEqual([
        OperationItemStub({
          id: '00000000-0000-4000-8000-000000000001',
          role: 'ward',
          text: 'Ward gate (full monorepo)',
          status: 'pending',
          locked: true,
          flowIds: [],
          packageNames: [],
        }),
      ]);
    });
  });

  describe('locked, which is what enrols a scope in its pt budget', () => {
    it('VALID: {codeweaver} => locked false, so its pt chain stays unbounded', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const result = familyScopesMintTransformer({
        quest: QuestStub({ flows: [] }),
        family: 'codeweaver',
      });

      expect(result.map(({ role, locked }) => ({ role, locked }))).toStrictEqual([
        { role: 'codeweaver', locked: false },
      ]);
    });

    it('VALID: {flowrider on a runtime flow} => locked true, the default every other family takes', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const result = familyScopesMintTransformer({
        quest: QuestStub({
          flows: [FlowStub({ id: 'send-comment', name: 'Send comment', flowType: 'runtime' })],
        }),
        family: 'flowrider',
      });

      expect(result.map(({ role, locked }) => ({ role, locked }))).toStrictEqual([
        { role: 'flowrider', locked: true },
      ]);
    });
  });

  describe('the late-observable bug this minting order fixes', () => {
    it('VALID: {an observable added to a node on a runtime flow, flowrider minted after it} => that unit is inside the minted scope work list', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE],
        flows: [
          FlowStub({
            id: 'late-flow',
            name: 'Late flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'late-node',
                label: 'Late node',
                type: 'terminal',
                packages: ['web'],
                observables: [
                  FlowObservableStub({
                    id: 'check-late-drain',
                    type: 'ui-state',
                    description: 'the drained ledger banner names the family still running',
                    package: 'web',
                    addedBy: 'operator',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      const [scope] = familyScopesMintTransformer({ quest, family: 'flowrider' });

      expect(signoffOutstandingTransformer({ quest, operationItem: scope! })).toStrictEqual([
        'late-flow:terminal:late-node',
        'late-flow:observable:check-late-drain',
      ]);
    });
  });

  describe('a family nothing routes to', () => {
    it("ERROR: {family: 'warpgate'} => throws, because its scope is appended at merge rather than minted here", () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      expect(() =>
        familyScopesMintTransformer({ quest: QuestStub({ flows: [] }), family: 'warpgate' }),
      ).toThrow(
        /^familyScopesMintTransformer: quest type 'feature' declares no routable family 'warpgate' — the routable families are: riftcarver, codeweaver, flowrider, siegemaster, wardFull$/u,
      );
    });
  });

  describe('purity', () => {
    it('VALID: {a quest with flows and packages} => the quest object is byte-identical after minting', () => {
      const proxy = familyScopesMintTransformerProxy();
      proxy.setupUuids({ ids: UUIDS });

      const quest = QuestStub({
        packagesAffected: [WEB_PACKAGE, SERVER_PACKAGE],
        flows: [
          FlowStub({
            id: 'send-comment',
            name: 'Send comment',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'compose', label: 'Compose', packages: ['web'] })],
          }),
        ],
      });
      const before = JSON.stringify(quest);

      familyScopesMintTransformer({ quest, family: 'codeweaver' });

      expect(JSON.stringify(quest)).toBe(before);
    });
  });
});
