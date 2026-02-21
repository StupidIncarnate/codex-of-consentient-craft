import { chatEntryGroupContract } from './chat-entry-group-contract';
import { SingleGroupStub, ToolGroupStub } from './chat-entry-group.stub';

describe('chatEntryGroupContract', () => {
  describe('single group', () => {
    it('VALID: {kind: single, entry: user} => parses successfully', () => {
      const result = chatEntryGroupContract.parse(SingleGroupStub());

      expect(result.kind).toBe('single');
    });
  });

  describe('tool group', () => {
    it('VALID: {kind: tool-group, entries: [tool_use, tool_result]} => parses successfully', () => {
      const result = chatEntryGroupContract.parse(ToolGroupStub());

      expect(result.kind).toBe('tool-group');
    });
  });
});
