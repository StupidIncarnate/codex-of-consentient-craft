/**
 * PURPOSE: Proves on a real filesystem that the contract index cache never changes the answer: after
 * a warm build, an edit, an edit that keeps size and mtime, an added file, a deleted file, a corrupt
 * shard, a shard from another schema version and an upgraded @dungeonmaster/shared, the index equals
 * what a build from an empty cache gives for the same tree.
 */
import { installTestbedCreateBroker } from '@dungeonmaster/testing';
import { readdirSync, rmSync, statSync, unlinkSync, utimesSync } from '#gateway/node/fs';

import { contractIndexAssembleBroker } from './contract-index-assemble-broker';

const CACHE_DIR = 'node_modules/.cache/dungeonmaster/contract-index';
const THING_PATH = 'packages/alpha/src/contracts/thing/thing-contract.ts';
const USE_PATH = 'packages/beta/src/brokers/use/use-broker.ts';
const WRAP_PATH = 'packages/beta/src/contracts/wrap/wrap-contract.ts';
const THING_TEXT = [
  "export const thingContract = z.object({ id: z.string().brand<'ThingId'>() }).brand<'Thing'>();",
  'export type Thing = z.infer<typeof thingContract>;',
].join('\n');
const USE_TEXT = [
  "import { thingContract } from '@repo/alpha/contracts';",
  'export const useBroker = (v: unknown) => thingContract.parse(v);',
].join('\n');
const WRAP_TEXT = [
  "import { thingContract } from '@repo/alpha/contracts';",
  "export const wrapContract = z.object({ thing: thingContract }).brand<'Wrap'>();",
].join('\n');
const FIXTURE: readonly (readonly [string, string])[] = [
  ['packages/alpha/package.json', '{"name":"@repo/alpha"}'],
  ['packages/alpha/src/contracts/contracts.ts', "export * from './thing/thing-contract';"],
  [THING_PATH, THING_TEXT],
  ['packages/alpha/src/statics/x/x-statics.ts', 'export const xStatics = { a: 1 } as const;'],
  ['packages/beta/package.json', '{"name":"@repo/beta","dependencies":{"@repo/alpha":"*"}}'],
  [USE_PATH, USE_TEXT],
  [WRAP_PATH, WRAP_TEXT],
  ['packages/beta/node_modules/dep/src/contracts/dep/dep-contract.ts', THING_TEXT],
];

