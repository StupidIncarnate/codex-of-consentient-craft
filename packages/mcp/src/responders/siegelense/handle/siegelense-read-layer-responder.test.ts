import {
  CleanupAnswerStub,
  CompareAnswerStub,
  CompareQueryStub,
  InstanceIdStub,
  ResultKindStub,
  ResultsAnswerStub,
  ResultsQueryStub,
  RunIdStub,
  StatusAnswerStub,
} from '@dungeonmaster/siegelense/contracts';

import { SiegelenseReadLayerResponder } from './siegelense-read-layer-responder';
import { SiegelenseReadLayerResponderProxy } from './siegelense-read-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;
const JSON_ERROR_SHAPE_PATTERN = /^\{\n {2}"success": false,\n {2}"error": ".+"\n\}$/u;

describe('SiegelenseReadLayerResponder', () => {
  describe('siegelense-results', () => {
    it('VALID: {instanceId} => folds every omitted field to null and returns the answer JSON', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const instanceId = InstanceIdStub();
      const query = ResultsQueryStub({ instanceId });
      const answer = ResultsAnswerStub({ instanceId });
      proxy.setupResultsReturns({ query, answer });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-results' as never,
        args: { instanceId },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });

    it('VALID: {instanceId, kind} => forwards the narrowing kind to the query', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const instanceId = InstanceIdStub();
      const kind = ResultKindStub({ value: 'network' });
      const query = ResultsQueryStub({ instanceId, kind });
      const answer = ResultsAnswerStub({ instanceId, kind });
      proxy.setupResultsReturns({ query, answer });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-results' as never,
        args: { instanceId, kind },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });

    it('INVALID: {missing instanceId} => answers with isError true rather than throwing', async () => {
      SiegelenseReadLayerResponderProxy();

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-results' as never,
        args: {},
      });

      expect(result.isError).toBe(true);
    });

    it('INVALID: {missing instanceId} => the answer carries the JSON error shape', async () => {
      SiegelenseReadLayerResponderProxy();

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-results' as never,
        args: {},
      });

      expect(String(result.content[0]?.text)).toMatch(JSON_ERROR_SHAPE_PATTERN);
    });

    it('ERROR: {resultsReadBroker throws RunIdRequiredError} => returns the JSON error shape with isError', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const instanceId = InstanceIdStub();
      const query = ResultsQueryStub({ instanceId });
      proxy.setupResultsThrows({
        query,
        error: new Error(
          `Instance ${instanceId} is dead with 3 runs recorded — name a runId or pass since: "boot"`,
        ),
      });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-results' as never,
        args: { instanceId },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `Instance ${instanceId} is dead with 3 runs recorded — name a runId or pass since: "boot"`,
              },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('siegelense-status', () => {
    it('VALID: {} => reports the whole fleet with instanceId resolved to null', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const answer = StatusAnswerStub();
      proxy.setupStatusReturns({ instanceId: null, answer });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-status' as never,
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });

    it('VALID: {instanceId} => reports that one instance in full', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const instanceId = InstanceIdStub();
      const answer = StatusAnswerStub();
      proxy.setupStatusReturns({ instanceId, answer });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-status' as never,
        args: { instanceId },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });

    it('INVALID: {instanceId: malformed} => answers with isError true rather than throwing', async () => {
      SiegelenseReadLayerResponderProxy();

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-status' as never,
        args: { instanceId: 'not-an-instance-id' },
      });

      expect(result.isError).toBe(true);
    });

    it('ERROR: {statusReadBroker throws} => returns the JSON error shape with isError', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      proxy.setupStatusThrows({
        instanceId: null,
        error: new Error('machineReadBroker: /proc unreadable'),
      });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-status' as never,
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'machineReadBroker: /proc unreadable' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('siegelense-compare', () => {
    it('VALID: {instanceId, runA, runB} => forwards the two runs and returns the diff JSON', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const query = CompareQueryStub();
      const answer = CompareAnswerStub({
        instanceId: query.instanceId,
        runA: query.runA,
        runB: query.runB,
      });
      proxy.setupCompareReturns({ query, answer });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-compare' as never,
        args: { instanceId: query.instanceId, runA: query.runA, runB: query.runB },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });

    it('INVALID: {missing runB} => answers with isError true rather than throwing', async () => {
      SiegelenseReadLayerResponderProxy();

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-compare' as never,
        args: { instanceId: InstanceIdStub(), runA: RunIdStub({ value: 'run_4' }) },
      });

      expect(result.isError).toBe(true);
    });

    it('INVALID: {instanceA, instanceB} => the answer carries the JSON error shape naming the stray keys', async () => {
      SiegelenseReadLayerResponderProxy();

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-compare' as never,
        args: {
          instanceA: InstanceIdStub(),
          instanceB: InstanceIdStub(),
          runA: 'run_4',
          runB: 'run_5',
        },
      });

      expect(String(result.content[0]?.text)).toMatch(JSON_ERROR_SHAPE_PATTERN);
    });

    it('ERROR: {compareReadBroker throws} => returns the JSON error shape with isError', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const query = CompareQueryStub();
      proxy.setupCompareThrows({
        query,
        error: new Error(`ENOENT: no stored return for ${query.runA}`),
      });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-compare' as never,
        args: { instanceId: query.instanceId, runA: query.runA, runB: query.runB },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: `ENOENT: no stored return for ${query.runA}` },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('siegelense-cleanup', () => {
    it('VALID: {} => reaps, releases and returns the cleanup answer JSON', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      const answer = CleanupAnswerStub();
      proxy.setupCleanupReturns({ answer });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-cleanup' as never,
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });

    it('INVALID: {instanceId} => answers with isError true, cleanup takes no argument', async () => {
      SiegelenseReadLayerResponderProxy();

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-cleanup' as never,
        args: { instanceId: InstanceIdStub() },
      });

      expect(result.isError).toBe(true);
    });

    it('ERROR: {cleanupRunBroker throws} => returns the JSON error shape with isError', async () => {
      const proxy = SiegelenseReadLayerResponderProxy();
      proxy.setupCleanupThrows({ error: new Error('registry.json is locked by another process') });

      const result = await SiegelenseReadLayerResponder({
        tool: 'siegelense-cleanup' as never,
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'registry.json is locked by another process' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });
});
