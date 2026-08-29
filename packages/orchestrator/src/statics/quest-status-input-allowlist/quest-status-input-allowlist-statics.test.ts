import { questStatusInputAllowlistStatics } from './quest-status-input-allowlist-statics';

const COMMENTS_WRITABLE_STATUSES = [
  'pending',
  'created',
  'explore_flows',
  'review_flows',
  'flows_approved',
  'explore_observables',
  'review_observables',
] as const;

describe('questStatusInputAllowlistStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusInputAllowlistStatics).toStrictEqual({
      pending: {
        allowedFields: ['title', 'comments', 'status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      created: {
        allowedFields: ['title', 'comments', 'status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      explore_flows: {
        allowedFields: [
          'title',
          'flows',
          'designDecisions',
          'packagesAffected',
          'comments',
          'status',
        ],
        flowsRule: 'full',
        allowedPlanningNotesFields: [],
      },
      review_flows: {
        allowedFields: ['comments', 'status'],
        backTransitionFields: {
          toStatus: 'explore_flows',
          fields: ['flows', 'designDecisions', 'packagesAffected'],
        },
        flowsRule: 'full',
        allowedPlanningNotesFields: [],
      },
      flows_approved: {
        allowedFields: [
          'flows',
          'designDecisions',
          'contracts',
          'toolingRequirements',
          'packagesAffected',
          'comments',
          'status',
        ],
        flowsRule: 'full',
        allowedPlanningNotesFields: [],
      },
      explore_observables: {
        allowedFields: [
          'flows',
          'designDecisions',
          'contracts',
          'toolingRequirements',
          'packagesAffected',
          'comments',
          'status',
        ],
        flowsRule: 'full',
        allowedPlanningNotesFields: [],
      },
      review_observables: {
        allowedFields: ['comments', 'status'],
        backTransitionFields: {
          toStatus: 'explore_observables',
          fields: [
            'flows',
            'designDecisions',
            'contracts',
            'toolingRequirements',
            'packagesAffected',
          ],
        },
        flowsRule: 'full',
        allowedPlanningNotesFields: [],
      },
      approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      explore_design: {
        allowedFields: ['designDecisions', 'status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      review_design: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_design',
          fields: ['designDecisions'],
        },
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      design_approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      in_progress: {
        allowedFields: ['contracts', 'toolingRequirements', 'flows', 'packagesAffected', 'status'],
        flowsRule: 'additive-only',
        allowedPlanningNotesFields: 'all',
      },
      paused: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      blocked: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      merging: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      merged: {
        allowedFields: [],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      complete: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      abandoned: {
        allowedFields: [],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
    });
  });

  it('VALID: all quest statuses from contract are present as keys', () => {
    const keys = Object.keys(questStatusInputAllowlistStatics).sort();

    expect(keys).toStrictEqual(
      [
        'abandoned',
        'approved',
        'blocked',
        'complete',
        'created',
        'design_approved',
        'explore_design',
        'explore_flows',
        'explore_observables',
        'flows_approved',
        'in_progress',
        'merged',
        'merging',
        'paused',
        'pending',
        'review_design',
        'review_flows',
        'review_observables',
      ].sort(),
    );
  });

  it("VALID: explore_observables => allowedFields does not include 'operations' (the implementation ledger is derived at Start, never authored)", () => {
    expect(questStatusInputAllowlistStatics.explore_observables.allowedFields).toStrictEqual([
      'flows',
      'designDecisions',
      'contracts',
      'toolingRequirements',
      'packagesAffected',
      'comments',
      'status',
    ]);
  });

  it("VALID: flows_approved => allowedFields does not include 'operations' (the implementation ledger is derived at Start, never authored)", () => {
    expect(questStatusInputAllowlistStatics.flows_approved.allowedFields).toStrictEqual([
      'flows',
      'designDecisions',
      'contracts',
      'toolingRequirements',
      'packagesAffected',
      'comments',
      'status',
    ]);
  });

  it("VALID: review_observables => backTransitionFields does not carry 'operations' back to explore_observables (no status ever permits writing it)", () => {
    expect(questStatusInputAllowlistStatics.review_observables.backTransitionFields).toStrictEqual({
      toStatus: 'explore_observables',
      fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'packagesAffected'],
    });
  });

  it("VALID: in_progress => allowedFields does not include 'operations' (questOperationsUpdateBroker is the sole runtime ledger writer, bypassing this gate)", () => {
    expect(questStatusInputAllowlistStatics.in_progress.allowedFields).toStrictEqual([
      'contracts',
      'toolingRequirements',
      'flows',
      'packagesAffected',
      'status',
    ]);
  });

  it('VALID: in_progress => flowsRule is additive-only, so a session can record a branch it found but never shrink the spine', () => {
    expect(questStatusInputAllowlistStatics.in_progress.flowsRule).toBe('additive-only');
  });

  it("VALID: in_progress => allowedPlanningNotesFields is 'all' (no per-phase sub-field gating; execution agents write blightLedger, questNotes and operationPlans)", () => {
    expect(questStatusInputAllowlistStatics.in_progress.allowedPlanningNotesFields).toBe('all');
  });

  describe('flowsRule across the flow-authoring loop (a user-named observable must land before Gate #1)', () => {
    it('VALID: {status: explore_flows} => flowsRule is full, so an observable the user asked for during flow review can be persisted on its node', () => {
      expect(questStatusInputAllowlistStatics.explore_flows.flowsRule).toBe('full');
    });

    it("VALID: {status: review_flows} => flowsRule is full, so the back-transition carrying the user's changes can carry an observable with them", () => {
      expect(questStatusInputAllowlistStatics.review_flows.flowsRule).toBe('full');
    });
  });

  describe("'packagesAffected' allowlist during flow authoring (tags are written with the node)", () => {
    it("VALID: {status: explore_flows} => allowedFields includes 'packagesAffected', so a node tag and its entry land in one call", () => {
      expect(questStatusInputAllowlistStatics.explore_flows.allowedFields).toStrictEqual([
        'title',
        'flows',
        'designDecisions',
        'packagesAffected',
        'comments',
        'status',
      ]);
    });

    it("VALID: {status: review_flows} => backTransitionFields carries 'packagesAffected' back to explore_flows, so the reject loop can retag", () => {
      expect(questStatusInputAllowlistStatics.review_flows.backTransitionFields).toStrictEqual({
        toStatus: 'explore_flows',
        fields: ['flows', 'designDecisions', 'packagesAffected'],
      });
    });
  });

  describe("'status' allowlist at the terminal statuses (the merge edge)", () => {
    it("VALID: {status: complete} => allowedFields includes 'status', so the merge route can move a finished quest to merging", () => {
      expect(questStatusInputAllowlistStatics.complete.allowedFields).toStrictEqual(['status']);
    });

    it("VALID: {status: blocked} => allowedFields includes 'status', so the merge route can move a halted quest to merging", () => {
      expect(questStatusInputAllowlistStatics.blocked.allowedFields).toStrictEqual(['status']);
    });

    it('VALID: {status: merged} => allowedFields is empty, since nothing transitions out of a merged quest', () => {
      expect(questStatusInputAllowlistStatics.merged.allowedFields).toStrictEqual([]);
    });

    it('VALID: {status: abandoned} => allowedFields is empty, since nothing transitions out of an abandoned quest', () => {
      expect(questStatusInputAllowlistStatics.abandoned.allowedFields).toStrictEqual([]);
    });
  });

  describe("'comments' allowlist (compose controls render only before approved)", () => {
    it.each(COMMENTS_WRITABLE_STATUSES)(
      "VALID: {status: %s} => allowedFields includes 'comments'",
      (status) => {
        const hasComments = new Set<unknown>(
          questStatusInputAllowlistStatics[status].allowedFields,
        ).has('comments');

        expect(hasComments).toBe(true);
      },
    );

    it("INVALID: {status: approved} => allowedFields does not include 'comments' (compose controls no longer render)", () => {
      const hasComments = new Set<unknown>(
        questStatusInputAllowlistStatics.approved.allowedFields,
      ).has('comments');

      expect(hasComments).toBe(false);
    });

    it("INVALID: {status: in_progress} => allowedFields does not include 'comments' (compose controls no longer render)", () => {
      const hasComments = new Set<unknown>(
        questStatusInputAllowlistStatics.in_progress.allowedFields,
      ).has('comments');

      expect(hasComments).toBe(false);
    });
  });
});
