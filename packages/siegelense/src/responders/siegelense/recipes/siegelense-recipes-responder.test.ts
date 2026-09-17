import { RecipeManifestStub } from '@dungeonmaster/siegelense-recipes/contracts';

import { RecipesAnswerStub } from '../../../contracts/recipes-answer/recipes-answer.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';

import { SiegelenseRecipesResponder } from './siegelense-recipes-responder';
import { SiegelenseRecipesResponderProxy } from './siegelense-recipes-responder.proxy';

describe('SiegelenseRecipesResponder', () => {
  describe('an empty book', () => {
    it('EMPTY: {human: false, no recipes} => writes the empty RecipesAnswer as one JSON document', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const answer = RecipesAnswerStub({ recipes: [] });
      proxy.stageAnswer({ answer });

      await SiegelenseRecipesResponder({ human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('EMPTY: {human: true, no recipes} => writes the "no recipes yet" sentence, which is a real answer', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      proxy.stageAnswer({ answer: RecipesAnswerStub({ recipes: [] }) });

      await SiegelenseRecipesResponder({ human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'No recipes yet — packages/siegelense-recipes/ holds none. Adding one lists it here.\n',
      ]);
    });
  });

  describe('the two declared recipes', () => {
    it('VALID: {human: false} => writes both manifests as one JSON document, produces: and fidelity included', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const answer = RecipesAnswerStub({
        recipes: [
          RecipeManifestStub({
            name: 'guild-with-three-quests',
            produces: 'one guild holding three quests, one in_progress',
            fidelity: 'production',
            mirrors: null,
            parameters: [],
            returns: [{ name: 'guildId', description: 'the seeded guild' }],
          }),
          RecipeManifestStub({
            name: 'session-with-nested-subagent',
            produces:
              'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
            fidelity: 'direct',
            mirrors: 'the Claude CLI session JSONL writer',
            parameters: [{ name: 'guild', description: 'the guild', required: true }],
            returns: [{ name: 'sessions.nested', description: 'the nested chain route' }],
          }),
        ],
      });
      proxy.stageAnswer({ answer });

      await SiegelenseRecipesResponder({ human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {human: true} => writes one block per recipe, each carrying its own produces: text and fidelity', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      proxy.stageAnswer({
        answer: RecipesAnswerStub({
          recipes: [
            RecipeManifestStub({
              name: 'guild-with-three-quests',
              produces: 'one guild holding three quests, one in_progress',
              fidelity: 'production',
              mirrors: null,
              parameters: [],
              returns: [
                { name: 'guildId', description: 'the seeded guild' },
                { name: 'guildSlug', description: 'the route segment' },
                { name: 'questId', description: 'the in_progress one' },
              ],
            }),
            RecipeManifestStub({
              name: 'session-with-nested-subagent',
              produces:
                'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
              fidelity: 'direct',
              mirrors: 'the Claude CLI session JSONL writer',
              parameters: [{ name: 'guild', description: 'the guild', required: true }],
              returns: [
                { name: 'sessionId', description: 'the session' },
                { name: 'sessions.outer', description: 'the outer chain route' },
                { name: 'sessions.nested', description: 'the nested chain route' },
              ],
            }),
          ],
        }),
      });

      await SiegelenseRecipesResponder({ human: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        'guild-with-three-quests\n' +
          '  produces: one guild holding three quests, one in_progress\n' +
          '  fidelity: production — none; this is the honest one\n' +
          '  returns:  guildId, guildSlug, questId\n' +
          '\n' +
          'session-with-nested-subagent\n' +
          '  produces: one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished\n' +
          '  fidelity: direct — it can drift from what production actually writes\n' +
          '  mirrors:  the Claude CLI session JSONL writer\n' +
          '  takes:    guild (required)\n' +
          '  returns:  sessionId, sessions.outer, sessions.nested\n',
      ]);
    });

    it('VALID: {human: false} => answers success without starting anything', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      proxy.stageAnswer({ answer: RecipesAnswerStub({ recipes: [] }) });

      const result = await SiegelenseRecipesResponder({ human: false });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
