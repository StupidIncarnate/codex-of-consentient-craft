import { flowEdgeIdContract } from './flow-edge-id-contract';
import { FlowEdgeIdStub } from './flow-edge-id.stub';

describe('flowEdgeIdContract', () => {
  it('VALID: {value: kebab-case} => parses successfully', () => {
    const id = FlowEdgeIdStub({ value: 'login-to-dashboard' });

    expect(id).toBe('login-to-dashboard');
  });

  it('VALID: {default value} => uses default kebab-case', () => {
    const id = FlowEdgeIdStub();

    expect(id).toBe('login-to-dashboard');
  });

  it('VALID: {single word} => parses successfully', () => {
    const id = FlowEdgeIdStub({ value: 'navigate' });

    expect(id).toBe('navigate');
  });

  it('INVALID_ID: {value: "Not-Kebab"} => throws validation error', () => {
    expect(() => {
      return flowEdgeIdContract.parse('Not-Kebab');
    }).toThrow(/invalid_string/u);
  });

  it('INVALID_ID: {value: ""} => throws validation error', () => {
    expect(() => {
      return flowEdgeIdContract.parse('');
    }).toThrow(/too_small/u);
  });
});
