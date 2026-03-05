import { flowNodeIdContract } from './flow-node-id-contract';
import { FlowNodeIdStub } from './flow-node-id.stub';

describe('flowNodeIdContract', () => {
  describe('valid node IDs', () => {
    it('VALID: {value: "view-list"} => parses successfully', () => {
      const id = FlowNodeIdStub({ value: 'view-list' });

      expect(id).toBe('view-list');
    });

    it('VALID: {default value} => uses default kebab-case id', () => {
      const id = FlowNodeIdStub();

      expect(id).toBe('start');
    });

    it('VALID: {value: "a"} => single letter parses successfully', () => {
      const id = FlowNodeIdStub({ value: 'a' });

      expect(id).toBe('a');
    });

    it('VALID: {value: "login-page"} => multi-segment parses successfully', () => {
      const id = FlowNodeIdStub({ value: 'login-page' });

      expect(id).toBe('login-page');
    });

    it('VALID: {value: "step1-auth2"} => alphanumeric segments parse successfully', () => {
      const id = FlowNodeIdStub({ value: 'step1-auth2' });

      expect(id).toBe('step1-auth2');
    });
  });

  describe('invalid node IDs', () => {
    it('INVALID_ID: {value: ""} => throws validation error', () => {
      expect(() => {
        flowNodeIdContract.parse('');
      }).toThrow(/too_small/u);
    });

    it('INVALID_ID: {value: "View-List"} => uppercase throws validation error', () => {
      expect(() => {
        flowNodeIdContract.parse('View-List');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID_ID: {value: "-start"} => leading hyphen throws validation error', () => {
      expect(() => {
        flowNodeIdContract.parse('-start');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID_ID: {value: "start-"} => trailing hyphen throws validation error', () => {
      expect(() => {
        flowNodeIdContract.parse('start-');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID_ID: {value: "1start"} => leading digit throws validation error', () => {
      expect(() => {
        flowNodeIdContract.parse('1start');
      }).toThrow(/invalid_string/u);
    });

    it('INVALID_ID: {value: "start--end"} => double hyphen throws validation error', () => {
      expect(() => {
        flowNodeIdContract.parse('start--end');
      }).toThrow(/invalid_string/u);
    });
  });
});
