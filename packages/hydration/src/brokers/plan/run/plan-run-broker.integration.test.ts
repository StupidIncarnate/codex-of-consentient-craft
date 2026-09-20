import {
  fileTargetHarness,
  fileTargetHarness as createFileTarget,
} from '../../../../test/harnesses/file-target/file-target.harness';
import { apiTargetHarness } from '../../../../test/harnesses/api-target/api-target.harness';
import { planRunBroker } from './plan-run-broker';
import { collectionChainTransformer } from '../../../transformers/collection-chain/collection-chain-transformer';
import {
  questIngredient,
  questFieldsContract,
  operationIngredient,
} from '../../../../test/type-fixtures/dm-target';
import { HydrationPlanStub } from '../../../contracts/hydration-plan/hydration-plan.stub';
import { OpCreateStub } from '../../../contracts/op-create/op-create.stub';
import { OpSaveRecordStub } from '../../../contracts/op-save-record/op-save-record.stub';
import { IngredientConfigStub } from '../../../contracts/ingredient-config/ingredient-config.stub';
import { LinkSpecStub } from '../../../contracts/link-spec/link-spec.stub';
import { HydrationTargetStub } from '../../../contracts/hydration-target/hydration-target.stub';
import type { HydrationOpStub } from '../../../contracts/hydration-op/hydration-op.stub';
import { fsEnsureWriteAdapter } from '../../../adapters/fs/ensure-write/fs-ensure-write-adapter';
import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';
import { HydrationWriteFailedError } from '../../../errors/hydration-write-failed/hydration-write-failed-error';
import { HydrationRouteFailedError } from '../../../errors/hydration-route-failed/hydration-route-failed-error';

type IngredientConfigData = ReturnType<typeof IngredientConfigStub>;
type HydrationOp = ReturnType<typeof HydrationOpStub>;

