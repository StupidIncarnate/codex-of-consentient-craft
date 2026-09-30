import { ruleRequireObjectContractBrandsBroker } from './rule-require-object-contract-brands-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

const CONTRACT = '/project/src/contracts/quest/quest-contract.ts';
const LAYER = '/project/src/contracts/quest/owner-layer-contract.ts';
const BROKER = '/project/src/brokers/quest/load/quest-load-broker.ts';

const TREE_HEAD = `const treeNodeFields = z.object({ name: z.string().brand<'TreeNodeName'>() });`;
const TREE_OWNER = `export const treeNodeContract = z
  .object({
    ...treeNodeFields.shape,
    get children(): z.ZodArray<z.core.$ZodType<TreeNodeSelf>> {
      return z.array(treeNodeContract);
    },
  })
  .brand<'TreeNode'>();`;

ruleTester.run('require-object-contract-brands', ruleRequireObjectContractBrandsBroker(), {
  valid: [
    // --- An object and its leaf, branded with the derived texts ---
    {
      code: "export const questContract = z.object({ id: z.string().brand<'QuestId'>() }).brand<'Quest'>();",
      filename: CONTRACT,
    },
    {
      code: `export const questContract = z.object({
        owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }).brand<'QuestOwner'>(),
      }).brand<'Quest'>();`,
      filename: CONTRACT,
    },
    // --- A snake_case key becomes PascalCase ---
    {
      code: "export const ctxContract = z.object({ used_percentage: z.number().brand<'CtxUsedPercentage'>() }).brand<'Ctx'>();",
      filename: CONTRACT,
    },
    // --- Arrays, record values and tuples carry the field's key ---
    {
      code: `export const questContract = z.object({
        tags: z.array(z.string().brand<'QuestTags'>()),
        counts: z.record(z.string(), z.number().brand<'QuestCounts'>()),
        span: z.tuple([z.number().brand<'QuestSpan0'>(), z.number().brand<'QuestSpan1'>()]),
        items: z.array(z.object({ n: z.number().brand<'QuestItemsN'>() }).brand<'QuestItems'>()),
      }).brand<'Quest'>();`,
      filename: CONTRACT,
    },
    // --- A record key stays plain, or reuses its owner's id field ---
    {
      code: "export const questContract = z.object({ counts: z.record(z.string(), z.number().brand<'QuestCounts'>()) }).brand<'Quest'>();",
      filename: CONTRACT,
    },
    {
      code: "export const guildContract = z.object({ byQuest: z.record(questContract.shape.id, z.number().brand<'GuildByQuest'>()) }).brand<'Guild'>();",
      filename: CONTRACT,
    },
    // --- A function-valued field is not graded inside ---
    {
      code: `export const toolContract = z.object({
        name: z.string().brand<'ToolName'>(),
        handler: z.function({ input: [z.object({ args: z.string().brand<'Anything'>() })], output: z.void() }),
        cleanup: z.custom<(reason: string) => void>(),
      }).brand<'Tool'>();`,
      filename: CONTRACT,
    },
    // --- Enums, literals and booleans take no brand ---
    {
      code: "export const workItemContract = z.object({ status: z.enum(['a', 'b']), kind: z.literal('x'), done: z.boolean() }).brand<'WorkItem'>();",
      filename: CONTRACT,
    },
    // --- A reuse keeps its source's brand ---
    {
      code: `export const dealContract = z.object({
        userId: userContract.shape.id,
        user: userContract.optional(),
        maybeId: userContract.shape.id.optional(),
        lines: z.array(lineItemContract),
      }).brand<'Deal'>();`,
      filename: CONTRACT,
    },
    // --- Every branch of a union takes the owner's name ---
    {
      code: `export const eventContract = z.union([
        z.object({ a: z.string().brand<'EventA'>() }).brand<'Event'>(),
        z.object({ b: z.string().brand<'EventB'>() }).brand<'Event'>(),
      ]);`,
      filename: CONTRACT,
    },
    // --- A shape-level method keeps the brand after it, and a wrapper after the brand ---
    {
      code: "export const questContract = z.object({ n: z.object({}).strict().brand<'QuestN'>().optional() }).strict().brand<'Quest'>();",
      filename: CONTRACT,
    },
    // --- The owner's own local id const, not exported, named for the owner's id ---
    {
      code: `const workItemId = z.string().uuid().brand<'WorkItemId'>();
      export const workItemContract = z.object({ id: workItemId, mintedBy: workItemId.optional() }).brand<'WorkItem'>();`,
      filename: CONTRACT,
    },
    // --- The getter form: an unbranded field list, a Self type that ends in the owner's brand ---
    {
      code: `${TREE_HEAD}
      type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] } & z.$brand<'TreeNode'>;
      ${TREE_OWNER}`,
      filename: CONTRACT,
    },
    // --- A layer contract's texts belong to the indexed rule ---
    {
      code: "export const ownerLayerContract = z.object({ name: z.string().brand<'Whatever'>() });",
      filename: LAYER,
    },
    // --- A gateway schema keeps its #Gateway text wherever it sits ---
    {
      code: "export const childProcessSchema = z.instanceof(ChildProcess).brand<'#GatewayChildProcess'>();",
      filename: CONTRACT,
    },
    // --- A reuse may be unwrapped or described, and z.ZodType is fine outside a getter's return type ---
    {
      code: `export const dealContract = z.object({
        userId: userContract.shape.id.unwrap().nullable(),
        note: noteContract.shape.text.describe('The note'),
      }).brand<'Deal'>();
      export const schemaContract: z.ZodType<Deal> = dealContract;`,
      filename: CONTRACT,
    },
    // --- Outside contracts/: an object needs no brand, and an object with fields may carry them ---
    { code: 'export const shape = z.object({ id: z.string() });', filename: BROKER },
    {
      code: "const shape = z.object({ a: z.string().brand<'AnyText'>() }).brand<'Any'>();",
      filename: BROKER,
    },
    // --- Tests, stubs and proxies are never graded ---
    {
      code: "export const questContract = z.object({ id: z.string().brand<'Wrong'>() });",
      filename: '/project/src/contracts/quest/quest.stub.ts',
    },
    {
      code: "const value = z.string().brand<'Loose'>();",
      filename: '/project/src/brokers/quest/load/quest-load-broker.test.ts',
    },
  ],

  invalid: [
    // --- An object with no brand ---
    {
      code: 'export const questContract = z.object({ id: idContract });',
      filename: CONTRACT,
      errors: [
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'Quest' } },
      ],
      output: "export const questContract = z.object({ id: idContract }).brand<'Quest'>();",
    },
    {
      code: 'export const questContract = z.strictObject({ id: idContract });',
      filename: CONTRACT,
      errors: [
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'Quest' } },
      ],
      output: "export const questContract = z.strictObject({ id: idContract }).brand<'Quest'>();",
    },
    // --- The brand goes before a wrapper, and after a shape-level method ---
    {
      code: 'export const questContract = z.object({ id: idContract }).strict().optional();',
      filename: CONTRACT,
      errors: [
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'Quest' } },
      ],
      output:
        "export const questContract = z.object({ id: idContract }).strict().brand<'Quest'>().optional();",
    },
    // --- A nested object takes the owner plus its key ---
    {
      code: "export const questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }) }).brand<'Quest'>();",
      filename: CONTRACT,
      errors: [
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'QuestOwner' } },
      ],
      output:
        "export const questContract = z.object({ owner: z.object({ name: z.string().brand<'QuestOwnerName'>() }).brand<'QuestOwner'>() }).brand<'Quest'>();",
    },
    // --- An object inside an array takes the field's key ---
    {
      code: "export const questContract = z.object({ items: z.array(z.object({ n: idContract })) }).brand<'Quest'>();",
      filename: CONTRACT,
      errors: [
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'QuestItems' } },
      ],
      output:
        "export const questContract = z.object({ items: z.array(z.object({ n: idContract }).brand<'QuestItems'>()) }).brand<'Quest'>();",
    },
    // --- Part of another contract, written inline, is a new object ---
    {
      code: "export const dealContract = z.object({ user: userContract.pick({ name: true }) }).brand<'Deal'>();",
      filename: CONTRACT,
      errors: [
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'DealUser' } },
      ],
      output:
        "export const dealContract = z.object({ user: userContract.pick({ name: true }).brand<'DealUser'>() }).brand<'Deal'>();",
    },
    // --- Two objects lacking a brand are two reports and two fixes ---
    {
      code: 'export const questContract = z.object({ owner: z.object({ n: idContract }) });',
      filename: CONTRACT,
      errors: [
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'Quest' } },
        { messageId: 'objectNoBrand', data: { file: 'quest-contract.ts', expected: 'QuestOwner' } },
      ],
      output:
        "export const questContract = z.object({ owner: z.object({ n: idContract }).brand<'QuestOwner'>() }).brand<'Quest'>();",
    },
    // --- A wrong text on an object and a leaf ---
    {
      code: "export const questContract = z.object({ id: z.string().brand<'QuestId'>() }).brand<'QuestContract'>();",
      filename: CONTRACT,
      errors: [
        { messageId: 'wrongBrandText', data: { actual: 'QuestContract', expected: 'Quest' } },
      ],
      output:
        "export const questContract = z.object({ id: z.string().brand<'QuestId'>() }).brand<'Quest'>();",
    },
    {
      code: "export const workItemContract = z.object({ retryCount: z.number().brand<'FailCount'>() }).brand<'WorkItem'>();",
      filename: CONTRACT,
      errors: [
        {
          messageId: 'wrongBrandText',
          data: { actual: 'FailCount', expected: 'WorkItemRetryCount' },
        },
      ],
      output:
        "export const workItemContract = z.object({ retryCount: z.number().brand<'WorkItemRetryCount'>() }).brand<'WorkItem'>();",
    },
    // --- A brand on an enum, a literal or a boolean comes off ---
    {
      code: "export const workItemContract = z.object({ status: z.enum(['a', 'b']).brand<'WorkItemStatus'>() }).brand<'WorkItem'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'brandOnUnbrandable', data: { key: 'status' } }],
      output:
        "export const workItemContract = z.object({ status: z.enum(['a', 'b']) }).brand<'WorkItem'>();",
    },
    {
      code: "export const workItemContract = z.object({ done: z.boolean().brand<'WorkItemDone'>() }).brand<'WorkItem'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'brandOnUnbrandable', data: { key: 'done' } }],
      output:
        "export const workItemContract = z.object({ done: z.boolean() }).brand<'WorkItem'>();",
    },
    // --- z.unknown and z.any check nothing ---
    {
      code: "export const questContract = z.object({ payload: z.unknown() }).brand<'Quest'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'unknownSchema', data: { key: 'payload' } }],
    },
    {
      code: "export const questContract = z.object({ extra: z.any().optional() }).brand<'Quest'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'unknownSchema', data: { key: 'extra' } }],
    },
    // --- z.lazy is refused ---
    {
      code: "export const questContract = z.object({ next: z.lazy(() => questContract) }).brand<'Quest'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'lazySchema' }],
    },
    // --- A standalone brand, in a contract or anywhere else ---
    {
      code: "export const questIdContract = z.string().min(1).brand<'QuestId'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'brandElsewhere' }],
    },
    {
      code: "const text = z.string().brand<'ContentText'>().parse(line);",
      filename: BROKER,
      errors: [{ messageId: 'brandElsewhere' }],
    },
    // --- The one local id const is exempt only when unexported, named for its owner and used as `id` ---
    {
      code: "export const workItemId = z.string().brand<'WorkItemId'>();\nexport const workItemContract = z.object({ id: workItemId }).brand<'WorkItem'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'brandElsewhere' }],
    },
    {
      code: "const label = z.string().brand<'Label'>();\nexport const workItemContract = z.object({ name: label }).brand<'WorkItem'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'brandElsewhere' }],
    },
    {
      code: "const workItemId = z.string().uuid().brand<'Id'>();\nexport const workItemContract = z.object({ id: workItemId }).brand<'WorkItem'>();",
      filename: CONTRACT,
      errors: [
        {
          messageId: 'localIdBrandText',
          data: { actual: 'Id', expected: 'WorkItemId', owner: 'workItemContract' },
        },
      ],
      output:
        "const workItemId = z.string().uuid().brand<'WorkItemId'>();\nexport const workItemContract = z.object({ id: workItemId }).brand<'WorkItem'>();",
    },
    // --- A reuse adds no check of its own ---
    {
      code: "export const dealContract = z.object({ userId: userContract.shape.id.min(5) }).brand<'Deal'>();",
      filename: CONTRACT,
      errors: [
        {
          messageId: 'reuseAddsCheck',
          data: { key: 'id', source: 'userContract.shape.id' },
        },
      ],
    },
    // --- The getter form: the Self type takes the owner's brand ---
    {
      code: `${TREE_HEAD}
      type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] };
      ${TREE_OWNER}`,
      filename: CONTRACT,
      errors: [{ messageId: 'selfTypeBrand', data: { expected: 'TreeNode' } }],
      output: `${TREE_HEAD}
      type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] } & z.$brand<'TreeNode'>;
      ${TREE_OWNER}`,
    },
    // --- A union alias is wrapped, so the brand binds the whole union ---
    {
      code: `${TREE_HEAD}
      type TreeNodeSelf = z.infer<typeof treeNodeFields> | { children: TreeNodeSelf[] };
      ${TREE_OWNER}`,
      filename: CONTRACT,
      errors: [{ messageId: 'selfTypeBrand', data: { expected: 'TreeNode' } }],
      output: `${TREE_HEAD}
      type TreeNodeSelf = (z.infer<typeof treeNodeFields> | { children: TreeNodeSelf[] }) & z.$brand<'TreeNode'>;
      ${TREE_OWNER}`,
    },
    // --- The field list carries no brand of its own ---
    {
      code: `const treeNodeFields = z.object({ name: z.string().brand<'TreeNodeName'>() }).brand<'TreeNode'>();
      type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] } & z.$brand<'TreeNode'>;
      ${TREE_OWNER}`,
      filename: CONTRACT,
      errors: [
        {
          messageId: 'fieldListBranded',
          data: { name: 'treeNodeFields', owner: 'treeNodeContract' },
        },
      ],
    },
    // --- A leaf of the field list takes the owner's name, not the list's ---
    {
      code: `const treeNodeFields = z.object({ name: z.string().brand<'FieldsName'>() });
      type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] } & z.$brand<'TreeNode'>;
      ${TREE_OWNER}`,
      filename: CONTRACT,
      errors: [
        { messageId: 'wrongBrandText', data: { actual: 'FieldsName', expected: 'TreeNodeName' } },
      ],
      output: `const treeNodeFields = z.object({ name: z.string().brand<'TreeNodeName'>() });
      type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] } & z.$brand<'TreeNode'>;
      ${TREE_OWNER}`,
    },
    // --- A getter typed z.ZodType is refused ---
    {
      code: `${TREE_HEAD}
      type TreeNodeSelf = z.infer<typeof treeNodeFields> & { children: TreeNodeSelf[] } & z.$brand<'TreeNode'>;
      export const treeNodeContract = z
        .object({
          ...treeNodeFields.shape,
          get children(): z.ZodType<TreeNodeSelf> {
            return z.array(treeNodeContract);
          },
        })
        .brand<'TreeNode'>();`,
      filename: CONTRACT,
      errors: [{ messageId: 'zodTypeGetter' }],
    },
  ],
});
