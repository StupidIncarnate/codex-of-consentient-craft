import { toolBriefContract } from './tool-brief-contract';
import { ToolBriefStub } from './tool-brief.stub';

describe('toolBriefContract', () => {
  describe('valid input', () => {
    it('VALID: {name, brief} => returns the branded tool brief', () => {
      const result = toolBriefContract.parse({
        name: 'Read',
        brief: 'file_path=/tmp/x.ts',
      });

      expect(result).toStrictEqual(
        ToolBriefStub({
          name: 'Read',
          brief: 'file_path=/tmp/x.ts',
        }),
      );
    });
  });

  describe('empty brief', () => {
    it('EDGE: {brief: ""} => returns the branded tool brief', () => {
      const result = toolBriefContract.parse({
        name: '?',
        brief: '',
      });

      expect(result).toStrictEqual(
        ToolBriefStub({
          name: '?',
          brief: '',
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {name: number} => throws', () => {
      expect(() => ToolBriefStub({ name: 42 as never })).toThrow(/Expected string/u);
    });

    it('INVALID: {brief: number} => throws', () => {
      expect(() => ToolBriefStub({ brief: 42 as never })).toThrow(/Expected string/u);
    });
  });

  describe('missing fields', () => {
    it('EMPTY: {no brief} => throws', () => {
      expect(() =>
        toolBriefContract.parse({
          name: 'Read',
        }),
      ).toThrow(/Required/u);
    });

    it('EMPTY: {no name} => throws', () => {
      expect(() =>
        toolBriefContract.parse({
          brief: 'file_path=/tmp/x.ts',
        }),
      ).toThrow(/Required/u);
    });
  });
});
