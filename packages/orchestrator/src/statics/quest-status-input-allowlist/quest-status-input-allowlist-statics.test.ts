import { questStatusInputAllowlistStatics } from './quest-status-input-allowlist-statics';

describe('questStatusInputAllowlistStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusInputAllowlistStatics).toStrictEqual({
      pending: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      created: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      explore_flows: {
        allowedFields: ['title', 'flows', 'designDecisions', 'status'],
        flowsRule: 'no-observables',
        blightReportsRule: 'forbidden',
      },
      review_flows: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_flows',
          fields: ['flows', 'designDecisions'],
        },
        flowsRule: 'no-observables',
        blightReportsRule: 'forbidden',
      },
      flows_approved: {
        allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
        flowsRule: 'full',
        blightReportsRule: 'forbidden',
      },
      explore_observables: {
        allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
        flowsRule: 'full',
        blightReportsRule: 'forbidden',
      },
      review_observables: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_observables',
          fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        },
        flowsRule: 'full',
        blightReportsRule: 'forbidden',
      },
      approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      explore_design: {
        allowedFields: ['designDecisions', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      review_design: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_design',
          fields: ['designDecisions'],
        },
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      design_approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      seek_scope: {
        allowedFields: ['planningNotes', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      seek_synth: {
        allowedFields: ['planningNotes', 'contracts', 'toolingRequirements', 'flows', 'status'],
        flowsRule: 'observable-wording-only',
        blightReportsRule: 'forbidden',
      },
      seek_walk: {
        allowedFields: ['planningNotes', 'contracts', 'toolingRequirements', 'flows', 'status'],
        flowsRule: 'observable-wording-only',
        blightReportsRule: 'forbidden',
      },
      seek_plan: {
        allowedFields: [
          'planningNotes',
          'steps',
          'contracts',
          'toolingRequirements',
          'flows',
          'status',
        ],
        flowsRule: 'observable-wording-only',
        blightReportsRule: 'forbidden',
      },
      in_progress: {
        allowedFields: ['steps', 'contracts', 'toolingRequirements', 'flows', 'status'],
        flowsRule: 'observable-wording-only',
        blightReportsRule: 'full',
      },
      paused: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      blocked: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      complete: {
        allowedFields: [],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
      },
      abandoned: {
        allowedFields: [],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
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
        'seek_plan',
        'seek_scope',
        'seek_synth',
        'seek_walk',
      ].sort(),
    );
  });

  it('VALID: in_progress => allows planningNotes.blightReports via blightReportsRule', () => {
    expect(questStatusInputAllowlistStatics.in_progress.blightReportsRule).toBe('full');
  });

  it('VALID: seek_plan => blocks planningNotes.blightReports via blightReportsRule', () => {
    expect(questStatusInputAllowlistStatics.seek_plan.blightReportsRule).toBe('forbidden');
  });
});
