import { matchesFlowFileNameGuard } from './matches-flow-file-name-guard';

describe('matchesFlowFileNameGuard', () => {
  it('VALID: {name: quest-flow.ts} => returns true', () => {
    expect(matchesFlowFileNameGuard({ name: 'quest-flow.ts' })).toBe(true);
  });

  it('VALID: {name: architecture-flow.ts} => returns true', () => {
    expect(matchesFlowFileNameGuard({ name: 'architecture-flow.ts' })).toBe(true);
  });

  it('EMPTY: {name: undefined} => returns false', () => {
    expect(matchesFlowFileNameGuard({})).toBe(false);
  });

  it('INVALID: {name: my-broker.ts} => returns false', () => {
    expect(matchesFlowFileNameGuard({ name: 'my-broker.ts' })).toBe(false);
  });

  it('INVALID: {name: flow.ts} => returns false (must have prefix before -flow)', () => {
    expect(matchesFlowFileNameGuard({ name: 'flow.ts' })).toBe(false);
  });

  it('INVALID: {name: quest-flow.js} => returns false (must end in .ts)', () => {
    expect(matchesFlowFileNameGuard({ name: 'quest-flow.js' })).toBe(false);
  });
});
