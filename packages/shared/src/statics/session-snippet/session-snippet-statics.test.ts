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

  it('VALID: wardDiscipline snippet => splits FULL-run ownership by dispatch surface', () => {
    expect(sessionSnippetStatics.wardDiscipline).toMatch(
      /^\*\*Who owns a FULL run\.\*\* An agent working directly for the user makes `npm run ward` exit 0 and owns every failure in it, including ones it did not cause\. An orchestrator-dispatched role is the opposite: it NEVER runs the full sweep — its Operating Rules override this snippet, and the dispatcher's own `run-ward` item is the regression pass\.$/mu,
    );
  });

  it('VALID: wardDiscipline snippet => requires an unpiped build before ward', () => {
    expect(sessionSnippetStatics.wardDiscipline).toMatch(
      /^\*\*Build first, unpiped\.\*\* .*Run `npm run build` as its OWN command and confirm it exits 0 — piping it \(`npm run build \| tail -3 && npm run ward`\) discards the exit code and feeds a failed build silently into ward\.$/mu,
    );
  });

  it('VALID: ward snippet => defers FULL-run ownership to the role rather than mandating green', () => {
    expect(sessionSnippetStatics.ward).toMatch(
      /^\*\*Zero tolerance:\*\* Never assume a failure is pre-existing — investigate and fix every one\. Whether a FULL run is yours to make green depends on your role; see the ward-discipline snippet\.$/mu,
    );
  });

  it('VALID: ward snippet => carries no unconditional "fully green" mandate to contradict a dispatched role', () => {
    expect(sessionSnippetStatics.ward.indexOf('Ward must be fully green')).toBe(-1);
  });

  it('VALID: discover snippet => flags shell grep/find/sed as blocked and points to ToolSearch', () => {
    expect(sessionSnippetStatics.discover).toMatch(
      /^`discover` is the ONLY way to search this codebase\. Native Glob, Grep, Search, and Find tools — plus shell `grep`\/`find`\/`sed` — are blocked by hooks\. `discover` and `get-project-map` are MCP \*\*tools\*\*: load them via `ToolSearch`, never as shell commands or skills\.$/mu,
    );
  });
});
