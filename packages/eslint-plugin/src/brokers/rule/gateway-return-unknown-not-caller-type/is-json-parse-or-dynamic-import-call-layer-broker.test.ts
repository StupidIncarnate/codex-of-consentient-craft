import { isJsonParseOrDynamicImportCallLayerBroker } from './is-json-parse-or-dynamic-import-call-layer-broker';
import { isJsonParseOrDynamicImportCallLayerBrokerProxy } from './is-json-parse-or-dynamic-import-call-layer-broker.proxy';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('isJsonParseOrDynamicImportCallLayerBroker', () => {
  it('VALID: {node: a JSON.parse(...) call} => returns true', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'JSON' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'parse' }),
      }),
    });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(true);
  });

  it('VALID: {node: an import(...) expression} => returns true', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = TsestreeStub({ type: TsestreeNodeType.ImportExpression });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(true);
  });

  it('INVALID: {node: a different member call, JSON.stringify} => returns false', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({
        type: TsestreeNodeType.MemberExpression,
        object: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'JSON' }),
        property: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'stringify' }),
      }),
    });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(false);
  });

  it('INVALID: {node: a bare function call, unrelated to JSON or import} => returns false', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = TsestreeStub({
      type: TsestreeNodeType.CallExpression,
      callee: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'fetchJson' }),
    });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node: undefined })).toBe(false);
  });
});
