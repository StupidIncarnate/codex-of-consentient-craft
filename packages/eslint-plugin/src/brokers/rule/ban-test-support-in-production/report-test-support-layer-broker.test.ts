import { reportTestSupportLayerBroker } from './report-test-support-layer-broker';
import { reportTestSupportLayerBrokerProxy } from './report-test-support-layer-broker.proxy';
import { EslintContextStub } from '../../../contracts/eslint-context/eslint-context.stub';
import { TsestreeStub, TsestreeNodeType } from '../../../contracts/tsestree/tsestree.stub';

describe('reportTestSupportLayerBroker', () => {
  describe('stub or proxy specifier', () => {
    it('VALID: {source ends .stub} => reports the specifier and returns true', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: '@dungeonmaster/shared/contracts/quest/quest.stub',
        }),
      });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'imported' });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([
        [
          {
            node,
            messageId: 'testSupportInProduction',
            data: {
              what: '@dungeonmaster/shared/contracts/quest/quest.stub',
              verb: 'imported',
            },
          },
        ],
      ]);
    });
  });

  describe('stub or proxy name through a hiding specifier', () => {
    it('VALID: {relative source, QuestStub specifier} => reports the name and returns true', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const specifier = TsestreeStub({
        type: TsestreeNodeType.ExportSpecifier,
        local: TsestreeStub({ name: 'QuestStub' }),
      });
      const node = TsestreeStub({
        type: TsestreeNodeType.ExportNamedDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: './quest/quest-contract' }),
        specifiers: [specifier],
      });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'exported' });

      expect(result).toBe(true);
      expect(mockReport.mock.calls).toStrictEqual([
        [
          {
            node: specifier,
            messageId: 'testSupportInProduction',
            data: { what: 'QuestStub', verb: 'exported' },
          },
        ],
      ]);
    });
  });

  describe('nothing to report', () => {
    it('VALID: {npm package source, createProxy specifier} => returns false, no report', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'http-proxy' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            imported: TsestreeStub({ name: 'createProxy' }),
            local: TsestreeStub({ name: 'createProxy' }),
          }),
        ],
      });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'imported' });

      expect(result).toBe(false);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {workspace source, production names} => returns false, no report', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: '@dungeonmaster/shared/contracts',
        }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            imported: TsestreeStub({ name: 'questContract' }),
            local: TsestreeStub({ name: 'questContract' }),
          }),
        ],
      });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'imported' });

      expect(result).toBe(false);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EMPTY: {node without a source} => returns false, no report', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = EslintContextStub({ report: mockReport });
      const node = TsestreeStub({ type: TsestreeNodeType.ExportNamedDeclaration });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'exported' });

      expect(result).toBe(false);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});
