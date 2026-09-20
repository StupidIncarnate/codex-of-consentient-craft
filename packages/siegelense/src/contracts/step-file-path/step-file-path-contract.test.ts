import { stepFilePathContract } from './step-file-path-contract';
import { StepFilePathStub } from './step-file-path.stub';

describe('stepFilePathContract', () => {
  describe('valid paths', () => {
    it.each(['guilds/g1/quests/q1/quest.json', 'api-server.log', 'nested/folder/file.txt'])(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        expect(StepFilePathStub({ value })).toBe(value);
      },
    );
  });

  describe('an absolute path', () => {
    it('INVALID: {value: "/etc/passwd"} => throws naming the lane home', () => {
      expect(() => stepFilePathContract.parse('/etc/passwd')).toThrow(
        /resolved against the lane's own throwaway home/u,
      );
    });
  });

  describe('directory traversal', () => {
    it.each(['..', '../file.txt', 'guilds/../../etc/passwd', 'nested/..'])(
      'INVALID: {value: %s} => throws for directory traversal',
      (value) => {
        expect(() => stepFilePathContract.parse(value)).toThrow(
          /must not contain.*directory traversal/u,
        );
      },
    );
  });

  describe('an empty string', () => {
    it('EMPTY: {value: ""} => throws for failing the minimum length', () => {
      expect(() => stepFilePathContract.parse('')).toThrow(/String must contain at least 1/u);
    });
  });
});
