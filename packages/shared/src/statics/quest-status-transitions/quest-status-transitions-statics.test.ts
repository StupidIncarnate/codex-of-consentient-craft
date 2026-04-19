import { questStatusTransitionsStatics } from './quest-status-transitions-statics';

describe('questStatusTransitionsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatusTransitionsStatics).toStrictEqual({
      created: ['explore_flows', 'paused'],
      pending: ['explore_flows', 'paused'],
      explore_flows: ['review_flows', 'paused'],
      review_flows: ['flows_approved', 'explore_flows', 'paused'],
      flows_approved: ['explore_observables', 'paused'],
      explore_observables: ['review_observables', 'paused'],
      review_observables: ['approved', 'explore_observables', 'paused'],
      approved: ['seek_scope', 'explore_design', 'paused'],
      explore_design: ['review_design', 'paused'],
      review_design: ['design_approved', 'explore_design', 'paused'],
      design_approved: ['seek_scope', 'explore_design', 'paused'],
      seek_scope: ['seek_synth', 'abandoned', 'paused'],
      seek_synth: ['seek_walk', 'seek_scope', 'abandoned', 'paused'],
      seek_walk: ['seek_plan', 'seek_scope', 'abandoned', 'paused'],
      seek_plan: ['in_progress', 'seek_walk', 'abandoned', 'paused'],
      in_progress: [
        'in_progress',
        'paused',
        'blocked',
        'complete',
        'abandoned',
        'seek_walk',
        'seek_scope',
      ],
      paused: [
        'created',
        'pending',
        'explore_flows',
        'review_flows',
        'flows_approved',
        'explore_observables',
        'review_observables',
        'approved',
        'explore_design',
        'review_design',
        'design_approved',
        'seek_scope',
        'seek_synth',
        'seek_walk',
        'seek_plan',
        'in_progress',
        'blocked',
        'abandoned',
      ],
      blocked: ['in_progress', 'abandoned', 'paused'],
      complete: [],
      abandoned: [],
    });
  });

  describe('paused reachability per pauseable status', () => {
    it('VALID: created transitions => exact [explore_flows, paused]', () => {
      expect(questStatusTransitionsStatics.created).toStrictEqual(['explore_flows', 'paused']);
    });

    it('VALID: pending transitions => exact [explore_flows, paused]', () => {
      expect(questStatusTransitionsStatics.pending).toStrictEqual(['explore_flows', 'paused']);
    });

    it('VALID: explore_flows transitions => exact [review_flows, paused]', () => {
      expect(questStatusTransitionsStatics.explore_flows).toStrictEqual(['review_flows', 'paused']);
    });

    it('VALID: review_flows transitions => exact [flows_approved, explore_flows, paused]', () => {
      expect(questStatusTransitionsStatics.review_flows).toStrictEqual([
        'flows_approved',
        'explore_flows',
        'paused',
      ]);
    });

    it('VALID: flows_approved transitions => exact [explore_observables, paused]', () => {
      expect(questStatusTransitionsStatics.flows_approved).toStrictEqual([
        'explore_observables',
        'paused',
      ]);
    });

    it('VALID: explore_observables transitions => exact [review_observables, paused]', () => {
      expect(questStatusTransitionsStatics.explore_observables).toStrictEqual([
        'review_observables',
        'paused',
      ]);
    });

    it('VALID: review_observables transitions => exact [approved, explore_observables, paused]', () => {
      expect(questStatusTransitionsStatics.review_observables).toStrictEqual([
        'approved',
        'explore_observables',
        'paused',
      ]);
    });

    it('VALID: approved transitions => exact [seek_scope, explore_design, paused]', () => {
      expect(questStatusTransitionsStatics.approved).toStrictEqual([
        'seek_scope',
        'explore_design',
        'paused',
      ]);
    });

    it('VALID: explore_design transitions => exact [review_design, paused]', () => {
      expect(questStatusTransitionsStatics.explore_design).toStrictEqual([
        'review_design',
        'paused',
      ]);
    });

    it('VALID: review_design transitions => exact [design_approved, explore_design, paused]', () => {
      expect(questStatusTransitionsStatics.review_design).toStrictEqual([
        'design_approved',
        'explore_design',
        'paused',
      ]);
    });

    it('VALID: design_approved transitions => exact [seek_scope, explore_design, paused]', () => {
      expect(questStatusTransitionsStatics.design_approved).toStrictEqual([
        'seek_scope',
        'explore_design',
        'paused',
      ]);
    });

    it('VALID: seek_scope transitions => exact [seek_synth, abandoned, paused]', () => {
      expect(questStatusTransitionsStatics.seek_scope).toStrictEqual([
        'seek_synth',
        'abandoned',
        'paused',
      ]);
    });

    it('VALID: seek_synth transitions => exact [seek_walk, seek_scope, abandoned, paused]', () => {
      expect(questStatusTransitionsStatics.seek_synth).toStrictEqual([
        'seek_walk',
        'seek_scope',
        'abandoned',
        'paused',
      ]);
    });

    it('VALID: seek_walk transitions => exact [seek_plan, seek_scope, abandoned, paused]', () => {
      expect(questStatusTransitionsStatics.seek_walk).toStrictEqual([
        'seek_plan',
        'seek_scope',
        'abandoned',
        'paused',
      ]);
    });

    it('VALID: seek_plan transitions => exact [in_progress, seek_walk, abandoned, paused]', () => {
      expect(questStatusTransitionsStatics.seek_plan).toStrictEqual([
        'in_progress',
        'seek_walk',
        'abandoned',
        'paused',
      ]);
    });

    it('VALID: blocked transitions => exact [in_progress, abandoned, paused]', () => {
      expect(questStatusTransitionsStatics.blocked).toStrictEqual([
        'in_progress',
        'abandoned',
        'paused',
      ]);
    });
  });

  describe('resume from paused', () => {
    it('VALID: paused transitions => every pauseable non-terminal status + abandoned (no paused self-edge)', () => {
      expect(questStatusTransitionsStatics.paused).toStrictEqual([
        'created',
        'pending',
        'explore_flows',
        'review_flows',
        'flows_approved',
        'explore_observables',
        'review_observables',
        'approved',
        'explore_design',
        'review_design',
        'design_approved',
        'seek_scope',
        'seek_synth',
        'seek_walk',
        'seek_plan',
        'in_progress',
        'blocked',
        'abandoned',
      ]);
    });
  });
});
