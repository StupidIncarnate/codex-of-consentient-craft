import { HookSubagentStartResponder } from './hook-subagent-start-responder';
import { HookSubagentStartResponderProxy } from './hook-subagent-start-responder.proxy';

describe('HookSubagentStartResponder', () => {
  describe('output structure', () => {
    it('VALID: {} => returns {shouldOutput: true, content: architecture + discover guidance}', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n\[SUBAGENT SPAWNED\].+# Architecture Overview\n.+## Code Discovery\n.+discover.+<\/dungeonmaster-architecture>\n$/su,
        ),
      });
    });
  });

  describe('architecture content', () => {
    it('VALID: {} => includes folder types table', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+## Folder Types\n.+\| Folder \| Purpose \| Depth \| When to Use \|.+<\/dungeonmaster-architecture>\n$/su,
        ),
      });
    });

    it('VALID: {} => includes critical rules section', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+## Critical Rules Summary\n.+Never do these things.+<\/dungeonmaster-architecture>\n$/su,
        ),
      });
    });
  });

  describe('discover guidance', () => {
    it('VALID: {} => includes discover MCP tool reference', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+mcp__dungeonmaster__discover.+<\/dungeonmaster-architecture>\n$/su,
        ),
      });
    });

    it('VALID: {} => includes discover examples', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+Browse a directory:.+Search by keyword:.+<\/dungeonmaster-architecture>\n$/su,
        ),
      });
    });
  });

  describe('MCP tools reference', () => {
    it('VALID: {} => includes MCP tools instruction at end', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+Use MCP tools \(get-folder-detail, get-syntax-rules, get-testing-patterns\).+<\/dungeonmaster-architecture>\n$/su,
        ),
      });
    });
  });
});
