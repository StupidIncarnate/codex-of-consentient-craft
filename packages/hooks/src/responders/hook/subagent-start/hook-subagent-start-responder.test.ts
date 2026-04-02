import { HookSubagentStartResponder } from './hook-subagent-start-responder';
import { HookSubagentStartResponderProxy } from './hook-subagent-start-responder.proxy';

describe('HookSubagentStartResponder', () => {
  describe('output structure', () => {
    it('VALID: {} => returns {shouldOutput: true, content: architecture overview}', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n\[SUBAGENT SPAWNED\].+# Architecture Overview\n.+<\/dungeonmaster-architecture>\n$/su,
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

    it('VALID: {} => includes code discovery section with discover tool', () => {
      HookSubagentStartResponderProxy();

      const result = HookSubagentStartResponder();

      expect(result).toStrictEqual({
        shouldOutput: true,
        content: expect.stringMatching(
          /^<dungeonmaster-architecture>\n.+## Code Discovery\n.+discover.+<\/dungeonmaster-architecture>\n$/su,
        ),
      });
    });
  });
});
