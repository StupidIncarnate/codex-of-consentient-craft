import { seedRowSummaryStatics } from './seed-row-summary-statics';

describe('seedRowSummaryStatics', () => {
  it('VALID: exported value => matches the complete statics shape', () => {
    expect(seedRowSummaryStatics).toStrictEqual({
      identity: {
        fieldOrder: ['title', 'name', 'label', 'urlSlug', 'slug', 'status', 'state'],
        maxFields: 2,
      },
    });
  });
});
