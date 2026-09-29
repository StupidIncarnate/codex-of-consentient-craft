import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { ImportDeclarationStub } from '#gateway/npm/typescript-eslint__utils/import-declaration/import-declaration.stub';
import { ExportSpecifierStub } from '#gateway/npm/typescript-eslint__utils/export-specifier/export-specifier.stub';
import { ExportNamedDeclarationStub } from '#gateway/npm/typescript-eslint__utils/export-named-declaration/export-named-declaration.stub';
import { reportTestSupportLayerBroker } from './report-test-support-layer-broker';
import { reportTestSupportLayerBrokerProxy } from './report-test-support-layer-broker.proxy';

describe('reportTestSupportLayerBroker', () => {
  describe('stub or proxy specifier', () => {
    it('VALID: {source ends .stub} => reports the specifier and returns true', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ImportDeclarationStub({
        code: 'import "@dungeonmaster/shared/contracts/quest/quest.stub";',
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
      const context = RuleContextStub({ report: mockReport });
      const code = 'export { QuestStub } from "./quest/quest-contract";';
      const specifier = ExportSpecifierStub({ code });
      const node = ExportNamedDeclarationStub({ code });

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
      const context = RuleContextStub({ report: mockReport });
      const node = ImportDeclarationStub({ code: 'import { createProxy } from "http-proxy";' });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'imported' });

      expect(result).toBe(false);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('VALID: {workspace source, production names} => returns false, no report', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ImportDeclarationStub({
        code: 'import { questContract } from "@dungeonmaster/shared/contracts";',
      });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'imported' });

      expect(result).toBe(false);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });

    it('EMPTY: {node without a source} => returns false, no report', () => {
      reportTestSupportLayerBrokerProxy();
      const mockReport = jest.fn();
      const context = RuleContextStub({ report: mockReport });
      const node = ExportNamedDeclarationStub({ code: 'export {  };' });

      const result = reportTestSupportLayerBroker({ node, context, verb: 'exported' });

      expect(result).toBe(false);
      expect(mockReport.mock.calls).toStrictEqual([]);
    });
  });
});
