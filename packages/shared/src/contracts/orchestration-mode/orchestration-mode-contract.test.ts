import { orchestrationModeContract } from './orchestration-mode-contract';
import { OrchestrationModeStub } from './orchestration-mode.stub';

describe('orchestrationModeContract', () => {
  it('VALID: {value: "claude"} => parses as "claude"', () => {
    const result = orchestrationModeContract.parse(OrchestrationModeStub({ value: 'claude' }));

    expect(result).toBe('claude');
  });

  it('VALID: {value: "node"} => parses as "node"', () => {
    const result = orchestrationModeContract.parse(OrchestrationModeStub({ value: 'node' }));

    expect(result).toBe('node');
  });

  it('VALID: default stub value => "claude"', () => {
    const result = OrchestrationModeStub();

    expect(result).toBe('claude');
  });

  it('INVALID: {value: "hybrid"} => throws', () => {
    expect(() => orchestrationModeContract.parse('hybrid')).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {value: ""} => throws', () => {
    expect(() => orchestrationModeContract.parse('')).toThrow(/Invalid enum value/u);
  });
});
