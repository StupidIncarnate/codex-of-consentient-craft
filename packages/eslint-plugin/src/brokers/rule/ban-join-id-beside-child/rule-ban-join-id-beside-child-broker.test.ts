import { ruleBanJoinIdBesideChildBroker } from './rule-ban-join-id-beside-child-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

const CONTRACT = '/project/src/contracts/work-item/work-item-contract.ts';
const BROKER = '/project/src/brokers/work-item/load/work-item-load-broker.ts';

ruleTester.run('ban-join-id-beside-child', ruleBanJoinIdBesideChildBroker(), {
  valid: [
    // The child alone
    {
      code: `export const workItemContract = z.object({ quest: questContract }).brand<'WorkItem'>();`,
      filename: CONTRACT,
    },
    // An id with no child beside it
    {
      code: `export const workItemContract = z.object({ questId: questContract.shape.id }).brand<'WorkItem'>();`,
      filename: CONTRACT,
    },
    // A child that may be absent is a different shape from an id that is always there
    {
      code: `export const workItemContract = z.object({
        quest: questContract.optional(),
        questId: questContract.shape.id,
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
    },
    {
      code: `export const workItemContract = z.object({
        quest: questContract.nullable(),
        questId: questContract.shape.id,
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
    },
    // requestId is `request`, `id`: it does not end in `quest`, `id`
    {
      code: `export const workItemContract = z.object({
        quest: questContract,
        requestId: requestContract.shape.id,
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
    },
    // An id of a different owner than the child
    {
      code: `export const workItemContract = z.object({
        quest: questContract,
        guildId: guildContract.shape.id,
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
    },
    // The child's own id on the child is not a sibling key
    {
      code: `export const questContract = z.object({ id: questId, name: questName }).brand<'Quest'>();`,
      filename: '/project/src/contracts/quest/quest-contract.ts',
    },
    // Not a contract file: the rule reads contracts only
    {
      code: `const shape = z.object({ quest: questContract, questId: questContract.shape.id });`,
      filename: BROKER,
    },
    // A stub or test beside a contract is not a contract
    {
      code: `const shape = z.object({ quest: questContract, questId: questContract.shape.id });`,
      filename: '/project/src/contracts/work-item/work-item.stub.ts',
    },
  ],
  invalid: [
    // The id reuses the child's schema
    {
      code: `export const workItemContract = z.object({
        quest: questContract,
        questId: questContract.shape.id,
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
      errors: [
        {
          messageId: 'joinIdBesideChild',
          data: { idKey: 'questId', childKey: 'quest' },
        },
      ],
    },
    // The id comes first
    {
      code: `export const workItemContract = z.object({
        questId: questContract.shape.id,
        quest: questContract,
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
      errors: [
        {
          messageId: 'joinIdBesideChild',
          data: { idKey: 'questId', childKey: 'quest' },
        },
      ],
    },
    // The id is a getter that returns the reuse (an import cycle)
    {
      code: `export const workItemContract = z.object({
        quest: questContract,
        get questId(): z.core.$ZodType<string & z.$brand<'QuestId'>> {
          return questContract.shape.id;
        },
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
      errors: [
        {
          messageId: 'joinIdBesideChild',
          data: { idKey: 'questId', childKey: 'quest' },
        },
      ],
    },
    // The id key matches by name and carries its own schema
    {
      code: `export const workItemContract = z.object({
        quest: questContract,
        questId: z.string().brand<'WorkItemQuestId'>(),
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
      errors: [
        {
          messageId: 'joinIdBesideChild',
          data: { idKey: 'questId', childKey: 'quest' },
        },
      ],
    },
    // The id key ends in the owner name and id: parentQuestId matches quest
    {
      code: `export const workItemContract = z.object({
        parent: questContract,
        parentQuestId: z.string(),
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
      errors: [
        {
          messageId: 'joinIdBesideChild',
          data: { idKey: 'parentQuestId', childKey: 'parent' },
        },
      ],
    },
    // The reuse under any name points at its child by contract
    {
      code: `export const workItemContract = z.object({
        parent: questContract,
        owningRef: questContract.shape.id,
      }).brand<'WorkItem'>();`,
      filename: CONTRACT,
      errors: [
        {
          messageId: 'joinIdBesideChild',
          data: { idKey: 'owningRef', childKey: 'parent' },
        },
      ],
    },
    // Two children match one name: the longest owner name wins
    {
      code: `export const boardContract = z.object({
        item: itemContract,
        workItem: workItemContract,
        workItemId: workItemContract.shape.id,
      }).brand<'Board'>();`,
      filename: '/project/src/contracts/board/board-contract.ts',
      errors: [
        {
          messageId: 'joinIdBesideChild',
          data: { idKey: 'workItemId', childKey: 'workItem' },
        },
      ],
    },
    // A derived object schema is an object schema too, and two id keys are two reports
    {
      code: `export const boardContract = z.strictObject({
        quest: questContract,
        guild: guildContract,
        questId: questContract.shape.id,
        guildId: guildContract.shape.id,
      }).brand<'Board'>();`,
      filename: '/project/src/contracts/board/board-contract.ts',
      errors: [
        { messageId: 'joinIdBesideChild', data: { idKey: 'questId', childKey: 'quest' } },
        { messageId: 'joinIdBesideChild', data: { idKey: 'guildId', childKey: 'guild' } },
      ],
    },
    // A nested object inside a contract is checked on its own
    {
      code: `export const boardContract = z.object({
        inner: z.object({ quest: questContract, questId: questContract.shape.id }).brand<'BoardInner'>(),
      }).brand<'Board'>();`,
      filename: '/project/src/contracts/board/board-contract.ts',
      errors: [{ messageId: 'joinIdBesideChild', data: { idKey: 'questId', childKey: 'quest' } }],
    },
  ],
});
