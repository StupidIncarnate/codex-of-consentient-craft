import { questGateContentRequirementsStatics } from './quest-gate-content-requirements-statics';

describe('questGateContentRequirementsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questGateContentRequirementsStatics).toStrictEqual({
      gates: {
        flows_approved: ['flows'],
        approved: [
          'flows',
          { field: 'operations', contains: { key: 'role', value: 'codeweaver' } },
        ],
        design_approved: ['flows'],
      },
    });
  });
});
