import { discoverSuggestionMessageStatics } from './discover-suggestion-message-statics';

describe('discoverSuggestionMessageStatics', () => {
  it('VALID: discoverSuggestionMessageStatics => contains blockMessage with full discover tool guide', () => {
    expect(discoverSuggestionMessageStatics).toStrictEqual({
      blockMessage: [
        'BLOCKED: Use the `discover` MCP tool (mcp__dungeonmaster__discover) instead of Grep/Glob.',
        '',
        'The discover tool returns file purposes, function signatures, and related files (tests, proxies, stubs).',
        '',
        '## REQUIRED parameter',
        '  type: "files"      Search source code files',
        '  type: "standards"  Search project documentation',
        '',
        '## OPTIONAL parameters (type: "files")',
        '  path      Directory to browse.        Example: "packages/hooks/src/guards"',
        '  fileType  Filter by architecture role. Values: broker, guard, transformer, adapter, contract, responder, flow, widget, binding, middleware, statics',
        '  search    Keyword match against file names and PURPOSE comments.',
        '  name      Exact file name. Returns full details: signature, usage, related files.',
        '',
        '## OPTIONAL parameters (type: "standards")',
        '  section   Section path to filter.     Example: "testing/proxy-architecture"',
        '',
        '## Examples',
        '  Browse a directory:         { "type": "files", "path": "packages/hooks/src/brokers" }',
        '  Find all guards:            { "type": "files", "fileType": "guard" }',
        '  Search by keyword:          { "type": "files", "search": "permission" }',
        '  Search brokers by keyword:  { "type": "files", "fileType": "broker", "search": "user" }',
        '  Get full file details:      { "type": "files", "name": "is-blocked-quality-command-guard" }',
        '  Browse project standards:   { "type": "standards" }',
        '  Filter to a standard:       { "type": "standards", "section": "testing" }',
      ].join('\n'),
    });
  });
});
