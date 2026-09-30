import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleRequireObjectContractBrandsIndexedBroker } from './rule-require-object-contract-brands-indexed-broker';
import { ruleRequireObjectContractBrandsIndexedBrokerProxy } from './rule-require-object-contract-brands-indexed-broker.proxy';

const ruleTester = ruleTesterHarness();

const CONTRACT = '/project/packages/alpha/src/contracts/thing/thing-contract.ts';

const LAYER_TEXT = [
  "import { z } from 'zod';",
  'export const questOwnerLayerContract = z',
  '  .object({',
  "    name: z.string().brand<'QuestOwnerName'>(),",
  '  })',
  "  .brand<'QuestOwner'>();",
].join('\n');
const QUEST_TEXT = [
  "import { z } from 'zod';",
  "import { questOwnerLayerContract } from '../quest/quest-owner-layer-contract';",
  "export const questContract = z.object({ owner: questOwnerLayerContract }).brand<'Quest'>();",
].join('\n');
const OTHER_TEXT = [
  "import { z } from 'zod';",
  "import { questOwnerLayerContract } from '../quest/quest-owner-layer-contract';",
  "export const otherContract = z.object({ owner: questOwnerLayerContract }).brand<'Other'>();",
].join('\n');
const LAYER = '/layered/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts';
const SHARED_LAYER = '/twice/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts';
const ORPHAN_LAYER = '/orphan/packages/alpha/src/contracts/quest/quest-owner-layer-contract.ts';

// The rule builds its index from the staged tree once per process, so staging every case
// identically leaves the first case to build it and the rest to read it back.
beforeEach(() => {
  const proxy = ruleRequireObjectContractBrandsIndexedBrokerProxy();
  proxy.setupProject();
  proxy.setupLayerProject({
    root: '/layered',
    contracts: [
      { folder: 'quest', file: 'quest-contract.ts', text: QUEST_TEXT },
      { folder: 'quest', file: 'quest-owner-layer-contract.ts', text: LAYER_TEXT },
    ],
  });
  proxy.setupLayerProject({
    root: '/twice',
    contracts: [
      { folder: 'quest', file: 'quest-contract.ts', text: QUEST_TEXT },
      { folder: 'quest', file: 'quest-owner-layer-contract.ts', text: LAYER_TEXT },
      { folder: 'other', file: 'other-contract.ts', text: OTHER_TEXT },
    ],
  });
  proxy.setupLayerProject({
    root: '/orphan',
    contracts: [{ folder: 'quest', file: 'quest-owner-layer-contract.ts', text: LAYER_TEXT }],
  });
  proxy.setupMissingFile({
    filePath: '/orphan/packages/alpha/src/contracts/quest/quest-contract.ts',
  });
});

