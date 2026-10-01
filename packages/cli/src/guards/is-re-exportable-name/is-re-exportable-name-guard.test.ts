import { isReExportableNameGuard } from './is-re-exportable-name-guard';

describe('isReExportableNameGuard', () => {
  it('VALID: {name: createElement} => returns true', () => {
    expect(isReExportableNameGuard({ name: 'createElement' })).toBe(true);
  });

  it('VALID: {name: $_private1} => returns true', () => {
    expect(isReExportableNameGuard({ name: '$_private1' })).toBe(true);
  });

  it('INVALID: {name: default} => returns false', () => {
    expect(isReExportableNameGuard({ name: 'default' })).toBe(false);
  });

  it('INVALID: {name: not-an-identifier} => returns false', () => {
    expect(isReExportableNameGuard({ name: 'not-an-identifier' })).toBe(false);
  });

  it('INVALID: {name: 1st} => returns false', () => {
    expect(isReExportableNameGuard({ name: '1st' })).toBe(false);
  });

  it('EMPTY: {name: ""} => returns false', () => {
    expect(isReExportableNameGuard({ name: '' })).toBe(false);
  });

  it('EMPTY: {} => returns false', () => {
    expect(isReExportableNameGuard({})).toBe(false);
  });
});
