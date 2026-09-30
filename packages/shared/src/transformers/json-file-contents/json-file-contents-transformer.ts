/**
 * PURPOSE: Serializes a value the way every JSON file this repo commits is formatted — 2-space
 * indent, ending in exactly one trailing newline. Reach for this over a bare `JSON.stringify` call
 * in any install-time writer (`package.json`, `.dungeonmaster.json`, `.mcp.json`,
 * `.claude/settings.json`, `.agents/*.json`): a bare `JSON.stringify` never ends its output in a
 * newline, so a consumer re-running `dungeonmaster init` got a file whose last line merged with the
 * shell prompt and whose diff against the previous run showed the whole file changed.
 *
 * USAGE:
 * const contents = jsonFileContentsTransformer({ value: updatedPackageJson });
 * // Returns branded FileContents: `${JSON.stringify(value, null, 2)}\n`
 */


const JSON_FILE_INDENT_SPACES = 2;

export const jsonFileContentsTransformer = ({ value }: { value: unknown }): string =>
  `${JSON.stringify(value, null, JSON_FILE_INDENT_SPACES)}\n`;
