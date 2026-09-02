import { attachmentIdContract } from './attachment-id-contract';
import { AttachmentIdStub } from './attachment-id.stub';

describe('attachmentIdContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "f47ac10b-58cc-4372-a567-0e02b2c3d479"} => parses attachment id', () => {
      const result = attachmentIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "not-a-uuid"} => throws for non-uuid string', () => {
      expect(() => attachmentIdContract.parse('not-a-uuid')).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => attachmentIdContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid attachment id', () => {
      const result = AttachmentIdStub();

      expect(result).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('VALID: {value: custom uuid} => creates with custom value', () => {
      const result = AttachmentIdStub({ value: '3fa85f64-5717-4562-b3fc-2c963f66afa6' });

      expect(result).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    });
  });
});
