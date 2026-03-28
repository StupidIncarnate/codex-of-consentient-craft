import { allCheckTypesStatics } from './all-check-types-statics';

describe('allCheckTypesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(allCheckTypesStatics).toStrictEqual(['lint', 'typecheck', 'unit', 'integration', 'e2e']);
  });
});
