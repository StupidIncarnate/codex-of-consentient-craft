import {
  CleanupAnswerStub,
  CompareAnswerStub,
  CompareQueryStub,
  InstanceIdStub,
  InstanceManifestStub,
  KillResultStub,
  RegistryEntryStub,
  RegistryStub,
  ResultsAnswerStub,
  ResultsQueryStub,
  RunResultStub,
  StatusAnswerStub,
} from '@dungeonmaster/siegelense/contracts';

import { SiegelenseHandleResponder } from './siegelense-handle-responder';
import { SiegelenseHandleResponderProxy } from './siegelense-handle-responder.proxy';

const JSON_INDENT_SPACES = 2;
const JSON_ERROR_SHAPE_PATTERN = /^\{\n {2}"success": false,\n {2}"error": ".+"\n\}$/u;

describe('SiegelenseHandleResponder', () => {
  describe('siegelense-start', () => {
    it('VALID: {specName} => folds omitted questId/guildId to null and returns the manifest JSON', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const manifest = InstanceManifestStub();
      proxy.setupStartReturns({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
        manifest,
      });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-start' as never,
        args: { specName: 'dungeonmaster-web' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(manifest, null, JSON_INDENT_SPACES) }],
      });
    });

    it('VALID: {specName, questId, guildId} => forwards all three to instanceStartBroker', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const manifest = InstanceManifestStub();
      proxy.setupStartReturns({
        specName: 'dungeonmaster-web',
        questId: 'add-auth',
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        manifest,
      });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-start' as never,
        args: {
          specName: 'dungeonmaster-web',
          questId: 'add-auth',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(manifest, null, JSON_INDENT_SPACES) }],
      });
    });

    it('INVALID: {missing specName} => answers with isError true rather than throwing', async () => {
      SiegelenseHandleResponderProxy();

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-start' as never,
        args: {},
      });

      expect(result.isError).toBe(true);
    });

    it('INVALID: {missing specName} => the answer carries the JSON error shape', async () => {
      SiegelenseHandleResponderProxy();

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-start' as never,
        args: {},
      });

      expect(String(result.content[0]?.text)).toMatch(JSON_ERROR_SHAPE_PATTERN);
    });

    it('ERROR: {instanceStartBroker throws} => returns the JSON error shape with isError', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      proxy.setupStartThrows({
        specName: 'dungeonmaster-web',
        questId: null,
        guildId: null,
        error: new Error('Lane dungeonmaster-web for instance inst_7f3a9c21 did not become ready'),
      });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-start' as never,
        args: { specName: 'dungeonmaster-web' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Lane dungeonmaster-web for instance inst_7f3a9c21 did not become ready',
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

  describe('siegelense-run', () => {
    it('VALID: {instanceId known to the registry} => sends the parsed steps and defaulted stopOn to instanceRunBroker', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const instanceId = InstanceIdStub();
      const runResult = RunResultStub({ instanceId });
      proxy.setupRegistry({
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.setupRunReturns({
        instanceId,
        steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
        stopOn: 'error',
        result: runResult,
      });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-run' as never,
        args: {
          instanceId,
          steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
        },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(runResult, null, JSON_INDENT_SPACES) }],
      });
    });

    it('INVALID: {missing steps} => answers with isError true rather than throwing', async () => {
      SiegelenseHandleResponderProxy();

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-run' as never,
        args: { instanceId: InstanceIdStub() },
      });

      expect(result.isError).toBe(true);
    });

    it('INVALID: {missing steps} => the answer carries the JSON error shape', async () => {
      SiegelenseHandleResponderProxy();

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-run' as never,
        args: { instanceId: InstanceIdStub() },
      });

      expect(String(result.content[0]?.text)).toMatch(JSON_ERROR_SHAPE_PATTERN);
    });

    it('ERROR: {instanceId the registry never held} => answers "unknown, never existed" without calling instanceRunBroker', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const unknownInstanceId = 'inst_deadbeef';
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-run' as never,
        args: {
          instanceId: unknownInstanceId,
          steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `siegelense-run: no instance by the id "${unknownInstanceId}" — unknown, never existed. Check the id siegelense-start returned.`,
              },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });

    it('ERROR: {instanceId known but instanceRunBroker throws DriverUnreachableError} => returns the JSON error shape with isError', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const instanceId = InstanceIdStub();
      proxy.setupRegistry({
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.setupRunThrows({
        instanceId,
        steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
        stopOn: 'error',
        error: new Error(
          `Driver for instance ${instanceId} is unreachable at socket /tmp/x.sock: refused`,
        ),
      });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-run' as never,
        args: {
          instanceId,
          steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }],
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `Driver for instance ${instanceId} is unreachable at socket /tmp/x.sock: refused`,
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

  describe('siegelense-kill', () => {
    it('VALID: {instanceId known to the registry} => sends it to instanceKillBroker and returns the KillResult JSON', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const instanceId = InstanceIdStub();
      const killResult = KillResultStub({ instanceId });
      proxy.setupRegistry({
        registry: RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] }),
      });
      proxy.setupKillReturns({ instanceId, result: killResult });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-kill' as never,
        args: { instanceId },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(killResult, null, JSON_INDENT_SPACES) }],
      });
    });

    it('INVALID: {missing instanceId} => answers with isError true rather than throwing', async () => {
      SiegelenseHandleResponderProxy();

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-kill' as never,
        args: {},
      });

      expect(result.isError).toBe(true);
    });

    it('INVALID: {missing instanceId} => the answer carries the JSON error shape', async () => {
      SiegelenseHandleResponderProxy();

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-kill' as never,
        args: {},
      });

      expect(String(result.content[0]?.text)).toMatch(JSON_ERROR_SHAPE_PATTERN);
    });

    it('ERROR: {instanceId the registry never held} => answers "unknown, never existed" without calling instanceKillBroker', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const unknownInstanceId = 'inst_deadbeef';
      proxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-kill' as never,
        args: { instanceId: unknownInstanceId },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `siegelense-kill: no instance by the id "${unknownInstanceId}" — unknown, never existed. Check the id siegelense-start returned.`,
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

  // The four read tools delegate to SiegelenseReadLayerResponder via the layerResponders map —
  // each block here proves the delegation actually returns that layer's answer, rather than only
  // proving a callback was handed over. Every deeper INVALID/ERROR path for these four is covered
  // in siegelense-read-layer-responder.test.ts itself.
  describe('siegelense-results', () => {
    it('VALID: {instanceId} => delegates to SiegelenseReadLayerResponder and returns its answer', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const instanceId = InstanceIdStub();
      const query = ResultsQueryStub({ instanceId });
      const answer = ResultsAnswerStub({ instanceId });
      proxy.setupResultsReturns({ query, answer });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-results' as never,
        args: { instanceId },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });
  });

  describe('siegelense-status', () => {
    it('VALID: {} => delegates to SiegelenseReadLayerResponder and returns the fleet answer', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const answer = StatusAnswerStub();
      proxy.setupStatusReturns({ instanceId: null, answer });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-status' as never,
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });
  });

  describe('siegelense-compare', () => {
    it('VALID: {instanceId, runA, runB} => delegates to SiegelenseReadLayerResponder and returns the diff', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const query = CompareQueryStub();
      const answer = CompareAnswerStub({
        instanceId: query.instanceId,
        runA: query.runA,
        runB: query.runB,
      });
      proxy.setupCompareReturns({ query, answer });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-compare' as never,
        args: { instanceId: query.instanceId, runA: query.runA, runB: query.runB },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });
  });

  describe('siegelense-cleanup', () => {
    it('VALID: {} => delegates to SiegelenseReadLayerResponder and returns the cleanup answer', async () => {
      const proxy = SiegelenseHandleResponderProxy();
      const answer = CleanupAnswerStub();
      proxy.setupCleanupReturns({ answer });

      const result = await SiegelenseHandleResponder({
        tool: 'siegelense-cleanup' as never,
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(answer, null, JSON_INDENT_SPACES) }],
      });
    });
  });
});
