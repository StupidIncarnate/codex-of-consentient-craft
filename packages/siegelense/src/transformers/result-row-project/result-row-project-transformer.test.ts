import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { ResultFieldStub } from '../../contracts/result-field/result-field.stub';
import { resultRowProjectTransformer } from './result-row-project-transformer';

describe('resultRowProjectTransformer', () => {
  describe('fields: null', () => {
    it('VALID: {fields: null} => the row passes through unchanged', () => {
      const row = ContentTextStub({ value: '{"status":200,"responseBody":"ok"}' });

      const result = resultRowProjectTransformer({ row, fields: null });

      expect(result).toBe('{"status":200,"responseBody":"ok"}');
    });
  });

  describe('fields named', () => {
    it('VALID: {fields: [status, responseBody]} => reduced to those two keys', () => {
      const row = ContentTextStub({
        value: '{"status":200,"responseBody":"ok","requestBody":null,"method":"GET"}',
      });

      const result = resultRowProjectTransformer({
        row,
        fields: [ResultFieldStub({ value: 'status' }), ResultFieldStub({ value: 'responseBody' })],
      });

      expect(JSON.parse(result)).toStrictEqual({ status: 200, responseBody: 'ok' });
    });

    it('VALID: {a named field the row does not carry} => the field is omitted, not thrown', () => {
      const row = ContentTextStub({ value: '{"status":200}' });

      const result = resultRowProjectTransformer({
        row,
        fields: [ResultFieldStub({ value: 'status' }), ResultFieldStub({ value: 'responseBody' })],
      });

      expect(JSON.parse(result)).toStrictEqual({ status: 200 });
    });
  });

  describe('a row that is not a JSON object', () => {
    it('EDGE: {row: a JSON array} => projects to an empty object', () => {
      const row = ContentTextStub({ value: '[1,2,3]' });

      const result = resultRowProjectTransformer({
        row,
        fields: [ResultFieldStub({ value: 'status' })],
      });

      expect(JSON.parse(result)).toStrictEqual({});
    });

    it('EDGE: {row: a bare JSON number} => projects to an empty object', () => {
      const row = ContentTextStub({ value: '42' });

      const result = resultRowProjectTransformer({
        row,
        fields: [ResultFieldStub({ value: 'status' })],
      });

      expect(JSON.parse(result)).toStrictEqual({});
    });
  });
});
