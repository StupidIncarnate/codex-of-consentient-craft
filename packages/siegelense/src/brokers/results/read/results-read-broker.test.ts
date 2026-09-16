import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { ResultFieldStub } from '../../../contracts/result-field/result-field.stub';
import { ResultWhereStub } from '../../../contracts/result-where/result-where.stub';
import { ResultsQueryStub } from '../../../contracts/results-query/results-query.stub';
import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { ServerLogWindowStub } from '../../../contracts/server-log-window/server-log-window.stub';
import { ShotListingStub } from '../../../contracts/shot-listing/shot-listing.stub';
import { StepIndexStub } from '../../../contracts/step-index/step-index.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';
import { resultsReadBroker } from './results-read-broker';
import { resultsReadBrokerProxy } from './results-read-broker.proxy';

type RunId = ReturnType<typeof RunIdStub>;

const INSTANCE_ID = InstanceIdStub();
const RUN_1 = RunIdStub({ value: 'run_1' });
const RUN_2 = RunIdStub({ value: 'run_2' });
const LAST_BEAT_MS = EpochMsStub({ value: 1_700_000_000_000 }).valueOf();

const networkText = ({
  method,
  url,
  status,
  responseBody,
}: {
  method: string;
  url: string;
  status: number;
  responseBody?: string;
}): ReturnType<typeof ContentTextStub> =>
  ContentTextStub({
    value: JSON.stringify({
      at: 1,
      method,
      url,
      resourceType: 'fetch',
      status,
      requestBody: null,
      responseBody: responseBody ?? 'ok',
    }),
  });

const bufferLine = ({
  runId,
  step,
  text,
}: {
  runId: RunId | null;
  step: number | null;
  text: ReturnType<typeof ContentTextStub>;
}): ReturnType<typeof ContentTextStub> =>
  ContentTextStub({ value: `${JSON.stringify({ runId, step, atMs: 1_700_000_000_000, text })}\n` });