ruleTester.run(
  'require-object-contract-brands-indexed',
  ruleRequireObjectContractBrandsIndexedBroker(),
  {
    valid: [
      {
        code: "export const thingContract = z.object({ title: z.string().min(1).brand<'ThingTitle'>() }).brand<'Thing'>();",
        filename: CONTRACT,
      },
      {
        code: "export const thingContract = z.object({ title: z.string().brand<'ThingTitle'>().optional() }).brand<'Thing'>();",
        filename: CONTRACT,
      },
      {
        code: "export const thingContract = z.object({ tags: z.array(z.string().brand<'ThingTags'>()) }).brand<'Thing'>();",
        filename: CONTRACT,
      },
      {
        // A claimed key reuses another owner's field, so it takes no brand of its own.
        code: 'export const thingContract = z.object({ questId: z.string() }).brand<"Thing">();',
        filename: CONTRACT,
      },
      {
        code: 'export const thingContract = z.object({ guildId: z.string().uuid().optional() }).brand<"Thing">();',
        filename: CONTRACT,
      },
      {
        // A reuse is not a leaf of this contract.
        code: 'export const thingContract = z.object({ title: otherContract.shape.title }).brand<"Thing">();',
        filename: CONTRACT,
      },
      {
        code: 'export const thingContract = z.object({ status: z.enum(["a"]), done: z.boolean() }).brand<"Thing">();',
        filename: CONTRACT,
      },
      {
        // A record's key stays plain.
        code: "export const thingContract = z.object({ counts: z.record(z.string(), z.number().brand<'ThingCounts'>()) }).brand<'Thing'>();",
        filename: CONTRACT,
      },
      {
        // A record keyed by an owner's id reuses that owner's field.
        code: "export const thingContract = z.object({ byQuest: z.record(questContract.shape.id, z.number().brand<'ThingByQuest'>()) }).brand<'Thing'>();",
        filename: CONTRACT,
      },
      {
        // A function-valued field is not a field of the contract's data, so nothing inside it takes a brand.
        code: "export const thingContract = z.object({ handler: z.function(z.tuple([z.string()]), z.object({ n: z.number() })), done: z.function({ input: [z.object({ id: z.string() })], output: z.void() }) }).brand<'Thing'>();",
        filename: CONTRACT,
      },
      {
        // A string that is not a field of an object contract stays plain.
        code: 'export const timeoutMs = z.number();',
        filename: CONTRACT,
      },
      {
        code: 'export const thingContract = z.object({ title: z.string() }).brand<"Thing">();',
        filename: '/project/packages/alpha/src/contracts/thing/thing-contract.test.ts',
      },
      {
        code: 'export const thingContract = z.object({ title: z.string() }).brand<"Thing">();',
        filename: '/project/packages/alpha/src/brokers/thing/load/thing-load-broker.ts',
      },
      {
        code: 'export const thingContract = z.object({ title: z.string() }).brand<"Thing">();',
        filename: '/project/scripts/thing-contract.ts',
      },
      {
        // A layer's texts are the parent's const plus the key it sits under, plus the layer's own keys.
        code: LAYER_TEXT,
        filename: LAYER,
      },
      {
        // The parent file is gone, so there is no use to derive a text from.
        code: LAYER_TEXT.replace('QuestOwnerName', 'AnyName'),
        filename: ORPHAN_LAYER,
      },
    ],
    invalid: [
      {
        code: "export const thingContract = z.object({ title: z.string().min(1) }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [{ messageId: 'leafNoBrand', data: { key: 'title', expected: 'ThingTitle' } }],
        output:
          "export const thingContract = z.object({ title: z.string().min(1).brand<'ThingTitle'>() }).brand<'Thing'>();",
      },
      {
        code: "export const thingContract = z.object({ count: z.number().int().optional() }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [{ messageId: 'leafNoBrand', data: { key: 'count', expected: 'ThingCount' } }],
        output:
          "export const thingContract = z.object({ count: z.number().int().brand<'ThingCount'>().optional() }).brand<'Thing'>();",
      },
      {
        code: "export const thingContract = z.object({ used_percentage: z.number() }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [
          {
            messageId: 'leafNoBrand',
            data: { key: 'used_percentage', expected: 'ThingUsedPercentage' },
          },
        ],
        output:
          "export const thingContract = z.object({ used_percentage: z.number().brand<'ThingUsedPercentage'>() }).brand<'Thing'>();",
      },
      {
        code: "export const thingContract = z.object({ tags: z.array(z.string()) }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [{ messageId: 'leafNoBrand', data: { key: 'tags', expected: 'ThingTags' } }],
        output:
          "export const thingContract = z.object({ tags: z.array(z.string().brand<'ThingTags'>()) }).brand<'Thing'>();",
      },
      {
        code: "export const thingContract = z.object({ counts: z.record(z.string(), z.number()) }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [{ messageId: 'leafNoBrand', data: { key: 'counts', expected: 'ThingCounts' } }],
        output:
          "export const thingContract = z.object({ counts: z.record(z.string(), z.number().brand<'ThingCounts'>()) }).brand<'Thing'>();",
      },
      {
        code: "export const thingContract = z.object({ span: z.tuple([z.number(), z.number()]) }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [
          { messageId: 'leafNoBrand', data: { key: 'span', expected: 'ThingSpan0' } },
          { messageId: 'leafNoBrand', data: { key: 'span', expected: 'ThingSpan1' } },
        ],
        output:
          "export const thingContract = z.object({ span: z.tuple([z.number().brand<'ThingSpan0'>(), z.number().brand<'ThingSpan1'>()]) }).brand<'Thing'>();",
      },
      {
        code: "export const thingContract = z.object({ owner: z.object({ name: z.string() }).brand<'ThingOwner'>() }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [{ messageId: 'leafNoBrand', data: { key: 'name', expected: 'ThingOwnerName' } }],
        output:
          "export const thingContract = z.object({ owner: z.object({ name: z.string().brand<'ThingOwnerName'>() }).brand<'ThingOwner'>() }).brand<'Thing'>();",
      },
      {
        code: "const thingFields = z.object({ name: z.string() });\nexport const thingContract = z.object({ ...thingFields.shape }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [{ messageId: 'leafNoBrand', data: { key: 'name', expected: 'ThingName' } }],
        output:
          "const thingFields = z.object({ name: z.string().brand<'ThingName'>() });\nexport const thingContract = z.object({ ...thingFields.shape }).brand<'Thing'>();",
      },
      {
        // 'questIds' names no owner field, so the plural key is a new value.
        code: "export const thingContract = z.object({ questIds: z.array(z.string()) }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [
          { messageId: 'leafNoBrand', data: { key: 'questIds', expected: 'ThingQuestIds' } },
        ],
        output:
          "export const thingContract = z.object({ questIds: z.array(z.string().brand<'ThingQuestIds'>()) }).brand<'Thing'>();",
      },
      {
        // 'requestId' names no owner in a package alpha can import, so it takes a brand.
        code: "export const thingContract = z.object({ requestId: z.string() }).brand<'Thing'>();",
        filename: CONTRACT,
        errors: [
          { messageId: 'leafNoBrand', data: { key: 'requestId', expected: 'ThingRequestId' } },
        ],
        output:
          "export const thingContract = z.object({ requestId: z.string().brand<'ThingRequestId'>() }).brand<'Thing'>();",
      },
      {
        code: LAYER_TEXT.replace('QuestOwnerName', 'OwnerName').replace("'QuestOwner'", "'Owner'"),
        filename: LAYER,
        errors: [
          {
            messageId: 'layerBrandText',
            data: { layer: 'questOwnerLayerContract', key: 'owner', expected: 'QuestOwner' },
          },
          {
            messageId: 'layerBrandText',
            data: { layer: 'questOwnerLayerContract', key: 'owner', expected: 'QuestOwnerName' },
          },
        ],
        output: LAYER_TEXT,
      },
      {
        code: LAYER_TEXT,
        filename: SHARED_LAYER,
        errors: [
          {
            messageId: 'layerImportedElsewhere',
            data: {
              layer: 'questOwnerLayerContract',
              file: '/twice/packages/alpha/src/contracts/other/other-contract.ts',
              parent: '/twice/packages/alpha/src/contracts/quest/quest-contract.ts',
            },
          },
        ],
      },
    ],
  },
);
