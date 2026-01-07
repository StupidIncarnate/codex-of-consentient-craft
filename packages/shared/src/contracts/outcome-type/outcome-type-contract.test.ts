import { outcomeTypeContract } from './outcome-type-contract';
import { OutcomeTypeStub } from './outcome-type.stub';

describe('outcomeTypeContract', () => {
  it('VALID: {value: api-call} => parses successfully', () => {
    const type = OutcomeTypeStub({ value: 'api-call' });

    expect(type).toBe('api-call');
  });

  it('VALID: {default} => uses default api-call', () => {
    const type = OutcomeTypeStub();

    expect(type).toBe('api-call');
  });

  it.each([
    'api-call',
    'file-exists',
    'environment',
    'log-output',
    'process-state',
    'performance',
    'ui-state',
    'cache-state',
    'db-query',
    'queue-message',
    'external-api',
    'custom',
  ] as const)('VALID: {value: %s} => parses successfully', (type) => {
    expect(outcomeTypeContract.parse(type)).toBe(type);
  });

  it('INVALID_TYPE: {value: "invalid"} => throws validation error', () => {
    expect(() => {
      return outcomeTypeContract.parse('invalid');
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID_TYPE: {value: ""} => throws validation error', () => {
    expect(() => {
      return outcomeTypeContract.parse('');
    }).toThrow(/Invalid enum value/u);
  });
});
