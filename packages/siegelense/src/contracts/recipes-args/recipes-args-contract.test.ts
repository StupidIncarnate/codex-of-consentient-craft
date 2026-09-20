import { recipesArgsContract } from './recipes-args-contract';
import { RecipesArgsStub } from './recipes-args.stub';

describe('recipesArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {human: false} => the JSON default parses', () => {
      const args = RecipesArgsStub({ human: false });

      const result = recipesArgsContract.parse(args);

      expect(result).toStrictEqual({ human: false });
    });

    it('VALID: {human: true} => the human-block form parses', () => {
      const args = RecipesArgsStub({ human: true });

      const result = recipesArgsContract.parse(args);

      expect(result).toStrictEqual({ human: true });
    });
  });

  describe('invalid args', () => {
    it('INVALID: {missing human} => raises exactly one issue, scoped to human', () => {
      const result = recipesArgsContract.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'boolean',
          received: 'undefined',
          path: ['human'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "instanceId"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        recipesArgsContract.parse({
          human: false,
          instanceId: 'inst_7f3a9c21',
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