// Real disk throughout — no adapter is mocked. `plan-run-broker.test.ts` beside this one hands the
// walk real FUNCTIONS over an in-memory map, which proves link resolution, ordering and the fold;
// it cannot prove a byte landed anywhere, that a missing parent gets created, or that a real EACCES
// names its path. This suite is what the specification's "a caller with no base URL can only run
// ingredients that declare a write route" rests on: every target below carries no `baseUrl`, so the
// pre-flight accepts these plans on `write` routes alone.
describe('planRunBroker (integration — real disk)', () => {
  const harness = fileTargetHarness();

  it('VALID: {a plan whose write route lands three directories deep, none present} => every parent is created and the file holds the row', async () => {
    const questConfig = IngredientConfigStub({
      name: 'quest',
      routes: {
        write: async (): Promise<unknown> => {
          await fsEnsureWriteAdapter({
            filePath: harness.absolutePath({ relativePath: 'guilds/g1/quests/q1/quest.json' }),
            content: FileContentsStub({
              value: JSON.stringify({ id: 'q1', title: 'The running one' }),
            }),
          });
          return { id: 'q1', title: 'The running one' };
        },
      },
    });

    await planRunBroker({
      plan: HydrationPlanStub({
        ops: [OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', ancestors: [], fields: {} })],
      }),
      target: harness.target(),
      ingredients: [questConfig],
    });

    expect(harness.readJson({ relativePath: 'guilds/g1/quests/q1/quest.json' })).toStrictEqual({
      id: 'q1',
      title: 'The running one',
    });
  });

  it('ERROR: {write route into a read-only directory} => the message names the real path', async () => {
    harness.denyWrites({ relativePath: 'locked' });
    const lockedQuestJsonPath = harness.absolutePath({ relativePath: 'locked/quest.json' });
    const questConfig = IngredientConfigStub({
      name: 'quest',
      routes: {
        write: async (): Promise<unknown> => {
          await fsEnsureWriteAdapter({
            filePath: lockedQuestJsonPath,
            content: FileContentsStub({ value: JSON.stringify({ id: 'q1', title: 'Quest 1' }) }),
          });
          return { id: 'q1', title: 'Quest 1' };
        },
      },
    });

    await expect(
      planRunBroker({
        plan: HydrationPlanStub({
          ops: [
            OpCreateStub({ ingredient: 'quest', ref: 'quest[0:0]', ancestors: [], fields: {} }),
          ],
        }),
        target: harness.target(),
        ingredients: [questConfig],
      }),
    ).rejects.toStrictEqual(
      new HydrationWriteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        path: lockedQuestJsonPath,
        cause: new Error(`EACCES: permission denied, open '${lockedQuestJsonPath}'`),
      }),
    );
  });

  it('VALID: {two guild creates read-modify-writing ONE config.json} => the file holds both ids', async () => {
    await fsEnsureWriteAdapter({
      filePath: harness.absolutePath({ relativePath: 'config.json' }),
      content: FileContentsStub({ value: JSON.stringify({ guilds: [] }) }),
    });
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: {
        write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
          const existing = harness.readJson({ relativePath: 'config.json' }) as Record<
            string,
            unknown
          >;
          const priorGuilds = existing.guilds as string[];
          await fsEnsureWriteAdapter({
            filePath: harness.absolutePath({ relativePath: 'config.json' }),
            content: FileContentsStub({
              value: JSON.stringify({ guilds: [...priorGuilds, fields.title] }),
            }),
          });
          return { id: fields.title, title: fields.title };
        },
      },
    });

    // The runner's walk is a serial `.reduce()` chain (D6), never `Promise.all` — that is what
    // keeps this read-modify-write from losing one of the two writes.
    await planRunBroker({
      plan: HydrationPlanStub({
        ops: [
          OpCreateStub({
            ingredient: 'guild',
            ref: 'guild[0:0]',
            ancestors: [],
            fields: { title: 'guild[0]' },
          }),
          OpCreateStub({
            ingredient: 'guild',
            ref: 'guild[0:1]',
            ancestors: [],
            fields: { title: 'guild[1]' },
          }),
        ],
      }),
      target: harness.target(),
      ingredients: [guildConfig],
    });

    expect(harness.readJson({ relativePath: 'config.json' })).toStrictEqual({
      guilds: ['guild[0]', 'guild[1]'],
    });
  });

  it('ERROR: {the second create fails} => the first row is still on disk', async () => {
    harness.denyWrites({ relativePath: 'locked' });
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: {
        write: async (): Promise<unknown> => {
          await fsEnsureWriteAdapter({
            filePath: harness.absolutePath({ relativePath: 'guilds/g1.json' }),
            content: FileContentsStub({ value: JSON.stringify({ id: 'g1', title: 'Guild' }) }),
          });
          return { id: 'g1', title: 'Guild' };
        },
      },
    });
    const questConfig = IngredientConfigStub({
      name: 'quest',
      links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
      routes: {
        write: async (): Promise<unknown> => {
          await fsEnsureWriteAdapter({
            filePath: harness.absolutePath({ relativePath: 'locked/quest.json' }),
            content: FileContentsStub({ value: JSON.stringify({ id: 'q1', title: 'Quest' }) }),
          });
          return { id: 'q1', title: 'Quest' };
        },
      },
    });

    // No try/catch that cleans up (D7): the runner's only catch classifies the failure and
    // re-throws. The guild's row is never removed, and reading it back after the rejection is the
    // only way to see that the framework implements no undo.
    await expect(
      planRunBroker({
        plan: HydrationPlanStub({
          ops: [
            OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
            OpCreateStub({
              ingredient: 'quest',
              ref: 'guild[0:0]/quest[0:0]',
              ancestors: ['guild[0:0]'],
              fields: {},
            }),
          ],
        }),
        target: harness.target(),
        ingredients: [guildConfig, questConfig],
      }),
    ).rejects.toThrow(HydrationWriteFailedError);

    expect(harness.readJson({ relativePath: 'guilds/g1.json' })).toStrictEqual({
      id: 'g1',
      title: 'Guild',
    });
  });

  it('VALID: {dm.quests.under({guildId}).add(1, q => [q[0].operations.add(1, () => [])])} => the minted grandchild carries the supplied guildId on disk', async () => {
    const questRunConfig = IngredientConfigStub({
      name: 'quest',
      links: [LinkSpecStub({ of: 'guild', as: 'guildId' })],
      routes: {
        write: async (): Promise<unknown> => Promise.resolve({ id: 'q1', title: 'Quest 1' }),
      },
    });
    const operationRunConfig = IngredientConfigStub({
      name: 'operation',
      links: [
        LinkSpecStub({ of: 'quest', as: 'questId' }),
        LinkSpecStub({ of: 'guild', as: 'guildId' }),
      ],
      routes: {
        write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
          await fsEnsureWriteAdapter({
            filePath: harness.absolutePath({ relativePath: 'operation.json' }),
            content: FileContentsStub({ value: JSON.stringify(fields) }),
          });
          return { id: 'op1', title: 'Operation 1' };
        },
      },
    });

    const quests = collectionChainTransformer<
      typeof questIngredient,
      { quests: typeof questIngredient; operations: typeof operationIngredient }
    >({
      registry: { quests: questIngredient, operations: operationIngredient },
      ingredientConfig: questIngredient as unknown as IngredientConfigData,
      ancestors: [],
      ancestorNames: [],
    });

    const ops = quests
      .under({ guildId: questFieldsContract.shape.guildId.parse('guild-1') })
      .add(1, (q) => [q[0].operations.add(1, () => [])]) as unknown as HydrationOp[];

    await planRunBroker({
      plan: HydrationPlanStub({ ops }),
      target: harness.target(),
      ingredients: [questRunConfig, operationRunConfig],
    });

    expect(harness.readJson({ relativePath: 'operation.json' })).toStrictEqual({
      guildId: 'guild-1',
      questId: 'q1',
    });
  });

  describe('determinism — the comparison mechanism rests on this', () => {
    const homeA = fileTargetHarness();
    const homeB = fileTargetHarness();

    it('VALID: {one plan run twice, against two fresh homes} => produces the same bytes', async () => {
      const guildConfigA = IngredientConfigStub({
        name: 'guild',
        routes: {
          write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
            await fsEnsureWriteAdapter({
              filePath: homeA.absolutePath({ relativePath: 'guilds/g1.json' }),
              content: FileContentsStub({
                value: JSON.stringify({ id: fields.title, title: fields.title }),
              }),
            });
            return { id: fields.title, title: fields.title };
          },
        },
      });
      const guildConfigB = IngredientConfigStub({
        name: 'guild',
        routes: {
          write: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
            await fsEnsureWriteAdapter({
              filePath: homeB.absolutePath({ relativePath: 'guilds/g1.json' }),
              content: FileContentsStub({
                value: JSON.stringify({ id: fields.title, title: fields.title }),
              }),
            });
            return { id: fields.title, title: fields.title };
          },
        },
      });

      await planRunBroker({
        plan: HydrationPlanStub({
          ops: [
            OpCreateStub({
              ingredient: 'guild',
              ref: 'guild[0:0]',
              ancestors: [],
              fields: { title: 'guild[0]' },
            }),
          ],
        }),
        target: homeA.target(),
        ingredients: [guildConfigA],
      });
      await planRunBroker({
        plan: HydrationPlanStub({
          ops: [
            OpCreateStub({
              ingredient: 'guild',
              ref: 'guild[0:0]',
              ancestors: [],
              fields: { title: 'guild[0]' },
            }),
          ],
        }),
        target: homeB.target(),
        ingredients: [guildConfigB],
      });

      expect({
        a: homeA.read({ relativePath: 'guilds/g1.json' }),
        b: homeB.read({ relativePath: 'guilds/g1.json' }),
      }).toStrictEqual({
        a: JSON.stringify({ id: 'guild[0]', title: 'guild[0]' }),
        b: JSON.stringify({ id: 'guild[0]', title: 'guild[0]' }),
      });
    });
  });
});

