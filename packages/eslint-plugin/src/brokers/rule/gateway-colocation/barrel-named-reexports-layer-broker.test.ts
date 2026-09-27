import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { barrelNamedReexportsLayerBroker } from './barrel-named-reexports-layer-broker';
import { barrelNamedReexportsLayerBrokerProxy } from './barrel-named-reexports-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('barrelNamedReexportsLayerBroker', () => {
  it('VALID: {one named re-export with a source} => returns its name and source', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const exportName = IdentifierStub({ value: 'readFileSync' });
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportNamedDeclaration,
          source: TsestreeStub({
            type: TsestreeNodeType.Literal,
            value: './read-file-sync/read-file-sync',
          }),
          specifiers: [
            TsestreeStub({
              type: TsestreeNodeType.ExportSpecifier,
              local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: exportName }),
              exported: TsestreeStub({ type: TsestreeNodeType.Identifier, name: exportName }),
            }),
          ],
        }),
      ],
    });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([
      { name: 'readFileSync', source: './read-file-sync/read-file-sync' },
    ]);
  });

  it('VALID: {renamed re-export} => returns the exported-as name, not the local name', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const localName = IdentifierStub({ value: 'internalName' });
    const exportName = IdentifierStub({ value: 'readFile' });
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportNamedDeclaration,
          source: TsestreeStub({ type: TsestreeNodeType.Literal, value: './internal' }),
          specifiers: [
            TsestreeStub({
              type: TsestreeNodeType.ExportSpecifier,
              local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: localName }),
              exported: TsestreeStub({ type: TsestreeNodeType.Identifier, name: exportName }),
            }),
          ],
        }),
      ],
    });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([{ name: 'readFile', source: './internal' }]);
  });

  it('EMPTY: {export * from a bare specifier, no specifiers} => returns an empty array', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportAllDeclaration,
        }),
      ],
    });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {a named export with no source} => returns an empty array', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportNamedDeclaration,
          source: null,
          declaration: TsestreeStub({ type: TsestreeNodeType.VariableDeclaration }),
        }),
      ],
    });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {body is undefined} => returns an empty array', () => {
    barrelNamedReexportsLayerBrokerProxy();
    const node = TsestreeStub({ type: TsestreeNodeType.Program, body: undefined });

    const result = barrelNamedReexportsLayerBroker({ node });

    expect(result).toStrictEqual([]);
  });
});
