import { isPascalCaseGuard } from './is-pascal-case-guard';

describe('isPascalCaseGuard', () => {
  it('VALID: {str: "UserFetchBroker"} => returns true', () => {
    expect(isPascalCaseGuard({ str: 'UserFetchBroker' })).toBe(true);
  });

  it('VALID: {str: "A"} => returns true', () => {
    expect(isPascalCaseGuard({ str: 'A' })).toBe(true);
  });

  it('VALID: {str: "MyVariable123"} => returns true', () => {
    expect(isPascalCaseGuard({ str: 'MyVariable123' })).toBe(true);
  });

  it('INVALID: {str: "userFetchBroker"} => returns false', () => {
    expect(isPascalCaseGuard({ str: 'userFetchBroker' })).toBe(false);
  });

  it('INVALID: {str: "User-Fetch-Broker"} => returns false', () => {
    expect(isPascalCaseGuard({ str: 'User-Fetch-Broker' })).toBe(false);
  });

  it('INVALID: {str: "User_Fetch"} => returns false', () => {
    expect(isPascalCaseGuard({ str: 'User_Fetch' })).toBe(false);
  });

  it('INVALID: {str: "123User"} => returns false', () => {
    expect(isPascalCaseGuard({ str: '123User' })).toBe(false);
  });

  it('EMPTY: {str: ""} => returns false', () => {
    expect(isPascalCaseGuard({ str: '' })).toBe(false);
  });

  it('EMPTY: {str: undefined} => returns false', () => {
    expect(isPascalCaseGuard({ str: undefined })).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(isPascalCaseGuard({})).toBe(false);
  });
});
