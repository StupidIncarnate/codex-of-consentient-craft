import { ResultWhereStub } from '../../../contracts/result-where/result-where.stub';
import { ServerLogWindowStub } from '../../../contracts/server-log-window/server-log-window.stub';
import { StepReadingStub } from '../../../contracts/step-reading/step-reading.stub';
import { serverWindowReadLayerBroker } from './server-window-read-layer-broker';
import { serverWindowReadLayerBrokerProxy } from './server-window-read-layer-broker.proxy';
import { Buffer } from '#gateway/node/buffer';

const EVIDENCE_PATH = '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1';

const LINE_OUTSIDE = '20:10:00 ERROR outside-window issue\n';
const LINE_STEP_6 = '20:10:30 INFO step6 boot\n';
const LINE_STEP_7 = '20:11:03 ERROR questListBroker: skipped unreadable quest.json\n';
const LINE_STEP_8 = '20:11:30 INFO step8 done\n';

const FULL_LOG = LINE_OUTSIDE + LINE_STEP_6 + LINE_STEP_7 + LINE_STEP_8;
const STEP_6_FROM = Buffer.byteLength(LINE_OUTSIDE, 'utf8');
const STEP_6_TO = STEP_6_FROM + Buffer.byteLength(LINE_STEP_6, 'utf8');
const STEP_7_FROM = STEP_6_TO;
const STEP_7_TO = STEP_7_FROM + Buffer.byteLength(LINE_STEP_7, 'utf8');
const STEP_8_FROM = STEP_7_TO;
const STEP_8_TO = STEP_8_FROM + Buffer.byteLength(LINE_STEP_8, 'utf8');

const readingsFixture = [
  StepReadingStub({
    step: 6,
    serverWindow: ServerLogWindowStub({ fromByte: STEP_6_FROM, toByte: STEP_6_TO }),
  }),
  StepReadingStub({
    step: 7,
    serverWindow: ServerLogWindowStub({ fromByte: STEP_7_FROM, toByte: STEP_7_TO }),
  }),
  StepReadingStub({
    step: 8,
    serverWindow: ServerLogWindowStub({ fromByte: STEP_8_FROM, toByte: STEP_8_TO }),
  }),
];

