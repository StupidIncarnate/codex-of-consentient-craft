/**
 * PURPOSE: Combines all active session snippets from sessionSnippetStatics into a single markdown
 * rules file for Antigravity (.agents/rules/dungeonmaster-rules.md)
 *
 * USAGE:
 * const markdown = agentsRulesCreatorTransformer();
 * // Returns: '# Dungeonmaster Operating Rules\n\n## discover Tool\n...'
 *
 * CONTRACTS: Output: FileContents (branded string)
 */

import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';

export const agentsRulesCreatorTransformer = (): string => {
  const activeSnippets = Object.values(sessionSnippetStatics).filter(
    (snippet): snippet is NonNullable<typeof snippet> => snippet !== null,
  );

  const markdown = `# Dungeonmaster Operating Rules\n\n${activeSnippets.join('\n\n---\n\n')}\n`;

  return markdown;
};