// Real sockets throughout — no `fetch` mock, and no injected route that fabricates a rejection
// string. `plan-run-broker.test.ts` beside this one proves the runner classifies WHATEVER an `api`
// route throws; it cannot prove the OS really refuses a connection or that a real server's body
// survives into the thrown message verbatim. This is what sad-path rows 1 and 2 rest on.
describe('planRunBroker (integration — real api routes)', () => {
  const harness = apiTargetHarness();

  it('VALID: {api route answers 201 with a record the contract accepts} => the saved row is the real server’s parsed body', async () => {
    harness.answerNext({ status: 201, body: '{"id":"g1","title":"Siege"}' });
    const url = harness.url({ path: '/api/guilds' });
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: {
        api: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
          const response = await fetchPostAdapter({ url, fields });
          return JSON.parse(response.body) as unknown;
        },
      },
    });

    const result = await planRunBroker({
      plan: HydrationPlanStub({
        ops: [
          OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          OpSaveRecordStub({ ref: 'guild[0:0]', name: 'guild' }),
        ],
      }),
      target: harness.target(),
      ingredients: [guildConfig],
    });

    expect(result).toStrictEqual({ guild: { id: 'g1', title: 'Siege' } });
  });

  it('ERROR: {api route rejects with a real ECONNREFUSED} => throws HydrationRouteFailedError naming the real url', async () => {
    const refusedUrl = harness.refusedUrl({ path: '/api/guilds' });
    const escapedUrl = refusedUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: {
        api: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> =>
          fetchPostAdapter({ url: refusedUrl, fields }),
      },
    });

    await expect(
      planRunBroker({
        plan: HydrationPlanStub({
          ops: [
            OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          ],
        }),
        target: HydrationTargetStub({ baseUrl: refusedUrl }),
        ingredients: [guildConfig],
      }),
    ).rejects.toThrow(
      new RegExp(
        `^recipe "guild-mid-execution": ingredient "guild"'s "api" route at ${escapedUrl} refused the connection: Error: POST ${escapedUrl} refused: connect ECONNREFUSED 127\\.0\\.0\\.1:\\d+$`,
        'u',
      ),
    );
  });

  it('ERROR: {api route answers 500 with a real body} => the message carries the response body verbatim', async () => {
    harness.answerNext({ status: 500, body: '{"error":"database unavailable"}' });
    const url = harness.url({ path: '/api/guilds' });
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: {
        api: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
          const response = await fetchPostAdapter({ url, fields });
          throw Object.assign(new Error(`answered ${String(response.status)}`), {
            url: response.url,
            status: response.status,
            body: response.body,
          });
        },
      },
    });

    await expect(
      planRunBroker({
        plan: HydrationPlanStub({
          ops: [
            OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          ],
        }),
        target: harness.target(),
        ingredients: [guildConfig],
      }),
    ).rejects.toStrictEqual(
      new HydrationRouteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        url,
        status: 500,
        responseBody: '{"error":"database unavailable"}',
        cause: null,
      }),
    );
  });

  it('ERROR: {api route answers 2xx with a body record rejects} => throws HydrationRecordShapeError naming the real missing field', async () => {
    harness.answerNext({ status: 201, body: '{"title":"Siege"}' });
    const url = harness.url({ path: '/api/guilds' });
    const guildConfig = IngredientConfigStub({
      name: 'guild',
      routes: {
        api: async ({ fields }: { fields: Record<string, unknown> }): Promise<unknown> => {
          const response = await fetchPostAdapter({ url, fields });
          return JSON.parse(response.body) as unknown;
        },
      },
    });

    await expect(
      planRunBroker({
        plan: HydrationPlanStub({
          ops: [
            OpCreateStub({ ingredient: 'guild', ref: 'guild[0:0]', ancestors: [], fields: {} }),
          ],
        }),
        target: harness.target(),
        ingredients: [guildConfig],
      }),
    ).rejects.toThrow(
      /^recipe "guild-mid-execution": ingredient "guild"'s "api" route answered 2xx with a record that field "id" rejects: Required$/u,
    );
  });
});

