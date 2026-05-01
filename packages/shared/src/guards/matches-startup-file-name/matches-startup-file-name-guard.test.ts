import { matchesStartupFileNameGuard } from './matches-startup-file-name-guard';

describe('matchesStartupFileNameGuard', () => {
  it('VALID: {name: start-my-app.ts} => returns true', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-my-app.ts' })).toBe(true);
  });

  it('VALID: {name: start-install.ts} => returns true', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-install.ts' })).toBe(true);
  });

  it('EMPTY: {name: undefined} => returns false', () => {
    expect(matchesStartupFileNameGuard({})).toBe(false);
  });

  it('INVALID: {name: my-broker.ts} => returns false', () => {
    expect(matchesStartupFileNameGuard({ name: 'my-broker.ts' })).toBe(false);
  });

  it('INVALID: {name: start-.ts} => returns false (must have at least one char after start-)', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-.ts' })).toBe(false);
  });

  it('INVALID: {name: start-my-app.js} => returns false (must end in .ts)', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-my-app.js' })).toBe(false);
  });

  it('INVALID: {name: start-cli.integration.test.ts} => returns false (test files are excluded)', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-cli.integration.test.ts' })).toBe(false);
  });

  it('INVALID: {name: start-cli.test.ts} => returns false (test files are excluded)', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-cli.test.ts' })).toBe(false);
  });

  it('INVALID: {name: start-cli.proxy.ts} => returns false (proxy files are excluded)', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-cli.proxy.ts' })).toBe(false);
  });

  it('INVALID: {name: start-cli.stub.ts} => returns false (stub files are excluded)', () => {
    expect(matchesStartupFileNameGuard({ name: 'start-cli.stub.ts' })).toBe(false);
  });
});
