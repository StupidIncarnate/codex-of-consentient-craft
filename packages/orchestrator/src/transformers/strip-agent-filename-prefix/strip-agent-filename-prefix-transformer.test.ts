import { FileNameStub } from '@dungeonmaster/shared/contracts';
import { stripAgentFilenamePrefixTransformer } from './strip-agent-filename-prefix-transformer';

describe('stripAgentFilenamePrefixTransformer', () => {
  describe('standard filenames', () => {
    it('VALID: {fileName: "agent-a750c8bc.jsonl"} => returns "a750c8bc"', () => {
      const result = stripAgentFilenamePrefixTransformer({
        fileName: FileNameStub({ value: 'agent-a750c8bc.jsonl' }),
      });

      expect(result).toStrictEqual('a750c8bc');
    });

    it('VALID: {fileName: "agent-a19598e0410120364.jsonl"} => returns "a19598e0410120364"', () => {
      const result = stripAgentFilenamePrefixTransformer({
        fileName: FileNameStub({ value: 'agent-a19598e0410120364.jsonl' }),
      });

      expect(result).toStrictEqual('a19598e0410120364');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {fileName without agent- prefix} => returns id without prefix stripping', () => {
      const result = stripAgentFilenamePrefixTransformer({
        fileName: FileNameStub({ value: 'a750c8bc.jsonl' }),
      });

      expect(result).toStrictEqual('a750c8bc');
    });

    it('EDGE: {fileName without .jsonl suffix} => returns id without suffix stripping', () => {
      const result = stripAgentFilenamePrefixTransformer({
        fileName: FileNameStub({ value: 'agent-a750c8bc' }),
      });

      expect(result).toStrictEqual('a750c8bc');
    });
  });
});
