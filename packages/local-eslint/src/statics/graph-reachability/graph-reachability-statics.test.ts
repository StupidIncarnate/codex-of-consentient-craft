import { graphReachabilityStatics } from './graph-reachability-statics';

describe('graphReachabilityStatics', () => {
  it('VALID: {} => the questFlowStatics source file is the one scope path, and the family terminals', () => {
    expect(graphReachabilityStatics).toStrictEqual({
      scopeFilePaths: ['packages/shared/src/statics/quest-flow/quest-flow-statics.ts'],
      familyTerminals: ['@complete', '@blocked'],
    });
  });
});
