import { sessionSnippetStatics } from './session-snippet-statics';

const MAX_SNIPPET_BYTES = 2048;

describe('sessionSnippetStatics', () => {
  const staticEntries = Object.entries(sessionSnippetStatics).filter(([, value]) => value !== null);

  const dynamicEntries = Object.entries(sessionSnippetStatics).filter(
    ([, value]) => value === null,
  );

  it('VALID: exported value => has at least one static snippet', () => {
    expect(staticEntries.length).toBeGreaterThan(0);
  });

  it.each(staticEntries)(
    'VALID: snippet "%s" => is a non-empty string under 2048 bytes',
    (_key, value) => {
      expect(String(value).length).toBeGreaterThan(0);
      expect(Buffer.byteLength(String(value), 'utf8')).toBeLessThanOrEqual(MAX_SNIPPET_BYTES);
    },
  );

  it.each(dynamicEntries)(
    'VALID: dynamic snippet "%s" => value is null (generated at runtime)',
    (_key, value) => {
      expect(value).toBe(null);
    },
  );

  it('VALID: discover snippet => flags shell grep/find/sed as blocked and points to ToolSearch', () => {
    expect(sessionSnippetStatics.discover).toMatch(
      /^`discover` is the ONLY way to search this codebase\. Native Glob, Grep, Search, and Find tools — plus shell `grep`\/`find`\/`sed` — are blocked by hooks\. `discover` and `get-project-map` are MCP \*\*tools\*\*: load them via `ToolSearch`, never as shell commands or skills\.$/mu,
    );
  });
});
