import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { agentsRulesCreatorTransformer } from './agents-rules-creator-transformer';

describe('agentsRulesCreatorTransformer', () => {
  it('VALID: creates rules markdown => starts with header and includes transformed snippets without sleep on ward', () => {
    const result = agentsRulesCreatorTransformer();

    const activeSnippets = Object.values(sessionSnippetStatics)
      .filter((snippet): snippet is NonNullable<typeof snippet> => snippet !== null)
      .map((snippet) =>
        snippet.replaceAll(
          '**Never `sleep` on a ward run, and never `tail` its output file.**',
          "**Never `tail` ward's output.**",
        ),
      );

    const expected = `# Dungeonmaster Operating Rules\n\n${activeSnippets.join('\n\n---\n\n')}\n`;

    expect(result).toBe(expected);
  });
});
