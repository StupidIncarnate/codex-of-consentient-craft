import { resolveStaticStringLayerBroker } from './resolve-static-string-layer-broker';
import { resolveStaticStringLayerBrokerProxy } from './resolve-static-string-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('resolveStaticStringLayerBroker', () => {
  describe('string literal', () => {
    it('VALID: {node: Literal "git"} => returns "git"', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TsestreeStub({ type: TsestreeNodeType.Literal, value: 'git' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe('git');
    });

    it('INVALID: {node: Literal 42} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TsestreeStub({ type: TsestreeNodeType.Literal, value: 42 });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('template literal', () => {
    it('VALID: {node: a template literal, static leading segment "git "} => returns "git "', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.TemplateLiteral,
        quasis: [
          TsestreeStub({
            type: TsestreeNodeType.TemplateElement,
            value: { raw: 'git ', cooked: 'git ' },
          }),
        ],
        expressions: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'sub' })],
      });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe('git ');
    });

    it('EDGE: {node: a template literal with an empty leading quasi} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.TemplateLiteral,
        quasis: [
          TsestreeStub({ type: TsestreeNodeType.TemplateElement, value: { raw: '', cooked: '' } }),
        ],
        expressions: [TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'sub' })],
      });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('module-level const identifier', () => {
    it('VALID: {node: Identifier naming a same-module const string} => returns the const value', () => {
      resolveStaticStringLayerBrokerProxy();
      const moduleBody = [
        TsestreeStub({
          type: TsestreeNodeType.VariableDeclaration,
          kind: 'const',
          declarations: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclarator,
              id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'COMMAND' }),
              init: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'lsof' }),
            }),
          ],
        }),
      ];
      const node = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'COMMAND' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody })).toBe('lsof');
    });

    it('EMPTY: {node: Identifier with no matching module-level const} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'userConfig' });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('module-level const object property', () => {
    it('VALID: {node: lsofStatics.command, const lsofStatics = {command: "lsof"}} => returns "lsof"', () => {
      resolveStaticStringLayerBrokerProxy();
      const moduleBody = [
        TsestreeStub({
          type: TsestreeNodeType.VariableDeclaration,
          kind: 'const',
          declarations: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclarator,
              id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'lsofStatics' }),
              init: TsestreeStub({
                type: TsestreeNodeType.ObjectExpression,
                properties: [
                  TsestreeStub({
                    type: TsestreeNodeType.Property,
                    computed: false,
                    key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
                    value: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'lsof' }),
                  }),
                ],
              }),
            }),
          ],
        }),
      ];
      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        computed: false,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'lsofStatics' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
      });

      expect(resolveStaticStringLayerBroker({ node, moduleBody })).toBe('lsof');
    });

    it('VALID: {node: lsofStatics.command, const lsofStatics = {command: "lsof"} as const} => returns "lsof"', () => {
      resolveStaticStringLayerBrokerProxy();
      const moduleBody = [
        TsestreeStub({
          type: TsestreeNodeType.VariableDeclaration,
          kind: 'const',
          declarations: [
            TsestreeStub({
              type: TsestreeNodeType.VariableDeclarator,
              id: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'lsofStatics' }),
              init: TsestreeStub({
                type: TsestreeNodeType.TSAsExpression,
                expression: TsestreeStub({
                  type: TsestreeNodeType.ObjectExpression,
                  properties: [
                    TsestreeStub({
                      type: TsestreeNodeType.Property,
                      computed: false,
                      key: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
                      value: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'lsof' }),
                    }),
                  ],
                }),
              }),
            }),
          ],
        }),
      ];
      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        computed: false,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'lsofStatics' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
      });

      expect(resolveStaticStringLayerBroker({ node, moduleBody })).toBe('lsof');
    });

    it('INVALID: {node: userConfig.devCommand, object is not a module-level const object} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        computed: false,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'userConfig' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'devCommand' }),
      });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });

    it('EDGE: {node: computed member access} => returns undefined', () => {
      resolveStaticStringLayerBrokerProxy();
      const node = TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        computed: true,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'lsofStatics' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'command' }),
      });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });

  describe('imported statics object property', () => {
    const importedMember = TsestreeStub({
      type: TsestreeNodeType.MemberExpression,
      computed: false,
      object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'bundleStatics' }),
      property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'buildCommand' }),
    });
    const bundleImport = TsestreeStub({
      type: TsestreeNodeType.ImportDeclaration,
      source: TsestreeStub({
        type: TsestreeNodeType.Literal,
        value: '../../../statics/bundle/bundle-statics',
      }),
      specifiers: [
        TsestreeStub({
          type: TsestreeNodeType.ImportSpecifier,
          imported: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'bundleStatics' }),
          local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'bundleStatics' }),
        }),
      ],
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
      const node = TsestreeStub({ type: TsestreeNodeType.CallExpression });

      expect(resolveStaticStringLayerBroker({ node, moduleBody: [] })).toBe(undefined);
    });
  });
});
