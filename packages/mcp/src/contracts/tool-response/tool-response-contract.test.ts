import { toolResponseContract as _toolResponseContract } from './tool-response-contract';
import { ToolResponseStub } from './tool-response.stub';

describe('toolResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {content: [{type: "text", text: "..."}]} => parses successfully', () => {
      const response = ToolResponseStub({
        content: [{ type: 'text', text: 'Hello' }],
      });

      expect(response).toStrictEqual({
        content: [{ type: 'text', text: 'Hello' }],
      });
    });

    it('VALID: {content: [...], isError: true} => parses with isError flag', () => {
      const response = ToolResponseStub({
        content: [{ type: 'text', text: 'Error occurred' }],
        isError: true,
      });

      expect(response).toStrictEqual({
        content: [{ type: 'text', text: 'Error occurred' }],
        isError: true,
      });
    });

    it('VALID: {content: []} => parses with empty content array', () => {
      const response = ToolResponseStub({ content: [] });

      expect(response).toStrictEqual({
        content: [],
      });
    });

    it('VALID: {content: [{...}, {...}]} => parses with multiple content items', () => {
      const response = ToolResponseStub({
        content: [
          { type: 'text', text: 'First' },
          { type: 'text', text: 'Second' },
        ],
      });

      expect(response).toStrictEqual({
        content: [
          { type: 'text', text: 'First' },
          { type: 'text', text: 'Second' },
        ],
      });
    });
  });

  describe('invalid responses', () => {
    it('INVALID: {content: [{type: "image"}]} => throws for non-text type', () => {
      expect(() => {
        _toolResponseContract.parse({
          content: [{ type: 'image', text: 'data' }],
        });
      }).toThrow(/invalid_literal/u);
    });

    it('INVALID: {} => throws when content is missing', () => {
      expect(() => {
        _toolResponseContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {content: "string"} => throws when content is not an array', () => {
      expect(() => {
        _toolResponseContract.parse({ content: 'not-an-array' });
      }).toThrow(/Expected array/u);
    });
  });
});
