import { z } from 'zod';
import { ingredientConfigContract } from './ingredient-config-contract';
import { IngredientConfigStub } from './ingredient-config.stub';

describe('ingredientConfigContract', () => {
  describe('valid ingredients', () => {
    it('VALID: {the whole quest ingredient} => returns every declared property', () => {
      const fields = z.object({ title: z.string().brand<'QuestFieldTitle'>() });
      const record = z.object({ id: z.string().brand<'QuestRecordId'>() });
      const write = (): unknown => undefined;
      const reach = (): unknown => undefined;
      const advanceOneStepArgs = z.object({ steps: z.number().brand<'StepCount'>() });
      const advanceOneStepApply = (): unknown => undefined;

      const result = IngredientConfigStub({
        name: 'quest',
        description: 'one quest under a guild, at whatever status you set it to',
        fields,
        record,
        links: [{ of: 'guild', as: 'guildId' }],
        transitions: { field: 'status', to: ['created', 'approved'], reach },
        routes: { write },
        copies: 'questPersistBroker',
        extras: { advanceOneStep: { args: advanceOneStepArgs, apply: advanceOneStepApply } },
      });

      expect(result).toStrictEqual({
        name: 'quest',
        description: 'one quest under a guild, at whatever status you set it to',
        fields,
        record,
        links: [{ of: 'guild', as: 'guildId' }],
        transitions: { field: 'status', to: ['created', 'approved'], reach },
        routes: { write },
        copies: 'questPersistBroker',
        extras: { advanceOneStep: { args: advanceOneStepArgs, apply: advanceOneStepApply } },
      });
    });

    it('VALID: {no extras key at all} => parses without an extras key', () => {
      const fields = z.object({ title: z.string().brand<'QuestFieldTitle'>() });
      const record = z.object({ id: z.string().brand<'QuestRecordId'>() });
      const write = (): unknown => undefined;

      const result = ingredientConfigContract.parse({
        name: 'quest',
        description: 'one quest under a guild',
        fields,
        record,
        routes: { write },
        copies: 'questPersistBroker',
      });

      expect(result).toStrictEqual({
        name: 'quest',
        description: 'one quest under a guild',
        fields,
        record,
        routes: { write },
        copies: 'questPersistBroker',
      });
    });
  });

  describe('invalid ingredients', () => {
    it('INVALID: {no description} => throws Required', () => {
      expect(() =>
        ingredientConfigContract.parse({
          name: 'quest',
          fields: z.object({}),
          record: z.object({}),
          routes: { write: (): unknown => undefined },
          copies: 'questPersistBroker',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {extras: {set: {args, apply}}} => throws naming the reserved verb', () => {
      expect(() =>
        IngredientConfigStub({
          extras: { set: { args: z.object({}), apply: (): unknown => undefined } },
        }),
      ).toThrow(/'set' is a reserved verb and cannot be declared as an extra/u);
    });

    it('INVALID: {extras: {advanceOneStep: {args}}, no apply} => throws naming the missing apply function', () => {
      expect(() =>
        IngredientConfigStub({
          extras: { advanceOneStep: { args: z.object({}) } },
        }),
      ).toThrow(/Expected an extra apply function/u);
    });

    it('INVALID: {extras: {advanceOneStep: a bare zod schema}} => throws, the old shape no longer parses', () => {
      expect(() =>
        IngredientConfigStub({
          extras: { advanceOneStep: z.object({ steps: z.number().brand<'StepCount'>() }) as never },
        }),
      ).toThrow(/Expected a zod schema/u);
    });

    it("INVALID: {routes: {write}, no copies} => throws naming 'copies'", () => {
      expect(() =>
        ingredientConfigContract.parse({
          name: 'quest',
          description: 'one quest under a guild',
          fields: z.object({}),
          record: z.object({}),
          routes: { write: (): unknown => undefined },
        }),
      ).toThrow(/declares a 'write' route and must declare 'copies'/u);
    });
  });
});
