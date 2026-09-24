import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { SpecHashStub } from '../../../contracts/spec-hash/spec-hash.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';
import { laneSpecHashBroker } from '../../lane-spec/hash/lane-spec-hash-broker';

import { profileReadBroker } from './profile-read-broker';
import { profileReadBrokerProxy } from './profile-read-broker.proxy';

const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const WEB_SPEC = SpecNameStub({ value: 'stack' });
const HEADLESS_SPEC = SpecNameStub({ value: 'api' });
const BEAT_MS = 1_757_808_000_000;

// The digests are REAL: laneSpecHashBrokerProxy stages nothing, so each spec's profile directory is
// its genuine content hash — which is what makes "a changed spec reads a different directory" a
// property of the tree rather than of a stub.
const specHashFor = async ({
  specName,
}: {
  specName: ReturnType<typeof SpecNameStub>;
}): Promise<ReturnType<typeof SpecHashStub>> =>
  SpecHashStub({
    value: String(laneSpecHashBroker({ spec: await laneSpecFindBroker({ specName }) })),
  });

const profilesPathFor = async ({
  specName,
}: {
  specName: ReturnType<typeof SpecNameStub>;
}): Promise<ReturnType<typeof FilePathStub>> =>
  FilePathStub({
    value: `${ROOT_PATH_VALUE}/profiles/${String(await specHashFor({ specName }))}`,
  });

