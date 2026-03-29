import { designDecisionContract } from './design-decision-contract';
import { DesignDecisionStub } from './design-decision.stub';

describe('designDecisionContract', () => {
  it('VALID: {all fields} => parses successfully', () => {
    const decision = DesignDecisionStub();

    expect(decision).toStrictEqual({
      id: 'use-jwt-auth',
      title: 'Use JWT for authentication tokens',
      rationale: 'JWT allows stateless auth with built-in expiration',
      relatedNodeIds: [],
    });
  });

  it('VALID: {with relatedNodeIds} => parses with flow node IDs', () => {
    const decision = DesignDecisionStub({
      relatedNodeIds: ['login-page', 'auth-check'],
    });

    expect(decision.relatedNodeIds).toStrictEqual(['login-page', 'auth-check']);
  });

  it('INVALID: {title: ""} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'use-jwt-auth',
        title: '',
        rationale: 'reason',
        relatedNodeIds: [],
      });
    }).toThrow(/too_small/u);
  });

  it('INVALID: {id: "Not-Valid"} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'Not-Valid',
        title: 'Title',
        rationale: 'reason',
        relatedNodeIds: [],
      });
    }).toThrow(/invalid_string/u);
  });

  it('INVALID: {relatedNodeIds: ["Bad-Id"]} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'use-jwt-auth',
        title: 'Title',
        rationale: 'reason',
        relatedNodeIds: ['Bad-Id'],
      });
    }).toThrow(/invalid_string/u);
  });
});