// Moved from `test/harnesses/file-target/file-target.harness.integration.test.ts` — that suite sat
// under `test/`, which this package's jest config never discovers, so it never ran despite being
// correct. What it guards is real: a permission restore that throws must not skip the cleanup that
// discards the throwaway home, because discarding that home is the framework's entire rollback
// story for a file-backed target.
describe('fileTargetHarness', () => {
  describe('afterEach()', () => {
    it('VALID: {a permission restore throws} => still removes the temporary home', () => {
      // Aliased on import so the ts-jest harness-lifecycle transformer's `*Harness()` name match
      // skips this call — this test drives `beforeEach`/`afterEach` manually, inside the test body,
      // to assert the throw-then-cleanup sequence together. The transformer would otherwise wrap a
      // bare `fileTargetHarness()` in `__wireHarnessLifecycle`, which registers jest's global
      // `beforeEach`/`afterEach` — a call jest refuses from inside a running test.
      const manualHarness = createFileTarget();
      manualHarness.beforeEach();
      manualHarness.denyWrites({ relativePath: 'locked' });
      // Removing the denied directory before teardown forces its own `chmodSync` restore to throw
      // ENOENT — the real failure mode the fix has to survive, produced with no mocking.
      manualHarness.removeDirectory({ relativePath: 'locked' });

      expect(() => {
        manualHarness.afterEach();
      }).toThrow(/ENOENT/u);
      expect(manualHarness.exists({ relativePath: '' })).toBe(false);
    });
  });
});
