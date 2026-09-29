import { ResultsArgsStub } from '../../contracts/results-args/results-args.stub';
import { ResultWhereStub } from '../../contracts/result-where/result-where.stub';
import { resultsArgsScopeCheckTransformer } from './results-args-scope-check-transformer';

describe('resultsArgsScopeCheckTransformer', () => {
  describe('a --where-* flag without its kind', () => {
    it('INVALID: {where.path, kind: null} => refuses naming the network kind to add', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ where: ResultWhereStub({ path: '/api/guilds' }) }),
        });
      }).toThrow(/^--where-path filters network rows; add --kind network$/u);
    });

    it('INVALID: {where.method, kind: null} => refuses naming the network kind to add', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ where: ResultWhereStub({ method: 'POST' }) }),
        });
      }).toThrow(/^--where-method filters network rows; add --kind network$/u);
    });

    it('INVALID: {where.nth, kind: null} => refuses naming the buffer kinds to add', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ where: ResultWhereStub({ nth: 0 }) }),
        });
      }).toThrow(
        /^--where-nth filters console, network and ws rows; add --kind console or --kind network or --kind ws$/u,
      );
    });

    it('INVALID: {where.steps, kind: null} => refuses, the default view ignores it', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ where: ResultWhereStub({ steps: '2-3' }) }),
        });
      }).toThrow(
        /^--where-steps filters console, network, ws, server and step rows; add --kind console or --kind network or --kind ws or --kind server or --kind steps$/u,
      );
    });

    it('INVALID: {where.level, kind: network} => refuses saying network has nothing for it to filter', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({
            kind: 'network',
            where: ResultWhereStub({ level: 'info' }),
          }),
        });
      }).toThrow(
        /^--where-level filters console and server rows; --kind network has nothing for it to filter\. Use --kind console or --kind server$/u,
      );
    });

    it('VALID: {where.level info, kind: console} => passes', () => {
      const args = ResultsArgsStub({ kind: 'console', where: ResultWhereStub({ level: 'info' }) });

      expect(resultsArgsScopeCheckTransformer({ args })).toStrictEqual(args);
    });
  });

  describe('--fields names that match nothing', () => {
    it('INVALID: {fields: step,status, kind: null} => names status and lists the step reading fields', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ fields: ['step', 'status'] as never }),
        });
      }).toThrow(
        /^--fields: no field "status" on step readings; fields are: step, verb, node, ok, expected, reading, shot, pixelChange, blank, blankColour, previousReading, delta, serverWindow, startedAtMs, endedAtMs$/u,
      );
    });

    it('INVALID: {fields: run, kind: network, no --since} => run only exists on boot rows', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ kind: 'network', fields: ['run'] as never }),
        });
      }).toThrow(
        /^--fields: no field "run" on network requests; fields are: at, method, url, resourceType, status, requestBody, responseBody$/u,
      );
    });

    it('VALID: {fields: run,status, kind: network, since: boot} => passes', () => {
      const args = ResultsArgsStub({
        kind: 'network',
        since: 'boot' as never,
        fields: ['run', 'status'] as never,
      });

      expect(resultsArgsScopeCheckTransformer({ args })).toStrictEqual(args);
    });

    it('INVALID: {fields: text, kind: server} => says server rows are raw lines', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ kind: 'server', fields: ['text'] as never }),
        });
      }).toThrow(
        /^--fields: no field "text" on server log lines; they are raw log lines with no fields to pick$/u,
      );
    });

    it('INVALID: {fields: bogus, kind: screenshots} => lists the shot fields', () => {
      expect(() => {
        resultsArgsScopeCheckTransformer({
          args: ResultsArgsStub({ kind: 'screenshots', fields: ['bogus'] as never }),
        });
      }).toThrow(
        /^--fields: no field "bogus" on screenshots; fields are: step, path, open, why, node, pixelChange, blank, blankColour$/u,
      );
    });
  });
});
