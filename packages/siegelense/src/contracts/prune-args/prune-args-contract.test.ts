import { pruneArgsContract } from './prune-args-contract';
import { PruneArgsStub } from './prune-args.stub';

describe('pruneArgsContract', () => {
  describe('valid args', () => {
    it('VALID: {defaults} => the JSON form parses, carrying the default window through', () => {
      const args = PruneArgsStub();

      const result = pruneArgsContract.parse(args);

      expect(result).toStrictEqual({
        query: { instanceId: null, kind: null, olderThan: '7d' },
        human: false,
      });
    });

    it('VALID: {human: true} => the table form parses', () => {
      const args = PruneArgsStub({ human: true });

      const result = pruneArgsContract.parse(args);

      expect(result.human).toBe(true);
    });
  });

  describe('invalid args', () => {
    it('INVALID: {human omitted} => throws, so the responder never has to guess which renderer was asked for', () => {
      expect(() => {
        pruneArgsContract.parse({ query: { instanceId: null, kind: null, olderThan: '7d' } });
      }).toThrow(/Required/u);
    });

    it('INVALID: {an extra key} => .strict() throws rather than accepting a flag nothing reads', () => {
      expect(() => {
        pruneArgsContract.parse({
          query: { instanceId: null, kind: null, olderThan: '7d' },
          human: false,
          dryRun: true,
        });
      }).toThrow(/Unrecognized key/u);
    });
  });
});
