import { workItemPayloadKeyContract } from './work-item-payload-key-contract';
import { WorkItemPayloadKeyStub } from './work-item-payload-key.stub';

describe('workItemPayloadKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "instance"} => parses and returns branded WorkItemPayloadKey', () => {
      expect(WorkItemPayloadKeyStub({ value: 'instance' })).toBe('instance');
    });

    it('VALID: {value: "units"} => parses any non-empty string key', () => {
      expect(WorkItemPayloadKeyStub({ value: 'units' })).toBe('units');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws', () => {
      expect(() => workItemPayloadKeyContract.parse(123)).toThrow(/expected string/u);
    });
  });
});
