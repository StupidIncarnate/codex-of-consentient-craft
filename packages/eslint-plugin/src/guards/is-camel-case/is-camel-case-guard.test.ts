import { isCamelCaseGuard } from './is-camel-case-guard';

describe('isCamelCaseGuard', () => {
  it('VALID: {str: "userFetchBroker"} => returns true', () => {
    expect(isCamelCaseGuard({ str: 'userFetchBroker' })).toBe(true);
  });

  it('VALID: {str: "a"} => returns true', () => {
    expect(isCamelCaseGuard({ str: 'a' })).toBe(true);
  });

  it('VALID: {str: "myVariable123"} => returns true', () => {
    expect(isCamelCaseGuard({ str: 'myVariable123' })).toBe(true);
  });

  it('INVALID: {str: "UserFetchBroker"} => returns false', () => {
    expect(isCamelCaseGuard({ str: 'UserFetchBroker' })).toBe(false);
  });

  it('INVALID: {str: "user-fetch-broker"} => returns false', () => {
    expect(isCamelCaseGuard({ str: 'user-fetch-broker' })).toBe(false);
  });

  it('INVALID: {str: "user_fetch"} => returns false', () => {
    expect(isCamelCaseGuard({ str: 'user_fetch' })).toBe(false);
  });

  it('INVALID: {str: "123user"} => returns false', () => {
    expect(isCamelCaseGuard({ str: '123user' })).toBe(false);
  });

  it('EMPTY: {str: ""} => returns false', () => {
    expect(isCamelCaseGuard({ str: '' })).toBe(false);
  });

  it('EMPTY: {str: undefined} => returns false', () => {
    expect(isCamelCaseGuard({ str: undefined })).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(isCamelCaseGuard({})).toBe(false);
  });
});
