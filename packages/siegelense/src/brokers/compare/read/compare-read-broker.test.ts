import {
  AbsoluteFilePathStub,
  ContentTextStub,
  GuildIdStub,
} from '@dungeonmaster/shared/contracts';

import { CompareQueryStub } from '../../../contracts/compare-query/compare-query.stub';
import { ElementDeltaStub } from '../../../contracts/element-delta/element-delta.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { KeyRowStub } from '../../../contracts/key-row/key-row.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { RunIndexStub } from '../../../contracts/run-index/run-index.stub';
import { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { ShotListingStub } from '../../../contracts/shot-listing/shot-listing.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { RunMissingError } from '../../../errors/run-missing/run-missing-error';

import { compareReadBroker } from './compare-read-broker';
import { compareReadBrokerProxy } from './compare-read-broker.proxy';

describe('compareReadBroker', () => {
  describe('signed index deltas', () => {
    it('VALID: {runA 0 console errors, runB 2} => console.errors "+2" and new naming both messages', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const firstError = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          kind: 'console',
          type: 'error',
          text: 'Cannot read properties of null',
          url: '',
          line: 0,
        }),
      });
      const secondError = ContentTextStub({
        value: JSON.stringify({
          at: 2,
          kind: 'pageerror',
          type: 'TypeError',
          text: 'boom',
          stack: null,
        }),
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
          index: RunIndexStub({
            console: {
              errors: ReadingCountStub({ value: 0 }),
              warnings: ReadingCountStub({ value: 0 }),
            },
            server: { errors: ReadingCountStub({ value: 0 }) },
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
          }),
          shots: [],
        }),
      });
      proxy.setupConsoleLines({ evidencePath, runId: runB, lines: [firstError, secondError] });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result).toStrictEqual({
        instanceId,
        runA,
        runB,
        console: { errors: '+2', new: [firstError, secondError] },
        server: { errors: '+0', new: [] },
        network: { errors: '+0', new: [] },
        pixels: null,
        elements: { runA: null, runB: null },
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
        network: { errors: '+0', new: [] },
        pixels: 'last capture differs 0%',
        elements: { runA: null, runB: null },
      });
    });
  });

  describe('console new lines', () => {
    it('VALID: {runB has a new console error line runA never produced} => console.new carries exactly that line', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const sharedLogLine = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          kind: 'console',
          type: 'log',
          text: 'boot',
          url: '',
          line: 0,
        }),
      });
      const newErrorLine = ContentTextStub({
        value: JSON.stringify({
          at: 2,
          kind: 'console',
          type: 'error',
          text: 'Cannot read properties of null',
          url: '',
          line: 0,
        }),
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
      proxy.setupConsoleLines({ evidencePath, runId: runA, lines: [sharedLogLine] });
      proxy.setupConsoleLines({ evidencePath, runId: runB, lines: [sharedLogLine, newErrorLine] });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.console.new).toStrictEqual([newErrorLine]);
    });

    it('VALID: {the same console error line appears in both runs} => it does not appear in console.new', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const sharedErrorLine = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          kind: 'console',
          type: 'error',
          text: 'boot failed',
          url: '',
          line: 0,
        }),
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
      proxy.setupConsoleLines({ evidencePath, runId: runA, lines: [sharedErrorLine] });
      proxy.setupConsoleLines({ evidencePath, runId: runB, lines: [sharedErrorLine] });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.console.new).toStrictEqual([]);
    });

    it('VALID: {runB adds a new error line and a new non-error line} => console.new carries only the error line', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const newErrorLine = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          kind: 'console',
          type: 'error',
          text: 'Cannot read properties of null',
          url: '',
          line: 0,
        }),
      });
      const newWarningLine = ContentTextStub({
        value: JSON.stringify({
          at: 2,
          kind: 'console',
          type: 'warning',
          text: 'deprecated api call',
          url: '',
          line: 0,
        }),
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
      proxy.setupConsoleLines({
        evidencePath,
        runId: runB,
        lines: [newErrorLine, newWarningLine],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.console.new).toStrictEqual([newErrorLine]);
    });
  });

  describe('network new lines', () => {
    it('VALID: {runB has a new non-2xx network line runA never produced} => network.new carries exactly that line', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const shared2xxLine = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          method: 'GET',
          url: '/x',
          resourceType: 'fetch',
          status: 200,
          requestBody: null,
          responseBody: 'ok',
        }),
      });
      const newNon2xxLine = ContentTextStub({
        value: JSON.stringify({
          at: 2,
          method: 'POST',
          url: '/api/guilds',
          resourceType: 'fetch',
          status: 500,
          requestBody: null,
          responseBody: null,
        }),
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
      proxy.setupNetworkLines({ evidencePath, runId: runA, lines: [shared2xxLine] });
      proxy.setupNetworkLines({ evidencePath, runId: runB, lines: [shared2xxLine, newNon2xxLine] });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.network).toStrictEqual({ errors: '+1', new: [newNon2xxLine] });
    });

    it('VALID: {runB adds a new non-2xx exchange and a new 2xx exchange} => network.new carries only the non-2xx exchange', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const newNon2xxLine = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          method: 'GET',
          url: '/api/quests',
          resourceType: 'fetch',
          status: 404,
          requestBody: null,
          responseBody: null,
        }),
      });
      const new2xxLine = ContentTextStub({
        value: JSON.stringify({
          at: 2,
          method: 'POST',
          url: '/api/quests',
          resourceType: 'fetch',
          status: 201,
          requestBody: null,
          responseBody: 'created',
        }),
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
      proxy.setupNetworkLines({
        evidencePath,
        runId: runB,
        lines: [newNon2xxLine, new2xxLine],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.network).toStrictEqual({ errors: '+1', new: [newNon2xxLine] });
    });

    it('VALID: {runB adds a real 500 alongside a batch of ordinary 304 cache revalidations} => network.errors and network.new agree: one delta, one line', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_1' });
      const runB = RunIdStub({ value: 'run_2' });
      const cacheRevalidationLines = [1, 2, 3].map((at) =>
        ContentTextStub({
          value: JSON.stringify({
            at,
            method: 'GET',
            url: '/@vite/client',
            resourceType: 'script',
            status: 304,
            requestBody: null,
            responseBody: null,
          }),
        }),
      );
      const realFailureLine = ContentTextStub({
        value: JSON.stringify({
          at: 4,
          method: 'POST',
          url: '/api/guilds',
          resourceType: 'fetch',
          status: 500,
          requestBody: null,
          responseBody: null,
        }),
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
          index: RunIndexStub({
            console: {
              errors: ReadingCountStub({ value: 0 }),
              warnings: ReadingCountStub({ value: 0 }),
            },
            server: { errors: ReadingCountStub({ value: 0 }) },
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
              errors: ReadingCountStub({ value: 0 }),
              warnings: ReadingCountStub({ value: 0 }),
            },
            server: { errors: ReadingCountStub({ value: 0 }) },
          }),
          shots: [],
        }),
      });
      proxy.setupNetworkLines({
        evidencePath,
        runId: runB,
        lines: [...cacheRevalidationLines, realFailureLine],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      // The real-world repro this guards: hundreds of ordinary 304s plus one genuine failure once
      // produced `non2xx: '+402'` beside a `new:` list naming only the failure — a count and a list
      // describing different sets under one name. Here the count agrees with the list: both see only
      // the 500 among the batch of cache revalidations.
      expect(result).toStrictEqual({
        instanceId,
        runA,
        runB,
        console: { errors: '+0', new: [] },
        server: { errors: '+0', new: [] },
        network: { errors: '+1', new: [realFailureLine] },
        pixels: null,
        elements: { runA: null, runB: null },
      });
    });

    it('VALID: {runB adds a 301 and a 302 redirect} => network.new stays empty, redirects are normal traffic', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const movedPermanentlyLine = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          method: 'GET',
          url: '/old-path',
          resourceType: 'document',
          status: 301,
          requestBody: null,
          responseBody: null,
        }),
      });
      const foundLine = ContentTextStub({
        value: JSON.stringify({
          at: 2,
          method: 'GET',
          url: '/redirected',
          resourceType: 'document',
          status: 302,
          requestBody: null,
          responseBody: null,
        }),
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
      proxy.setupNetworkLines({
        evidencePath,
        runId: runB,
        lines: [movedPermanentlyLine, foundLine],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.network).toStrictEqual({ errors: '+0', new: [] });
    });

    it('EDGE: {runB adds a 399 and a 400} => network.new carries only the 400, the floor of what attention flags', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const status399Line = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          method: 'GET',
          url: '/x',
          resourceType: 'fetch',
          status: 399,
          requestBody: null,
          responseBody: null,
        }),
      });
      const status400Line = ContentTextStub({
        value: JSON.stringify({
          at: 2,
          method: 'GET',
          url: '/y',
          resourceType: 'fetch',
          status: 400,
          requestBody: null,
          responseBody: null,
        }),
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
      proxy.setupNetworkLines({
        evidencePath,
        runId: runB,
        lines: [status399Line, status400Line],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.network).toStrictEqual({ errors: '+1', new: [status400Line] });
    });

    it('EDGE: {runB adds a network line with status null, a request that never got a response} => network.new carries that line', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const noResponseLine = ContentTextStub({
        value: JSON.stringify({
          at: 1,
          method: 'GET',
          url: '/never-answered',
          resourceType: 'fetch',
          status: null,
          requestBody: null,
          responseBody: null,
        }),
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
      proxy.setupNetworkLines({
        evidencePath,
        runId: runB,
        lines: [noResponseLine],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.network).toStrictEqual({ errors: '+1', new: [noResponseLine] });
    });
  });

  describe('element deltas', () => {
    it('VALID: {runB last step recorded an appeared row and a changed row, runA recorded none} => elements.runA is null and elements.runB carries the real rows', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const appearedRow = KeyRowStub({ testId: 'GUILD_ADD_MODAL', tag: 'div' });
      const changedBefore = KeyRowStub({ testId: 'GUILD_COUNT', text: '3' });
      const changedAfter = KeyRowStub({ testId: 'GUILD_COUNT', text: '4' });
      const runBDelta = ElementDeltaStub({
        appeared: [appearedRow],
        disappeared: [],
        changed: [{ before: changedBefore, after: changedAfter }],
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
      proxy.setupStepReadings({
        evidencePath,
        runId: runB,
        readings: [StepReadingStub({ step: StepIndexStub({ value: 1 }), delta: runBDelta })],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.elements).toStrictEqual({ runA: null, runB: runBDelta });
    });

    it("VALID: {runA's step 1 carries a delta, step 2 carries none} => elements.runA is step 1's delta, the true last one recorded", async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const runADelta = ElementDeltaStub({ appeared: [KeyRowStub({ testId: 'ONLY_ROW' })] });

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
      proxy.setupStepReadings({
        evidencePath,
        runId: runA,
        readings: [
          StepReadingStub({ step: StepIndexStub({ value: 1 }), delta: runADelta }),
          StepReadingStub({ step: StepIndexStub({ value: 2 }) }),
        ],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.elements.runA).toStrictEqual(runADelta);
    });

    it('VALID: {runA and runB each recorded a different delta} => elements reports both, side by side', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub();
      const guildId = GuildIdStub();
      const runA = RunIdStub({ value: 'run_4' });
      const runB = RunIdStub({ value: 'run_5' });
      const runADelta = ElementDeltaStub({ appeared: [KeyRowStub({ testId: 'A_ONLY' })] });
      const runBDelta = ElementDeltaStub({ disappeared: [KeyRowStub({ testId: 'B_ONLY' })] });

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
      proxy.setupStepReadings({
        evidencePath,
        runId: runA,
        readings: [StepReadingStub({ step: StepIndexStub({ value: 1 }), delta: runADelta })],
      });
      proxy.setupStepReadings({
        evidencePath,
        runId: runB,
        readings: [StepReadingStub({ step: StepIndexStub({ value: 1 }), delta: runBDelta })],
      });

      const result = await compareReadBroker({
        query: CompareQueryStub({ instanceId, runA, runB }),
      });

      expect(result.elements).toStrictEqual({ runA: runADelta, runB: runBDelta });
    });
  });

  describe('an unknown instance', () => {
    it('ERROR: {instanceId with no registry row} => rejects with InstanceUnknownError, the exact message and no filesystem path', async () => {
      const proxy = compareReadBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_deadbeef' });
      const runA = RunIdStub({ value: 'run_1' });
      const runB = RunIdStub({ value: 'run_2' });

      proxy.setupUnknownInstance();

      await expect(
        compareReadBroker({ query: CompareQueryStub({ instanceId, runA, runB }) }),
      ).rejects.toStrictEqual(new InstanceUnknownError({ instanceId }));
    });
  });

  describe('a known instance with a missing run', () => {
    it('ERROR: {runB has no stored return on disk} => rejects with RunMissingError naming runB, the exact message and no filesystem path', async () => {
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
        result: RunResultStub({ instanceId, runId: runA, shots: [] }),
      });
      proxy.setupMissingRun({ evidencePath, runId: runB });

      await expect(
        compareReadBroker({ query: CompareQueryStub({ instanceId, runA, runB }) }),
      ).rejects.toStrictEqual(new RunMissingError({ instanceId, runId: runB }));
    });
  });
});
