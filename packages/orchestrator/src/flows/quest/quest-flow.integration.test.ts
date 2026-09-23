import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  AddQuestInputStub,
  CommentBatchEntryStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  ModifyQuestInputStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestBlightLedgerEntryStub,
  QuestContractEntryStub,
  QuestNoteStub,
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { CommentBatchResponder } from '../../responders/comment/batch/comment-batch-responder';
import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestFlow } from './quest-flow';
import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { orchestrationQueueHarness } from '../../../test/harnesses/orchestration-queue/orchestration-queue.harness';
import { orchestrationQuestHarness } from '../../../test/harnesses/orchestration-quest/orchestration-quest.harness';

describe('QuestFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const queue = orchestrationQueueHarness();
  const questHelper = orchestrationQuestHarness();

  describe('delegation to responders', () => {
    it('VALID: {questId: nonexistent} => get delegates to QuestGetResponder and returns error', async () => {
      const result = await QuestFlow.get({ questId: 'nonexistent-quest' });

      expect(result.success).toBe(false);
    });
  });

  // getSummary reads a real quest.json off disk and recomputes coverage from the flow graph, so the
  // only way to prove the numbers survive a persist/reload round trip — and that provenance and
  // flow-type exclusions are applied to the PERSISTED shape rather than an in-memory stub — is to
  // drive it against a seeded quest file.
  describe('getSummary — verification state of a persisted quest', () => {
    it('VALID: {runtime flow with one siegemaster-added observable, an operational flow and two notes} => coverage, drift, debt and note groups all come back off disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-get-summary' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [],
        workItems: [],
        planningNotes: {
          blightLedger: [],
          questNotes: [
            QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' }),
            QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' }),
          ],
          operationPlans: [],
        },
        flows: [
          FlowStub({
            id: 'login-flow',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                observables: [
                  FlowObservableStub({
                    id: 'crash-on-bleh',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 400 for a non-JSON body',
                    addedBy: 'siegemaster',
                  }),
                ],
              }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
              }),
            ],
            edges: [
              FlowEdgeStub({
                id: 'e-success',
                from: 'login-page',
                to: 'dashboard',
                label: 'success',
              }),
            ],
          }),
          FlowStub({
            id: 'deploy-lint-rule',
            name: 'Deploy the lint rule',
            flowType: 'operational',
            entryPoint: 'register-rule',
            exitPoints: ['/done'],
            nodes: [FlowNodeStub({ id: 'register-rule', label: 'Register the rule' })],
            edges: [],
          }),
        ],
      });

      const summary = await QuestFlow.getSummary({ questId });

      testbed.cleanup();

      // login-flow is runtime, so all three denominators measure it. Units: 1 terminal (dashboard,
      // the only node with no outgoing edge) + 1 labelled branch (e-success) + 1 observable + 7
      // off-map families. Codeweaver and Flowrider both shed the off-map families AND the
      // siegemaster-added observable, leaving terminal + branch — 2 each, all outstanding, since no
      // work item marked anything (met/cantMeet/unmet are all 0 for every track). Siegemaster keeps
      // all 10. deploy-lint-rule is operational, so both Flowrider and Siegemaster drop out entirely
      // — operational units move to codeweaver's reviewer, the only family that settles them — and it
      // carries a codeweaver row alone (the one terminal, outstanding). No marks anywhere means the
      // whole-quest debt list is empty too.
      expect(summary).toStrictEqual({
        questId,
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            tracks: [
              { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
              { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
              { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 10 },
            ],
          },
          {
            id: 'deploy-lint-rule',
            name: 'Deploy the lint rule',
            flowType: 'operational',
            tracks: [{ id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 1 }],
          },
        ],
        midQuestObservables: [
          {
            id: 'login-flow:observable:crash-on-bleh',
            flowId: 'login-flow',
            nodeId: 'login-page',
            observableId: 'crash-on-bleh',
            addedBy: 'siegemaster',
            observableType: 'api-call',
            description: 'POST /api/auth/login returns 400 for a non-JSON body',
          },
        ],
        debt: [],
        humanChecks: [],
        noteGroups: [
          {
            id: 'open-question',
            notes: [QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' })],
          },
          {
            id: 'tooling-error',
            notes: [QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' })],
          },
          { id: 'out-of-scope', notes: [] },
          { id: 'walk-reset', notes: [] },
          { id: 'walked', notes: [] },
          { id: 'human-verdict', notes: [] },
        ],
      });
    }, 30_000);
  });

  // The four package-relational rules are proven as pure functions by their own transformer unit
  // tests. What those cannot prove is that the modify-quest path actually REFUSES the transition
  // and hands the agent the offender string back: that runs through questModifyBroker's tiering
  // (input allowlist → gate content → re-parse → save invariants), and only the save-invariants
  // tier returns named `failedChecks`, which `quest-handle-responder` renders as
  // `- [FAIL] <check name>: <details>`. A rule whose message never reaches that surface is
  // invisible to the agent that has to act on it, so these drive the real gate against a real
  // quest.json and assert the check NAME and the whole remediation clause.
  describe('package tags at the flows_approved gate', () => {
    it("INVALID: {node tags a package absent from packagesAffected} => refused as 'Node Package Coverage' naming node, flow, package and the entry shape to add; the quest stays at review_flows", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-node-coverage' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'review_flows',
        operations: [],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [FlowNodeStub({ id: 'press-warp', label: 'Press WARP', packages: ['cli'] })],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });

      const afterRefusal = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        error: String(result.error),
        failedChecks: result.failedChecks!.map((check) => ({
          name: String(check.name),
          passed: check.passed,
          details: String(check.details),
        })),
        statusOnDisk: afterRefusal.status,
      }).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'Node Package Coverage',
            passed: false,
            details:
              "Node 'press-warp' in flow 'warpgate-merge' tags package 'cli', which is not in quest.packagesAffected. Add an entry { name, location, changeType: 'edit' | 'new', packageType } — and for a 'new' package, usedBy[] naming its consumers — in the same modify-quest call, or retag the node.",
          },
        ],
        statusOnDisk: 'review_flows',
      });
    }, 30_000);

    it("INVALID: {edge whose endpoints share no package} => refused as 'No Unglued Seam' naming the edge, both endpoints and their tags; the quest stays at review_flows", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-unglued-seam' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'review_flows',
        operations: [],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            // Every tag is declared, so Node Package Coverage passes and the ONLY failure the
            // gate can report is the boundary these two nodes cross with nothing spanning it.
            nodes: [
              FlowNodeStub({ id: 'press-warp', label: 'Press WARP', packages: ['web'] }),
              FlowNodeStub({
                id: 'merge-status-ok',
                label: 'Merge status OK',
                packages: ['server'],
              }),
            ],
            edges: [
              FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' }),
            ],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });

      const afterRefusal = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        error: String(result.error),
        failedChecks: result.failedChecks!.map((check) => ({
          name: String(check.name),
          passed: check.passed,
          details: String(check.details),
        })),
        statusOnDisk: afterRefusal.status,
      }).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'No Unglued Seam',
            passed: false,
            details:
              "Edge 'press-to-status' in flow 'warpgate-merge' joins node 'press-warp' (packages: web) to node 'merge-status-ok' (packages: server), which share no package. An edge whose endpoints share no package is a boundary crossed with nothing spanning it — widen one endpoint to carry both packages (that endpoint IS the glue node), or insert a node between them that does.",
          },
        ],
        statusOnDisk: 'review_flows',
      });
    }, 30_000);

    // The untagged node never reaches the gate, and that is the design rather than a hole:
    // `flowNodeContract.packages` is `.min(1)`, and questModifyBroker re-parses the whole mutated
    // quest through `questContract` BEFORE the save-invariants tier runs. So the refusal lands one
    // tier earlier, on the write that would have created the node — which is the only place it can
    // land, because `review_flows` allows nothing but `comments`/`status` and every route into
    // `flows_approved` therefore carries flows that are already on disk and already parsed. This
    // asserts the refusal an agent actually gets, and that the untagged node never lands.
    it('INVALID: {agent adds a node carrying no packages} => the write is refused before the gate and the flow on disk keeps only its tagged node', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-untagged-node' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'explore_flows',
        operations: [],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [FlowNodeStub({ id: 'press-warp', label: 'Press WARP', packages: ['web'] })],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          // `modifyQuestInputContract`'s node union has a `.partial()` branch, so a node arriving
          // without `packages` is shape-identical to a legitimate patch and passes INPUT
          // validation — the merged node is what gets rejected.
          flows: [
            {
              id: 'warpgate-merge',
              nodes: [{ id: 'merge-status-ok', label: 'Merge status OK', type: 'state' }],
            },
          ] as never,
        }),
      });

      const afterRefusal = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        nodeIdsOnDisk: afterRefusal.flows[0]!.nodes.map((node) => String(node.id)),
      }).toStrictEqual({
        success: false,
        nodeIdsOnDisk: ['press-warp'],
      });
      expect(String(result.error)).toBe(
        '[\n  {\n    "code": "invalid_type",\n    "expected": "array",\n    "received": "undefined",\n    "path": [\n      "flows",\n      0,\n      "nodes",\n      1,\n      "packages"\n    ],\n    "message": "Required"\n  }\n]',
      );
    }, 30_000);

    // The positive case, driven through the REAL authoring path rather than a seeded fixture:
    // `packagesAffected` and the node tags that draw on it land in ONE modify-quest write, which is
    // also the only way to exercise the write-time existence check (each `location` resolves
    // against the QUEST's own repo root, seeded here by `seedQuestRepoPackages`). A suite of
    // refusals alone passes just as well against a gate that refuses everything.
    it('VALID: {flows and packagesAffected authored in one write, every tag declared and the seam glued} => the gate admits it and the tags survive on disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-flows-approved-ok' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });
      await envHarness.seedQuestRepoPackages({
        repoRoot: testbed.guildPath,
        locations: ['./packages/web', './packages/server'],
      });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const toExploreFlows = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
      });

      const authored = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          packagesAffected: [
            QuestPackageEntryStub({
              name: 'web',
              location: './packages/web',
              packageType: 'frontend-react',
            }),
            QuestPackageEntryStub({
              name: 'server',
              location: './packages/server',
              packageType: 'http-backend',
            }),
          ],
          flows: [
            FlowStub({
              id: 'warpgate-merge',
              name: 'Warpgate merge',
              entryPoint: '/quest/warp',
              exitPoints: ['/quest/merged'],
              // press-warp is widened to carry both packages, which is the remedy the seam
              // rule's own message names — that endpoint IS the glue node.
              nodes: [
                FlowNodeStub({
                  id: 'press-warp',
                  label: 'Press WARP',
                  packages: ['web', 'server'],
                }),
                FlowNodeStub({
                  id: 'merge-status-ok',
                  label: 'Merge status OK',
                  packages: ['server'],
                }),
              ],
              edges: [
                FlowEdgeStub({ id: 'press-to-status', from: 'press-warp', to: 'merge-status-ok' }),
              ],
            }),
          ],
          status: 'review_flows',
        }),
      });

      const gated = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });

      const afterGate = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        toExploreFlows: toExploreFlows.success,
        authored: authored.success,
        gated: gated.success,
        gatedFailedChecks: gated.failedChecks,
        statusOnDisk: afterGate.status,
        // The tag has to SURVIVE the write to be gate-able at all: only the top object of
        // `modifyQuestInputContract` is `.strict()`, so a node key it did not declare would be
        // silently stripped and the persisted quest would never see it.
        nodeTagsOnDisk: afterGate.flows[0]!.nodes.map((node) => ({
          id: String(node.id),
          packages: node.packages.map((name) => String(name)),
        })),
        declaredPackages: afterGate.packagesAffected.map((entry) => ({
          name: String(entry.name),
          location: String(entry.location),
          changeType: entry.changeType,
        })),
      }).toStrictEqual({
        toExploreFlows: true,
        authored: true,
        gated: true,
        gatedFailedChecks: undefined,
        statusOnDisk: 'flows_approved',
        nodeTagsOnDisk: [
          { id: 'press-warp', packages: ['web', 'server'] },
          { id: 'merge-status-ok', packages: ['server'] },
        ],
        declaredPackages: [
          { name: 'web', location: './packages/web', changeType: 'edit' },
          { name: 'server', location: './packages/server', changeType: 'edit' },
        ],
      });
    }, 30_000);
  });

  describe('package tags at the approved gate', () => {
    it("INVALID: {glue node whose observables cover only one of its two packages} => refused as 'Observable Package Attribution' naming the uncovered package; the quest stays at review_observables", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-attribution' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'review_observables',
        // No contract is authored, so Contract Source Coverage — the sibling rule that binds at
        // this same gate — has nothing to report and the attribution failure stands alone.
        operations: [
          OperationItemStub({
            id: OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000fa1' }),
            role: 'codeweaver',
            text: 'Build the warpgate seam',
            status: 'pending',
            locked: false,
            packageNames: ['web', 'server'],
          }),
        ],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            // No edges at all, so nothing is seam-forced: `server` is declared on the node and
            // asserted by neither an observable nor the edge set.
            nodes: [
              FlowNodeStub({
                id: 'landed-on-base',
                label: 'Landed on base',
                packages: ['web', 'server'],
                observables: [
                  FlowObservableStub({
                    id: 'merge-banner-shown',
                    type: 'ui-state',
                    description: 'the merged banner replaces the WARP button',
                    package: 'web',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const afterRefusal = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        error: String(result.error),
        failedChecks: result.failedChecks!.map((check) => ({
          name: String(check.name),
          passed: check.passed,
          details: String(check.details),
        })),
        statusOnDisk: afterRefusal.status,
      }).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'Observable Package Attribution',
            passed: false,
            details:
              "Node 'landed-on-base' in flow 'warpgate-merge' tags packages web, server but its observables only cover web. Package(s) server are declared on the node and asserted by nothing — a seam declared on one side only. Add an observable carrying each uncovered package, or narrow the node's packages to what it really lands in.",
          },
        ],
        statusOnDisk: 'review_observables',
      });
    }, 30_000);

    it("INVALID: {authored contract whose source sits under no declared package} => refused as 'Contract Source Coverage' naming the contract and its unroutable source", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-contract-source' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'review_observables',
        operations: [],
        workItems: [],
        // `orchestrator` is deliberately absent from packagesAffected below, so this source
        // resolves to no package and the foundation item it should mint at Start never exists.
        contracts: [
          QuestContractEntryStub({
            id: 'merge-status',
            name: 'MergeStatus',
            status: 'new',
            source: 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts',
            nodeId: 'merge-status-ok',
          }),
        ],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        // Every node is single-package and every observable names its own node's package, so
        // Observable Package Attribution passes and the ledger gap stands alone.
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press WARP',
                packages: ['web'],
                observables: [
                  FlowObservableStub({
                    id: 'warp-button-disables',
                    type: 'ui-state',
                    description: 'the WARP button goes disabled while the merge runs',
                    package: 'web',
                  }),
                ],
              }),
              FlowNodeStub({
                id: 'merge-status-ok',
                label: 'Merge status OK',
                packages: ['server'],
                observables: [
                  FlowObservableStub({
                    id: 'merge-status-200',
                    type: 'api-call',
                    description: 'GET /api/quests/:id/merge-status returns 200',
                    package: 'server',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const afterRefusal = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        error: String(result.error),
        failedChecks: result.failedChecks!.map((check) => ({
          name: String(check.name),
          passed: check.passed,
          details: String(check.details),
        })),
        statusOnDisk: afterRefusal.status,
      }).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'Contract Source Coverage',
            passed: false,
            details:
              "Contract 'MergeStatus' declares source 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger routes each contract into its package's item by these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
          },
        ],
        statusOnDisk: 'review_observables',
      });
    }, 30_000);

    // The same spine, the same unroutable contract source, the same declared packages as the
    // refusal above — only `questType` differs. Contract Source Coverage binds on a bug-hunt quest
    // exactly as it does on a feature one: bug-hunt runs the SAME relay as a feature quest, deriving
    // one codeweaver item per (package, flow) cell, so a contract resolving to no declared package
    // reaches no session on either quest type.
    it("INVALID: {bug-hunt quest whose contract source resolves nowhere} => refused as 'Contract Source Coverage', same as a feature quest", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-bug-hunt-contract-source' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'review_observables',
        questType: 'bug-hunt',
        operations: [],
        workItems: [],
        contracts: [
          QuestContractEntryStub({
            id: 'merge-status',
            name: 'MergeStatus',
            status: 'new',
            source: 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts',
            nodeId: 'merge-status-ok',
          }),
        ],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press WARP',
                packages: ['web'],
                observables: [
                  FlowObservableStub({
                    id: 'warp-button-disables',
                    type: 'ui-state',
                    description: 'the WARP button goes disabled while the merge runs',
                    package: 'web',
                  }),
                ],
              }),
              FlowNodeStub({
                id: 'merge-status-ok',
                label: 'Merge status OK',
                packages: ['server'],
                observables: [
                  FlowObservableStub({
                    id: 'merge-status-200',
                    type: 'api-call',
                    description: 'GET /api/quests/:id/merge-status returns 200',
                    package: 'server',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const afterRefusal = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        error: String(result.error),
        failedChecks: result.failedChecks!.map((check) => ({
          name: String(check.name),
          passed: check.passed,
          details: String(check.details),
        })),
        questTypeOnDisk: afterRefusal.questType,
        statusOnDisk: afterRefusal.status,
      }).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'Contract Source Coverage',
            passed: false,
            details:
              "Contract 'MergeStatus' declares source 'packages/orchestrator/src/contracts/merge-status/merge-status-contract.ts', which sits under no package in quest.packagesAffected. The implementation ledger routes each contract into its package's item by these paths, so a contract resolving nowhere reaches no session at all. Point source at a declared package's location, add the entry { name, location, changeType: 'edit' | 'new', packageType } that owns it, or mark the contract status 'existing' if the quest only references it.",
          },
        ],
        questTypeOnDisk: 'bug-hunt',
        statusOnDisk: 'review_observables',
      });
    }, 30_000);

    // 22 of the 100 nodes on the measured quest carry no observables at all — decision nodes that
    // are still branch units in the checklist denominator. Demanding coverage from them would
    // reject a correct spec, so the attribution rule exempts them outright. This node carries two
    // packages and NO edges, so no seam waiver is in play either: the exemption alone is what
    // admits it, and without it both `web` and `server` would be named.
    it('VALID: {multi-package decision node carrying no observables and no edges} => exempt from attribution, the gate admits it', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-zero-observable-node' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'review_observables',
        operations: [
          OperationItemStub({
            id: OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000fa4' }),
            role: 'codeweaver',
            text: 'Build the warpgate seam',
            status: 'pending',
            locked: false,
            packageNames: ['web', 'server'],
          }),
        ],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [
              FlowNodeStub({
                id: 'can-resolve-intake',
                label: 'Can resolve intake?',
                type: 'decision',
                packages: ['web', 'server'],
                observables: [],
              }),
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press WARP',
                packages: ['web'],
                observables: [
                  FlowObservableStub({
                    id: 'warp-button-disables',
                    type: 'ui-state',
                    description: 'the WARP button goes disabled while the merge runs',
                    package: 'web',
                  }),
                ],
              }),
              FlowNodeStub({
                id: 'merge-status-ok',
                label: 'Merge status OK',
                packages: ['server'],
                observables: [
                  FlowObservableStub({
                    id: 'merge-status-200',
                    type: 'api-call',
                    description: 'GET /api/quests/:id/merge-status returns 200',
                    package: 'server',
                  }),
                ],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const afterGate = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        failedChecks: result.failedChecks,
        statusOnDisk: afterGate.status,
      }).toStrictEqual({
        success: true,
        failedChecks: undefined,
        statusOnDisk: 'approved',
      });
    }, 30_000);

    it('VALID: {glue node whose observables cover both sides and a ledger claiming both packages} => the gate admits it and the resolved observable packages survive on disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-gate-approved-ok' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'review_observables',
        operations: [
          OperationItemStub({
            id: OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000fa5' }),
            role: 'codeweaver',
            text: 'Build the warpgate seam',
            status: 'pending',
            locked: false,
            packageNames: ['web', 'server'],
          }),
        ],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press WARP',
                packages: ['web'],
                observables: [
                  FlowObservableStub({
                    id: 'warp-button-disables',
                    type: 'ui-state',
                    description: 'the WARP button goes disabled while the merge runs',
                    package: 'web',
                  }),
                ],
              }),
              FlowNodeStub({
                id: 'landed-on-base',
                label: 'Landed on base',
                packages: ['web', 'server'],
                observables: [
                  FlowObservableStub({
                    id: 'merge-banner-shown',
                    type: 'ui-state',
                    description: 'the merged banner replaces the WARP button',
                    package: 'web',
                  }),
                  FlowObservableStub({
                    id: 'merge-status-200',
                    type: 'api-call',
                    description: 'GET /api/quests/:id/merge-status returns 200',
                    package: 'server',
                  }),
                ],
              }),
            ],
            edges: [
              FlowEdgeStub({ id: 'press-to-landed', from: 'press-warp', to: 'landed-on-base' }),
            ],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const afterGate = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        failedChecks: result.failedChecks,
        statusOnDisk: afterGate.status,
        observablePackagesOnDisk: afterGate.flows[0]!.nodes.flatMap((node) =>
          node.observables.map((observable) => ({
            id: String(observable.id),
            package: String(observable.package),
          })),
        ),
      }).toStrictEqual({
        success: true,
        failedChecks: undefined,
        statusOnDisk: 'approved',
        observablePackagesOnDisk: [
          { id: 'warp-button-disables', package: 'web' },
          { id: 'merge-banner-shown', package: 'web' },
          { id: 'merge-status-200', package: 'server' },
        ],
      });
    }, 30_000);

    // Every seeded fixture above states each observable's `package` outright. These two drive the
    // path an author actually takes during the observables phase — writing through modify-quest
    // with the key ABSENT, which `modifyQuestInputContract` permits and the persisted
    // `flowObservableContract` requires — so what lands on disk is produced by the save, not by a
    // stub default.
    it('VALID: {observables written through modify-quest with no package onto single-package nodes} => the save resolves each from its owning node and the value lands on disk', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-observable-package-resolve' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'explore_observables',
        operations: [],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [
              FlowNodeStub({
                id: 'press-warp',
                label: 'Press WARP',
                packages: ['web'],
                observables: [],
              }),
              FlowNodeStub({
                id: 'merge-status-ok',
                label: 'Merge status OK',
                packages: ['server'],
                observables: [],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          flows: [
            {
              id: 'warpgate-merge',
              nodes: [
                {
                  id: 'press-warp',
                  observables: [
                    {
                      id: 'warp-button-disables',
                      type: 'ui-state',
                      description: 'the WARP button goes disabled while the merge runs',
                    },
                  ],
                },
                {
                  id: 'merge-status-ok',
                  observables: [
                    {
                      id: 'merge-status-200',
                      type: 'api-call',
                      description: 'GET /api/quests/:id/merge-status returns 200',
                    },
                  ],
                },
              ],
            },
          ] as never,
        }),
      });

      const afterWrite = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        failedChecks: result.failedChecks,
        observablePackagesOnDisk: afterWrite.flows[0]!.nodes.flatMap((node) =>
          node.observables.map((observable) => ({
            id: String(observable.id),
            package: String(observable.package),
          })),
        ),
      }).toStrictEqual({
        success: true,
        failedChecks: undefined,
        observablePackagesOnDisk: [
          { id: 'warp-button-disables', package: 'web' },
          { id: 'merge-status-200', package: 'server' },
        ],
      });
    }, 30_000);

    it("INVALID: {observable written through modify-quest with no package onto a two-package node} => refused as 'Observable Package Resolution' naming both tags, and the observable never reaches disk", async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-observable-package-unresolvable' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      await questHelper.seedInProgressRelay({
        questId,
        status: 'explore_observables',
        operations: [],
        workItems: [],
        packagesAffected: [
          QuestPackageEntryStub({
            name: 'web',
            location: './packages/web',
            packageType: 'frontend-react',
          }),
          QuestPackageEntryStub({
            name: 'server',
            location: './packages/server',
            packageType: 'http-backend',
          }),
        ],
        flows: [
          FlowStub({
            id: 'warpgate-merge',
            name: 'Warpgate merge',
            entryPoint: '/quest/warp',
            exitPoints: ['/quest/merged'],
            nodes: [
              FlowNodeStub({
                id: 'landed-on-base',
                label: 'Landed on base',
                packages: ['web', 'server'],
                observables: [],
              }),
            ],
            edges: [],
          }),
        ],
      });

      const result = await QuestFlow.modify({
        questId,
        input: ModifyQuestInputStub({
          questId,
          flows: [
            {
              id: 'warpgate-merge',
              nodes: [
                {
                  id: 'landed-on-base',
                  observables: [
                    {
                      id: 'merge-banner-shown',
                      type: 'ui-state',
                      description: 'the merged banner replaces the WARP button',
                    },
                  ],
                },
              ],
            },
          ] as never,
        }),
      });

      const afterRefusal = await questHelper.reload({ questId });

      testbed.cleanup();

      expect({
        success: result.success,
        error: String(result.error),
        failedChecks: result.failedChecks!.map((check) => ({
          name: String(check.name),
          passed: check.passed,
          details: String(check.details),
        })),
        observableIdsOnDisk: afterRefusal.flows[0]!.nodes.flatMap((node) =>
          node.observables.map((observable) => String(observable.id)),
        ),
      }).toStrictEqual({
        success: false,
        error: 'Observable package resolution failed',
        failedChecks: [
          {
            name: 'Observable Package Resolution',
            passed: false,
            details:
              "Observable 'merge-banner-shown' on node 'landed-on-base' in flow 'warpgate-merge' names no package, and its node tags web, server. An omitted package is filled in from the owning node only when that node tags exactly ONE — state the package this observable is read in, drawn from the ones its node already tags, or retag the node.",
          },
        ],
        observableIdsOnDisk: [],
      });
    }, 30_000);
  });

  // The operations relay: an agent session ends with signal-back complete. The real
  // handle-signal-back responder → operations-update broker → advance broker chain applies the
  // outcome to the ledger and creates the next work item, all against the real filesystem. These
  // drive QuestFlow end-to-end (not mocked) — the seam the broker unit tests mock.
  describe('operations relay — advance on done', () => {
    // Nothing is appended beside the completed item: the standards review happened inside the
    // codeweaver session's own turn, via the reviewer-minion whose disposition the review-coverage
    // gate reads. So the very next thing get-next-step dispatches is the SEEDED flowrider item.
    it('VALID: {codeweaver signals complete/done} => operation completes, no review item is appended, and get-next-step dispatches the seeded flowrider', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-relay-done' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000c1' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f1' });
      const cwWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        planningNotes: QuestStub({
          planningNotes: {
            blightLedger: [
              QuestBlightLedgerEntryStub({
                itemId: 'packages/orchestrator/src/foo/foo-broker.ts:craft',
                workItemId: cwWorkItemId,
                createdAt: new Date().toISOString(),
              }),
            ],
          },
        }).planningNotes,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'build core',
            status: 'in_progress',
            locked: false,
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: cwWorkItemId,
            role: 'codeweaver',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(cwOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
          }),
        ],
      });

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: cwWorkItemId,
        signal: 'complete',
      });

      const afterAdvance = await QuestGetResponder({ questId });
      const flowWorkItem = afterAdvance.quest!.workItems.find((wi) => wi.role === 'flowrider');
      const nextStep = await QuestFlow.getNextStep();

      testbed.cleanup();

      expect({
        questStatus: afterAdvance.quest!.status,
        operations: afterAdvance.quest!.operations.map((op) => ({
          role: op.role,
          status: op.status,
        })),
        cwWorkItemStatus: afterAdvance.quest!.workItems.find((wi) => wi.id === cwWorkItemId)
          ?.status,
        workItemRoles: afterAdvance.quest!.workItems.map((wi) => wi.role),
        flowWorkItemStatus: flowWorkItem?.status,
        flowWorkItemLink: flowWorkItem?.relatedDataItems,
        flowWorkItemDependsOn: flowWorkItem?.dependsOn,
      }).toStrictEqual({
        questStatus: 'in_progress',
        operations: [
          { role: 'codeweaver', status: 'complete' },
          { role: 'flowrider', status: 'in_progress' },
        ],
        cwWorkItemStatus: 'complete',
        workItemRoles: ['codeweaver', 'flowrider'],
        flowWorkItemStatus: 'pending',
        flowWorkItemLink: [`operations/${String(flowOpId)}`],
        flowWorkItemDependsOn: [cwWorkItemId],
      });

      expect(nextStep).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'flowrider',
            model: 'opus',
            workItemId: flowWorkItem!.id,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "flowrider-planner",\n  workItemId: "${String(flowWorkItem!.id)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${String(questId)}",\n  workItemId: "${String(flowWorkItem!.id)}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${String(questId)}",\n  workItemId: "${String(flowWorkItem!.id)}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(flowWorkItem!.id)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
    }, 30_000);
  });

  // A STEPPED scope is the router's, and the signal is only a session-terminal marker on ONE work
  // item of it. This drives the real dispatch scan (QuestFlow.getNextStep -> scanOnceLayerBroker ->
  // questRouteScopeBroker) against a ledger whose work item carries a `step`, which is the shape
  // every quest seeded since the step graph landed has and the shape no integration test covered.
  describe('operations relay — a stepped scope advances through its step graph', () => {
    it('VALID: {codeweaver at step `plan` signals complete} => the scope stays in_progress, the scan mints its `work` step on the SAME scope, and the flowrider family is never opened', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-relay-stepped' }),
      });
      envHarness.setup({ tempDir: testbed.guildPath, queueHarness: queue });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const cwOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000c3' });
      const flowOpId = OperationItemIdStub({ value: '00000000-0000-4000-8000-0000000000f3' });
      const planWorkItemId = QuestWorkItemIdStub({ value: crypto.randomUUID() });

      await questHelper.seedInProgressRelay({
        questId,
        operations: [
          OperationItemStub({
            id: cwOpId,
            role: 'codeweaver',
            text: 'build core',
            status: 'in_progress',
            locked: false,
          }),
          OperationItemStub({
            id: flowOpId,
            role: 'flowrider',
            text: 'verify flows',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: planWorkItemId,
            role: 'codeweaver',
            status: 'in_progress',
            spawnerType: 'agent',
            relatedDataItems: [`operations/${String(cwOpId)}`],
            dependsOn: [],
            createdAt: new Date().toISOString(),
            // The entry step questAdvanceBroker stamps for the codeweaver family, and the word the
            // planner recorded through `quest-work` — `plan`'s `done` route is `work`.
            step: 'plan',
            declaredWord: 'done',
          }),
        ],
      });

      await QuestFlow.handleSignalBack({
        questId,
        workItemId: planWorkItemId,
        signal: 'complete',
      });

      const afterSignal = await questHelper.reload({ questId });
      const nextStep = await QuestFlow.getNextStep();
      const afterScan = await questHelper.reload({ questId });
      const mintedWorkItem = afterScan.workItems.find((wi) => wi.id !== planWorkItemId);

      testbed.cleanup();

      // The signal alone terminalizes ONE work item and touches nothing else: the scope is still
      // open at `plan`, and nothing has been minted for it or for the next family.
      expect({
        operations: afterSignal.operations.map((op) => ({ role: op.role, status: op.status })),
        workItems: afterSignal.workItems.map((wi) => ({
          id: wi.id,
          status: wi.status,
          step: wi.step,
        })),
      }).toStrictEqual({
        operations: [
          { role: 'codeweaver', status: 'in_progress' },
          { role: 'flowrider', status: 'pending' },
        ],
        workItems: [{ id: planWorkItemId, status: 'complete', step: 'plan' }],
      });

      // The scan routes the scope to the NEXT STEP of the same family — a second work item on the
      // same operations ref, at `work`, chained behind the plan item. The flowrider scope is
      // untouched: a family's scopes are minted when the previous family drains, not on a signal.
      expect({
        operations: afterScan.operations.map((op) => ({ role: op.role, status: op.status })),
        workItemCount: afterScan.workItems.length,
        mintedRole: mintedWorkItem?.role,
        mintedStep: mintedWorkItem?.step,
        mintedStatus: mintedWorkItem?.status,
        mintedLink: mintedWorkItem?.relatedDataItems,
        mintedDependsOn: mintedWorkItem?.dependsOn,
      }).toStrictEqual({
        operations: [
          { role: 'codeweaver', status: 'in_progress' },
          { role: 'flowrider', status: 'pending' },
        ],
        workItemCount: 2,
        mintedRole: 'codeweaver',
        mintedStep: 'work',
        mintedStatus: 'pending',
        mintedLink: [`operations/${String(cwOpId)}`],
        mintedDependsOn: [planWorkItemId],
      });

      // And the dispatch that comes back is that `work` session, not a flowrider one.
      expect(nextStep).toStrictEqual({
        type: 'spawn-agents',
        agents: [
          {
            questId,
            role: 'codeweaver',
            model: 'sonnet',
            workItemId: mintedWorkItem!.id,
            taskPrompt: `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "codeweaver-worker",\n  workItemId: "${String(mintedWorkItem!.id)}",\n  questId: "${String(questId)}"\n}) and follow its instructions exactly.\n\nWhen the work is done, RECORD it through mcp__dungeonmaster__quest-work and signal, in that order.\n\nMark every unit you were assigned — a signal from a session that left one unmarked is refused, naming it:\nmcp__dungeonmaster__quest-work({\n  questId: "${String(questId)}",\n  workItemId: "${String(mintedWorkItem!.id)}",\n  payload: { kind: "observations", observations: [{ unitId: "<unit id>", mark: "met" | "cant-meet" | "unmet", evidence: "<what you saw>" }] }\n})\n\nThen name the outcome of this step as a whole — "done", "unmet", "empty" or "wall". A unit you could not settle is "unmet", which mints a successor scoped to exactly those units; "wall" is an environment wall no session of your role can pass, and halts the quest:\nmcp__dungeonmaster__quest-work({\n  questId: "${String(questId)}",\n  workItemId: "${String(mintedWorkItem!.id)}",\n  payload: { kind: "outcome", word: "done", reason: "<why this word>" }\n})\n\nThen, as the last action of your turn:\nmcp__dungeonmaster__signal-back({\n  questId: "${String(questId)}",\n  workItemId: "${String(mintedWorkItem!.id)}",\n  signal: "complete",\n  operationItemId: "<your operation item id>"\n})`,
          },
        ],
      });
    }, 30_000);
  });

  // Flow: orphan-comment-cleanup, node quest-modify-request, observable
  // check-http-comments-write-allowed. CommentBatchResponder is the comment-batch route's own
  // server-side persist path — it calls questModifyBroker directly, with none of the MCP
  // responder's comments strip (that strip lives ONLY at the MCP tool boundary, in
  // packages/mcp/src/responders/quest/handle/quest-handle-responder.ts). Driving it here against a
  // real quest on real disk proves the strip is scoped to the MCP agent payload, not to the
  // `comments` field itself — mcp-server-flow.integration.test.ts proves the opposite half: the
  // SAME field, arriving via modify-quest, is silently dropped for an agent caller.
  describe('comment integrity — the comment-batch route writes comments the MCP agent path blocks', () => {
    it('VALID: {CommentBatchResponder persists one comment} => the real persisted quest.comments carries it on the very next read', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-comment-batch-write' }),
      });
      envHarness.setupHome({ tempDir: testbed.guildPath });

      const { questId } = await questHelper.createGuildAndQuest({ testbed });

      const entry = CommentBatchEntryStub({
        flowId: 'login-flow' as never,
        nodeId: 'start' as never,
        text: 'Left on the box by a real user, through the batch route' as never,
      });

      const batchResult = await CommentBatchResponder({ questId, comments: [entry] });
      const afterBatch = await QuestGetResponder({ questId });

      testbed.cleanup();

      expect({
        flowId: batchResult.comments[0]!.flowId,
        nodeId: batchResult.comments[0]!.nodeId,
        text: batchResult.comments[0]!.text,
      }).toStrictEqual({ flowId: entry.flowId, nodeId: entry.nodeId, text: entry.text });
      expect(afterBatch.quest!.comments).toStrictEqual(batchResult.comments);
    }, 30_000);
  });

  // Flow: Auto-create guild on create-quest. Entry point mcp__dungeonmaster__create-quest,
  // surfaced in-process as QuestFlow.mcpCreate. These drive the WHOLE real seam end-to-end —
  // processCwdAdapter → cwdResolveBroker → guildListBroker → guildCoversRepoRootGuard →
  // guildAddBroker → questUserAddBroker against a real DUNGEONMASTER_HOME + real cwd. The
  // broker/responder/guard unit tests mock every one of those, so this is the only place the
  // glue between create-quest and the guild brokers is proven against the real filesystem.
  describe('auto-create guild on create-quest', () => {
    const { userRequest } = AddQuestInputStub();

    it('VALID: {no covering guild registered} => auto-creates a guild at the repo root, creates its quests dir, persists the quest, and returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-autocreate' }),
      });
      // tempDir doubles as DUNGEONMASTER_HOME AND the repo root the cwd resolves to:
      // the guild gets path === repo root === testbed dir.
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      await envHarness.writeRepoRootMarker({ repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-guild-appended + check-new-guild-slug-returned: exactly one guild (the complete
      // array is [created]), anchored at the repo root, and the returned slug is its urlSlug.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      // check-quests-dir-created + check-quest-persisted.
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {a guild already covers the repo root} => reuses it, appends no new guild, returns the existing guild slug', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-reuse' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      await envHarness.writeRepoRootMarker({ repoRoot });

      // Pre-register a guild whose path equals the repo root.
      const existing = await GuildAddResponder({
        name: GuildNameStub({ value: 'Existing Covering Guild' }),
        path: repoRoot,
      });

      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: existing.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-no-duplicate-when-covered: the complete guilds array is still just the
      // pre-registered guild — no new entry was appended.
      expect(guildsAfter).toStrictEqual([
        {
          name: existing.name,
          path: existing.path,
          guildId: existing.id,
          urlSlug: existing.urlSlug,
        },
      ]);
      // check-existing-guild-slug-returned: the returned slug is the existing guild's urlSlug,
      // and the quest persisted under the EXISTING guild (reuse, not a fresh guild).
      expect(result.guildSlug).toBe(existing.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('VALID: {cwd is a subfolder of an already-registered guild} => reuses the ancestor guild (matches repo root, not the literal subfolder cwd)', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-subfolder' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      envHarness.setupHome({ tempDir: repoRoot });
      // .dungeonmaster.json lives ONLY at the repo root, so cwdResolveBroker walking up from the
      // subfolder resolves to the repo root.
      await envHarness.writeRepoRootMarker({ repoRoot });

      const ancestor = await GuildAddResponder({
        name: GuildNameStub({ value: 'Ancestor Guild' }),
        path: repoRoot,
      });

      // Create a nested subfolder under the repo root and run create-quest from there.
      const subfolder = GuildPathStub({ value: `${String(repoRoot)}/packages/some-pkg/src` });
      const cwd = envHarness.makeAndChdir({ dir: subfolder });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: ancestor.id,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // The ancestor guild covers the resolved repo root: the complete guilds array is just the
      // ancestor — no duplicate — and the slug + quest belong to it.
      expect(guildsAfter).toStrictEqual([
        {
          name: ancestor.name,
          path: ancestor.path,
          guildId: ancestor.id,
          urlSlug: ancestor.urlSlug,
        },
      ]);
      expect(result.guildSlug).toBe(ancestor.urlSlug);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);

    it('EDGE: {no .dungeonmaster.json anywhere up the tree AND no covering guild} => cwdResolveBroker rejects, broker falls back to literal cwd, auto-creates a guild there, and still returns { questId, guildSlug }', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'qf-mcp-fallback' }),
      });
      const repoRoot = GuildPathStub({ value: testbed.guildPath });
      // setupHome writes config.json but NO .dungeonmaster.json — and /tmp has none up the tree,
      // so cwdResolveBroker walks to filesystem root and throws ProjectRootNotFoundError, exercising
      // the literal-cwd fallback against the real resolver (not a mocked rejection).
      envHarness.setupHome({ tempDir: repoRoot });
      const cwd = envHarness.chdirInto({ dir: repoRoot });

      const result = await QuestFlow.mcpCreate({ userRequest });

      const guildsAfter = envHarness.readConfigGuilds({ tempDir: repoRoot });
      const created = guildsAfter[0]!;
      const questsDirExists = envHarness.questsDirExists({
        tempDir: repoRoot,
        guildId: created.guildId,
      });
      const questFile = envHarness.questFilePersisted({
        tempDir: repoRoot,
        guildId: created.guildId,
        questId: result.questId,
      });

      cwd.restore();
      testbed.cleanup();

      // check-fallback-autocreate-at-cwd: exactly one guild (complete array is [created]) was
      // auto-created with path === literal cwd.
      expect(guildsAfter).toStrictEqual([
        {
          name: created.name,
          path: created.path,
          guildId: created.guildId,
          urlSlug: created.urlSlug,
        },
      ]);
      expect(created.path).toBe(String(repoRoot));
      expect(result.guildSlug).toBe(created.urlSlug);
      expect(questsDirExists).toBe(true);
      expect(questFile).toStrictEqual({ exists: true, questIdInFile: true });
    }, 30_000);
  });
});
