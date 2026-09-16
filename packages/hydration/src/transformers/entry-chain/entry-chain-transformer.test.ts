import { entryChainTransformer } from './entry-chain-transformer';
import {
  guildIngredient,
  guildFieldsContract,
  questIngredient,
  questFieldsContract,
  sessionIngredient,
  operationIngredient,
} from '../../../test/type-fixtures/dm-target';
import { fromSavedRefTransformer } from '../from-saved-ref/from-saved-ref-transformer';
import { SavedRecordNameStub } from '../../contracts/saved-record-name/saved-record-name.stub';
import { FieldNameStub } from '../../contracts/field-name/field-name.stub';
import type { HydrationOpStub } from '../../contracts/hydration-op/hydration-op.stub';

type HydrationOp = ReturnType<typeof HydrationOpStub>;

describe('entryChainTransformer', () => {
  it('VALID: {a four-ingredient registry} => returns exactly guilds, quests, operations, sessions', () => {
    const dm = entryChainTransformer({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
    });

    expect(Object.keys(dm).sort()).toStrictEqual(['guilds', 'operations', 'quests', 'sessions']);
  });

  it('VALID: {dm.quests.add(1, ...) at top level} => still builds, with no guild ancestor to fill guildId', () => {
    const dm = entryChainTransformer({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
    });

    const result = dm.quests.add(1, (q) => [
      q[0].saveRecordAs({ name: 'orphan' }),
    ]) as unknown as HydrationOp[];

    expect(result).toStrictEqual([
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'quest[0:0]',
        index: 0,
        ancestors: [],
        fields: { title: 'Quest 1' },
      },
      { op: 'saveRecord', ref: 'quest[0:0]', name: 'orphan' },
    ]);
  });

  it('VALID: {a guild holding three quests, one transitioned, a filter removing a minted row, a saved record, a cross-link} => builds the complete op tree', () => {
    const dm = entryChainTransformer({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
    });

    const built = dm.guilds.add(1, (g) => [
      g[0].set({ name: guildFieldsContract.shape.name.parse('Siege') }),
      g[0].saveRecordAs({ name: 'guild' }),
      g[0].sessions.add(1, (s) => [s[0].saveRecordAs({ name: 'origin' })]),
      g[0].quests.add(3, (q, all) => [
        all.set({
          userRequest: fromSavedRefTransformer({
            name: SavedRecordNameStub({ value: 'origin' }),
            field: FieldNameStub({ value: 'sessionId' }),
          }),
        }),
        q[0].set({
          status: 'underway',
          title: questFieldsContract.shape.title.parse('The running one'),
        }),
        q[2].saveRecordAs({ name: 'third' }),
      ]),
      g[0].quests.filter({ where: { status: 'queued' } }).remove(),
    ]) as unknown as HydrationOp[];

    expect(built).toStrictEqual([
      { op: 'create', ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [], fields: {} },
      { op: 'set', ref: 'guild[0:0]', written: { name: 'Siege' } },
      { op: 'saveRecord', ref: 'guild[0:0]', name: 'guild' },
      {
        op: 'create',
        ingredient: 'session',
        ref: 'guild[0:0]/session[0:0]',
        index: 0,
        ancestors: ['guild[0:0]'],
        fields: {},
      },
      { op: 'saveRecord', ref: 'guild[0:0]/session[0:0]', name: 'origin' },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'guild[0:0]/quest[0:0]',
        index: 0,
        ancestors: ['guild[0:0]'],
        fields: { title: 'Quest 1' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'guild[0:0]/quest[0:1]',
        index: 1,
        ancestors: ['guild[0:0]'],
        fields: { title: 'Quest 2' },
      },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'guild[0:0]/quest[0:2]',
        index: 2,
        ancestors: ['guild[0:0]'],
        fields: { title: 'Quest 3' },
      },
      {
        op: 'set',
        ref: 'guild[0:0]/quest[0:0]',
        written: { userRequest: { __savedRef: true, name: 'origin', field: 'sessionId' } },
      },
      {
        op: 'set',
        ref: 'guild[0:0]/quest[0:1]',
        written: { userRequest: { __savedRef: true, name: 'origin', field: 'sessionId' } },
      },
      {
        op: 'set',
        ref: 'guild[0:0]/quest[0:2]',
        written: { userRequest: { __savedRef: true, name: 'origin', field: 'sessionId' } },
      },
      {
        op: 'set',
        ref: 'guild[0:0]/quest[0:0]',
        written: { title: 'The running one' },
        transition: { field: 'status', to: 'underway' },
      },
      { op: 'saveRecord', ref: 'guild[0:0]/quest[0:2]', name: 'third' },
      {
        op: 'filter',
        ingredient: 'quest',
        scope: 'guild[0:0]',
        where: { status: 'queued' },
        expect: 'some',
        matchedRef: 'guild[0:0]/quest[match]',
        ops: [{ op: 'remove', ref: 'guild[0:0]/quest[match]' }],
      },
    ]);
  });

  it('VALID: {the same recipe built twice} => produces byte-identical ops', () => {
    const firstBuild = entryChainTransformer({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
    }).guilds.add(1, (g) => [
      g[0].set({ name: guildFieldsContract.shape.name.parse('Siege') }),
      g[0].quests.add(2, (q) => [
        q[0].set({
          status: 'underway',
          title: questFieldsContract.shape.title.parse('The running one'),
        }),
      ]),
    ]) as unknown as HydrationOp[];

    const secondBuild = entryChainTransformer({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
    }).guilds.add(1, (g) => [
      g[0].set({ name: guildFieldsContract.shape.name.parse('Siege') }),
      g[0].quests.add(2, (q) => [
        q[0].set({
          status: 'underway',
          title: questFieldsContract.shape.title.parse('The running one'),
        }),
      ]),
    ]) as unknown as HydrationOp[];

    expect(firstBuild).toStrictEqual(secondBuild);
  });

  it('VALID: {a guild holding a quest holding an operation, three levels deep} => the operation create carries a correctly-built ref and ancestors', () => {
    const dm = entryChainTransformer({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
    });

    const built = dm.guilds.add(1, (g) => [
      g[0].quests.add(1, (q) => [
        q[0].operations.add(1, (o) => [o[0].saveRecordAs({ name: 'op' })]),
      ]),
    ]) as unknown as HydrationOp[];

    expect(built).toStrictEqual([
      { op: 'create', ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [], fields: {} },
      {
        op: 'create',
        ingredient: 'quest',
        ref: 'guild[0:0]/quest[0:0]',
        index: 0,
        ancestors: ['guild[0:0]'],
        fields: { title: 'Quest 1' },
      },
      {
        op: 'create',
        ingredient: 'operation',
        ref: 'guild[0:0]/quest[0:0]/operation[0:0]',
        index: 0,
        ancestors: ['guild[0:0]', 'guild[0:0]/quest[0:0]'],
        fields: {},
      },
      { op: 'saveRecord', ref: 'guild[0:0]/quest[0:0]/operation[0:0]', name: 'op' },
    ]);
  });

  it('VALID: {two top-level add(1, ...) calls of the same ingredient} => mint two guilds with distinct references', () => {
    const dm = entryChainTransformer({
      registry: {
        guilds: guildIngredient,
        quests: questIngredient,
        operations: operationIngredient,
        sessions: sessionIngredient,
      },
    });

    const firstGuild = dm.guilds.add(1, (g) => [
      g[0].saveRecordAs({ name: 'a' }),
    ]) as unknown as HydrationOp[];
    const secondGuild = dm.guilds.add(1, (g) => [
      g[0].saveRecordAs({ name: 'b' }),
    ]) as unknown as HydrationOp[];

    expect([...firstGuild, ...secondGuild]).toStrictEqual([
      { op: 'create', ingredient: 'guild', ref: 'guild[0:0]', index: 0, ancestors: [], fields: {} },
      { op: 'saveRecord', ref: 'guild[0:0]', name: 'a' },
      { op: 'create', ingredient: 'guild', ref: 'guild[1:0]', index: 0, ancestors: [], fields: {} },
      { op: 'saveRecord', ref: 'guild[1:0]', name: 'b' },
    ]);
  });
});
