import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';

import { questInputForbiddenFieldsTransformer } from './quest-input-forbidden-fields-transformer';

describe('questInputForbiddenFieldsTransformer', () => {
  describe('top-level field allowlist', () => {
    it('VALID: {explore_flows + flows} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {explore_flows + operations} => rejects operations', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'explore_flows'",
      ]);
    });

    it('INVALID: {complete + title} => rejects every input field (terminal status)', () => {
      const input = ModifyQuestInputStub({
        title: 'New Title' as never,
      });
      const currentQuest = QuestStub({ status: 'complete' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'complete',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'title' not allowed in status 'complete'",
      ]);
    });
  });

  describe('back-transition carveout', () => {
    it('VALID: {review_flows -> explore_flows + flows} => permits flows on back transition', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
        status: 'explore_flows',
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
        nextStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {review_flows + flows without back transition} => rejects flows', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'flows' not allowed in status 'review_flows'",
      ]);
    });
  });

  describe('flowsRule: forbidden', () => {
    it('INVALID: {created + flows} => rejects flows top-level (forbidden rule)', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'created' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'created',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'flows' not allowed in status 'created'",
      ]);
    });
  });

  describe('flowsRule: full', () => {
    it('VALID: {flows_approved + flows with observables and structural changes} => returns empty array', () => {
      const observable = FlowObservableStub({ id: 'redirects' as never });
      const node = FlowNodeStub({ id: 'login' as never, observables: [observable] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const input = ModifyQuestInputStub({ flows: [flow] });
      const currentQuest = QuestStub({ status: 'flows_approved' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'flows_approved',
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('flowsRule: full during flow authoring (an observable the user named while reviewing the draft)', () => {
    it('VALID: {explore_flows + flows[].nodes[].observables: []} => permits empty observables array', () => {
      const node = FlowNodeStub({ id: 'login' as never, observables: [] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const input = ModifyQuestInputStub({ flows: [flow] });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {explore_flows + flows with a populated observable} => permits it, so a user-named assertion lands before Gate #1', () => {
      const observable = FlowObservableStub({ id: 'redirects' as never });
      const node = FlowNodeStub({ id: 'login' as never, observables: [observable] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const input = ModifyQuestInputStub({ flows: [flow] });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it("VALID: {review_flows back-transition to explore_flows + flows with a populated observable} => permits it on the same call that carries the rest of the user's changes", () => {
      const observable = FlowObservableStub({ id: 'redirects' as never });
      const node = FlowNodeStub({ id: 'login' as never, observables: [observable] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const input = ModifyQuestInputStub({ flows: [flow], status: 'explore_flows' });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
        nextStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  // One of the two checks that survive `flowsRule: 'full'`, and the reason it is not a permission
  // rule. Every other restriction on an execution agent's flow write is gone — it adds, edits and
  // deletes freely. A sign-off naming an id the graph does not hold is different in kind: the upsert
  // APPENDS that id rather than rejecting it, so one logical unit ends up with a second, phantom
  // home no later read can tell from the real one. These two cases are the only thing holding that.
  // The payloads are the PATCH shape a signing call really sends — a full observable restated
  // alongside its sign-off is the coupled edit the sibling check refuses, covered in
  // `quest-signoff-coupled-edit-violations-transformer.test.ts`.
  describe('flowsRule: full still refuses a sign-off on a unit the graph does not hold', () => {
    it('VALID: {in_progress + signs an observable that EXISTS} => returns empty array', () => {
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [
          FlowNodeStub({
            id: 'login' as never,
            observables: [FlowObservableStub({ id: 'redirects' as never })],
          }),
        ],
      });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [
                  {
                    id: 'redirects',
                    codeweaverSignoff: SignoffStub({
                      verdict: 'confirmed',
                      evidence:
                        'login-widget.test.tsx:31 — red when the redirect target is /' as never,
                    }),
                  },
                ],
              },
            ],
          },
        ] as never,
      });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {in_progress + signs an observable id the flow does NOT hold} => rejects it by name', () => {
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [
          FlowNodeStub({
            id: 'login' as never,
            observables: [FlowObservableStub({ id: 'redirects' as never })],
          }),
        ],
      });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [
                  {
                    id: 'never-existed',
                    codeweaverSignoff: SignoffStub({ verdict: 'confirmed' }),
                  },
                ],
              },
            ],
          },
        ] as never,
      });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([
        "Sign-off on unknown observable 'never-existed' — no observable with that id exists on node 'login' in flow 'login-flow'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one",
      ]);
    });
  });

  // The other check that survives `flowsRule: 'full'`. The session that builds an artifact is the
  // session that signs it, so a payload free to sign a unit and rewrite that same unit in one call
  // can move the goalposts to whatever it produced. This case is what proves the check is WIRED
  // here — every key it refuses is enumerated in the sibling transformer's own tests.
  describe('flowsRule: full still refuses an edit coupled to a sign-off', () => {
    it('INVALID: {in_progress + signs an observable AND rewrites its description in one call} => rejects the coupled key by name', () => {
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [
          FlowNodeStub({
            id: 'login' as never,
            observables: [FlowObservableStub({ id: 'redirects' as never })],
          }),
        ],
      });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [
                  {
                    id: 'redirects',
                    description: 'redirects to /home instead',
                    codeweaverSignoff: SignoffStub({ verdict: 'confirmed' }),
                  },
                ],
              },
            ],
          },
        ] as never,
      });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([
        "Sign-off on observable 'redirects' on node 'login' in flow 'login-flow' also writes 'description' — an observable carrying a sign-off may carry only its id and its sign-off fields; a sign-off is evidence about the unit as it stands, so one call may not both sign it and rewrite it — send the sign-off and the edit as two separate modify-quest calls",
      ]);
    });
  });

  describe('flowsRule: full at in_progress — an execution agent may restructure a flow, not just add to it', () => {
    it('VALID: {in_progress + replace existing observable wording} => returns empty array', () => {
      const existingObservable = FlowObservableStub({ id: 'redirects' as never });
      const existingNode = FlowNodeStub({
        id: 'login' as never,
        observables: [existingObservable],
      });
      const existingEdge = FlowEdgeStub({
        id: 'self' as never,
        from: 'login' as never,
        to: 'login' as never,
      });
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [existingNode],
        edges: [existingEdge],
      });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const replacementObservable = FlowObservableStub({
        id: 'redirects' as never,
        description: 'redirects to /home instead' as never,
      });
      const updateNode = FlowNodeStub({
        id: 'login' as never,
        observables: [replacementObservable],
      });
      const updateFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [updateNode],
      });
      const input = ModifyQuestInputStub({ flows: [updateFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {in_progress + add new flow} => returns empty array, since flowsRule: full allows a whole new flow', () => {
      const currentQuest = QuestStub({ status: 'in_progress', flows: [] });
      const newFlow = FlowStub({ id: 'brand-new-flow' as never });
      const input = ModifyQuestInputStub({ flows: [newFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {in_progress + add new node and edge to existing flow} => allowed, a session may record a branch it discovered', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingEdge = FlowEdgeStub({
        id: 'self' as never,
        from: 'login' as never,
        to: 'login' as never,
      });
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [existingNode],
        edges: [existingEdge],
      });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const newNode = FlowNodeStub({ id: 'new-node' as never });
      const newEdge = FlowEdgeStub({
        id: 'new-edge' as never,
        from: 'login' as never,
        to: 'new-node' as never,
      });
      const updateFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [newNode],
        edges: [newEdge],
      });
      const input = ModifyQuestInputStub({ flows: [updateFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {in_progress + delete existing observable} => returns empty array, since flowsRule: full allows any flow mutation', () => {
      const existingObservable = FlowObservableStub({ id: 'redirects' as never });
      const existingNode = FlowNodeStub({
        id: 'login' as never,
        observables: [existingObservable],
      });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            nodes: [
              {
                id: 'login',
                label: 'Login',
                type: 'state',
                observables: [{ id: 'redirects', _delete: true }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {in_progress + add new observable to existing node} => allowed, adding only tightens the target', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never, observables: [] });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const newObservable = FlowObservableStub({ id: 'brand-new-obs' as never });
      const updateNode = FlowNodeStub({
        id: 'login' as never,
        observables: [newObservable],
      });
      const updateFlow = FlowStub({ id: 'login-flow' as never, nodes: [updateNode] });
      const input = ModifyQuestInputStub({ flows: [updateFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('in_progress planningNotes ungating (allowedPlanningNotesFields: all)', () => {});

  describe('operations field allowlist (never writable — the implementation ledger is derived at Start, not authored)', () => {
    it('INVALID: {explore_observables + operations} => rejects operations (the ledger is derived from node packages tags and contract source paths, not authored here)', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'explore_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_observables',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'explore_observables'",
      ]);
    });

    it('INVALID: {flows_approved + operations} => rejects operations (the ledger is derived from node packages tags and contract source paths, not authored here)', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'flows_approved' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'flows_approved',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'flows_approved'",
      ]);
    });

    it('INVALID: {in_progress + operations} => rejects operations (execution agents signal outcomes instead of writing the ledger)', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'in_progress' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'in_progress'",
      ]);
    });

    it('INVALID: {review_observables -> explore_observables + operations} => rejects operations even on the back transition (no status ever permits it)', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
        status: 'explore_observables',
      });
      const currentQuest = QuestStub({ status: 'review_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_observables',
        nextStatus: 'explore_observables',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'review_observables'",
      ]);
    });

    it('INVALID: {review_observables + operations without back transition} => rejects operations', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'review_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_observables',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'review_observables'",
      ]);
    });
  });

  describe('packagesAffected field allowlist', () => {
    it('VALID: {explore_observables + packagesAffected} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'orchestrator', location: './packages/orchestrator' }),
          QuestPackageEntryStub({ name: 'web', location: './packages/web' }),
        ],
      });
      const currentQuest = QuestStub({ status: 'explore_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_observables',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {flows_approved + packagesAffected} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'shared', location: './packages/shared' }),
        ],
      });
      const currentQuest = QuestStub({ status: 'flows_approved' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'flows_approved',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {in_progress + packagesAffected} => allowed, a repair can pull in a package the spec never listed', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'orchestrator', location: './packages/orchestrator' }),
        ],
      });
      const currentQuest = QuestStub({ status: 'in_progress' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {explore_flows + packagesAffected + flows} => allowed, a node tag and the entry it names land in one call', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {review_flows -> explore_flows + packagesAffected} => permitted on the back transition, so a retag can declare the package it reaches for', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
        status: 'explore_flows',
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
        nextStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {review_flows + packagesAffected without back transition} => rejects packagesAffected', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'packagesAffected' not allowed in status 'review_flows'",
      ]);
    });
  });
});
