import { streamJsonLineContract } from './stream-json-line-contract';
import { StreamJsonLineStub } from './stream-json-line.stub';

type StreamJsonLine = ReturnType<typeof StreamJsonLineStub>;

describe('streamJsonLineContract', () => {
  describe('valid stream JSON lines', () => {
    it('VALID: {value: JSON object string} => parses JSON object line', () => {
      const result = streamJsonLineContract.parse('{"type":"init","session_id":"abc-123"}');

      expect(result).toBe('{"type":"init","session_id":"abc-123"}');
    });

    it('VALID: {value: simple JSON} => parses minimal JSON', () => {
      const result = streamJsonLineContract.parse('{}');

      expect(result).toBe('{}');
    });

    it('EDGE: {value: single character} => parses minimum valid string', () => {
      const result = streamJsonLineContract.parse('x');

      expect(result).toBe('x');
    });

    it('VALID: {value: JSON array string} => parses JSON array line', () => {
      const result = streamJsonLineContract.parse('[1,2,3]');

      expect(result).toBe('[1,2,3]');
    });
  });

  describe('stub', () => {
    it('VALID: stub default => returns default stream JSON line', () => {
      const line: StreamJsonLine = StreamJsonLineStub();

      expect(line).toBe('{"type":"init","session_id":"abc-123"}');
    });

    it('VALID: stub with custom value => returns custom stream JSON line', () => {
      const line: StreamJsonLine = StreamJsonLineStub({ value: '{"type":"result","data":"test"}' });

      expect(line).toBe('{"type":"result","data":"test"}');
    });
  });

  describe('invalid stream JSON lines', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => streamJsonLineContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID_TYPE: {value: number} => throws for non-string type', () => {
      expect(() => streamJsonLineContract.parse(123 as never)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {value: null} => throws for null', () => {
      expect(() => streamJsonLineContract.parse(null as never)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {value: undefined} => throws for undefined', () => {
      expect(() => streamJsonLineContract.parse(undefined as never)).toThrow(/Required/u);
    });

    it('INVALID_TYPE: {value: object} => throws for object', () => {
      expect(() => streamJsonLineContract.parse({} as never)).toThrow(/Expected string/u);
    });
  });
});
