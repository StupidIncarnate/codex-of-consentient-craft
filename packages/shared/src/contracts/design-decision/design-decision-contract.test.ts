import { designDecisionContract } from './design-decision-contract';
import { DesignDecisionStub } from './design-decision.stub';

describe('designDecisionContract', () => {
  it('VALID: {all fields} => parses successfully', () => {
    const decision = DesignDecisionStub();

    expect(decision.id).toBe('c23bc10b-58cc-4372-a567-0e02b2c3d479');
    expect(decision.title).toBe('Use JWT for authentication tokens');
    expect(decision.rationale).toBe('JWT allows stateless auth with built-in expiration');
    expect(decision.relatedRequirements).toStrictEqual([]);
  });

  it('VALID: {with relatedRequirements} => parses with requirement IDs', () => {
    const decision = DesignDecisionStub({
      relatedRequirements: ['b12ac10b-58cc-4372-a567-0e02b2c3d479'],
    });

    expect(decision.relatedRequirements).toHaveLength(1);
    expect(decision.relatedRequirements[0]).toBe('b12ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('INVALID_TITLE: {title: ""} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
        title: '',
        rationale: 'reason',
        relatedRequirements: [],
      });
    }).toThrow(/too_small/u);
  });

  it('INVALID_ID: {id: "not-uuid"} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'not-uuid',
        title: 'Title',
        rationale: 'reason',
        relatedRequirements: [],
      });
    }).toThrow(/Invalid uuid/u);
  });

  it('INVALID_RELATED: {relatedRequirements: ["not-uuid"]} => throws validation error', () => {
    expect(() => {
      return designDecisionContract.parse({
        id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Title',
        rationale: 'reason',
        relatedRequirements: ['not-uuid'],
      });
    }).toThrow(/Invalid uuid/u);
  });
});