describe('profileReadBroker', () => {
  describe('a spec nothing has ever run', () => {
    it('EMPTY: {no samples, no boots} => answers honestly rather than inventing a figure', async () => {
      const proxy = profileReadBrokerProxy();
      const profilesPath = await profilesPathFor({ specName: HEADLESS_SPEC });
      proxy.setupProfileTree({ profilesPath, sampleFileNames: [], bootFileNames: [] });

      const result = await profileReadBroker({ specName: HEADLESS_SPEC });

      expect(result).toStrictEqual({
        specName: 'api',
        processes: 1,
        hash: String(await specHashFor({ specName: HEADLESS_SPEC })),
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
    });
  });

  describe('processes counts the browser', () => {
    it('VALID: {stack, which boots api, vite and chromium} => processes is 3', async () => {
      const proxy = profileReadBrokerProxy();
      proxy.stageLaneSpec({
        processes: [
          {
            name: 'api',
            command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
            portRole: 'api',
            readyPath: '/api/guilds',
          },
          {
            name: 'web',
            command: 'npx vite preview --strictPort',
            portRole: 'web',
            readyPath: '/',
          },
        ],
      });
      const profilesPath = await profilesPathFor({ specName: WEB_SPEC });
      proxy.setupProfileTree({ profilesPath, sampleFileNames: [], bootFileNames: [] });

      const result = await profileReadBroker({ specName: WEB_SPEC });

      expect(result).toStrictEqual({
        specName: 'stack',
        processes: 3,
        hash: String(await specHashFor({ specName: WEB_SPEC })),
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });
    });
  });

  describe('a measured profile', () => {
    it('VALID: {two solo runs and one contended} => two sample groups, fromRuns 3, a mean bootMs and a measuredAt date', async () => {
      const proxy = profileReadBrokerProxy();
      proxy.stageLaneSpec({
        processes: [
          {
            name: 'api',
            command: 'npm run dev:no-watch --workspace=@dungeonmaster/server',
            portRole: 'api',
            readyPath: '/api/guilds',
          },
          {
            name: 'web',
            command: 'npx vite preview --strictPort',
            portRole: 'web',
            readyPath: '/',
          },
        ],
      });
      const profilesPath = await profilesPathFor({ specName: WEB_SPEC });
      const hash = String(await specHashFor({ specName: WEB_SPEC }));
      proxy.setupProfileTree({
        profilesPath,
        sampleFileNames: ['inst_aaaa1111.json', 'inst_bbbb2222.json', 'inst_cccc3333.json'],
        bootFileNames: ['inst_aaaa1111.json', 'inst_bbbb2222.json'],
      });
      proxy.stageSampleRecord({
        profilesPath,
        fileName: 'inst_aaaa1111.json',
        json: JSON.stringify({
          instanceId: 'inst_aaaa1111',
          specHash: hash,
          firstBeatAtMs: BEAT_MS,
          measuredAtMs: BEAT_MS + 60_000,
          pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 3600, steadyBeats: 2 }],
        }),
      });
      proxy.stageSampleRecord({
        profilesPath,
        fileName: 'inst_bbbb2222.json',
        json: JSON.stringify({
          instanceId: 'inst_bbbb2222',
          specHash: hash,
          firstBeatAtMs: BEAT_MS,
          measuredAtMs: BEAT_MS + 120_000,
          pools: [{ poolSize: 1, peakMB: 2500, steadySumMB: 3700, steadyBeats: 2 }],
        }),
      });
      proxy.stageSampleRecord({
        profilesPath,
        fileName: 'inst_cccc3333.json',
        json: JSON.stringify({
          instanceId: 'inst_cccc3333',
          specHash: hash,
          firstBeatAtMs: BEAT_MS,
          measuredAtMs: BEAT_MS + 30_000,
          pools: [{ poolSize: 3, peakMB: 2810, steadySumMB: 3840, steadyBeats: 2 }],
        }),
      });
      proxy.stageBootRecord({
        profilesPath,
        fileName: 'inst_aaaa1111.json',
        json: JSON.stringify({
          instanceId: 'inst_aaaa1111',
          specHash: hash,
          bootMs: 20_000,
          recordedAtMs: BEAT_MS,
        }),
      });
      proxy.stageBootRecord({
        profilesPath,
        fileName: 'inst_bbbb2222.json',
        json: JSON.stringify({
          instanceId: 'inst_bbbb2222',
          specHash: hash,
          bootMs: 21_001,
          recordedAtMs: BEAT_MS,
        }),
      });

      const result = await profileReadBroker({ specName: WEB_SPEC });

      expect(result).toStrictEqual({
        specName: 'stack',
        processes: 3,
        hash,
        measuredAt: '2025-09-14',
        fromRuns: 3,
        bootMs: 20_500,
        samples: [
          { poolSize: 1, steadyMB: 1825, peakMB: 2600, runs: 2 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 1 },
        ],
      });
    });
  });

  describe('a record that will not parse', () => {
    it('ERROR: {one corrupt sample beside one good one} => folds the good one and reports the skip on stderr', async () => {
      const proxy = profileReadBrokerProxy();
      const profilesPath = await profilesPathFor({ specName: HEADLESS_SPEC });
      const hash = String(await specHashFor({ specName: HEADLESS_SPEC }));
      proxy.setupProfileTree({
        profilesPath,
        sampleFileNames: ['inst_aaaa1111.json', 'inst_bbbb2222.json'],
        bootFileNames: [],
      });
      proxy.stageSampleRecord({
        profilesPath,
        fileName: 'inst_aaaa1111.json',
        json: JSON.stringify({
          instanceId: 'inst_aaaa1111',
          specHash: hash,
          firstBeatAtMs: BEAT_MS,
          measuredAtMs: BEAT_MS,
          pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 }],
        }),
      });
      proxy.stageSampleRecord({
        profilesPath,
        fileName: 'inst_bbbb2222.json',
        json: '{"instanceId": "not-an-instance-id"}',
      });

      const result = await profileReadBroker({ specName: HEADLESS_SPEC });

      expect(result).toStrictEqual({
        specName: 'api',
        processes: 1,
        hash,
        measuredAt: '2025-09-14',
        fromRuns: 1,
        bootMs: null,
        samples: [{ poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 1 }],
      });
      expect(proxy.getStderrMessages().map((message) => message.split(':')[0])).toStrictEqual([
        `[profile-read] skipping an unreadable profile record at ${ROOT_PATH_VALUE}/profiles/${hash}/samples/inst_bbbb2222.json`,
      ]);
    });
  });

  describe('a file that is not a record', () => {
    it('EDGE: {a stray README beside one record} => reads only the .json records', async () => {
      const proxy = profileReadBrokerProxy();
      const profilesPath = await profilesPathFor({ specName: HEADLESS_SPEC });
      const hash = String(await specHashFor({ specName: HEADLESS_SPEC }));
      proxy.setupProfileTree({
        profilesPath,
        sampleFileNames: ['README.md', 'inst_aaaa1111.json'],
        bootFileNames: [],
      });
      proxy.stageSampleRecord({
        profilesPath,
        fileName: 'inst_aaaa1111.json',
        json: JSON.stringify({
          instanceId: 'inst_aaaa1111',
          specHash: hash,
          firstBeatAtMs: BEAT_MS,
          measuredAtMs: BEAT_MS,
          pools: [{ poolSize: 2, peakMB: 2700, steadySumMB: 1850, steadyBeats: 1 }],
        }),
      });

      const result = await profileReadBroker({ specName: HEADLESS_SPEC });

      expect(result).toStrictEqual({
        specName: 'api',
        processes: 1,
        hash,
        measuredAt: '2025-09-14',
        fromRuns: 1,
        bootMs: null,
        samples: [{ poolSize: 2, steadyMB: 1850, peakMB: 2700, runs: 1 }],
      });
    });
  });
});
