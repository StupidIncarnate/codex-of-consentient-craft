/**
 * PURPOSE: Proves on a real filesystem that the owner index cache never changes the answer: after
 * a cold build, a warm build, an edit, an edit that keeps size and mtime, an added file, a deleted
 * file, a corrupt shard, a shard from another schema version, an upgraded @dungeonmaster/shared and
 * a half-written temp file, the index equals what a build from an empty cache gives for the same
 * tree; and a shard rewrite clears temp files over an hour old.
 */
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { readdirSync, rmSync, statSync, unlinkSync, utimesSync } from '#gateway/node/fs';

import { OwnerIndexPackageStub } from '../../../contracts/owner-index-package/owner-index-package.stub';
import { ownerIndexFromSourcesTransformer } from '../../../transformers/owner-index-from-sources/owner-index-from-sources-transformer';
import { ownerIndexAssembleBroker } from './owner-index-assemble-broker';

const CACHE_DIR = 'node_modules/.cache/dungeonmaster/owner-index';
const THING_PATH = 'packages/alpha/src/contracts/thing/thing-contract.ts';
const OTHER_ID_PATH = 'packages/beta/src/contracts/other-id/other-id-contract.ts';
const MODE_PATH = 'packages/beta/src/contracts/mode/mode-contract.ts';
const THING_TEXT = [
  'export const thingContract = z.object({',
  "  id: z.string().brand<'ThingId'>(),",
  '  otherId: otherIdContract,',
  '});',
  'export type Thing = z.infer<typeof thingContract>;',
].join('\n');
const OTHER_ID_TEXT = "export const otherIdContract = z.string().brand<'OtherId'>();";
// Unbranded, so beta's two files each add to a different list and the index does not depend on
// the order the filesystem lists them in.
const MODE_TEXT = "export const modeContract = z.enum(['slow', 'fast']);";
const FIXTURE: readonly (readonly [string, string])[] = [
  ['packages/alpha/package.json', '{"name":"@repo/alpha","dependencies":{"@repo/beta":"*"}}'],
  [THING_PATH, THING_TEXT],
  [
    'packages/alpha/src/contracts/thing/thing-part-layer-contract.ts',
    "export const thingPartLayerContract = z.object({ id: z.string().brand<'ThingPartId'>() });",
  ],
  ['packages/alpha/src/contracts/thing/thing-contract.test.ts', THING_TEXT],
  ['packages/beta/package.json', '{"name":"@repo/beta"}'],
  [OTHER_ID_PATH, OTHER_ID_TEXT],
  [MODE_PATH, MODE_TEXT],
  ['packages/beta/node_modules/dep/src/contracts/dep/dep-contract.ts', THING_TEXT],
];

