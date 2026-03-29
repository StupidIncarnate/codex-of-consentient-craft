import { designDecisionIdContract } from './design-decision-id-contract';
import { DesignDecisionIdStub } from './design-decision-id.stub';

describe('designDecisionIdContract', () => {
  it('VALID: {value: kebab-case} => parses successfully', () => {
    const id = DesignDecisionIdStub({ value: 'use-jwt-auth' });

    expect(id).toBe('use-jwt-auth');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const id = DesignDecisionIdStub();

    expect(id).toBe('use-jwt-auth');
  });

  it('VALID: {single word} => parses successfully', () => {
    const id = DesignDecisionIdStub({ value: 'caching' });

    expect(id).toBe('caching');
  });

  it('INVALID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return designDecisionIdContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID: {value: ""} => throws validation error', () => {
    expect(() => {
      return designDecisionIdContract.parse('');
    }).toThrow(/too_small/u);
  });
});
