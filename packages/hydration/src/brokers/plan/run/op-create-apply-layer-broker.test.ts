import { opCreateApplyLayerBroker } from './op-create-apply-layer-broker';
import { opCreateApplyLayerBrokerProxy } from './op-create-apply-layer-broker.proxy';
import { OpCreateStub } from '../../../contracts/op-create/op-create.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { LinkSpecStub } from '../../../contracts/link-spec/link-spec.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import { HydrationRunStateStub } from '../../../contracts/hydration-run-state/hydration-run-state.stub';
import { RowRefStub } from '../../../contracts/row-ref/row-ref.stub';
import { SavedRefStub } from '../../../contracts/saved-ref/saved-ref.stub';
import { HydrationRecordShapeError } from '../../../errors/hydration-record-shape/hydration-record-shape-error';
import { HydrationRouteFailedError } from '../../../errors/hydration-route-failed/hydration-route-failed-error';

describe('opCreateApplyLayerBroker', () => {
  describe('links — filling foreign keys from ancestor records', () => {
    it('VALID: {a create with two links} => the route received both ids', async () => {
      opCreateApplyLayerBrokerProxy();
      let receivedFields: unknown = null;
      const config = IngredientConfigStub({
        name: 'operation',
        links: [
          LinkSpecStub({ of: 'quest', as: 'questId' }),
          LinkSpecStub({ of: 'guild', as: 'guildId' }),
        ],
        routes: {
          write: ({ fields }: { fields: unknown }): unknown => {
            receivedFields = fields;
            return { id: 'op1', title: 'Op 1' };
          },
        },
      });
      const state = HydrationRunStateStub({});
      state.records.set(RowRefStub({ value: 'guild[0:0]' }), { id: 'g1' });
      state.records.set(RowRefStub({ value: 'quest[0:0]' }), { id: 'q1' });
      const op = OpCreateStub({
        ingredient: 'operation',
        ref: 'guild[0:0]/quest[0:0]/operation[0:0]',
        ancestors: ['guild[0:0]', 'quest[0:0]'],
        fields: { role: 'riftcarver' },
      });

      await opCreateApplyLayerBroker({
        op,
        target: HydrationTargetStub({}),
        config,
        route: 'write',
        state,
      });

      expect(receivedFields).toStrictEqual({ role: 'riftcarver', questId: 'q1', guildId: 'g1' });
    });
  });

  describe('cross-links — resolving a fromSaved before the route is called', () => {
    it('VALID: {a create whose fields carry a SavedRef} => the route received the resolved value', async () => {
      opCreateApplyLayerBrokerProxy();
      let receivedFields: unknown = null;
      const config = IngredientConfigStub({
        name: 'quest',
        routes: {
          write: ({ fields }: { fields: unknown }): unknown => {
            receivedFields = fields;
            return { id: 'q1', title: 'Quest 1' };
          },
        },
      });
      const state = HydrationRunStateStub({});
      state.saved.set('origin' as never, { sessionId: 's1' });
      const op = OpCreateStub({
        ingredient: 'quest',
        ref: 'quest[0:0]',
        ancestors: [],
        fields: { userRequest: SavedRefStub({ name: 'origin', field: 'sessionId' }) },
      });

      await opCreateApplyLayerBroker({
        op,
        target: HydrationTargetStub({}),
        config,
        route: 'write',
        state,
      });

      expect(receivedFields).toStrictEqual({ userRequest: 's1' });
    });
  });

  describe('a successful route — the record lands in state', () => {
    it('VALID: {a write route resolving a record} => state.records holds the parsed record under op.ref', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: { write: (): unknown => ({ id: 'g1', title: 'Siege' }) },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await opCreateApplyLayerBroker({
        op,
        target: HydrationTargetStub({}),
        config,
        route: 'write',
        state,
      });

      expect(state.records.get(RowRefStub({ value: 'guild[0:0]' }))).toStrictEqual({
        id: 'g1',
        title: 'Siege',
      });
    });
  });

  describe('a route returning a shape `record` rejects — row 3, and D3’s undefined case', () => {
    it('ERROR: {route returns {title: "Siege"} for a record needing id} => throws HydrationRecordShapeError naming "id"', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: { write: (): unknown => ({ title: 'Siege' }) },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await expect(
        opCreateApplyLayerBroker({
          op,
          target: HydrationTargetStub({}),
          config,
          route: 'write',
          state,
        }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "guild"'s write route returned a record that field "id" rejects: Required$/u,
      );
    });

    it('ERROR: {route returns undefined} => throws HydrationRecordShapeError', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: { write: (): unknown => undefined },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await expect(
        opCreateApplyLayerBroker({
          op,
          target: HydrationTargetStub({}),
          config,
          route: 'write',
          state,
        }),
      ).rejects.toThrow(HydrationRecordShapeError);
    });
  });

  describe('the write route fails — sad-path row 4', () => {
    it('ERROR: {write route rejects EACCES} => throws HydrationWriteFailedError naming the real path', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: {
          write: (): unknown => {
            throw Object.assign(new Error('EACCES: permission denied'), {
              path: '/home/user/.dungeonmaster/guilds/foo/guild.json',
              code: 'EACCES',
            });
          },
        },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await expect(
        opCreateApplyLayerBroker({
          op,
          target: HydrationTargetStub({}),
          config,
          route: 'write',
          state,
        }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "guild"'s write route failed writing "\/home\/user\/\.dungeonmaster\/guilds\/foo\/guild\.json": Error: EACCES: permission denied$/u,
      );
    });
  });

  describe('the api route fails — sad-path rows 1 and 2', () => {
    it('ERROR: {api route rejects with a bare Error carrying no url} => names the failure honestly, with no fabricated URL', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: {
          api: (): unknown => {
            throw new Error('connect ECONNREFUSED 127.0.0.1:1');
          },
        },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await expect(
        opCreateApplyLayerBroker({
          op,
          target: HydrationTargetStub({}),
          config,
          route: 'api',
          state,
        }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "guild"'s "api" route failed with no URL known: Error: connect ECONNREFUSED 127\.0\.0\.1:1$/u,
      );
    });

    it('ERROR: {api route rejects with a connection-refusal that carries the url it tried} => names the ingredient, the route and the URL', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: {
          api: (): unknown => {
            throw Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3737'), {
              url: 'http://localhost:3737/api/guilds',
            });
          },
        },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await expect(
        opCreateApplyLayerBroker({
          op,
          target: HydrationTargetStub({}),
          config,
          route: 'api',
          state,
        }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "guild"'s "api" route at http:\/\/localhost:3737\/api\/guilds refused the connection: Error: connect ECONNREFUSED 127\.0\.0\.1:3737$/u,
      );
    });

    it('ERROR: {api route rejects with an HttpResponse-shaped cause} => throws HydrationRouteFailedError', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: {
          api: (): unknown => {
            throw Object.assign(new Error('database unavailable'), {
              url: 'http://localhost:3737/api/guilds',
              status: 500,
              body: '{"error":"database unavailable"}',
            });
          },
        },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await expect(
        opCreateApplyLayerBroker({
          op,
          target: HydrationTargetStub({}),
          config,
          route: 'api',
          state,
        }),
      ).rejects.toThrow(HydrationRouteFailedError);
    });

    it('ERROR: {api route rejects with an HttpResponse-shaped cause} => carries the url, status and body verbatim', async () => {
      opCreateApplyLayerBrokerProxy();
      const config = IngredientConfigStub({
        name: 'guild',
        routes: {
          api: (): unknown => {
            throw Object.assign(new Error('database unavailable'), {
              url: 'http://localhost:3737/api/guilds',
              status: 500,
              body: '{"error":"database unavailable"}',
            });
          },
        },
      });
      const state = HydrationRunStateStub({});
      const op = OpCreateStub({
        ingredient: 'guild',
        ref: 'guild[0:0]',
        ancestors: [],
        fields: {},
      });

      await expect(
        opCreateApplyLayerBroker({
          op,
          target: HydrationTargetStub({}),
          config,
          route: 'api',
          state,
        }),
      ).rejects.toThrow(
        /^recipe "guild-mid-execution": ingredient "guild"'s "api" route at http:\/\/localhost:3737\/api\/guilds answered 500 with body: \{"error":"database unavailable"\}$/u,
      );
    });
  });
});
