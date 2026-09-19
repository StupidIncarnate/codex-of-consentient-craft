import { recipeManifestContract } from './recipe-manifest-contract';
import { RecipeManifestStub } from './recipe-manifest.stub';

describe('recipeManifestContract', () => {
  describe('valid manifests', () => {
    it('VALID: {a production recipe with no parameters} => round-trips whole', () => {
      const manifest = RecipeManifestStub({
        name: 'guild-with-three-quests',
        produces: 'one guild holding three quests, one in_progress',
        fidelity: 'production',
        mirrors: null,
        parameters: [],
        returns: [
          { name: 'guildId', description: 'the seeded guild' },
          { name: 'guildSlug', description: 'the guild route segment' },
        ],
      });

      const result = recipeManifestContract.parse(manifest);

      expect(result).toStrictEqual({
        name: 'guild-with-three-quests',
        produces: 'one guild holding three quests, one in_progress',
        fidelity: 'production',
        mirrors: null,
        parameters: [],
        returns: [
          { name: 'guildId', description: 'the seeded guild' },
          { name: 'guildSlug', description: 'the guild route segment' },
        ],
      });
    });

    it('VALID: {a direct recipe naming its mirrors and one required parameter} => round-trips whole', () => {
      const manifest = RecipeManifestStub({
        name: 'session-with-nested-subagent',
        produces: 'one session transcript holding an outer sub-agent chain',
        fidelity: 'direct',
        mirrors: 'the Claude CLI session JSONL writer',
        parameters: [
          { name: 'guild', description: 'the guild the transcript belongs to', required: true },
        ],
        returns: [{ name: 'sessions.nested', description: 'the nested chain route' }],
      });

      const result = recipeManifestContract.parse(manifest);

      expect(result).toStrictEqual({
        name: 'session-with-nested-subagent',
        produces: 'one session transcript holding an outer sub-agent chain',
        fidelity: 'direct',
        mirrors: 'the Claude CLI session JSONL writer',
        parameters: [
          { name: 'guild', description: 'the guild the transcript belongs to', required: true },
        ],
        returns: [{ name: 'sessions.nested', description: 'the nested chain route' }],
      });
    });
  });

  describe('the mirrors pairing', () => {
    it("INVALID: {fidelity: 'direct', mirrors: null} => raises one issue on mirrors naming the drift it cannot bound", () => {
      const result = recipeManifestContract.safeParse({
        name: 'session-with-nested-subagent',
        produces: 'one session transcript',
        fidelity: 'direct',
        mirrors: null,
        parameters: [],
        returns: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'custom',
          path: ['mirrors'],
          message:
            "fidelity 'direct' must declare mirrors — name the production writer whose shape it copied, or every diagnosis opens with a hunt for it",
        },
      ]);
    });

    it("INVALID: {fidelity: 'production', mirrors: 'questPersistBroker'} => raises one issue on mirrors, because a real code path has nothing to drift from", () => {
      const result = recipeManifestContract.safeParse({
        name: 'guild-with-three-quests',
        produces: 'one guild holding three quests',
        fidelity: 'production',
        mirrors: 'questPersistBroker',
        parameters: [],
        returns: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'custom',
          path: ['mirrors'],
          message:
            "mirrors belongs only to fidelity 'direct' — a recipe built by calling the real code path has no counterpart to drift from",
        },
      ]);
    });
  });

  describe('invalid manifests', () => {
    it('EMPTY: {produces: ""} => throws, because a listing with no claim is a name and nothing else', () => {
      expect(() =>
        recipeManifestContract.parse({
          name: 'guild-with-three-quests',
          produces: '',
          fidelity: 'production',
          mirrors: null,
          parameters: [],
          returns: [],
        }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {missing produces} => raises exactly one issue, scoped to produces', () => {
      const result = recipeManifestContract.safeParse({
        name: 'guild-with-three-quests',
        fidelity: 'production',
        mirrors: null,
        parameters: [],
        returns: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['produces'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "selector"} => throws Unrecognized key, so no DOM handle can be smuggled onto a recipe', () => {
      expect(() =>
        recipeManifestContract.parse({
          name: 'guild-with-three-quests',
          produces: 'one guild holding three quests',
          fidelity: 'production',
          mirrors: null,
          parameters: [],
          returns: [],
          selector: '[data-testid="PIXEL_BTN"]',
        }),
      ).toThrow(/Unrecognized key/u);
    });

    it('INVALID: {a parameter missing required} => raises exactly one issue, scoped to that parameter', () => {
      const result = recipeManifestContract.safeParse({
        name: 'session-with-nested-subagent',
        produces: 'one session transcript',
        fidelity: 'direct',
        mirrors: 'the Claude CLI session JSONL writer',
        parameters: [{ name: 'guild', description: 'the guild' }],
        returns: [],
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['parameters', 0, 'required'],
          message: 'Required',
        },
      ]);
    });
  });
});
