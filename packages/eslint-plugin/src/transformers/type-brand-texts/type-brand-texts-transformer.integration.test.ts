import { Linter } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import { ESLintUtils } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { typeBrandTextsTransformer } from './type-brand-texts-transformer';

// Real ESLint + real TypeScript program, like typedReturnIsVoidLikeTransformer's test: the brand
// names only exist on a type the checker resolved, so each case declares `probe` with a type built
// from real zod schemas and reads the type the checker gives that declaration. The filename is this
// package's own src/index.ts, a real file under a real tsconfig, with no `..` for
// `parserOptions.project: true` to walk.
const REAL_FILE = `${__dirname.replace('/transformers/type-brand-texts', '')}/index.ts`;

describe('typeBrandTextsTransformer', () => {
  it.each([
    [
      'VALID: {branded string} => [its name]',
      "const c = z.string().brand<'WorkItemId'>(); declare const probe: z.infer<typeof c>;",
      ['WorkItemId'],
    ],
    [
      'VALID: {branded number} => [its name]',
      "const c = z.number().brand<'Attempts'>(); declare const probe: z.infer<typeof c>;",
      ['Attempts'],
    ],
    [
      'VALID: {branded object} => [its name]',
      "const c = z.object({ a: z.string() }).brand<'Quest'>(); declare const probe: z.infer<typeof c>;",
      ['Quest'],
    ],
    [
      'VALID: {branded twice} => [both names]',
      "const c = z.string().brand<'Inner'>().brand<'Outer'>(); declare const probe: z.infer<typeof c>;",
      ['Inner', 'Outer'],
    ],
    [
      'VALID: {brand or undefined} => [the brand]',
      "const c = z.string().brand<'WorkItemId'>(); declare const probe: z.infer<typeof c> | undefined;",
      ['WorkItemId'],
    ],
    [
      'VALID: {two different brands in a union} => [both names]',
      "const a = z.string().brand<'First'>(); const b = z.string().brand<'Second'>(); declare const probe: z.infer<typeof a> | z.infer<typeof b>;",
      ['First', 'Second'],
    ],
    [
      'VALID: {union members sharing a brand} => [the brand once]',
      "const a = z.string().brand<'Same'>(); declare const probe: z.infer<typeof a> | (z.infer<typeof a> & { extra: true });",
      ['Same'],
    ],
    ['EMPTY: {plain string} => []', 'declare const probe: string;', []],
    ['EMPTY: {string literal} => []', "declare const probe: 'literal';", []],
    ['EMPTY: {plain object} => []', 'declare const probe: { id: string };', []],
  ])('%s', (_name, body, expected) => {
    const found: ReturnType<typeof typeBrandTextsTransformer>[] = [];
    const linter = new Linter({ configType: 'flat' });

    linter.verify(
      `import { z } from '#gateway/npm/zod'; ${body}`,
      {
        files: ['**/*.ts'],
        languageOptions: {
          parser: tsParser,
          parserOptions: { ecmaVersion: 2020, sourceType: 'module', project: true },
        },
        plugins: {
          probe: {
            rules: {
              x: {
                create: (context: unknown) => ({
                  VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
                    const services = ESLintUtils.getParserServices(
                      context as Readonly<TSESLint.RuleContext<never, never[]>>,
                    );
                    found.push(
                      typeBrandTextsTransformer({
                        checker: services.program.getTypeChecker(),
                        type: services.getTypeAtLocation(node.id),
                      }),
                    );
                  },
                }),
              },
            },
          },
        },
        rules: { 'probe/x': 'error' },
      },
      { filename: REAL_FILE },
    );

    // every declarator in the snippet is read; the one named `probe` is always last
    expect(found.at(-1)).toStrictEqual(expected);
  });
});
