import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { ObjectExpressionStub } from '#gateway/npm/typescript-eslint__utils/object-expression/object-expression.stub';

import { selfLocatedRepoLookupStatics } from '../../statics/self-located-repo-lookup/self-located-repo-lookup-statics';
import { isSelfLocatedExpressionGuard } from './is-self-located-expression-guard';

type AstNode = ReturnType<typeof CallExpressionStub> | ReturnType<typeof IdentifierStub>;

describe('isSelfLocatedExpressionGuard', () => {
  describe('missing node', () => {
    it('EMPTY: {} => returns false', () => {
      expect(isSelfLocatedExpressionGuard({})).toBe(false);
    });

    it('EMPTY: {node: null} => returns false', () => {
      expect(isSelfLocatedExpressionGuard({ node: null })).toBe(false);
    });
  });

  describe('module-location names', () => {
    it.each(selfLocatedRepoLookupStatics.selfLocationIdentifiers)(
      'VALID: {node: %s} => returns true',
      (name) => {
        expect(isSelfLocatedExpressionGuard({ node: IdentifierStub({ code: `${name};` }) })).toBe(
          true,
        );
      },
    );

    it('VALID: {node: import.meta.url} => returns true', () => {
      expect(
        isSelfLocatedExpressionGuard({ node: MemberExpressionStub({ code: 'import.meta.url;' }) }),
      ).toBe(true);
    });

    it('VALID: {node: resolve(__dirname, "..")} => returns true', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: CallExpressionStub({ code: "resolve(__dirname, '..');" }),
        }),
      ).toBe(true);
    });

    it('VALID: {node: { startDir: __dirname }} => returns true', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: ObjectExpressionStub({ code: 'f({ startDir: __dirname });' }),
        }),
      ).toBe(true);
    });
  });

  describe('a name used as a label', () => {
    it('VALID: {node: { __dirname: startDir }} => returns false', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: ObjectExpressionStub({ code: 'f({ __dirname: startDir });' }),
        }),
      ).toBe(false);
    });

    it('VALID: {node: paths.__dirname} => returns false', () => {
      expect(
        isSelfLocatedExpressionGuard({ node: MemberExpressionStub({ code: 'paths.__dirname;' }) }),
      ).toBe(false);
    });

    it('VALID: {node: paths[__dirname]} => returns true', () => {
      expect(
        isSelfLocatedExpressionGuard({ node: MemberExpressionStub({ code: 'paths[__dirname];' }) }),
      ).toBe(true);
    });
  });

  describe('a value from the input', () => {
    it('VALID: {node: dirname(filename)} => returns false', () => {
      expect(
        isSelfLocatedExpressionGuard({ node: CallExpressionStub({ code: 'dirname(filename);' }) }),
      ).toBe(false);
    });

    it('VALID: {node: { startPath: cwd(), kind: "repo-root" }} => returns false', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: ObjectExpressionStub({ code: "f({ startPath: cwd(), kind: 'repo-root' });" }),
        }),
      ).toBe(false);
    });
  });

  describe('a same-file variable', () => {
    it('VALID: {node: ownDir, ownDir = dirname(__filename)} => returns true', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: IdentifierStub({ code: 'ownDir;' }),
          declarations: new Map([['ownDir', CallExpressionStub({ code: 'dirname(__filename);' })]]),
        }),
      ).toBe(true);
    });

    it('VALID: {node: rootDir, rootDir = join(ownDir), ownDir = __dirname} => returns true', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: IdentifierStub({ code: 'rootDir;' }),
          declarations: new Map<string, AstNode>([
            ['rootDir', CallExpressionStub({ code: 'join(ownDir);' })],
            ['ownDir', IdentifierStub({ code: '__dirname;' })],
          ]),
        }),
      ).toBe(true);
    });

    it('VALID: {node: fileDir, fileDir = dirname(filename)} => returns false', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: IdentifierStub({ code: 'fileDir;' }),
          declarations: new Map([['fileDir', CallExpressionStub({ code: 'dirname(filename);' })]]),
        }),
      ).toBe(false);
    });

    it('EDGE: {node: a, a = b, b = a} => returns false', () => {
      expect(
        isSelfLocatedExpressionGuard({
          node: IdentifierStub({ code: 'a;' }),
          declarations: new Map([
            ['a', IdentifierStub({ code: 'b;' })],
            ['b', IdentifierStub({ code: 'a;' })],
          ]),
        }),
      ).toBe(false);
    });
  });
});
