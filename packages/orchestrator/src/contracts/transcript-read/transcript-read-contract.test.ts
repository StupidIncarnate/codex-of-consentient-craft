import { transcriptReadContract } from './transcript-read-contract';
import { TranscriptReadStub } from './transcript-read.stub';

describe('transcriptReadContract', () => {
  describe('valid input', () => {
    it('VALID: {path, fromByte} => parses to the complete entry', () => {
      const result = transcriptReadContract.parse({
        path: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
        fromByte: 4_096,
      });

      expect(result).toStrictEqual({
        path: '/home/user/.claude/projects/-home-user-proj/session.jsonl',
        fromByte: 4_096,
      });
    });

    it('EDGE: {fromByte: 0} => parses, which is a file being read whole', () => {
      expect(TranscriptReadStub().fromByte).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {fromByte: -1} => throws, because a read never starts before the file does', () => {
      expect(() => TranscriptReadStub({ fromByte: -1 as never })).toThrow(
        /greater than or equal to 0/u,
      );
    });

    it('INVALID: {path: relative} => throws', () => {
      expect(() => TranscriptReadStub({ path: 'session.jsonl' as never })).toThrow(/absolute/iu);
    });
  });
});
