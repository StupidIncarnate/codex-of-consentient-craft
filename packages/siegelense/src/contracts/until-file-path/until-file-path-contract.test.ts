import { untilFilePathContract } from './until-file-path-contract';
import { UntilFilePathStub } from './until-file-path.stub';

describe('untilFilePathContract', () => {
  describe('a home-relative path', () => {
    it.each(['guilds/g1/quests/q1/quest.json', 'a.json'])(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        expect(UntilFilePathStub({ value })).toBe(value);
      },
    );
  });

  describe('an absolute path', () => {
    it('INVALID: {value: "/etc/passwd"} => throws naming the home it would have been resolved against', () => {
      expect(() => untilFilePathContract.parse('/etc/passwd')).toThrow(
        /resolved against the lane's own throwaway home/u,
      );
    });
  });

  describe('an empty string', () => {
    it('EMPTY: {value: ""} => throws for failing the minimum length', () => {
      expect(() => untilFilePathContract.parse('')).toThrow(/String must contain at least 1/u);
    });
  });
});
