import { readInteractionFlowSource } from '../../../test/harnesses/interaction-flow-source/interaction-flow-source.harness';

import { InteractionFlow } from './interaction-flow';

describe('InteractionFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 2 registrations with correct tool names', () => {
      const registrations = InteractionFlow();

      const names = registrations.map(({ name }) => name);

      expect(names).toStrictEqual(['signal-back', 'get-agent-prompt']);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = InteractionFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual(['function', 'function']);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = InteractionFlow();

      const descriptions = registrations.map(({ description }) => description);

      expect(descriptions).toStrictEqual([
        'Signals the CLI with step completion status, progress, or blocking conditions',
        'Returns the prompt and configuration for a named agent. Call this first when spawned as an agent to receive your instructions.',
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = InteractionFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual(['object', 'object']);
    });
  });

  describe('regression: handler forwards meta to InteractionHandleResponder', () => {
    it('VALID: source spreads meta into both handler calls => prevents the toolUseId-drop regression', () => {
      // The handler destructure once dropped `meta` silently: _meta.claudecode/toolUseId
      // arrived at the MCP boundary but was never forwarded to InteractionHandleResponder,
      // breaking the entire get-agent-prompt auto-stamp pipeline (workItems' sessionId/
      // agentId stayed null and the quest-driven watcher never tailed the session). A
      // proxy-based functional test would have to bridge flows/ → responder/.proxy,
      // which the responders/flows boundary rule forbids; a full mcp-server-harness
      // integration test would require spawning a subprocess with HOME + cwd overrides
      // plus a seeded sub-agent JSONL + quest, a lot of surface area for one spread. This
      // source-shape assertion (same pattern slash-commands-statics.test.ts uses for the
      // removed-needle check) catches the regression deterministically with one harness
      // file read.
      const source = String(readInteractionFlowSource());

      const destructurePattern = /handler: async \(\{ args, meta \}\)/gu;
      const spreadPattern = /\.\.\.\(meta !== undefined && \{ meta \}\)/gu;
      const destructures = [...source.matchAll(destructurePattern)];
      const spreads = [...source.matchAll(spreadPattern)];

      expect({ destructures: destructures.length, spreads: spreads.length }).toStrictEqual({
        destructures: 2,
        spreads: 2,
      });
    });
  });
});
