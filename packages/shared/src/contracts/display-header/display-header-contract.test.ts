import { displayHeaderContract } from './display-header-contract';
import { DisplayHeaderStub } from './display-header.stub';

describe('displayHeaderContract', () => {
  describe('valid display headers', () => {
    it('VALID: "IN PROGRESS" => parses to DisplayHeader branded type', () => {
      const result = displayHeaderContract.parse('IN PROGRESS');

      expect(result).toBe('IN PROGRESS');
    });

    it('VALID: "EXECUTION PAUSED" => parses to DisplayHeader branded type', () => {
      const result = displayHeaderContract.parse('EXECUTION PAUSED');

      expect(result).toBe('EXECUTION PAUSED');
    });

    it('VALID: "" => parses empty string to DisplayHeader branded type', () => {
      const result = displayHeaderContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid display headers', () => {
    it('ERROR: 123 => throws validation error for number', () => {
      expect(() => displayHeaderContract.parse(123)).toThrow('Expected string, received number');
    });

    it('ERROR: undefined => throws validation error for undefined', () => {
      expect(() => displayHeaderContract.parse(undefined)).toThrow('Required');
    });
  });

  describe('stub', () => {
    it('VALID: DisplayHeaderStub() => returns default stub value', () => {
      const result = DisplayHeaderStub();

      expect(result).toBe('QUEST CREATED');
    });

    it('VALID: DisplayHeaderStub({value: "IN PROGRESS"}) => returns custom value', () => {
      const result = DisplayHeaderStub({ value: 'IN PROGRESS' });

      expect(result).toBe('IN PROGRESS');
    });
  });
});
