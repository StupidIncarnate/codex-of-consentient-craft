import { questGateContentRequirementsStatics } from './quest-gate-content-requirements-statics';

describe('questGateContentRequirementsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questGateContentRequirementsStatics).toStrictEqual({
      gates: {
        flows_approved: ['flows'],
        approved: ['flows'],
        design_approved: ['flows'],
        seek_synth: ['planningNotes.scopeClassification'],
        seek_walk: ['planningNotes.scopeClassification', 'planningNotes.synthesis'],
        in_progress: [
          'planningNotes.scopeClassification',
          'planningNotes.synthesis',
          'planningNotes.walkFindings',
        ],
      },
    });
  });
});