describe('contractIndexAssembleBroker (integration with a real filesystem)', () => {
  it('VALID: {cold then warm} => the warm index equals the cold one and no shard is rewritten', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'contract-index-warm' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = contractIndexAssembleBroker({ rootDir });
    const mtimesBefore = readdirSync(`${rootDir}/${CACHE_DIR}`).map(
      (name) => statSync(`${rootDir}/${CACHE_DIR}/${name}`).modifiedAtMs,
    );

    const warm = contractIndexAssembleBroker({ rootDir });
    const mtimesAfter = readdirSync(`${rootDir}/${CACHE_DIR}`).map(
      (name) => statSync(`${rootDir}/${CACHE_DIR}/${name}`).modifiedAtMs,
    );
    const shards = testbed.listDir({ relativePath: CACHE_DIR });
    testbed.cleanup();

    expect({
      warm,
      mtimesAfter,
      shards,
      summary: cold.map(({ exportedContractNames, isParsed, isWholeParsed, nestedInFiles }) => ({
        exportedContractNames,
        isParsed,
        isWholeParsed,
        nestedIn: nestedInFiles.map((file) => file.slice(rootDir.length + 1)),
      })),
    }).toStrictEqual({
      warm: cold,
      mtimesAfter: mtimesBefore,
      shards: ['@repo__alpha.json', '@repo__beta.json'],
      summary: [
        {
          exportedContractNames: ['thingContract'],
          isParsed: true,
          isWholeParsed: true,
          nestedIn: [WRAP_PATH],
        },
        {
          exportedContractNames: ['wrapContract'],
          isParsed: false,
          isWholeParsed: false,
          nestedIn: [],
        },
      ],
    });
  });

  it('VALID: {an edit, an added file and a deleted file after a warm build} => equals a build from an empty cache', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'contract-index-changes' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    contractIndexAssembleBroker({ rootDir });

    testbed.writeFile({
      relativePath: WRAP_PATH,
      content: `${WRAP_TEXT}\nexport const wrapBroker = (v: unknown) => wrapContract.parse(v);`,
    });
    testbed.writeFile({
      relativePath: 'packages/alpha/src/contracts/gadget/gadget-contract.ts',
      content: "export const gadgetContract = z.string().brand<'Gadget'>();",
    });
    unlinkSync(`${rootDir}/${USE_PATH}`);
    const incremental = contractIndexAssembleBroker({ rootDir });
    rmSync(`${rootDir}/${CACHE_DIR}`, { recursive: true, force: true });
    const fromEmptyCache = contractIndexAssembleBroker({ rootDir });
    testbed.cleanup();

    expect({
      incremental,
      parsed: incremental
        .map(
          ({ exportedContractNames, isParsed }) =>
            `${exportedContractNames.join(',')} ${String(isParsed)}`,
        )
        .sort(),
    }).toStrictEqual({
      incremental: fromEmptyCache,
      parsed: ['gadgetContract false', 'thingContract false', 'wrapContract,wrapBroker false'],
    });
  });

  it('VALID: {an edit that keeps the file size and mtime} => re-reads it and equals a build from an empty cache', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'contract-index-same-stat' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    contractIndexAssembleBroker({ rootDir });
    const before = statSync(`${rootDir}/${USE_PATH}`);
    testbed.writeFile({
      relativePath: USE_PATH,
      content: USE_TEXT.replace('.parse(v)', '.pars3(v)'),
    });
    utimesSync(`${rootDir}/${USE_PATH}`, before.modifiedAtMs / 1000, before.modifiedAtMs / 1000);
    const after = statSync(`${rootDir}/${USE_PATH}`);

    const incremental = contractIndexAssembleBroker({ rootDir });
    rmSync(`${rootDir}/${CACHE_DIR}`, { recursive: true, force: true });
    const fromEmptyCache = contractIndexAssembleBroker({ rootDir });
    testbed.cleanup();

    expect({
      sameSize: after.sizeBytes === before.sizeBytes,
      incremental,
      thingParsed: incremental.map(({ isParsed }) => isParsed),
    }).toStrictEqual({ sameSize: true, incremental: fromEmptyCache, thingParsed: [false, false] });
  });

  it('INVALID: {a truncated shard} => treats it as a miss and rewrites a whole one', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'contract-index-corrupt' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = contractIndexAssembleBroker({ rootDir });
    const shardText = testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__beta.json` });
    testbed.writeFile({
      relativePath: `${CACHE_DIR}/@repo__beta.json`,
      content: String(shardText).slice(0, 50),
    });

    const afterCorruption = contractIndexAssembleBroker({ rootDir });
    const rewritten = testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__beta.json` });
    testbed.cleanup();

    expect({ afterCorruption, rewritten }).toStrictEqual({
      afterCorruption: cold,
      rewritten: shardText,
    });
  });

  it('INVALID: {a shard from another schema version holding a stale read} => ignores the stale read', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'contract-index-version' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = contractIndexAssembleBroker({ rootDir });
    const shardText = String(testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__beta.json` }));
    testbed.writeFile({
      relativePath: `${CACHE_DIR}/@repo__beta.json`,
      content: shardText
        .replace('"schemaVersion":1', '"schemaVersion":0')
        .split('"parseCalls":[{')
        .join('"parseCalls":[],"x":[{'),
    });

    const afterVersionChange = contractIndexAssembleBroker({ rootDir });
    testbed.cleanup();

    expect(afterVersionChange).toStrictEqual(cold);
  });

  it('VALID: {installed @dungeonmaster/shared upgraded after a build} => rewrites the shards under the new version, same index', () => {
    const testbed = installTestbedCreateBroker({ baseName: 'contract-index-shared-upgrade' });
    for (const [relativePath, content] of FIXTURE) {
      testbed.writeFile({ relativePath, content });
    }
    const rootDir = testbed.guildPath;
    const cold = contractIndexAssembleBroker({ rootDir });
    testbed.writeFile({
      relativePath: 'node_modules/@dungeonmaster/shared/package.json',
      content: '{"name":"@dungeonmaster/shared","version":"9.9.9"}',
    });

    const upgraded = contractIndexAssembleBroker({ rootDir });
    const upgradedVersion = /"sharedVersion":"([^"]*)"/u.exec(
      String(testbed.readFile({ relativePath: `${CACHE_DIR}/@repo__alpha.json` })),
    )?.[1];
    testbed.cleanup();

    expect({ upgraded, upgradedVersion }).toStrictEqual({
      upgraded: cold,
      upgradedVersion: '9.9.9',
    });
  });
});
