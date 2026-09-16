import {
  AbsoluteFilePathStub,
  ContentTextStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';

import { CompareQueryStub } from '../../../contracts/compare-query/compare-query.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { RunIndexStub } from '../../../contracts/run-index/run-index.stub';
import { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { ShotListingStub } from '../../../contracts/shot-listing/shot-listing.stub';

import { compareReadBroker } from './compare-read-broker';
import { compareReadBrokerProxy } from './compare-read-broker.proxy';

describe('compareReadBroker', () => {
  describe('signed index deltas', () => {
    it('VALID: {runA 0 console errors, runB 2} => console.errors "+2", server.errors "+0", network.non2xx "+1"', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });

      proxy.setupInstance({
        entry: RegistryEntryStub({ id: instanceId, guildId, state: 'killed' }),
      });
      const evidencePath = proxy.evidencePathFor({ instanceId, guildId });
      proxy.setupRun({
        evidencePath,
        runId: runA,
        result: RunResultStub({
          instanceId,
          runId: runA,
          index: RunIndexStub({
            console: {
              errors: ReadingCountStub({ value: 0 }),
              warnings: ReadingCountStub({ value: 0 }),
            },
            server: { errors: ReadingCountStub({ value: 0 }) },
            network: {
              exchanges: ReadingCountStub({ value: 5 }),
              non2xx: ReadingCountStub({ value: 0 }),
            },
          }),
          shots: [],
        }),
      });
      proxy.setupRun({
        evidencePath,
        runId: runB,
        result: RunResultStub({
          instanceId,
          runId: runB,
          index: RunIndexStub({
            console: {
              errors: ReadingCountStub({ value: 2 }),
              warnings: ReadingCountStub({ value: 0 }),
            },
            server: { errors: ReadingCountStub({ value: 0 }) },
            network: {
              exchanges: ReadingCountStub({ value: 6 }),
              non2xx: ReadingCountStub({ value: 1 }),
            },
          }),
          shots: [],
        }),
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result).toStrictEqual({
        instanceId,
        runA,
        runB,
        console: { errors: '+2', new: [] },
        server: { errors: '+0', new: [] },
        network: { non2xx: '+1', new: [] },
        pixels: null,
      });
    });
  });

  describe('pixels', () => {
    it('EDGE: {runB took no shot} => pixels is null', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const previousPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_4/step1.png',
      });

      proxy.setupInstance({
        entry: RegistryEntryStub({ id: instanceId, guildId, state: 'killed' }),
      });
      const evidencePath = proxy.evidencePathFor({ instanceId, guildId });
      proxy.setupRun({
        evidencePath,
        runId: runA,
        result: RunResultStub({
          instanceId,
          runId: runA,
          shots: [ShotListingStub({ path: previousPath })],
        }),
      });
      proxy.setupRun({
        evidencePath,
        runId: runB,
        result: RunResultStub({ instanceId, runId: runB, shots: [] }),
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.pixels).toBe(null);
    });

    it('VALID: {both runs took shots, 2 of 100 pixels differ} => pixels carries the exact percent sentence', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const previousPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_4/step1.png',
      });
      const currentPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_5/step1.png',
      });
      const previousPixels = new Uint8Array(400).fill(255);
      const currentPixels = new Uint8Array(400).fill(255);
      const flatPixelStride = 4;
      const firstDifferingPixel = 0;
      const secondDifferingPixel = 50;
      currentPixels[firstDifferingPixel * flatPixelStride] = 0;
      currentPixels[firstDifferingPixel * flatPixelStride + 1] = 0;
      currentPixels[firstDifferingPixel * flatPixelStride + 2] = 0;
      currentPixels[secondDifferingPixel * flatPixelStride] = 0;
      currentPixels[secondDifferingPixel * flatPixelStride + 1] = 0;
      currentPixels[secondDifferingPixel * flatPixelStride + 2] = 0;

      proxy.setupInstance({
        entry: RegistryEntryStub({ id: instanceId, guildId, state: 'killed' }),
      });
      const evidencePath = proxy.evidencePathFor({ instanceId, guildId });
      proxy.setupRun({
        evidencePath,
        runId: runA,
        result: RunResultStub({
          instanceId,
          runId: runA,
          shots: [ShotListingStub({ path: previousPath })],
        }),
      });
      proxy.setupRun({
        evidencePath,
        runId: runB,
        result: RunResultStub({
          instanceId,
          runId: runB,
          shots: [ShotListingStub({ path: currentPath })],
        }),
      });
      proxy.stagesShotFrame({ path: previousPath, width: 10, height: 10, pixels: previousPixels });
      proxy.stagesShotFrame({ path: currentPath, width: 10, height: 10, pixels: currentPixels });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.pixels).toBe('last capture differs 2%');
    });
  });

  describe('a degenerate call', () => {
    it('EDGE: {runA and runB are the same run id} => every delta is "+0" and every new list is empty', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runId = RunIdStub({ value: 'run_4' });
      const shotPath = AbsoluteFilePathStub({
        value: '/repo/.siegelense/guilds/g1/instances/inst_7f3a9c21/runs/run_4/step1.png',
      });
      const identicalPixels = new Uint8Array(400).fill(255);

      proxy.setupInstance({
        entry: RegistryEntryStub({ id: instanceId, guildId, state: 'killed' }),
      });
      const evidencePath = proxy.evidencePathFor({ instanceId, guildId });
      proxy.setupRun({
        evidencePath,
        runId,
        result: RunResultStub({
          instanceId,
          runId,
          index: RunIndexStub({
            console: {
              errors: ReadingCountStub({ value: 3 }),
              warnings: ReadingCountStub({ value: 1 }),
            },
            server: { errors: ReadingCountStub({ value: 2 }) },
            network: {
              exchanges: ReadingCountStub({ value: 7 }),
              non2xx: ReadingCountStub({ value: 1 }),
            },
          }),
          shots: [ShotListingStub({ path: shotPath })],
        }),
      });
      proxy.stagesShotFrame({ path: shotPath, width: 10, height: 10, pixels: identicalPixels });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA: runId, runB: runId }),
      });

      expect(result).toStrictEqual({
        instanceId,
        runA: runId,
        runB: runId,
        console: { errors: '+0', new: [] },
        server: { errors: '+0', new: [] },
        network: { non2xx: '+0', new: [] },
        pixels: 'last capture differs 0%',
      });
    });
  });

  describe('console new lines', () => {
    it('VALID: {runB has a console line runA never produced} => console.new carries exactly that line', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const sharedLine = ContentTextStub({ value: '{"level":"log","text":"boot"}' });
      const newLine = ContentTextStub({
        value: '{"level":"error","text":"Cannot read properties of null"}',
      });

      proxy.setupInstance({
        entry: RegistryEntryStub({ id: instanceId, guildId, state: 'killed' }),
      });
      const evidencePath = proxy.evidencePathFor({ instanceId, guildId });
      proxy.setupRun({
        evidencePath,
        runId: runA,
        result: RunResultStub({ instanceId, runId: runA, shots: [] }),
      });
      proxy.setupRun({
        evidencePath,
        runId: runB,
        result: RunResultStub({ instanceId, runId: runB, shots: [] }),
      });
      proxy.setupConsoleLines({ evidencePath, runId: runA, lines: [sharedLine] });
      proxy.setupConsoleLines({ evidencePath, runId: runB, lines: [sharedLine, newLine] });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.console.new).toStrictEqual([newLine]);
    });

    it('VALID: {the same console line appears in both runs} => it does not appear in console.new', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const sharedLine = ContentTextStub({ value: '{"level":"log","text":"boot"}' });

      proxy.setupInstance({
        entry: RegistryEntryStub({ id: instanceId, guildId, state: 'killed' }),
      });
      const evidencePath = proxy.evidencePathFor({ instanceId, guildId });
      proxy.setupRun({
        evidencePath,
        runId: runA,
        result: RunResultStub({ instanceId, runId: runA, shots: [] }),
      });
      proxy.setupRun({
        evidencePath,
        runId: runB,
        result: RunResultStub({ instanceId, runId: runB, shots: [] }),
      });
      proxy.setupConsoleLines({ evidencePath, runId: runA, lines: [sharedLine] });
      proxy.setupConsoleLines({ evidencePath, runId: runB, lines: [sharedLine] });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.console.new).toStrictEqual([]);
    });
  });
});
