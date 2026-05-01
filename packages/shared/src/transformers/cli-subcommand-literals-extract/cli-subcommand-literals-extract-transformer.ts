/**
 * PURPOSE: Extracts CLI subcommand string literals from startup source text by matching
 * `args[0] === 'cmd'` and `case 'cmd':` patterns via regex.
 *
 * USAGE:
 * const cmds = cliSubcommandLiteralsExtractTransformer({ source: contentTextContract.parse(src) });
 * // Returns ['run', 'list', 'detail'] as ContentText[] for a startup file dispatching on args[0]
 *
 * WHEN-TO-USE: cli-tool headline renderer extracting subcommand literals from startup source
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

// Matches: args[0] === 'run'  OR  args[0] === "run"  OR  case 'run':  OR  case "run":
const SUBCOMMAND_LITERAL_PATTERN =
  /(?:args\[0\]\s*===?\s*['"](\w[\w-]*)['"]|case\s+['"](\w[\w-]*)['"])/gu;

export const cliSubcommandLiteralsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const literals: ContentText[] = [];
  SUBCOMMAND_LITERAL_PATTERN.lastIndex = 0;
  let match = SUBCOMMAND_LITERAL_PATTERN.exec(String(source));
  while (match !== null) {
    const captured = match[1] ?? match[2];
    if (captured !== undefined) {
      const parsed = contentTextContract.parse(captured);
      const alreadySeen = literals.some((l) => String(l) === String(parsed));
      if (!alreadySeen) {
        literals.push(parsed);
      }
    }
    match = SUBCOMMAND_LITERAL_PATTERN.exec(String(source));
  }
  return literals;
};
