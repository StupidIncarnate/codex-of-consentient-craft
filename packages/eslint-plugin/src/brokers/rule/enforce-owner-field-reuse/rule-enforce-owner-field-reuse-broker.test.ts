import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleEnforceOwnerFieldReuseBroker } from './rule-enforce-owner-field-reuse-broker';
import { ruleEnforceOwnerFieldReuseBrokerProxy } from './rule-enforce-owner-field-reuse-broker.proxy';

const ruleTester = ruleTesterHarness();

const BROKER = '/project/packages/alpha/src/brokers/thing/load/thing-load-broker.ts';
const CONTRACT = '/project/packages/alpha/src/contracts/thing/thing-contract.ts';

// The rule builds its index from the staged tree once per process, so staging every case
// identically leaves the first case to build it and the rest to read it back.
beforeEach(() => {
  ruleEnforceOwnerFieldReuseBrokerProxy().setupProject();
});

ruleTester.run('enforce-owner-field-reuse', ruleEnforceOwnerFieldReuseBroker(), {
  valid: [
    {
      code: "import { questContract } from '@project/beta/contracts';\nexport const thingContract = z.object({ questId: questContract.shape.id }).brand<'Thing'>();",
      filename: CONTRACT,
    },
    {
      code: "import { questContract } from '@project/beta/contracts';\nexport const thingContract = z.object({ questId: questContract.shape.id.optional() }).brand<'Thing'>();",
      filename: CONTRACT,
    },
    {
      code: "export const thingContract = z.object({ get questId(): z.core.$ZodType<string & z.$brand<'QuestId'>> { return questContract.shape.id; } }).brand<'Thing'>();",
      filename: CONTRACT,
    },
    {
      code: "export const thingContract = z.object({ label: z.string().brand<'ThingLabel'>() }).brand<'Thing'>();",
      filename: CONTRACT,
    },
    {
      code: "export const thingContract = z.object({ requestId: z.string().brand<'RequestId'>() }).brand<'Thing'>();",
      filename: CONTRACT,
    },
    {
      code: "export const thingContract = z.object({ sessionId: z.string().brand<'SessionId'>() }).brand<'Thing'>();",
      filename: CONTRACT,
    },
    {
      code: "export const load = ({ questId }: { questId: Quest['id'] }) => questId;",
      filename: BROKER,
    },
    {
      code: 'export const load = ({ label }: { label: string }) => label;',
      filename: BROKER,
    },
    {
      code: 'export const load = ({ requestId }: { requestId: string }) => requestId;',
      filename: BROKER,
    },
    {
      code: 'export const load = ({ sessionId }: { sessionId: string }) => sessionId;',
      filename: BROKER,
    },
    {
      code: 'export const load = ({ questId }: { questId: SomethingElseId }) => questId;',
      filename: BROKER,
    },
    {
      code: 'export const load = ({ questIds }: { questIds: string[] }) => questIds;',
      filename: BROKER,
    },
    {
      code: 'export const load = ({ questId }: { questId: string }) => questId;',
      filename: '/project/packages/alpha/src/brokers/thing/load/thing-load-broker.test.ts',
    },
    {
      code: 'export const load = ({ questId }: { questId: string }) => questId;',
      filename: '/project/packages/alpha/src/brokers/thing/load/thing-load-broker.proxy.ts',
    },
    {
      code: 'export const load = ({ questId }: { questId: string }) => questId;',
      filename: '/project/scripts/load.ts',
    },
    {
      // errors/ may import nothing, so an error's parameter stays plain.
      code: 'export class QuestNotFoundError extends Error { public constructor({ questId }: { questId: string }) { super(questId); } }',
      filename: '/project/packages/alpha/src/errors/quest-not-found/quest-not-found-error.ts',
    },
    {
      code: 'export const load = ({ questId }: { questId: string }) => questId;',
      filename: '/project/packages/nowhere/src/brokers/thing/load/thing-load-broker.ts',
    },
  ],
  invalid: [
    {
      code: 'export const load = ({ questId }: { questId: string }) => questId;',
      filename: BROKER,
      errors: [
        {
          messageId: 'paramNotOwnerType',
          data: { name: 'questId', owner: 'Quest', field: 'id', Owner: 'Quest' },
        },
      ],
      output:
        "import type { Quest } from '@project/beta/contracts';\nexport const load = ({ questId }: { questId: Quest['id'] }) => questId;",
    },
    {
      code: "import { z } from 'zod';\nexport const load = ({ parentQuestId }: { parentQuestId: string | undefined }) => parentQuestId;",
      filename: BROKER,
      errors: [
        {
          messageId: 'paramNotOwnerType',
          data: { name: 'parentQuestId', owner: 'Quest', field: 'id', Owner: 'Quest' },
        },
      ],
      output:
        "import { z } from 'zod';\nimport type { Quest } from '@project/beta/contracts';\nexport const load = ({ parentQuestId }: { parentQuestId: Quest['id'] | undefined }) => parentQuestId;",
    },
    {
      code: "import type { WorkItem } from '@project/beta/contracts';\nexport const load = ({ questId }: { questId: string }) => questId;",
      filename: BROKER,
      errors: [{ messageId: 'paramNotOwnerType' }],
      output:
        "import type { WorkItem, Quest } from '@project/beta/contracts';\nexport const load = ({ questId }: { questId: Quest['id'] }) => questId;",
    },
    {
      code: "import type { Quest } from '@project/beta/contracts';\nexport const load = ({ questId }: { questId: string }) => questId;",
      filename: BROKER,
      errors: [{ messageId: 'paramNotOwnerType' }],
      output:
        "import type { Quest } from '@project/beta/contracts';\nexport const load = ({ questId }: { questId: Quest['id'] }) => questId;",
    },
    {
      code: 'export const load = ({ guildId }: { guildId: string }) => guildId;',
      filename: BROKER,
      errors: [
        {
          messageId: 'paramNotOwnerType',
          data: { name: 'guildId', owner: 'Guild', field: 'id', Owner: 'Guild' },
        },
      ],
      output:
        "import type { Guild } from '../../../contracts/guild/guild-contract';\nexport const load = ({ guildId }: { guildId: Guild['id'] }) => guildId;",
    },
    {
      code: 'export function load({ workItemId }: { workItemId: string }): void {}',
      filename: BROKER,
      errors: [
        {
          messageId: 'paramNotOwnerType',
          data: { name: 'workItemId', owner: 'WorkItem', field: 'id', Owner: 'WorkItem' },
        },
      ],
      output:
        "import type { WorkItem } from '@project/beta/contracts';\nexport function load({ workItemId }: { workItemId: WorkItem['id'] }): void {}",
    },
    {
      code: 'export const load = (questId: string) => questId;',
      filename: BROKER,
      errors: [{ messageId: 'paramNotOwnerType' }],
      output:
        "import type { Quest } from '@project/beta/contracts';\nexport const load = (questId: Quest['id']) => questId;",
    },
    {
      code: 'export const load = ({ questId }: { questId: QuestId }) => questId;',
      filename: BROKER,
      errors: [{ messageId: 'paramNotOwnerType' }],
      output:
        "import type { Quest } from '@project/beta/contracts';\nexport const load = ({ questId }: { questId: Quest['id'] }) => questId;",
    },
    {
      code: "import { z } from 'zod';\nexport const thingContract = z.object({ questId: z.string().brand<'SomeQuestId'>() }).brand<'Thing'>();",
      filename: CONTRACT,
      errors: [
        {
          messageId: 'contractKeyNotReused',
          data: {
            key: 'questId',
            owner: 'Quest',
            field: 'id',
            ownerContract: 'questContract',
          },
        },
      ],
      output:
        "import { z } from 'zod';\nimport { questContract } from '@project/beta/contracts';\nexport const thingContract = z.object({ questId: questContract.shape.id }).brand<'Thing'>();",
    },
    {
      code: "import { z } from 'zod';\nexport const thingContract = z.object({ parentQuestId: questIdContract.optional() }).brand<'Thing'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'contractKeyNotReused' }],
      output:
        "import { z } from 'zod';\nimport { questContract } from '@project/beta/contracts';\nexport const thingContract = z.object({ parentQuestId: questContract.shape.id.optional() }).brand<'Thing'>();",
    },
    {
      code: "import { z } from 'zod';\nexport const thingContract = z.object({ guildId: z.string() }).brand<'Thing'>();",
      filename: CONTRACT,
      errors: [
        {
          messageId: 'contractKeyNotReused',
          data: { key: 'guildId', owner: 'Guild', field: 'id', ownerContract: 'guildContract' },
        },
      ],
      output:
        "import { z } from 'zod';\nimport { guildContract } from '../guild/guild-contract';\nexport const thingContract = z.object({ guildId: guildContract.shape.id }).brand<'Thing'>();",
    },
    {
      code: "import { z } from 'zod';\nexport const thingContract = z.object({ questId: workItemContract.shape.questId }).brand<'Thing'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'contractKeyNotReused' }],
      output:
        "import { z } from 'zod';\nimport { questContract } from '@project/beta/contracts';\nexport const thingContract = z.object({ questId: questContract.shape.id }).brand<'Thing'>();",
    },
    {
      code: "import { z } from 'zod';\nexport const thingContract = z.object({ questId: z.string().default('none') }).brand<'Thing'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'contractKeyNotReused' }],
      output: null,
    },
    {
      code: "export const thingContract = z.object({ get questId(): z.core.$ZodType<string> { return z.string(); } }).brand<'Thing'>();",
      filename: CONTRACT,
      errors: [{ messageId: 'contractKeyNotReused' }],
      output: null,
    },
    {
      code: 'export const questContract = z.object({ parentQuestId: z.string() });',
      filename: '/project/packages/beta/src/contracts/quest/quest-contract.ts',
      errors: [{ messageId: 'contractKeyNotReused' }],
      output: null,
    },
  ],
});
