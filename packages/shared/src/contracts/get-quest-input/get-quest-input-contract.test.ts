import { getQuestInputContract } from './get-quest-input-contract';
import { GetQuestInputStub } from './get-quest-input.stub';

describe('getQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId with stage} => parses with stage value', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', stage: 'spec' });
    });

    it('VALID: {questId with slice array} => parses with slice value', () => {
      const result = getQuestInputContract.parse({
        questId: 'add-auth',
        stage: 'planning',
        slice: ['backend', 'frontend'],
      });

      expect(result).toStrictEqual({
        questId: 'add-auth',
        stage: 'planning',
        slice: ['backend', 'frontend'],
      });
    });

    it('VALID: {questId with empty slice array} => parses successfully (empty array is valid)', () => {
      const result = getQuestInputContract.parse({
        questId: 'add-auth',
        slice: [],
      });

      expect(result).toStrictEqual({ questId: 'add-auth', slice: [] });
    });

    it('VALID: {questId without slice} => slice omitted from result', () => {
      const result = getQuestInputContract.parse({ questId: 'add-auth' });

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {stage with invalid value} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: 'add-auth', stage: 'invalid' });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          path: '/some/path',
        } as never);
      }).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {slice as non-array} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          slice: 'backend' as never,
        });
      }).toThrow(/Expected array/u);
    });

    it('INVALID: {slice with non-string element} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          slice: [123 as never],
        });
      }).toThrow(/Expected string/u);
    });

    it('INVALID: {slice with non-kebab string element} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({
          questId: 'add-auth',
          slice: ['NotKebab'],
        });
      }).toThrow(/invalid_string/u);
    });
  });
});
