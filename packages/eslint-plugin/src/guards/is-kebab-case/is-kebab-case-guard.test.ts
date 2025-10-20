import { isKebabCaseGuard } from './is-kebab-case-guard';

describe('isKebabCaseGuard', () => {
  it('VALID: {str: "user-fetch-broker"} => returns true', () => {
    expect(isKebabCaseGuard({ str: 'user-fetch-broker' })).toBe(true);
  });

  it('VALID: {str: "a"} => returns true', () => {
    expect(isKebabCaseGuard({ str: 'a' })).toBe(true);
  });

  it('VALID: {str: "my-variable-123"} => returns true', () => {
    expect(isKebabCaseGuard({ str: 'my-variable-123' })).toBe(true);
  });

  it('VALID: {str: "component-v2"} => returns true', () => {
    expect(isKebabCaseGuard({ str: 'component-v2' })).toBe(true);
  });

  it('INVALID: {str: "UserFetchBroker"} => returns false', () => {
    expect(isKebabCaseGuard({ str: 'UserFetchBroker' })).toBe(false);
  });

  it('INVALID: {str: "userFetchBroker"} => returns false', () => {
    expect(isKebabCaseGuard({ str: 'userFetchBroker' })).toBe(false);
  });

  it('INVALID: {str: "user_fetch"} => returns false', () => {
    expect(isKebabCaseGuard({ str: 'user_fetch' })).toBe(false);
  });

  it('INVALID: {str: "User-Fetch-Broker"} => returns false', () => {
    expect(isKebabCaseGuard({ str: 'User-Fetch-Broker' })).toBe(false);
  });

  it('INVALID: {str: "-user-fetch"} => returns false', () => {
    expect(isKebabCaseGuard({ str: '-user-fetch' })).toBe(false);
  });

  it('INVALID: {str: "user-fetch-"} => returns false', () => {
    expect(isKebabCaseGuard({ str: 'user-fetch-' })).toBe(false);
  });

  it('INVALID: {str: "user--fetch"} => returns false', () => {
    expect(isKebabCaseGuard({ str: 'user--fetch' })).toBe(false);
  });

  it('INVALID: {str: "123user"} => returns false', () => {
    expect(isKebabCaseGuard({ str: '123user' })).toBe(false);
  });

  it('EMPTY: {str: ""} => returns false', () => {
    expect(isKebabCaseGuard({ str: '' })).toBe(false);
  });

  it('EMPTY: {str: undefined} => returns false', () => {
    expect(isKebabCaseGuard({ str: undefined })).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(isKebabCaseGuard({})).toBe(false);
  });
});
