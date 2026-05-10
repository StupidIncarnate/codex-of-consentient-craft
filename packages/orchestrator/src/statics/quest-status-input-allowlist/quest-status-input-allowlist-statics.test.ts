import { questStatusInputAllowlistStatics } from './quest-status-input-allowlist-statics';

describe('questStatusInputAllowlistStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusInputAllowlistStatics).toStrictEqual({
      pending: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      created: {
        allowedFields: ['title', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      explore_flows: {
        allowedFields: ['title', 'flows', 'designDecisions', 'status'],
        flowsRule: 'no-observables',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      review_flows: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_flows',
          fields: ['flows', 'designDecisions'],
        },
        flowsRule: 'no-observables',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      flows_approved: {
        allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
        flowsRule: 'full',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      explore_observables: {
        allowedFields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements', 'status'],
        flowsRule: 'full',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      review_observables: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_observables',
          fields: ['flows', 'designDecisions', 'contracts', 'toolingRequirements'],
        },
        flowsRule: 'full',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      explore_design: {
        allowedFields: ['designDecisions', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      review_design: {
        allowedFields: ['status'],
        backTransitionFields: {
          toStatus: 'explore_design',
          fields: ['designDecisions'],
        },
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      design_approved: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      seek_scope: {
        allowedFields: ['planningNotes', 'status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: ['scopeClassification'],
      },
      seek_synth: {
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
        allowedPlanningNotesFields: ['surfaceReports', 'synthesis'],
      },
      seek_walk: {
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
        allowedPlanningNotesFields: ['walkFindings'],
      },
      in_progress: {
        allowedFields: ['steps', 'contracts', 'toolingRequirements', 'flows', 'status'],
        flowsRule: 'observable-wording-only',
        blightReportsRule: 'full',
        allowedPlanningNotesFields: ['blightReports'],
      },
      paused: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      blocked: {
        allowedFields: ['status'],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      complete: {
        allowedFields: [],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
        allowedPlanningNotesFields: [],
      },
      abandoned: {
        allowedFields: [],
        flowsRule: 'forbidden',
        blightReportsRule: 'forbidden',
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
        'seek_scope',
        'seek_synth',
        'seek_walk',
      ].sort(),
    );
  });

  it('VALID: in_progress => allows planningNotes.blightReports via blightReportsRule', () => {
    expect(questStatusInputAllowlistStatics.in_progress.blightReportsRule).toBe('full');
  });

  it('VALID: seek_scope => allowedPlanningNotesFields limits writes to scopeClassification', () => {
    expect(questStatusInputAllowlistStatics.seek_scope.allowedPlanningNotesFields).toStrictEqual([
      'scopeClassification',
    ]);
  });

  it('VALID: seek_synth => allowedPlanningNotesFields limits writes to surfaceReports and synthesis', () => {
    expect(questStatusInputAllowlistStatics.seek_synth.allowedPlanningNotesFields).toStrictEqual([
      'surfaceReports',
      'synthesis',
    ]);
  });

  it("VALID: seek_synth => allowedFields includes 'steps' so surface-scope minions can commit steps directly", () => {
    expect(questStatusInputAllowlistStatics.seek_synth.allowedFields).toStrictEqual([
      'planningNotes',
      'steps',
      'contracts',
      'toolingRequirements',
      'flows',
      'status',
    ]);
  });

  it('VALID: seek_walk => allowedPlanningNotesFields limits writes to walkFindings', () => {
    expect(questStatusInputAllowlistStatics.seek_walk.allowedPlanningNotesFields).toStrictEqual([
      'walkFindings',
    ]);
  });

  it("VALID: seek_walk => allowedFields includes 'steps' so PathSeeker can patch step fields during the walk", () => {
    expect(questStatusInputAllowlistStatics.seek_walk.allowedFields).toStrictEqual([
      'planningNotes',
      'steps',
      'contracts',
      'toolingRequirements',
      'flows',
      'status',
    ]);
  });

  it('VALID: in_progress => allowedPlanningNotesFields limits writes to blightReports', () => {
    expect(questStatusInputAllowlistStatics.in_progress.allowedPlanningNotesFields).toStrictEqual([
      'blightReports',
    ]);
  });
});
