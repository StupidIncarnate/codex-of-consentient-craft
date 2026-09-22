import { recipesArgsContract } from './recipes-args-contract';
import { RecipesArgsStub } from './recipes-args.stub';

describe('recipesArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {isJson: true} => the JSON default parses', () => {
      const args = RecipesArgsStub({ isJson: true });

      const result = recipesArgsContract.parse(args);

      expect(result).toStrictEqual({ isJson: true });
    });

    it('VALID: {isJson: false} => the human-block form parses', () => {
      const args = RecipesArgsStub({ isJson: false });

      const result = recipesArgsContract.parse(args);

      expect(result).toStrictEqual({ isJson: false });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing isJson} => raises exactly one issue, scoped to isJson', () => {
      const result = recipesArgsContract.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['isJson'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "instanceId"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        recipesArgsContract.parse({
          isJson: true,
          instanceId: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