describe('resultsReadBroker', () => {
  it('VALID: {no kind, no step, run named} => storedReturn carries the exact RunResult from disk, rows empty', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const runResult = RunResultStub({ instanceId: INSTANCE_ID, runId: RUN_2 });
    proxy.setupStoredReturn({ evidencePath, runId: RUN_2, result: runResult });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID, runId: RUN_2 }),
    });

    expect(result).toStrictEqual({
      instanceId: INSTANCE_ID,
      instanceState: 'killed',
      runId: RUN_2,
      kind: null,
      step: null,
      verb: null,
      prunedAtMs: null,
      prunedByRule: null,
      matched: 0,
      returned: 0,
      truncated: false,
      rows: [],
      storedReturn: runResult,
    });
  });

  it("VALID: {step: 7, no kind} => spec line 2719's own call: the reading, the verb and the shot path", async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const step7 = StepReadingStub({ step: StepIndexStub({ value: 7 }), verb: 'click' });
    proxy.setupTranscript({
      evidencePath,
      runId: RUN_2,
      content: `${JSON.stringify(step7)}\n`,
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({
        instanceId: INSTANCE_ID,
        runId: RUN_2,
        step: StepIndexStub({ value: 7 }),
      }),
    });

    expect(result).toStrictEqual({
      instanceId: INSTANCE_ID,
      instanceState: 'killed',
      runId: RUN_2,
      kind: null,
      step: 7,
      verb: 'click',
      prunedAtMs: null,
      prunedByRule: null,
      matched: 1,
      returned: 1,
      truncated: false,
      rows: [JSON.stringify(step7)],
      storedReturn: null,
    });
  });

  it('VALID: {kind: network, step: 7} => only the entries tagged with step 7, from a fixture holding steps 6, 7 and 8', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const step6Text = networkText({ method: 'GET', url: '/api/a', status: 200 });
    const step7Text = networkText({ method: 'GET', url: '/api/b', status: 200 });
    const step8Text = networkText({ method: 'GET', url: '/api/c', status: 200 });
    proxy.setupBuffer({
      evidencePath,
      kind: 'network',
      content:
        bufferLine({ runId: RUN_2, step: 6, text: step6Text }) +
        bufferLine({ runId: RUN_2, step: 7, text: step7Text }) +
        bufferLine({ runId: RUN_2, step: 8, text: step8Text }),
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({
        instanceId: INSTANCE_ID,
        runId: RUN_2,
        kind: 'network',
        step: StepIndexStub({ value: 7 }),
      }),
    });

    expect(result.rows).toStrictEqual([step7Text]);
  });

  it('VALID: {kind: network, where: {path, method}} => only the matching exchange', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const matchingText = networkText({ method: 'POST', url: '/api/quests', status: 201 });
    const otherPathText = networkText({ method: 'POST', url: '/api/guilds', status: 201 });
    const otherMethodText = networkText({ method: 'GET', url: '/api/quests', status: 200 });
    proxy.setupBuffer({
      evidencePath,
      kind: 'network',
      content:
        bufferLine({ runId: RUN_2, step: 4, text: matchingText }) +
        bufferLine({ runId: RUN_2, step: 4, text: otherPathText }) +
        bufferLine({ runId: RUN_2, step: 4, text: otherMethodText }),
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({
        instanceId: INSTANCE_ID,
        runId: RUN_2,
        kind: 'network',
        where: ResultWhereStub({ path: '/api/quests', method: 'POST' }),
      }),
    });

    expect(result.rows).toStrictEqual([matchingText]);
  });

  it('VALID: {kind: network, fields: [status, responseBody]} => each row reduced to those two keys', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const exchangeText = networkText({
      method: 'GET',
      url: '/api/quests',
      status: 200,
      responseBody: 'seven-thirty-six',
    });
    proxy.setupBuffer({
      evidencePath,
      kind: 'network',
      content: bufferLine({ runId: RUN_2, step: 4, text: exchangeText }),
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({
        instanceId: INSTANCE_ID,
        runId: RUN_2,
        kind: 'network',
        fields: [ResultFieldStub({ value: 'status' }), ResultFieldStub({ value: 'responseBody' })],
      }),
    });

    expect(result.rows.map((row) => JSON.parse(row))).toStrictEqual([
      { status: 200, responseBody: 'seven-thirty-six' },
    ]);
  });

  it("VALID: {kind: server, where: {steps: '6-8', level: error}} => the error lines inside those three steps' byte windows", async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });

    const lineOutside = '20:10:00 ERROR outside-window issue\n';
    const lineStep6 = '20:10:30 INFO step6 boot\n';
    const lineStep7 = '20:11:03 ERROR questListBroker: skipped unreadable quest.json\n';
    const lineStep8 = '20:11:30 INFO step8 done\n';
    const fullLog = lineOutside + lineStep6 + lineStep7 + lineStep8;
    const step6From = Buffer.byteLength(lineOutside, 'utf8');
    const step6To = step6From + Buffer.byteLength(lineStep6, 'utf8');
    const step7From = step6To;
    const step7To = step7From + Buffer.byteLength(lineStep7, 'utf8');
    const step8From = step7To;
    const step8To = step8From + Buffer.byteLength(lineStep8, 'utf8');

    const readings = [
      StepReadingStub({
        step: StepIndexStub({ value: 6 }),
        serverWindow: ServerLogWindowStub({ fromByte: step6From, toByte: step6To }),
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 7 }),
        serverWindow: ServerLogWindowStub({ fromByte: step7From, toByte: step7To }),
      }),
      StepReadingStub({
        step: StepIndexStub({ value: 8 }),
        serverWindow: ServerLogWindowStub({ fromByte: step8From, toByte: step8To }),
      }),
    ];
    proxy.setupTranscript({
      evidencePath,
      runId: RUN_2,
      content: readings.map((reading) => `${JSON.stringify(reading)}\n`).join(''),
    });
    proxy.setupServerLog({ evidencePath, content: fullLog });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({
        instanceId: INSTANCE_ID,
        runId: RUN_2,
        kind: 'server',
        where: ResultWhereStub({ steps: '6-8', level: 'error' }),
      }),
    });

    expect(result.rows).toStrictEqual([lineStep7.trimEnd()]);
  });

  it('VALID: {kind: screenshots} => each shot with its node', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const shot = ShotListingStub({ node: 'PIXEL_BTN' });
    const runResult = RunResultStub({ instanceId: INSTANCE_ID, runId: RUN_2, shots: [shot] });
    proxy.setupStoredReturn({ evidencePath, runId: RUN_2, result: runResult });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID, runId: RUN_2, kind: 'screenshots' }),
    });

    expect(result.rows).toStrictEqual([JSON.stringify(shot)]);
  });

  it('VALID: {kind: console, since: boot} => entries from run_1 AND run_2 AND the untagged between-runs entry', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({
      evidencePath,
      entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl', 'run_2.json'],
    });
    const run1Text = ContentTextStub({
      value: '{"at":1,"kind":"console","type":"log","text":"a"}',
    });
    const betweenRunsText = ContentTextStub({
      value: '{"at":2,"kind":"console","type":"log","text":"b"}',
    });
    const run2Text = ContentTextStub({
      value: '{"at":3,"kind":"console","type":"log","text":"c"}',
    });
    proxy.setupBuffer({
      evidencePath,
      kind: 'console',
      content:
        bufferLine({ runId: RUN_1, step: null, text: run1Text }) +
        bufferLine({ runId: null, step: null, text: betweenRunsText }) +
        bufferLine({ runId: RUN_2, step: null, text: run2Text }),
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID, kind: 'console', since: 'boot' }),
    });

    expect(result.rows).toStrictEqual([run1Text, betweenRunsText, run2Text]);
  });

  it('VALID: {kind: network, since: boot} => entries from run_1 AND run_2, with real matched/returned counts', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({
      evidencePath,
      entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl', 'run_2.json'],
    });
    const run1Text = networkText({ method: 'GET', url: '/api/a', status: 200 });
    const run2Text = networkText({ method: 'POST', url: '/api/b', status: 500 });
    proxy.setupBuffer({
      evidencePath,
      kind: 'network',
      content:
        bufferLine({ runId: RUN_1, step: null, text: run1Text }) +
        bufferLine({ runId: RUN_2, step: null, text: run2Text }),
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID, kind: 'network', since: 'boot' }),
    });

    expect({ matched: result.matched, returned: result.returned, rows: result.rows }).toStrictEqual(
      { matched: 2, returned: 2, rows: [run1Text, run2Text] },
    );
  });

  it('ERROR: {killed instance holding console/network/ws evidence, since: boot, no kind} => refuses by name rather than answering matched: 0 for evidence genuinely on disk', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    proxy.setupBuffer({
      evidencePath,
      kind: 'console',
      content: bufferLine({
        runId: RUN_2,
        step: null,
        text: ContentTextStub({ value: '{"at":1,"kind":"console","type":"log","text":"a"}' }),
      }),
    });
    proxy.setupBuffer({
      evidencePath,
      kind: 'network',
      content: bufferLine({
        runId: RUN_2,
        step: null,
        text: networkText({ method: 'GET', url: '/api/quests', status: 200 }),
      }),
    });
    proxy.setupBuffer({
      evidencePath,
      kind: 'websocket',
      content: bufferLine({
        runId: RUN_2,
        step: null,
        text: ContentTextStub({ value: '{"at":1,"direction":"send","payload":"ping"}' }),
      }),
    });

    await expect(
      resultsReadBroker({ query: ResultsQueryStub({ instanceId: INSTANCE_ID, since: 'boot' }) }),
    ).rejects.toThrow(
      /^results against instance inst_7f3a9c21 with since: 'boot' and no kind cannot answer: boot spans every run, and only console, network, ws hold lines for the whole timeline\. Name one with --kind <kind>, or drop --since boot to read a single run's steps, server or screenshots\.$/u,
    );
  });

  it('ERROR: {no run, instanceState killed} => throws RunIdRequiredError naming the state and the count', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({
      evidencePath,
      entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl', 'run_2.json'],
    });

    await expect(
      resultsReadBroker({ query: ResultsQueryStub({ instanceId: INSTANCE_ID }) }),
    ).rejects.toThrow(/killed with 2 run\(s\) recorded/u);
  });

  it('ERROR: {no run, instanceState killed, run_2 crashed with no run_2.json} => the count still names 2, matching what status counts off the same .jsonl set', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'] });

    await expect(
      resultsReadBroker({ query: ResultsQueryStub({ instanceId: INSTANCE_ID }) }),
    ).rejects.toThrow(/killed with 2 run\(s\) recorded/u);
  });

  it("VALID: {run: run_2 named, run_2 crashed with no run_2.json} => still reads run_2's transcript despite the missing stored return", async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl'] });
    const step7 = StepReadingStub({ step: StepIndexStub({ value: 7 }), verb: 'click' });
    proxy.setupTranscript({
      evidencePath,
      runId: RUN_2,
      content: `${JSON.stringify(step7)}\n`,
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({
        instanceId: INSTANCE_ID,
        runId: RUN_2,
        step: StepIndexStub({ value: 7 }),
      }),
    });

    expect(result).toStrictEqual({
      instanceId: INSTANCE_ID,
      instanceState: 'killed',
      runId: RUN_2,
      kind: null,
      step: 7,
      verb: 'click',
      prunedAtMs: null,
      prunedByRule: null,
      matched: 1,
      returned: 1,
      truncated: false,
      rows: [JSON.stringify(step7)],
      storedReturn: null,
    });
  });

  it('VALID: {no run, instanceState alive} => reads the latest run', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({
      id: INSTANCE_ID,
      state: 'alive',
      lastBeatMs: EpochMsStub({ value: LAST_BEAT_MS }),
    });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    proxy.setupNow({ nowMs: LAST_BEAT_MS + 5000 });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({
      evidencePath,
      entries: ['run_1.jsonl', 'run_1.json', 'run_2.jsonl', 'run_2.json'],
    });
    const runResult = RunResultStub({ instanceId: INSTANCE_ID, runId: RUN_2 });
    proxy.setupStoredReturn({ evidencePath, runId: RUN_2, result: runResult });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID }),
    });

    expect(result).toStrictEqual({
      instanceId: INSTANCE_ID,
      instanceState: 'alive',
      runId: RUN_2,
      kind: null,
      step: null,
      verb: null,
      prunedAtMs: null,
      prunedByRule: null,
      matched: 0,
      returned: 0,
      truncated: false,
      rows: [],
      storedReturn: runResult,
    });
  });

  it('EMPTY: {unknown instance} => instanceState unknown, rows []', async () => {
    const proxy = resultsReadBrokerProxy();
    proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID }),
    });

    expect(result).toStrictEqual({
      instanceId: INSTANCE_ID,
      instanceState: 'unknown',
      runId: null,
      kind: null,
      step: null,
      verb: null,
      prunedAtMs: null,
      prunedByRule: null,
      matched: 0,
      returned: 0,
      truncated: false,
      rows: [],
      storedReturn: null,
    });
  });

  it('EMPTY: {pruned instance} => instanceState pruned with prunedAtMs and prunedByRule, rows []', async () => {
    const proxy = resultsReadBrokerProxy();
    const prunedAtMs = EpochMsStub({ value: 1_700_000_500_000 });
    const entry = RegistryEntryStub({
      id: INSTANCE_ID,
      state: 'pruned',
      prunedAtMs,
      prunedByRule: 'stale by 3 beats',
    });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID }),
    });

    expect(result).toStrictEqual({
      instanceId: INSTANCE_ID,
      instanceState: 'pruned',
      runId: null,
      kind: null,
      step: null,
      verb: null,
      prunedAtMs,
      prunedByRule: 'stale by 3 beats',
      matched: 0,
      returned: 0,
      truncated: false,
      rows: [],
      storedReturn: null,
    });
  });

  it('EDGE: {901 matching rows} => matched 901, returned 200, truncated true', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const rowCount = 901;
    const content = Array.from({ length: rowCount }, (_unused, index) =>
      bufferLine({
        runId: RUN_2,
        step: null,
        text: networkText({ method: 'GET', url: `/api/x${String(index)}`, status: 200 }),
      }),
    ).join('');
    proxy.setupBuffer({ evidencePath, kind: 'network', content });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID, runId: RUN_2, kind: 'network' }),
    });

    expect({
      matched: result.matched,
      returned: result.returned,
      truncated: result.truncated,
    }).toStrictEqual({
      matched: 901,
      returned: 200,
      truncated: true,
    });
  });

  it('EDGE: {a transcript whose last line is truncated} => the earlier readings still answer', async () => {
    const proxy = resultsReadBrokerProxy();
    const entry = RegistryEntryStub({ id: INSTANCE_ID, state: 'killed' });
    proxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    const evidencePath = proxy.evidencePathFor({ instanceId: INSTANCE_ID });
    proxy.setupRuns({ evidencePath, entries: ['run_2.jsonl', 'run_2.json'] });
    const first = StepReadingStub({ step: StepIndexStub({ value: 1 }) });
    const second = StepReadingStub({ step: StepIndexStub({ value: 2 }) });
    const truncatedTail = JSON.stringify(second).slice(0, 20);
    proxy.setupTranscript({
      evidencePath,
      runId: RUN_2,
      content: `${JSON.stringify(first)}\n${truncatedTail}`,
    });

    const result = await resultsReadBroker({
      query: ResultsQueryStub({ instanceId: INSTANCE_ID, runId: RUN_2, kind: 'steps' }),
    });

    expect(result.rows).toStrictEqual([JSON.stringify(first)]);
  });
});
