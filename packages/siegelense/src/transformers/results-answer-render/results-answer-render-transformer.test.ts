import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';
import { InstanceStateStub } from '../../contracts/instance-state/instance-state.stub';
import { ResultsAnswerStub } from '../../contracts/results-answer/results-answer.stub';
import { RunResultStub } from '../../contracts/run-result/run-result.stub';
import { resultsStatics } from '../../statics/results/results-statics';
import { resultsAnswerRenderTransformer } from './results-answer-render-transformer';

describe('resultsAnswerRenderTransformer', () => {
  describe('empty readings', () => {
    it('VALID: {rows: []} => outputs instance header and none found notice', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe('INSTANCE: inst_7f3a9c21 (alive)\nREADINGS: none found for query\n');
    });
  });

  describe('step readings present', () => {
    it('VALID: {rows with step, verb, content} => outputs formatted readings', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [
          ContentTextStub({
            value: JSON.stringify({ step: 1, verb: 'goto', content: 'https://example.com' }),
          }),
          ContentTextStub({
            value: JSON.stringify({ step: 2, verb: 'click', content: '[data-testid="ADD"]' }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\n[step 1] goto: https://example.com\n[step 2] click: [data-testid="ADD"]\n',
      );
    });

    it('VALID: {rows with step, verb, reading} => formats using reading field', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [
          ContentTextStub({
            value: JSON.stringify({ step: 1, verb: 'goto', reading: 'navigated to /' }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe('INSTANCE: inst_7f3a9c21 (alive)\n[step 1] goto: navigated to /\n');
    });
  });

  describe('box and seed step readings', () => {
    it('VALID: {box step row} => geometry line, not raw JSON', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [
          ContentTextStub({
            value: JSON.stringify({
              step: 3,
              verb: 'box',
              reading: JSON.stringify({
                ref: 24,
                x: 472,
                y: 351,
                width: 260,
                height: 36,
                viewport: { width: 1280, height: 720 },
                visible: true,
                inViewport: true,
              }),
            }),
          }),
        ],
      });

      expect(resultsAnswerRenderTransformer({ answer })).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\n' +
          '[step 3] box: ref 24: 260×36 at (472, 351) — visible, in viewport (viewport 1280×720)\n',
      );
    });

    it('VALID: {seed step row} => one line per binding, not the whole record', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [
          ContentTextStub({
            value: JSON.stringify({
              step: 2,
              verb: 'seed',
              reading: JSON.stringify({
                quest: {
                  id: 'd4581716',
                  title: 'Advancing quest',
                  status: 'in_progress',
                  flows: [{ id: 'f1' }],
                },
              }),
            }),
          }),
        ],
      });

      expect(resultsAnswerRenderTransformer({ answer })).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\n' +
          '[step 2] seed: SEEDED:\n' +
          '  quest: d4581716 (title: Advancing quest, status: in_progress)\n',
      );
    });
  });

  describe('stored return present', () => {
    it('VALID: {storedReturn, rows: []} => delegates to runAnswerRenderTransformer under instance header, with no readings appended', () => {
      const runResult = RunResultStub({ shots: [] });
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'killed' }),
        rows: [],
        storedReturn: runResult,
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (killed)\nRUN: run_1 (status: done, steps: 5, duration: 0ms)\n',
      );
    });

    it('VALID: {storedReturn, rows with step readings} => renders the run summary AND every step reading below it', () => {
      const runResult = RunResultStub({ shots: [] });
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        rows: [
          ContentTextStub({
            value: JSON.stringify({ step: 1, verb: 'goto', content: 'https://example.com' }),
          }),
          ContentTextStub({
            value: JSON.stringify({ step: 2, verb: 'click', content: '[data-testid="ADD"]' }),
          }),
        ],
        storedReturn: runResult,
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\nRUN: run_1 (status: done, steps: 5, duration: 0ms)\n' +
          '[step 1] goto: https://example.com\n[step 2] click: [data-testid="ADD"]\n',
      );
    });
  });

  describe('console kind rows', () => {
    it('VALID: {kind: console, rows: error and warning} => prefixes each with its level, so the two never look identical', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        kind: 'console',
        rows: [
          ContentTextStub({
            value: JSON.stringify({
              at: 1,
              kind: 'console',
              type: 'error',
              text: 'boom-from-eval',
              url: '',
              line: 0,
            }),
          }),
          ContentTextStub({
            value: JSON.stringify({
              at: 2,
              kind: 'console',
              type: 'warning',
              text: 'warn-from-eval',
              url: '',
              line: 0,
            }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\nERROR: boom-from-eval\nWARNING: warn-from-eval\n',
      );
    });
  });

  describe('network kind rows', () => {
    it('VALID: {kind: network, row with method/status/url/body} => renders one readable row per exchange', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        kind: 'network',
        rows: [
          ContentTextStub({
            value: JSON.stringify({
              at: 1,
              method: 'POST',
              url: '/api/guilds',
              resourceType: 'fetch',
              status: 500,
              requestBody: '{"name":"x"}',
              responseBody: '{"error":"database unavailable"}',
            }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\nPOST 500 /api/guilds — {"error":"database unavailable"}\n',
      );
    });

    it('VALID: {kind: network, requestfailed row with no status} => renders ERR in place of a status code', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        kind: 'network',
        rows: [
          ContentTextStub({
            value: JSON.stringify({
              at: 1,
              method: 'GET',
              url: '/api/quests',
              resourceType: 'fetch',
              status: null,
              requestBody: null,
              responseBody: '<request failed: timeout>',
            }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        'INSTANCE: inst_7f3a9c21 (alive)\nGET ERR /api/quests — <request failed: timeout>\n',
      );
    });

    it('VALID: {kind: network, body longer than the trim ceiling} => trims the body with a trailing ellipsis', () => {
      const longBody = 'x'.repeat(resultsStatics.render.bodyTrimChars + 50);
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        kind: 'network',
        rows: [
          ContentTextStub({
            value: JSON.stringify({
              at: 1,
              method: 'GET',
              url: '/api/x',
              resourceType: 'fetch',
              status: 200,
              requestBody: null,
              responseBody: longBody,
            }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe(
        `INSTANCE: inst_7f3a9c21 (alive)\nGET 200 /api/x — ${longBody.slice(0, resultsStatics.render.bodyTrimChars)}…\n`,
      );
    });

    it('EMPTY: {kind: network, no request or response body} => renders the exchange with no trailing body', () => {
      const answer = ResultsAnswerStub({
        instanceId: InstanceIdStub({ value: 'inst_7f3a9c21' }),
        instanceState: InstanceStateStub({ value: 'alive' }),
        kind: 'network',
        rows: [
          ContentTextStub({
            value: JSON.stringify({
              at: 1,
              method: 'GET',
              url: '/@vite/client',
              resourceType: 'script',
              status: 304,
              requestBody: null,
              responseBody: null,
            }),
          }),
        ],
      });

      const result = resultsAnswerRenderTransformer({ answer });

      expect(result).toBe('INSTANCE: inst_7f3a9c21 (alive)\nGET 304 /@vite/client\n');
    });
  });
});
