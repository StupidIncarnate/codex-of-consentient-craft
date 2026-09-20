import { hydrationCreateBroker } from './hydration-create-broker';
import { hydrationCreateBrokerProxy } from './hydration-create-broker.proxy';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { HydrationPlanStub } from '../../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../../contracts/op-create/op-create.stub';
import type { DmTarget } from '../../../../test/type-fixtures/dm-target';
import type { SqlTarget } from '../../../../test/type-fixtures/sql-target';

type IngredientConfigData = ReturnType<typeof IngredientConfigStub>;

describe('hydrationCreateBroker', () => {
  it('VALID: {createHydration<DmTarget>()} => returns exactly ingredient, registry, recipe, run, listing', () => {
    hydrationCreateBrokerProxy();

    const dm = hydrationCreateBroker<DmTarget>();

    expect(Object.keys(dm).sort()).toStrictEqual([
      'ingredient',
      'listing',
      'recipe',
      'registry',
      'run',
    ]);
  });

  // Generics bypassed via `as never`, matching `ingredientDeclareBroker`'s own valid-declaration
  // test — the TYPE-LEVEL proof that `dm.ingredient({...})` compiles against a real DmTarget
  // ingredient already lives in `test/type-fixtures/dm-target.ts`'s own successful compilation;
  // this test is about RUNTIME behaviour: the TTarget binding reaches `ingredientDeclareBroker`.
  it('VALID: {the returned ingredient} => declares a quest against a home-directory target', () => {
    hydrationCreateBrokerProxy();

    const dm = hydrationCreateBroker<DmTarget>();

    const quest = dm.ingredient({
      name: 'quest',
      description: 'one quest under a guild, at whatever status you set it to',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      links: [{ of: 'guild', as: 'guildId' }],
      routes: { write: (): unknown => undefined },
      copies: 'questPersistBroker',
    } as never) as unknown as IngredientConfigData;

    expect({ name: quest.name, links: quest.links }).toStrictEqual({
      name: 'quest',
      links: [{ of: 'guild', as: 'guildId' }],
    });
  });

  it('VALID: {createHydration<SqlTarget>()} => declares a post against a transaction target', () => {
    hydrationCreateBrokerProxy();

    const blog = hydrationCreateBroker<SqlTarget>();

    const post = blog.ingredient({
      name: 'post',
      description: 'one post owned by a user, at whatever status you set it to',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      links: [{ of: 'user', as: 'authorId' }],
      routes: { write: (): unknown => undefined },
      copies: 'PostService.create',
    } as never) as unknown as IngredientConfigData;

    expect({ name: post.name, links: post.links }).toStrictEqual({
      name: 'post',
      links: [{ of: 'user', as: 'authorId' }],
    });
  });

  // D1: `run` reads the ingredients THIS binding's own `registry()` call was handed — never a
  // hand-passed list — so a plan's `create` op resolves its ingredient purely from having been
  // registered through the same `dm`.
  it('VALID: {run(plan, target)} => resolves a plan’s create op against what registry() was handed', async () => {
    hydrationCreateBrokerProxy();
    const dm = hydrationCreateBroker<DmTarget>();
    let receivedFields: unknown = null;
    const guild = dm.ingredient({
      name: 'guild',
      description: 'a guild the server has registered',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      routes: {
        write: ({ fields }: { fields: unknown }): unknown => {
          receivedFields = fields;
          return { id: 'g1', title: 'Siege' };
        },
      },
      copies: 'guildAddBroker',
    } as never);
    dm.registry({ guilds: guild } as never);
    const plan = HydrationPlanStub({
      ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} })],
    });

    await dm.run(plan, { home: '/tmp/dm' } as never);

    expect(receivedFields).toStrictEqual({});
  });

  // D1 again, for `listing`: both `runs` and `makes` read the same `registeredIngredients`
  // closure `registry()` populated on THIS `dm`, so the assertion proves the closure is read
  // rather than that a parameter was forwarded.
  it('VALID: {a plan over two write-route ingredients} => listing().runs is {serverless: true}', () => {
    hydrationCreateBrokerProxy();
    const dm = hydrationCreateBroker<DmTarget>();
    const guild = dm.ingredient({
      name: 'guild',
      description: 'a guild the server has registered',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      routes: { write: (): unknown => undefined },
      copies: 'guildAddBroker',
    } as never);
    const quest = dm.ingredient({
      name: 'quest',
      description: 'one quest under a guild, at whatever status you set it to',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      links: [{ of: 'guild', as: 'guildId' }],
      routes: { write: (): unknown => undefined },
      copies: 'questPersistBroker',
    } as never);
    dm.registry({ guilds: guild, quests: quest } as never);
    const plan = HydrationPlanStub({
      ops: [
        OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
        OpCreateStub({
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:0]',
          index: 0,
          ancestors: ['guild[0:0]'],
        }),
      ],
    });

    const { runs } = dm.listing(plan);

    expect(runs).toStrictEqual({ serverless: true });
  });

  it('VALID: {a plan whose only created ingredient declares an api route, not write} => listing().runs is {serverless: false, needsServerFor: "guild"}', () => {
    hydrationCreateBrokerProxy();
    const dm = hydrationCreateBroker<DmTarget>();
    const guild = dm.ingredient({
      name: 'guild',
      description: 'a guild the server has registered',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      routes: { api: (): unknown => undefined },
    } as never);
    dm.registry({ guilds: guild } as never);
    const plan = HydrationPlanStub({
      ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] })],
    });

    const { runs } = dm.listing(plan);

    expect(runs).toStrictEqual({ serverless: false, needsServerFor: 'guild' });
  });

  it('VALID: {a plan making one guild and three quests} => listing().makes is the complete array, in declaration order', () => {
    hydrationCreateBrokerProxy();
    const dm = hydrationCreateBroker<DmTarget>();
    const guild = dm.ingredient({
      name: 'guild',
      description: 'a guild the server has registered',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      routes: { write: (): unknown => undefined },
      copies: 'guildAddBroker',
    } as never);
    const quest = dm.ingredient({
      name: 'quest',
      description: 'one quest under a guild, at whatever status you set it to',
      fields: IngredientConfigStub().fields,
      record: IngredientConfigStub().record,
      links: [{ of: 'guild', as: 'guildId' }],
      routes: { write: (): unknown => undefined },
      copies: 'questPersistBroker',
    } as never);
    dm.registry({ guilds: guild, quests: quest } as never);
    const plan = HydrationPlanStub({
      ops: [
        OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] }),
        OpCreateStub({
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:0]',
          index: 0,
          ancestors: ['guild[0:0]'],
        }),
        OpCreateStub({
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:1]',
          index: 1,
          ancestors: ['guild[0:0]'],
        }),
        OpCreateStub({
          ingredient: 'quest',
          ref: 'guild[0:0]/quest[0:2]',
          index: 2,
          ancestors: ['guild[0:0]'],
        }),
      ],
    });

    const { makes } = dm.listing(plan);

    expect(makes).toStrictEqual([
      { ingredient: 'guild', count: 1 },
      { ingredient: 'quest', count: 3 },
    ]);
  });

  // The empty-closure case: nothing was ever registered, so `listing` sees exactly the failure
  // `run` would — every created ingredient has no config to check and reports needing a server.
  it('ERROR: {listing() from a binding whose registry() was never called} => runs reports needsServerFor for the first created ingredient', () => {
    hydrationCreateBrokerProxy();
    const dm = hydrationCreateBroker<DmTarget>();
    const plan = HydrationPlanStub({
      ops: [OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [] })],
    });

    const { runs } = dm.listing(plan);

    expect(runs).toStrictEqual({ serverless: false, needsServerFor: 'guild' });
  });
});