describe('serverWindowReadLayerBroker', () => {
  it('EMPTY: {no api-server.log} => returns an empty array', async () => {
    const proxy = serverWindowReadLayerBrokerProxy();
    proxy.setupMissingServerLog({ evidencePath: EVIDENCE_PATH });

    const result = await serverWindowReadLayerBroker({
      evidencePath: EVIDENCE_PATH,
      sinceBoot: false,
      readings: readingsFixture,
      step: null,
      where: null,
    });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {step outside every reading} => returns an empty array', async () => {
    const proxy = serverWindowReadLayerBrokerProxy();
    proxy.setupServerLog({ evidencePath: EVIDENCE_PATH, content: FULL_LOG });

    const result = await serverWindowReadLayerBroker({
      evidencePath: EVIDENCE_PATH,
      sinceBoot: false,
      readings: readingsFixture,
      step: 99,
      where: null,
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {where: {steps: 6-8, level: error}} => the error line inside those windows, the out-of-window error absent', async () => {
    const proxy = serverWindowReadLayerBrokerProxy();
    proxy.setupServerLog({ evidencePath: EVIDENCE_PATH, content: FULL_LOG });

    const result = await serverWindowReadLayerBroker({
      evidencePath: EVIDENCE_PATH,
      sinceBoot: false,
      readings: readingsFixture,
      step: null,
      where: ResultWhereStub({ steps: '6-8', level: 'error' }),
    });

    expect(result).toStrictEqual([LINE_STEP_7.trimEnd()]);
  });

  it('VALID: {step: 7, no level} => every line inside step 7 own window, unfiltered', async () => {
    const proxy = serverWindowReadLayerBrokerProxy();
    proxy.setupServerLog({ evidencePath: EVIDENCE_PATH, content: FULL_LOG });

    const result = await serverWindowReadLayerBroker({
      evidencePath: EVIDENCE_PATH,
      sinceBoot: false,
      readings: readingsFixture,
      step: 7,
      where: null,
    });

    expect(result).toStrictEqual([LINE_STEP_7.trimEnd()]);
  });

  it('VALID: {no step, no where.steps} => the union of every reading own window', async () => {
    const proxy = serverWindowReadLayerBrokerProxy();
    proxy.setupServerLog({ evidencePath: EVIDENCE_PATH, content: FULL_LOG });

    const result = await serverWindowReadLayerBroker({
      evidencePath: EVIDENCE_PATH,
      sinceBoot: false,
      readings: readingsFixture,
      step: null,
      where: null,
    });

    expect(result).toStrictEqual([
      LINE_STEP_6.trimEnd(),
      LINE_STEP_7.trimEnd(),
      LINE_STEP_8.trimEnd(),
    ]);
  });

  it('VALID: {where: {level: warn}} => no server-log warn classification exists, so every line in range passes through', async () => {
    const proxy = serverWindowReadLayerBrokerProxy();
    proxy.setupServerLog({ evidencePath: EVIDENCE_PATH, content: FULL_LOG });

    const result = await serverWindowReadLayerBroker({
      evidencePath: EVIDENCE_PATH,
      sinceBoot: false,
      readings: readingsFixture,
      step: 8,
      where: ResultWhereStub({ level: 'warn' }),
    });

    expect(result).toStrictEqual([LINE_STEP_8.trimEnd()]);
  });

  describe('sinceBoot', () => {
    it('VALID: {sinceBoot: true, no readings} => every line in the log, boot lines outside any window included', async () => {
      const proxy = serverWindowReadLayerBrokerProxy();
      proxy.setupServerLog({
        evidencePath: EVIDENCE_PATH,
        content: `Server listening on http://dungeonmaster.localhost:39887\n${FULL_LOG}`,
      });

      const result = await serverWindowReadLayerBroker({
        evidencePath: EVIDENCE_PATH,
        sinceBoot: true,
        readings: [],
        step: null,
        where: null,
      });

      expect(result).toStrictEqual([
        'Server listening on http://dungeonmaster.localhost:39887',
        LINE_OUTSIDE.trimEnd(),
        LINE_STEP_6.trimEnd(),
        LINE_STEP_7.trimEnd(),
        LINE_STEP_8.trimEnd(),
      ]);
    });

    it('VALID: {sinceBoot: true, where: {level: error}} => every error line in the whole log', async () => {
      const proxy = serverWindowReadLayerBrokerProxy();
      proxy.setupServerLog({
        evidencePath: EVIDENCE_PATH,
        content: `${FULL_LOG}[http] info GET /api/guilds 200 3ms\n[http] error GET /api/guilds 500 4ms: {"error":"boom"}\n`,
      });

      const result = await serverWindowReadLayerBroker({
        evidencePath: EVIDENCE_PATH,
        sinceBoot: true,
        readings: [],
        step: null,
        where: ResultWhereStub({ level: 'error' }),
      });

      expect(result).toStrictEqual([
        LINE_OUTSIDE.trimEnd(),
        LINE_STEP_7.trimEnd(),
        '[http] error GET /api/guilds 500 4ms: {"error":"boom"}',
      ]);
    });

    it('EMPTY: {sinceBoot: true, no api-server.log} => returns an empty array', async () => {
      const proxy = serverWindowReadLayerBrokerProxy();
      proxy.setupMissingServerLog({ evidencePath: EVIDENCE_PATH });

      const result = await serverWindowReadLayerBroker({
        evidencePath: EVIDENCE_PATH,
        sinceBoot: true,
        readings: [],
        step: null,
        where: null,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
