import { composerSerializedContract } from './composer-serialized-contract';
import { ComposerSerializedStub } from './composer-serialized.stub';

describe('composerSerializedContract', () => {
  describe('valid inputs', () => {
    it('VALID: {text: "A[Pasted Image 1]B", attachmentIds: [one uuid]} => parses successfully', () => {
      const result = composerSerializedContract.parse({
        text: 'A[Pasted Image 1]B',
        attachmentIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
      });

      expect(result).toStrictEqual({
        text: 'A[Pasted Image 1]B',
        attachmentIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
      });
    });

    it('EMPTY: {text: "", attachmentIds: []} => parses successfully as an empty composer', () => {
      const result = composerSerializedContract.parse({
        text: '',
        attachmentIds: [],
      });

      expect(result).toStrictEqual({
        text: '',
        attachmentIds: [],
      });
    });

    it('VALID: {text: two placeholders, attachmentIds: two uuids} => parses successfully', () => {
      const result = composerSerializedContract.parse({
        text: 'A[Pasted Image 1]B[Pasted Image 2]C',
        attachmentIds: [
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        ],
      });

      expect(result).toStrictEqual({
        text: 'A[Pasted Image 1]B[Pasted Image 2]C',
        attachmentIds: [
          'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        ],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {attachmentIds: ["not-a-uuid"]} => throws for non-uuid entry', () => {
      expect(() =>
        composerSerializedContract.parse({
          text: 'A[Pasted Image 1]B',
          attachmentIds: ['not-a-uuid'],
        } as never),
      ).toThrow(/Invalid uuid/u);
    });

    it('INVALID: {attachmentIds: "not-an-array"} => throws for non-array attachmentIds', () => {
      expect(() =>
        composerSerializedContract.parse({
          text: 'A[Pasted Image 1]B',
          attachmentIds: 'not-an-array',
        } as never),
      ).toThrow(/Expected array/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a stub with a placeholder and one attachment id', () => {
      const result = ComposerSerializedStub();

      expect(result).toStrictEqual({
        text: 'A[Pasted Image 1]B',
        attachmentIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
      });
    });

    it('VALID: {text, attachmentIds override} => creates with overridden values', () => {
      const result = ComposerSerializedStub({
        text: 'Just text, no images',
        attachmentIds: [],
      });

      expect(result).toStrictEqual({
        text: 'Just text, no images',
        attachmentIds: [],
      });
    });
  });
});
