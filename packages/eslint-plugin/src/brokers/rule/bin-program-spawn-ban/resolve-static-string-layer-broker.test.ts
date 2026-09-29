import { TemplateLiteralStub } from '#gateway/npm/typescript-eslint__utils/template-literal/template-literal.stub';
import { LiteralStub } from '#gateway/npm/typescript-eslint__utils/literal/literal.stub';
import { VariableDeclarationStub } from '#gateway/npm/typescript-eslint__utils/variable-declaration/variable-declaration.stub';
import { IdentifierStub } from '#gateway/npm/typescript-eslint__utils/identifier/identifier.stub';
import { MemberExpressionStub } from '#gateway/npm/typescript-eslint__utils/member-expression/member-expression.stub';
import { ImportDeclarationStub } from '#gateway/npm/typescript-eslint__utils/import-declaration/import-declaration.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { resolveStaticStringLayerBroker } from './resolve-static-string-layer-broker';
import { resolveStaticStringLayerBrokerProxy } from './resolve-static-string-layer-broker.proxy';

describe('resolveStaticStringLayerBroker', () => {
  describe('string literal', () => {
    it('VALID: {node: Literal "git"} => returns "git"', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = LiteralStub({ code: 'const l = "git";' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe('git');
    });

    it('INVALID: {node: Literal 42} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = LiteralStub({ code: 'const l = 42;' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('template literal', () => {
    it('VALID: {node: a template literal, static leading segment "git "} => returns "git "', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TemplateLiteralStub({ code: `const t = \`git \${sub}\`;` });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe('git ');
    });

    it('EDGE: {node: a template literal with an empty leading quasi} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TemplateLiteralStub({ code: `const t = \`\${sub}\`;` });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('module-level const identifier', () => {
    it('VALID: {node: Identifier naming a same-module const string} => returns the const value', () => {
      resolveStaticStringLayerBrokerProxy();
      const moduleBody = [VariableDeclarationStub({ code: 'const COMMAND = "lsof";' })];
      const node = IdentifierStub({ code: 'COMMAND;' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody })).toBe('lsof');
    });

    it('EMPTY: {node: Identifier with no matching module-level const} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = IdentifierStub({ code: 'userConfig;' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('module-level const object property', () => {
    it('VALID: {node: lsofStatics.command, const lsofStatics = {command: "lsof"}} => returns "lsof"', () => {
      resolveStaticStringLayerBrokerProxy();
      const moduleBody = [
        VariableDeclarationStub({ code: 'const lsofStatics = { command: "lsof" };' }),
      ];
      const node = MemberExpressionStub({ code: 'lsofStatics.command;' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody })).toBe('lsof');
    });

    it('VALID: {node: lsofStatics.command, const lsofStatics = {command: "lsof"} as const} => returns "lsof"', () => {
      resolveStaticStringLayerBrokerProxy();
      const moduleBody = [
        VariableDeclarationStub({ code: 'const lsofStatics = { command: "lsof" } as unknown;' }),
      ];
      const node = MemberExpressionStub({ code: 'lsofStatics.command;' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody })).toBe('lsof');
    });

    it('INVALID: {node: userConfig.devCommand, object is not a module-level const object} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = MemberExpressionStub({ code: 'userConfig.devCommand;' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });

    it('EDGE: {node: computed member access} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = MemberExpressionStub({ code: 'lsofStatics[command];' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('imported statics object property', () => {
    const importedMember = MemberExpressionStub({ code: 'bundleStatics.buildCommand;' });
    const bundleImport = ImportDeclarationStub({
      code: 'import { bundleStatics } from "../../../statics/bundle/bundle-statics";',
    });

    it('VALID: {bundleStatics.buildCommand, imported from a relative path, filename given} => returns the statics file value', () => {
      const proxy = resolveStaticStringLayerBrokerProxy();
      proxy.setupImportedFile({
        path: '/repo/packages/ward/src/statics/bundle/bundle-statics.ts',
        contents: "export const bundleStatics = { buildCommand: 'npm' } as const;",
      });

      expect(
        resolveStaticStringLayerBroker({
          node: importedMember,
          moduleBody: [bundleImport],
          filename: '/repo/packages/ward/src/brokers/bundle/build/bundle-build-broker.ts',
        }),
      ).toBe('npm');
    });

    it('EMPTY: {imported object, no filename} => returns undefined without reading a file', () => {
      resolveStaticStringLayerBrokerProxy();

      expect(
        resolveStaticStringLayerBroker({ node: importedMember, moduleBody: [bundleImport] }),
      ).toBe(undefined);
    });
  });

  describe('unresolvable node shapes', () => {
    it('EMPTY: {node: undefined} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();

      expect(resolveStaticStringLayerBroker({ node: undefined, moduleBody: [] })).toBe(undefined);
    });

    it('INVALID: {node: CallExpression, a runtime-computed value} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = CallExpressionStub({ code: 'f();' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });
});
