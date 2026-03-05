import { flowNodeTypeContract } from './flow-node-type-contract';
import { FlowNodeTypeStub } from './flow-node-type.stub';

describe('flowNodeTypeContract', () => {
  describe('valid types', () => {
    it('VALID: state => parses successfully', () => {
      const type = FlowNodeTypeStub({ value: 'state' });

      expect(type).toBe('state');
    });

    it('VALID: decision => parses successfully', () => {
      const type = FlowNodeTypeStub({ value: 'decision' });

      expect(type).toBe('decision');
    });

    it('VALID: action => parses successfully', () => {
      const type = FlowNodeTypeStub({ value: 'action' });

      expect(type).toBe('action');
    });

    it('VALID: terminal => parses successfully', () => {
      const type = FlowNodeTypeStub({ value: 'terminal' });

      expect(type).toBe('terminal');
    });
  });

  describe('invalid types', () => {
    it('INVALID: unknown type => throws validation error', () => {
      expect(() => {
        flowNodeTypeContract.parse('invalid');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
