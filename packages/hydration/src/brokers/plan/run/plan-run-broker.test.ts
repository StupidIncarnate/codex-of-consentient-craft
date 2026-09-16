import { planRunBroker } from './plan-run-broker';
import { planRunBrokerProxy } from './plan-run-broker.proxy';
import { HydrationPlanStub } from '../../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../../contracts/op-create/op-create.stub';
import { OpSaveRecordStub } from '../../../contracts/op-save-record/op-save-record.stub';
import { OpSetStub } from '../../../contracts/op-set/op-set.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { TransitionSpecStub } from '../../../contracts/transition-spec/transition-spec.stub';
import { LinkSpecStub } from '../../../contracts/link-spec/link-spec.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRouteUnavailableError } from '../../../errors/hydration-route-unavailable/hydration-route-unavailable-error';
import { HydrationRouteFailedError } from '../../../errors/hydration-route-failed/hydration-route-failed-error';
import { HydrationWriteFailedError } from '../../../errors/hydration-write-failed/hydration-write-failed-error';

describe('planRunBroker', () => {
  // A real route never sees the `ref` it is filling in — it only receives `{ target, fields }` —
  // so every ordering assertion below bakes the ref into a `marker` field the route echoes into a
  // shared array, standing in for "which op actually ran, and in what order". Every returned
  // record carries both `id` and `title`: IngredientConfigStub's own default `record` contract
  // requires both, and these tests reuse that default rather than declaring a new zod schema —
  // only `contracts/` files may import `zod` at all.
  describe('the walk — depth-first, in declaration order', () => {
    it('VALID: {two sibling adds} => the routes ran in declaration order', async () => {
      planRunBrokerProxy();
      const recorded: string[] = [];
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: {
          write: ({ fields }: { fields: Record<string, unknown> }): unknown => {
            recorded.push(fields.marker as string);
            return { id: 'g1', title: 'Guild' };
          },
        },
      });
      const questConfig = IngredientConfigStub({
        name: 'quest',
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        routes: {
          write: ({ fields }: { fields: Record<string, unknown> }): unknown => {
            recorded.push(fields.marker as string);
            return { id: fields.marker, title: 'Quest' };
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'guild',
            ref: 'guild[0:0]',
            ancestors: [],
            fields: { marker: 'guild[0:0]' },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            fields: { marker: 'guild[0:0]/quest[0:0]' },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:1]',
            ancestors: ['guild[0:0]'],
            fields: { marker: 'guild[0:0]/quest[0:1]' },
          }),
        ],
      });

      await planRunBroker({
        plan,
        target: HydrationTargetStub({}),
        ingredients: [guildConfig, questConfig],
      });

      expect(recorded).toStrictEqual([
        'guild[0:0]',
        'guild[0:0]/quest[0:0]',
        'guild[0:0]/quest[0:1]',
      ]);
    });

    it('VALID: {a quest under a guild} => the quest route received guildId from the guild’s record', async () => {
      planRunBrokerProxy();
      let questFields: unknown = null;
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: { write: (): unknown => ({ id: 'g1', title: 'Guild' }) },
      });
      const questConfig = IngredientConfigStub({
        name: 'quest',
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        routes: {
          write: ({ fields }: { fields: Record<string, unknown> }): unknown => {
            questFields = fields;
            return { id: 'q1', title: 'Quest 1' };
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            fields: { title: 'Quest 1' },
          }),
        ],
      });

      await planRunBroker({
        plan,
        target: HydrationTargetStub({}),
        ingredients: [guildConfig, questConfig],
      });

      expect(questFields).toStrictEqual({ title: 'Quest 1', guildId: 'g1' });
    });

    it('VALID: {add(3) with defaults} => the three routes received Quest 1, Quest 2, Quest 3', async () => {
      planRunBrokerProxy();
      const recorded: string[] = [];
      const questConfig = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: ({ fields }: { fields: Record<string, unknown> }): unknown => {
            recorded.push(fields.title as string);
            return { id: fields.title, title: fields.title };
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            ancestors: [],
            fields: { title: 'Quest 1' },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:1]',
            ancestors: [],
            fields: { title: 'Quest 2' },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:2]',
            ancestors: [],
            fields: { title: 'Quest 3' },
          }),
        ],
      });

      await planRunBroker({ plan, target: HydrationTargetStub({}), ingredients: [questConfig] });

      expect(recorded).toStrictEqual(['Quest 1', 'Quest 2', 'Quest 3']);
    });

    // The index is scoped to its OWN `add` call — two separate `add(2, …)` calls both see indexes
    // 0 and 1, which is why the reference folds in the CALL index (`quest[0:…]` vs `quest[1:…]`)
    // while the baked `defaults(index)` values repeat.
    it('VALID: {two separate add(2) calls} => each sees indexes 0 and 1', async () => {
      planRunBrokerProxy();
      const recorded: string[] = [];
      const questConfig = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: ({ fields }: { fields: Record<string, unknown> }): unknown => {
            recorded.push(fields.title as string);
            return { id: fields.title, title: fields.title };
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            ancestors: [],
            fields: { title: 'Quest 1' },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:1]',
            ancestors: [],
            fields: { title: 'Quest 2' },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[1:0]',
            ancestors: [],
            fields: { title: 'Quest 1' },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[1:1]',
            ancestors: [],
            fields: { title: 'Quest 2' },
          }),
        ],
      });

      await planRunBroker({ plan, target: HydrationTargetStub({}), ingredients: [questConfig] });

      expect(recorded).toStrictEqual(['Quest 1', 'Quest 2', 'Quest 1', 'Quest 2']);
    });
  });

  describe('the output — flat, one key per saveRecordAs', () => {
    it('VALID: {saveRecordAs on two rows} => the result is exactly those two keys', async () => {
      planRunBrokerProxy();
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: { write: (): unknown => ({ id: 'g1', title: 'Guild' }) },
      });
      const questConfig = IngredientConfigStub({
        name: 'quest',
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        routes: {
          write: ({ fields }: { fields: Record<string, unknown> }): unknown => ({
            id: 'q1',
            ...fields,
          }),
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          OpSaveRecordStub({ ref: 'guild[0:0]', name: 'guild' }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            fields: { title: 'Quest 1' },
          }),
          OpSaveRecordStub({ ref: 'guild[0:0]/quest[0:0]', name: 'quest' }),
        ],
      });

      const result = await planRunBroker({
        plan,
        target: HydrationTargetStub({}),
        ingredients: [guildConfig, questConfig],
      });

      // `guildId` does not survive into the saved record: `IngredientConfigStub`'s default
      // `record` schema is `{id, title}` with no `.passthrough()`, and zod strips any key an
      // `z.object` does not declare — the same reason a real ingredient's `record` contract must
      // name every field `saveRecordAs` is expected to hand back.
      expect(result).toStrictEqual({
        guild: { id: 'g1', title: 'Guild' },
        quest: { id: 'q1', title: 'Quest 1' },
      });
    });
  });

  describe('the walk is serial — row 9', () => {
    it('VALID: {two create ops recording start and end} => the recorded order is start:0, end:0, start:1, end:1', async () => {
      planRunBrokerProxy();
      const recorded: string[] = [];
      const questConfig = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
            recorded.push(`start:${String(fields.idx)}`);
            await new Promise((resolve) => {
              setTimeout(resolve, 5);
            });
            recorded.push(`end:${String(fields.idx)}`);
            return { id: String(fields.idx), title: 'Q' };
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:0]',
            ancestors: [],
            fields: { idx: 0 },
          }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'quest[0:1]',
            ancestors: [],
            fields: { idx: 1 },
          }),
        ],
      });

      await planRunBroker({ plan, target: HydrationTargetStub({}), ingredients: [questConfig] });

      expect(recorded).toStrictEqual(['start:0', 'end:0', 'start:1', 'end:1']);
    });
  });

  describe('a route throws — sad-path rows 1 and 4', () => {
    it('ERROR: {api route rejects} => throws HydrationRouteFailedError', async () => {
      planRunBrokerProxy();
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: {
          api: (): unknown => {
            throw new Error('connect ECONNREFUSED 127.0.0.1:1');
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} })],
      });

      await expect(
        planRunBroker({
          plan,
          target: HydrationTargetStub({ baseUrl: 'http://127.0.0.1:1' }),
          ingredients: [guildConfig],
        }),
      ).rejects.toThrow(HydrationRouteFailedError);
    });

    it('ERROR: {write route rejects EACCES} => throws HydrationWriteFailedError naming the path', async () => {
      planRunBrokerProxy();
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: {
          write: (): unknown => {
            throw Object.assign(new Error('EACCES: permission denied'), {
              path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
            });
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} })],
      });

      await expect(
        planRunBroker({ plan, target: HydrationTargetStub({}), ingredients: [guildConfig] }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "guild"'s write route failed writing "\/home\/user\/\.dungeonmaster\/guilds\/foo\/guild\.json": Error: EACCES: permission denied$/u,
      );
    });
  });

  describe('no undo — a failed plan leaves what already landed', () => {
    it('ERROR: {the second create fails} => the first route still ran to completion', async () => {
      planRunBrokerProxy();
      const recorded: string[] = [];
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: {
          write: (): unknown => {
            recorded.push('guild');
            return { id: 'g1', title: 'Guild' };
          },
        },
      });
      const questConfig = IngredientConfigStub({
        name: 'quest',
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        routes: {
          write: (): unknown => {
            throw new Error('boom');
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            fields: {},
          }),
        ],
      });

      await expect(
        planRunBroker({
          plan,
          target: HydrationTargetStub({}),
          ingredients: [guildConfig, questConfig],
        }),
      ).rejects.toThrow(HydrationWriteFailedError);
      expect(recorded).toStrictEqual(['guild']);
    });
  });

  describe('the walk halts — a mid-batch failure does not continue to what follows it', () => {
    it('ERROR: {three sibling creates, the second throws} => the third never runs', async () => {
      planRunBrokerProxy();
      const recorded: string[] = [];
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: {
          write: (): unknown => {
            recorded.push('guild');
            return { id: 'g1', title: 'Guild' };
          },
        },
      });
      const questConfig = IngredientConfigStub({
        name: 'quest',
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        routes: {
          write: (): unknown => {
            throw new Error('boom');
          },
        },
      });
      const operationConfig = IngredientConfigStub({
        name: 'operation',
        links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
        routes: {
          write: (): unknown => {
            recorded.push('operation');
            return { id: 'op1', title: 'Operation' };
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          OpCreateStub({
            ingredient: 'quest',
            ref: 'guild[0:0]/quest[0:0]',
            ancestors: ['guild[0:0]'],
            fields: {},
          }),
          OpCreateStub({
            ingredient: 'operation',
            ref: 'guild[0:0]/operation[0:0]',
            ancestors: ['guild[0:0]'],
            fields: {},
          }),
        ],
      });

      // A `.reduce()` chain that continued past the quest's rejection would still reach the
      // operation op — the same shape a `for…of` loop with `await` inside would produce if its own
      // early return were missed. Asserting `recorded` has no `'operation'` entry is the only way
      // to see the difference between "refused before the next op" and "refused, then kept going".
      await expect(
        planRunBroker({
          plan,
          target: HydrationTargetStub({}),
          ingredients: [guildConfig, questConfig, operationConfig],
        }),
      ).rejects.toThrow(HydrationWriteFailedError);
      expect(recorded).toStrictEqual(['guild']);
    });
  });

  describe('a set carrying a transition — chunk 5, walked through the full runner', () => {
    it('VALID: {create a quest, then transition its status} => the saved record carries what reach produced', async () => {
      planRunBrokerProxy();
      let receivedFrom: unknown = 'not called';
      const questConfig = IngredientConfigStub({
        name: 'quest',
        transitions: TransitionSpecStub({
          field: 'status',
          to: ['created', 'in_progress'],
          reach: (args: { from: unknown }): unknown => {
            receivedFrom = args.from;
            return { id: 'q1', title: 'Quest 1', status: 'in_progress' };
          },
        }),
        routes: { write: (): unknown => ({ id: 'q1', title: 'Quest 1' }) },
      });
      const plan = HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', ancestors: [], fields: {} }),
          OpSetStub({
            ref: 'quest[0:0]',
            written: {},
            transition: { field: 'status', to: 'in_progress' },
          }),
          OpSaveRecordStub({ ref: 'quest[0:0]', name: 'quest' }),
        ],
      });

      const result = await planRunBroker({
        plan,
        target: HydrationTargetStub({}),
        ingredients: [questConfig],
      });

      // The write route's own record ({id, title}) carries no `status` — a legal `from` for a row
      // a `write` route just created with no status at all.
      expect(receivedFrom).toBe(undefined);
      expect(result).toStrictEqual({
        quest: { id: 'q1', title: 'Quest 1', status: 'in_progress' },
      });
    });
  });

  describe('the pre-flight refuses before the first write', () => {
    it('INVALID: {an api-only ingredient and no baseUrl} => throws before any route runs', async () => {
      planRunBrokerProxy();
      const recorded: string[] = [];
      const guildConfig = IngredientConfigStub({
        name: 'guild',
        routes: {
          api: (): unknown => {
            recorded.push('guild');
            return { id: 'g1', title: 'Guild' };
          },
        },
      });
      const plan = HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} })],
      });

      await expect(
        planRunBroker({ plan, target: HydrationTargetStub({}), ingredients: [guildConfig] }),
      ).rejects.toThrow(HydrationRouteUnavailableError);
      expect(recorded).toStrictEqual([]);
    });
  });
});
