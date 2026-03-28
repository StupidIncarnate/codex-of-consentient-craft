import { questStatics } from './quest-statics';

describe('questStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatics).toStrictEqual({
      json: {
        indentSpaces: 2,
      },
      designStatuses: {
        allowed: ['explore_design', 'review_design', 'design_approved'],
      },
    });
  });
});
