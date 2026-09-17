import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
import { agentsRulesCreatorTransformer } from './agents-rules-creator-transformer';

describe('agentsRulesCreatorTransformer', () => {
  it('VALID: creates rules markdown => starts with header and includes all active snippets', () => {
    const result = agentsRulesCreatorTransformer();

    expect(result.startsWith('# Dungeonmaster Operating Rules\n\n')).toBe(true);

    const activeSnippets = Object.values(sessionSnippetStatics).filter(
      (snippet): snippet is string => typeof snippet === 'string',
    );

    const expected = `# Dungeonmaster Operating Rules\n\n${activeSnippets.join('\n\n---\n\n')}\n`;

    expect(result).toBe(expected);
  });
});
