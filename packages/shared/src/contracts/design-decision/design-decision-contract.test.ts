import { designDecisionContract } from './design-decision-contract';
import { DesignDecisionStub } from './design-decision.stub';

describe('designDecisionContract', () => {
  it('VALID: {all fields} => parses successfully', () => {
    const decision = DesignDecisionStub();

    expect(decision).toStrictEqual({
      id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
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

  it('INVALID_TITLE: {title: ""} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
        title: '',
        rationale: 'reason',
        relatedNodeIds: [],
      });
    }).toThrow(/too_small/u);
  });

  it('INVALID_ID: {id: "not-uuid"} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'not-uuid',
        title: 'Title',
        rationale: 'reason',
        relatedNodeIds: [],
      });
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_RELATED: {relatedNodeIds: ["Bad-Id"]} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Title',
        rationale: 'reason',
        relatedNodeIds: ['Bad-Id'],
      });
    }).toThrow(/invalid_string/u);
  });
});
