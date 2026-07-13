import { questStatusInputAllowlistStatics } from './quest-status-input-allowlist-statics';

describe('questStatusInputAllowlistStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusInputAllowlistStatics).toStrictEqual({
      pending: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      created: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      explore_flows: {
        allowedFields: ['title', 'flows', 'designDecisions', 'status'],
        flowsRule: 'no-observables',
        allowedPlanningNotesFields: [],
      },
      review_flows: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_flows',
          fields: ['flows', 'designDecisions'],
        },
        flowsRule: 'no-observables',
        allowedPlanningNotesFields: [],
      },
      flows_approved: {
        allowedFields: [
          'flows',
          'designDecisions',
          'contracts',
          'toolingRequirements',
          'packagesAffected',
          'operations',
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
          'operations',
          'status',
        ],
        flowsRule: 'full',
        allowedPlanningNotesFields: [],
      },
      review_observables: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_observables',
          fields: [
            'flows',
            'designDecisions',
            'contracts',
            'toolingRequirements',
            'packagesAffected',
            'operations',
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
        allowedFields: ['contracts', 'toolingRequirements', 'flows', 'status'],
        flowsRule: 'observable-wording-only',
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
      complete: {
        allowedFields: [],
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
        'paused',
        'pending',
        'review_design',
        'review_flows',
        'review_observables',
      ].sort(),
    );
  });

  it("VALID: explore_observables => allowedFields includes 'operations' (ChaosWhisperer authors the implementation plan items there)", () => {
    expect(questStatusInputAllowlistStatics.explore_observables.allowedFields).toStrictEqual([
      'flows',
      'designDecisions',
      'contracts',
      'toolingRequirements',
      'packagesAffected',
      'operations',
      'status',
    ]);
  });

  it("VALID: review_observables => backTransitionFields carries 'operations' back to explore_observables", () => {
    expect(questStatusInputAllowlistStatics.review_observables.backTransitionFields).toStrictEqual({
      toStatus: 'explore_observables',
      fields: [
        'flows',
        'designDecisions',
        'contracts',
        'toolingRequirements',
        'packagesAffected',
        'operations',
      ],
    });
  });

  it("VALID: in_progress => allowedFields does not include 'operations' (questOperationsUpdateBroker is the sole runtime ledger writer, bypassing this gate)", () => {
    expect(questStatusInputAllowlistStatics.in_progress.allowedFields).toStrictEqual([
      'contracts',
      'toolingRequirements',
      'flows',
      'status',
    ]);
  });

  it("VALID: in_progress => allowedPlanningNotesFields is 'all' (no per-phase sub-field gating; execution agents write blightReports)", () => {
    expect(questStatusInputAllowlistStatics.in_progress.allowedPlanningNotesFields).toBe('all');
  });
});