describe('ownerIndexAssembleBroker (integration with a real filesystem)', () => {
  it('VALID: {cold cache} => writes one shard per package and equals the index built from the sources directly', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-cold' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;

    const cold = ownerIndexAssembleBroker({ rootDir });
    const reference = ownerIndexFromSourcesTransformer({
      rootDir,
      packages: [
        OwnerIndexPackageStub({
          name: '@repo/alpha',
          dir: `${rootDir}/packages/alpha`,
          dependencies: ['@repo/beta'],
        }),
        OwnerIndexPackageStub({ name: '@repo/beta', dir: `${rootDir}/packages/beta` }),
      ],
      sources: [
        { filePath: `${rootDir}/${THING_PATH}`, text: THING_TEXT },
        { filePath: `${rootDir}/${MODE_PATH}`, text: MODE_TEXT },
        { filePath: `${rootDir}/${OTHER_ID_PATH}`, text: OTHER_ID_TEXT },
      ],
    });
    const shards = testbed.listDir({ relativePath: CACHE_DIR });
    testbed.cleanup();

    expect({ cold, shards }).toStrictEqual({
      cold: reference,
      shards: ['@repo__alpha.json', '@repo__beta.json'],
    });
  });

  it('VALID: {warm cache} => equals the cold index and rewrites no shard', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-warm' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = ownerIndexAssembleBroker({ rootDir });
    const shardMtimesBefore = readdirSync(`${rootDir}/${CACHE_DIR}`).map(
      (name) => statSync(`${rootDir}/${CACHE_DIR}/${name}`).modifiedAtMs,
    );

    const warm = ownerIndexAssembleBroker({ rootDir });
    const shardMtimesAfter = readdirSync(`${rootDir}/${CACHE_DIR}`).map(
      (name) => statSync(`${rootDir}/${CACHE_DIR}/${name}`).modifiedAtMs,
    );
    testbed.cleanup();

    expect({ warm, shardMtimesAfter }).toStrictEqual({
      warm: cold,
      shardMtimesAfter: shardMtimesBefore,
    });
  });

  it('VALID: {an edit, an added file and a deleted file after a warm build} => equals a build from an empty cache', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-changes' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    ownerIndexAssembleBroker({ rootDir });

    testbed.writeFile({
      relativePath: THING_PATH,
      content: THING_TEXT.replace("brand<'ThingId'>", "brand<'ThingKey'>"),
    });
    testbed.writeFile({
      relativePath: 'packages/alpha/src/contracts/gadget/gadget-contract.ts',
      content: "export const gadgetContract = z.object({ id: z.string().brand<'GadgetId'>() });",
    });
    unlinkSync(`${rootDir}/${MODE_PATH}`);
    const incremental = ownerIndexAssembleBroker({ rootDir });
    rmSync(`${rootDir}/${CACHE_DIR}`, { recursive: true, force: true });
    const fromEmptyCache = ownerIndexAssembleBroker({ rootDir });
    testbed.cleanup();

    expect({
      matchesEmptyCacheBuild: incremental,
      ownerBrands: incremental.owners
        .map(({ ownerName, fields }) =>
          [ownerName, ...fields.map(({ brandText }) => brandText)].join(' '),
        )
        .sort(),
      enums: incremental.enums,
    }).toStrictEqual({
      matchesEmptyCacheBuild: fromEmptyCache,
      ownerBrands: ['Gadget GadgetId', 'Thing ThingKey OtherId'],
      enums: [],
    });
  });

  it('INVALID: {a truncated shard} => treats it as a miss, equals the cold index and rewrites a whole shard', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-corrupt' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = ownerIndexAssembleBroker({ rootDir });
    const shardText = testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__alpha.json` });
    testbed.writeFile({
      relativePath: `${CACHE_DIR}/@repo__alpha.json`,
      content: String(shardText).slice(0, 40),
    });

    const afterCorruption = ownerIndexAssembleBroker({ rootDir });
    const rewritten = testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__alpha.json` });
    testbed.cleanup();

    expect({ afterCorruption, rewritten }).toStrictEqual({
      afterCorruption: cold,
      rewritten: shardText,
    });
  });

  it('INVALID: {a shard from another schema version holding a stale read} => ignores the stale read', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-version' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = ownerIndexAssembleBroker({ rootDir });
    const shardText = String(testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__alpha.json` }));
    testbed.writeFile({
      relativePath: `${CACHE_DIR}/@repo__alpha.json`,
      content: shardText
        .replace('"schemaVersion":2', '"schemaVersion":0')
        .replace("brand<'ThingId'>", "brand<'StaleId'>")
        .replace('"brandText":"ThingId"', '"brandText":"StaleId"'),
    });

    const afterVersionChange = ownerIndexAssembleBroker({ rootDir });
    testbed.cleanup();

    expect(afterVersionChange).toStrictEqual(cold);
  });

  it('EDGE: {a half-written temp file beside a shard} => reads the shard, never the temp file', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-tmp' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = ownerIndexAssembleBroker({ rootDir });
    testbed.writeFile({
      relativePath: `${CACHE_DIR}/@repo__alpha.json.4242-0.tmp`,
      content: '{"schemaVersion":2,"packageName":"@repo/al',
    });

    const withTempFile = ownerIndexAssembleBroker({ rootDir });
    const listed = testbed.listDir({ relativePath: CACHE_DIR });
    testbed.cleanup();

    expect({ withTempFile, listed }).toStrictEqual({
      withTempFile: cold,
      listed: ['@repo__alpha.json', '@repo__alpha.json.4242-0.tmp', '@repo__beta.json'],
    });
  });

  it('VALID: {an edit that keeps the file size and mtime} => re-parses it and equals a build from an empty cache', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-same-stat' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    ownerIndexAssembleBroker({ rootDir });
    const before = statSync(`${rootDir}/${THING_PATH}`);
    testbed.writeFile({
      relativePath: THING_PATH,
      content: THING_TEXT.replace("brand<'ThingId'>", "brand<'ThingXy'>"),
    });
    utimesSync(`${rootDir}/${THING_PATH}`, before.modifiedAtMs / 1000, before.modifiedAtMs / 1000);
    const after = statSync(`${rootDir}/${THING_PATH}`);

    const incremental = ownerIndexAssembleBroker({ rootDir });
    rmSync(`${rootDir}/${CACHE_DIR}`, { recursive: true, force: true });
    const fromEmptyCache = ownerIndexAssembleBroker({ rootDir });
    testbed.cleanup();

    expect({
      sameSize: after.sizeBytes === before.sizeBytes,
      incremental,
      thingBrands: incremental.owners.map(({ fields }) => fields.map(({ brandText }) => brandText)),
    }).toStrictEqual({
      sameSize: true,
      incremental: fromEmptyCache,
      thingBrands: [['ThingXy', 'OtherId']],
    });
  });

  it('VALID: {installed @dungeonmaster/shared upgraded after a build} => rewrites every shard under the new version, same index', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-shared-upgrade' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = ownerIndexAssembleBroker({ rootDir });
    const coldVersion = /"sharedVersion":"([^"]*)"/u.exec(
      String(testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__beta.json` })),
    )?.[1];
    testbed.writeFile({
      relativePath: 'node_modules/@dungeonmaster/shared/package.json',
      content: '{"name":"@dungeonmaster/shared","version":"9.9.9"}',
    });

    const upgraded = ownerIndexAssembleBroker({ rootDir });
    const upgradedVersion = /"sharedVersion":"([^"]*)"/u.exec(
      String(testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__beta.json` })),
    )?.[1];
    testbed.cleanup();

    expect({ upgraded, coldVersion, upgradedVersion }).toStrictEqual({
      upgraded: cold,
      coldVersion: '',
      upgradedVersion: '9.9.9',
    });
  });

  it('VALID: {a shard rewrite beside a temp file over an hour old and a young one} => removes only the old one', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'owner-index-stale-tmp' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    ownerIndexAssembleBroker({ rootDir });
    testbed.writeFile({ relativePath: `${CACHE_DIR}/@repo__alpha.json.1111-0.tmp`, content: '{' });
    testbed.writeFile({ relativePath: `${CACHE_DIR}/@repo__alpha.json.2222-0.tmp`, content: '{' });
    const twoHoursAgoSeconds =
      (statSync(`${rootDir}/${THING_PATH}`).modifiedAtMs - 7_200_000) / 1000;
    utimesSync(
      `${rootDir}/${CACHE_DIR}/@repo__alpha.json.1111-0.tmp`,
      twoHoursAgoSeconds,
      twoHoursAgoSeconds,
    );
    testbed.writeFile({
      relativePath: THING_PATH,
      content: THING_TEXT.replace("brand<'ThingId'>", "brand<'ThingKey'>"),
    });

    ownerIndexAssembleBroker({ rootDir });
    const listed = testbed.listDir({ relativePath: CACHE_DIR });
    testbed.cleanup();

    expect(listed).toStrictEqual([
      '@repo__alpha.json',
      '@repo__alpha.json.2222-0.tmp',
      '@repo__beta.json',
    ]);
  });
});
