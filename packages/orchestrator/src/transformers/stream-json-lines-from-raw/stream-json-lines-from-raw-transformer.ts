/**
 * PURPOSE: Turns the raw lines a JSONL file split into into branded stream lines, trimming each and
 * dropping the ones that are blank once trimmed. `readNonEmptyLines` keeps a whitespace-only line
 * and a padded one exactly as the file held them, so this is where a caller's own trim happens.
 *
 * USAGE:
 * streamJsonLinesFromRawTransformer({ rawLines: ['  {"type":"system"}  ', '   ', '{"type":"assistant"}'] });
 * // Returns ['{"type":"system"}', '{"type":"assistant"}'] as StreamJsonLine[]
 */

export const streamJsonLinesFromRawTransformer = ({
  rawLines,
}: {
  rawLines: readonly string[];
}): string[] =>
  rawLines
    .map((rawLine) => rawLine.trim())
    .filter((trimmed) => trimmed.length > 0)
    .map((trimmed) => trimmed);
