import { readInteractionFlowSource } from '../../../test/harnesses/interaction-flow-source/interaction-flow-source.harness';

import { InteractionFlow } from './interaction-flow';

describe('InteractionFlow', () => {
  describe('tool registrations', () => {
    it('VALID: returns 6 registrations with correct tool names', () => {
      const registrations = InteractionFlow();

      const names = registrations.map(({ name }) => name);

      expect(names).toStrictEqual([
        'signal-back',
        'ask-user-question',
        'get-agent-prompt',
        'get-planner-information',
        'get-worker-information',
        'get-reviewer-information',
      ]);
    });

    it('VALID: each registration has a handler function', () => {
      const registrations = InteractionFlow();

      const handlerTypes = registrations.map(({ handler }) => typeof handler);

      expect(handlerTypes).toStrictEqual([
        'function',
        'function',
        'function',
        'function',
        'function',
        'function',
      ]);
    });

    it('VALID: each registration has a non-empty description', () => {
      const registrations = InteractionFlow();

      const descriptions = registrations.map(({ description }) => description);

      expect(descriptions).toStrictEqual([
        'Signals the CLI with step completion status, progress, or blocking conditions',
        "Ask the user clarifying questions with structured options. Fire-and-forget: returns immediately. The questions are surfaced to the user's browser and their answers arrive as the next user message in the session. Use when running headless (no interactive terminal).",
        'Returns the prompt and configuration for a named agent. Call this first when spawned as an agent to receive your instructions.',
        "Returns everything a PLANNER minion needs that does not depend on which kind of work it is planning: the round document and how to read and append to it, the brief lines that address it, the plan blocks in the order they are built, a chunk's five fields, the two dispatch indexes, its operating rules, the commit it makes, and the two values its `NEXT:` line may carry. Every `<role>-planner-minion` calls this once, before anything else; its own prompt carries what the work IS. Takes no arguments.",
        "Returns everything a WORKER minion needs that does not depend on which kind of work its chunk is: the round document and where its report goes, the brief lines that address it, a chunk's five fields read as the session executing one, its operating rules, the build and git bans that make a wave of workers safe to run at once, and the two lines it returns. Every `<role>-worker-minion` calls this once, before anything else; its own prompt carries what doing the chunk MEANS and what proves it. Takes no arguments.",
        "Returns everything a REVIEWER minion needs that does not depend on which kind of work the round produced: the round document, the plan blocks and chunk fields it grades against, the two dispatch indexes, its operating rules, the build-and-ward pair only it runs, the five standing review concerns and how to record a disposition per unit, the round's commit subjects, and how to write the `NEXT:` line that decides the round. Every `<role>-reviewer-minion` calls this once, before anything else; its own prompt carries what it asks of each file and what it signs. Takes no arguments.",
      ]);
    });

    it('VALID: each registration has an inputSchema object', () => {
      const registrations = InteractionFlow();

      const schemaTypes = registrations.map(({ inputSchema }) => typeof inputSchema);

      expect(schemaTypes).toStrictEqual([
        'object',
        'object',
        'object',
        'object',
        'object',
        'object',
      ]);
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
      // THREE of the six registrations here carry meta, not all six: `signal-back`,
      // `ask-user-question` and `get-agent-prompt` each identify their calling sub-agent from
      // `_meta.claudecode/toolUseId`. The three information tools take no arguments and serve the same
      // text to every caller, so they destructure `{ args }` alone — counted separately below so a
      // future drop shows up as the number it changed rather than hiding inside one total.
      const source = String(readInteractionFlowSource());

      const destructurePattern = /handler: async \(\{ args, meta \}\)/gu;
      const spreadPattern = /\.\.\.\(meta !== undefined && \{ meta \}\)/gu;
      const argsOnlyPattern = /handler: async \(\{ args \}\)/gu;
      const destructures = [...source.matchAll(destructurePattern)];
      const spreads = [...source.matchAll(spreadPattern)];
      const argsOnly = [...source.matchAll(argsOnlyPattern)];

      expect({
        destructures: destructures.length,
        spreads: spreads.length,
        argsOnly: argsOnly.length,
      }).toStrictEqual({ destructures: 3, spreads: 3, argsOnly: 3 });
    });
  });
});
