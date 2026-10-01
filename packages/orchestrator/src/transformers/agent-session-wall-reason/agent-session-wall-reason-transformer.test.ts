import { McpServerStatusInitLineStub } from '../../contracts/mcp-server-status-init-line/mcp-server-status-init-line.stub';
import { SessionResultTextLineStub } from '../../contracts/session-result-text-line/session-result-text-line.stub';
import { agentSessionWallStatics } from '../../statics/agent-session-wall/agent-session-wall-statics';

import { agentSessionWallReasonTransformer } from './agent-session-wall-reason-transformer';

// The init line the CLI wrote in quest 1918a5ee's worktree, whose MCP entry crashed at load on a
// missing gateway `dist/` — trimmed to the keys this transformer reads plus one it must ignore.
const FAILED_INIT_LINE =
  '{"type":"system","subtype":"init","session_id":"9f4961d5-5414-4ebf-b169-e9e6d47c76cb","mcp_servers":[{"name":"webstorm","status":"connected","source":"user"},{"name":"dungeonmaster","status":"failed","source":"project"}]}';

const FAILED_REASON =
  "the dungeonmaster MCP server did not connect in this session (status: failed), so it had no get-agent-prompt, quest-work or signal-back tool — run the server's command from .mcp.json by hand in this session's working directory to see why it fails";

describe('agentSessionWallReasonTransformer', () => {
  describe('the init line', () => {
    it('VALID: {the real init line with dungeonmaster failed} => returns the MCP wall reason', () => {
      expect(agentSessionWallReasonTransformer({ line: FAILED_INIT_LINE })).toBe(FAILED_REASON);
    });

    it.each(agentSessionWallStatics.mcp.wallStatuses)(
      'VALID: {dungeonmaster %s} => returns the reason naming that status',
      (status) => {
        const line = JSON.stringify(
          McpServerStatusInitLineStub({
            mcp_servers: [{ name: 'dungeonmaster', status }],
          }),
        );

        expect(agentSessionWallReasonTransformer({ line })).toBe(
          `the dungeonmaster MCP server did not connect in this session (status: ${status}), so it had no get-agent-prompt, quest-work or signal-back tool — run the server's command from .mcp.json by hand in this session's working directory to see why it fails`,
        );
      },
    );

    // The init line quest 1918a5ee's spiritmender child wrote 3s after spawn while its server was
    // still starting under load. The server connects later in the same session, so this is no wall.
    it('VALID: {dungeonmaster pending} => returns undefined', () => {
      const line = JSON.stringify(
        McpServerStatusInitLineStub({
          mcp_servers: [{ name: 'dungeonmaster', status: 'pending' }],
        }),
      );

      expect(agentSessionWallReasonTransformer({ line })).toBe(undefined);
    });

    it('VALID: {dungeonmaster connected} => returns undefined', () => {
      const line = JSON.stringify(
        McpServerStatusInitLineStub({
          mcp_servers: [{ name: 'dungeonmaster', status: 'connected' }],
        }),
      );

      expect(agentSessionWallReasonTransformer({ line })).toBe(undefined);
    });

    it('EMPTY: {init line with no dungeonmaster server listed} => returns undefined', () => {
      const line = JSON.stringify(McpServerStatusInitLineStub({ mcp_servers: [] }));

      expect(agentSessionWallReasonTransformer({ line })).toBe(undefined);
    });
  });

  describe('the final result line', () => {
    it('VALID: {result text ending in a wall marker line} => returns the text after the marker', () => {
      const line = JSON.stringify(
        SessionResultTextLineStub({
          result:
            'I cannot reach quest-work.\n\nDUNGEONMASTER-WALL: the dungeonmaster MCP server is down (CONNECTION_CLOSED)',
        }),
      );

      expect(agentSessionWallReasonTransformer({ line })).toBe(
        'the dungeonmaster MCP server is down (CONNECTION_CLOSED)',
      );
    });

    it('VALID: {marker line indented} => still reads it', () => {
      const line = JSON.stringify(
        SessionResultTextLineStub({
          result: '   DUNGEONMASTER-WALL: permission denied on git push',
        }),
      );

      expect(agentSessionWallReasonTransformer({ line })).toBe('permission denied on git push');
    });

    it('EDGE: {marker with nothing after it} => returns the no-reason text', () => {
      const line = JSON.stringify(SessionResultTextLineStub({ result: 'DUNGEONMASTER-WALL:' }));

      expect(agentSessionWallReasonTransformer({ line })).toBe(
        'the session declared a wall and gave no reason',
      );
    });

    it('VALID: {marker mentioned mid-sentence, not at a line start} => returns undefined', () => {
      const line = JSON.stringify(
        SessionResultTextLineStub({
          result: 'I did not need to write DUNGEONMASTER-WALL: everything worked.',
        }),
      );

      expect(agentSessionWallReasonTransformer({ line })).toBe(undefined);
    });

    it('VALID: {ordinary result text} => returns undefined', () => {
      const line = JSON.stringify(SessionResultTextLineStub());

      expect(agentSessionWallReasonTransformer({ line })).toBe(undefined);
    });
  });

  describe('other lines', () => {
    it('VALID: {an assistant line holding the marker} => returns undefined, since only the result line counts', () => {
      expect(
        agentSessionWallReasonTransformer({
          line: '{"type":"assistant","message":{"content":[{"type":"text","text":"DUNGEONMASTER-WALL: x"}]}}',
        }),
      ).toBe(undefined);
    });

    it('EMPTY: {a non-JSON line} => returns undefined', () => {
      expect(agentSessionWallReasonTransformer({ line: 'not json' })).toBe(undefined);
    });

    it('EMPTY: {line: ""} => returns undefined', () => {
      expect(agentSessionWallReasonTransformer({ line: '' })).toBe(undefined);
    });
  });
});
