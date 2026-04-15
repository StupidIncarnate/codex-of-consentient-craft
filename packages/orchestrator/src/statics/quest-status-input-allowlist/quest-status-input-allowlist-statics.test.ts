import { questStatusInputAllowlistStatics } from './quest-status-input-allowlist-statics';

describe('questStatusInputAllowlistStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusInputAllowlistStatics).toStrictEqual({
      pending: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
      },
      created: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
      },
      explore_flows: {
        allowedFields: ['title', 'flows', 'designDecisions', 'status'],
        flowsRule: 'no-observables',
      },
      review_flows: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_flows',
          fields: ['flows', 'designDecisions'],
        },
        flowsRule: 'no-observables',
      },
      flows_approved: {
        allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
        flowsRule: 'full',
      },
      explore_observables: {
        allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
        flowsRule: 'full',
      },
      review_observables: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_observables',
          fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        },
        flowsRule: 'full',
      },
      approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
      },
      explore_design: {
        allowedFields: ['designDecisions', 'status'],
        flowsRule: 'forbidden',
      },
      review_design: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_design',
          fields: ['designDecisions'],
        },
        flowsRule: 'forbidden',
      },
      design_approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
      },
      in_progress: {
        allowedFields: ['steps', 'contracts', 'toolingRequirements', 'flows', 'status'],
        flowsRule: 'observable-wording-only',
      },
      paused: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
      },
      blocked: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
      },
      complete: {
        allowedFields: [],
        flowsRule: 'forbidden',
      },
      abandoned: {
        allowedFields: [],
        flowsRule: 'forbidden',
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
});
