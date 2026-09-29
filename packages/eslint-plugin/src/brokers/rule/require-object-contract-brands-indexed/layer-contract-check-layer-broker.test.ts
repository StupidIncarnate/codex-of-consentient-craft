import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { layerContractCheckLayerBroker } from './layer-contract-check-layer-broker';
import { layerContractCheckLayerBrokerProxy } from './layer-contract-check-layer-broker.proxy';

const OWNER_LAYER = [
  "import { z } from 'zod';",
  'export const questOwnerLayerContract = z',
  '  .object({',
  "    name: z.string().brand<'QuestOwnerName'>(),",
  "    tags: z.array(z.string().brand<'QuestOwnerTags'>()),",
  '  })',
  "  .brand<'QuestOwner'>();",
  '',
].join('\n');

const QUEST_USING_LAYER = [
  "import { z } from 'zod';",
  "import { questOwnerLayerContract } from '../quest/quest-owner-layer-contract';",
  'export const questContract = z',
  '  .object({',
  '    owner: questOwnerLayerContract,',
  '  })',
  "  .brand<'Quest'>();",
  '',
].join('\n');

const OTHER_USING_LAYER = [
  "import { z } from 'zod';",
  "import { questOwnerLayerContract } from '../quest/quest-owner-layer-contract';",
  'export const otherContract = z',
  '  .object({',
  '    owner: questOwnerLayerContract,',
  '  })',
  "  .brand<'Other'>();",
  '',
].join('\n');

const reportsOf = ({ report }: { report: jest.Mock }): unknown[] =>
  report.mock.calls.map(([descriptor]: [{ messageId: string; data?: unknown }]) => ({
    messageId: descriptor.messageId,
    data: descriptor.data,
  }));

describe('layerContractCheckLayerBroker', () => {
  describe('brand texts', () => {
    it('VALID: {every text is the parent const plus the key plus the leaf key} => reports nothing', () => {
      const root = '/right';
      const proxy = layerContractCheckLayerBrokerProxy();
      proxy.setupProject({
        root,
        contracts: [
          { folder: 'quest', file: 'quest-contract.ts', text: QUEST_USING_LAYER },
          { folder: 'quest', file: 'quest-owner-layer-contract.ts', text: OWNER_LAYER },
        ],
      });
      const report = jest.fn();
      const filename = `${root}/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts`;
      const context = RuleContextStub({ code: OWNER_LAYER, report });

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: OWNER_LAYER }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([]);
    });

    it("INVALID: {a text that names the layer const, not the parent's use} => reports each wrong text", () => {
      const root = '/wrong';
      const wrongLayer = OWNER_LAYER.replace('QuestOwnerName', 'OwnerName')
        .replace('QuestOwnerTags', 'OwnerTags')
        .replace("brand<'QuestOwner'>", "brand<'Owner'>");
      const proxy = layerContractCheckLayerBrokerProxy();
      proxy.setupProject({
        root,
        contracts: [
          { folder: 'quest', file: 'quest-contract.ts', text: QUEST_USING_LAYER },
          { folder: 'quest', file: 'quest-owner-layer-contract.ts', text: wrongLayer },
        ],
      });
      const report = jest.fn();
      const filename = `${root}/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts`;
      const context = RuleContextStub({ code: wrongLayer, report });

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: wrongLayer }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([
        {
          messageId: 'layerBrandText',
          data: { layer: 'questOwnerLayerContract', key: 'owner', expected: 'QuestOwner' },
        },
        {
          messageId: 'layerBrandText',
          data: { layer: 'questOwnerLayerContract', key: 'owner', expected: 'QuestOwnerName' },
        },
        {
          messageId: 'layerBrandText',
          data: { layer: 'questOwnerLayerContract', key: 'owner', expected: 'QuestOwnerTags' },
        },
      ]);
    });
  });

  describe('importers', () => {
    it('INVALID: {a second contract nests the layer} => reports that file against the parent', () => {
      const root = '/shared';
      const proxy = layerContractCheckLayerBrokerProxy();
      proxy.setupProject({
        root,
        contracts: [
          { folder: 'quest', file: 'quest-contract.ts', text: QUEST_USING_LAYER },
          { folder: 'quest', file: 'quest-owner-layer-contract.ts', text: OWNER_LAYER },
          { folder: 'other', file: 'other-contract.ts', text: OTHER_USING_LAYER },
        ],
      });
      const report = jest.fn();
      const filename = `${root}/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts`;
      const context = RuleContextStub({ code: OWNER_LAYER, report });

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: OWNER_LAYER }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([
        {
          messageId: 'layerImportedElsewhere',
          data: {
            layer: 'questOwnerLayerContract',
            file: `${root}/packages/alpha/src/contracts/other/other-contract.ts`,
            parent: `${root}/packages/alpha/src/contracts/quest/quest-contract.ts`,
          },
        },
      ]);
    });
  });

  describe('files it leaves alone', () => {
    it('EMPTY: {the parent file is missing} => reports no text', () => {
      const root = '/orphan';
      const proxy = layerContractCheckLayerBrokerProxy();
      proxy.setupProject({
        root,
        contracts: [{ folder: 'quest', file: 'quest-owner-layer-contract.ts', text: OWNER_LAYER }],
      });
      proxy.setupMissingFile({
        filePath: `${root}/packages/alpha/src/contracts/quest/quest-contract.ts`,
      });
      const report = jest.fn();
      const filename = `${root}/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts`;
      const context = RuleContextStub({ code: OWNER_LAYER, report });

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: OWNER_LAYER }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([]);
    });

    it('EMPTY: {the parent never uses the layer} => reports no text', () => {
      const root = '/unused';
      const proxy = layerContractCheckLayerBrokerProxy();
      proxy.setupProject({
        root,
        contracts: [
          {
            folder: 'quest',
            file: 'quest-contract.ts',
            text: "export const questContract = z.object({}).brand<'Quest'>();",
          },
          { folder: 'quest', file: 'quest-owner-layer-contract.ts', text: OWNER_LAYER },
        ],
      });
      const report = jest.fn();
      const filename = `${root}/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts`;
      const context = RuleContextStub({ code: OWNER_LAYER, report });

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: OWNER_LAYER }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([]);
    });

    it('EMPTY: {a layer file that declares no layer contract} => reports nothing', () => {
      const root = '/noconst';
      layerContractCheckLayerBrokerProxy();
      const report = jest.fn();
      const filename = `${root}/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts`;
      const context = RuleContextStub({ code: 'const a = 1;', report });

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: 'const a = 1;' }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([]);
    });

    it('EMPTY: {a file with a path that is not a layer} => reports nothing', () => {
      const root = '/nolayer';
      const proxy = layerContractCheckLayerBrokerProxy();
      proxy.setupProject({ root, contracts: [] });
      const report = jest.fn();
      const filename = `${root}/packages/alpha/src/contracts/quest/quest-contract.ts`;
      const context = RuleContextStub({ code: 'const a = 1;', report });

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: 'const a = 1;' }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([]);
    });

    it('EMPTY: {a path outside any packages folder} => reports nothing', () => {
      layerContractCheckLayerBrokerProxy();
      const report = jest.fn();
      const context = RuleContextStub({ code: OWNER_LAYER, report });
      const filename = '/scripts/quest-owner-layer-contract.ts';

      layerContractCheckLayerBroker({
        context,
        program: ProgramStub({ code: OWNER_LAYER }),
        filename,
      });

      expect(reportsOf({ report })).toStrictEqual([]);
    });
  });
});
