import { kebabCaseVariantsTransformer } from './kebab-case-variants-transformer';

describe('kebabCaseVariantsTransformer', () => {
  it.each([
    [
      'user-fetch-broker',
      { camel: 'userFetchBroker', pascal: 'UserFetchBroker', testId: 'USER_FETCH_BROKER' },
    ],
    ['format-date', { camel: 'formatDate', pascal: 'FormatDate', testId: 'FORMAT_DATE' }],
    ['single', { camel: 'single', pascal: 'Single', testId: 'SINGLE' }],
    ['a-b-c-d', { camel: 'aBCD', pascal: 'ABCD', testId: 'A_B_C_D' }],
    ['', { camel: '', pascal: '', testId: '' }],
    ['-leading-dash', { camel: 'LeadingDash', pascal: 'LeadingDash', testId: '_LEADING_DASH' }],
  ])('VALID: {kebab: %j} => returns %j', (kebab, expected) => {
    expect(kebabCaseVariantsTransformer({ kebab })).toStrictEqual(expected);
  });
});
