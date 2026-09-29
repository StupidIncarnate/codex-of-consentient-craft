import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { ImportExpressionStub } from '#gateway/npm/typescript-eslint__utils/import-expression/import-expression.stub';
import { isJsonParseOrDynamicImportCallLayerBroker } from './is-json-parse-or-dynamic-import-call-layer-broker';
import { isJsonParseOrDynamicImportCallLayerBrokerProxy } from './is-json-parse-or-dynamic-import-call-layer-broker.proxy';

describe('isJsonParseOrDynamicImportCallLayerBroker', () => {
  it('VALID: {node: a JSON.parse(...) call} => returns true', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = CallExpressionStub({ code: 'JSON.parse();' });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(true);
  });

  it('VALID: {node: an import(...) expression} => returns true', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = ImportExpressionStub({ code: "import('x');" });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(true);
  });

  it('INVALID: {node: a different member call, JSON.stringify} => returns false', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = CallExpressionStub({ code: 'JSON.stringify();' });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(false);
  });

  it('INVALID: {node: a bare function call, unrelated to JSON or import} => returns false', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();
    const node = CallExpressionStub({ code: 'fetchJson();' });

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    isJsonParseOrDynamicImportCallLayerBrokerProxy();

    expect(isJsonParseOrDynamicImportCallLayerBroker({ node: undefined })).toBe(false);
  });
});
