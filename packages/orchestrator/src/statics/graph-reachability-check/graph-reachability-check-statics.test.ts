import { graphReachabilityCheckStatics } from './graph-reachability-check-statics';

describe('graphReachabilityCheckStatics', () => {
  it('VALID: {} => the family terminals, the step terminals, and the four known handlers', () => {
    expect(graphReachabilityCheckStatics).toStrictEqual({
      familyTerminals: ['@complete', '@blocked'],
      stepTerminals: ['@done', '@blocked'],
      knownHandlers: ['commit', 'ward', 'riftcarver', 'cleanup'],
    });
  });
});
