import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { checkSchemaBrandTextLayerBroker } from './check-schema-brand-text-layer-broker';
import { checkSchemaBrandTextLayerBrokerProxy } from './check-schema-brand-text-layer-broker.proxy';

describe('checkSchemaBrandTextLayerBroker', () => {
  describe('z.instanceof receiver', () => {
    it('VALID: {brand: #GatewayChildProcess for z.instanceof(ChildProcess)} => reports nothing', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({
        code: 'z.instanceof(ChildProcess).brand<"#GatewayChildProcess">();',
      });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: {brand: #GatewayWrongName for z.instanceof(ChildProcess)} => reports wrongBrandText', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({
        code: 'z.instanceof(ChildProcess).brand<"#GatewayWrongName">();',
      });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'wrongBrandText',
        data: { brandText: '#GatewayWrongName', expectedBrandText: '#GatewayChildProcess' },
      });
    });
  });

  describe('z.custom receiver', () => {
    it('VALID: {brand: #GatewayWalkedFile for z.custom<WalkedFile>(fn)} => reports nothing', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({
        code: 'z.custom<WalkedFile>(() => {}).brand<"#GatewayWalkedFile">();',
      });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });

    it('INVALID: {brand: #GatewayWrongName for z.custom<WalkedFile>(fn)} => reports wrongBrandText', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({
        code: 'z.custom<WalkedFile>(() => {}).brand<"#GatewayWrongName">();',
      });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledWith({
        node,
        messageId: 'wrongBrandText',
        data: { brandText: '#GatewayWrongName', expectedBrandText: '#GatewayWalkedFile' },
      });
    });
  });

  describe('unrecognized receiver shape', () => {
    it('EMPTY: {.brand() chained off a plain function call, not instanceof/custom} => reports nothing', () => {
      checkSchemaBrandTextLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = CallExpressionStub({ code: 'z.string().brand<"AnyText">();' });

      checkSchemaBrandTextLayerBroker({ node, context });

      expect(mockReport).toHaveBeenCalledTimes(0);
    });
  });
});
