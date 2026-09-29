import { PruneAnswerStub } from '../../../contracts/prune-answer/prune-answer.stub';
import { PruneQueryStub } from '../../../contracts/prune-query/prune-query.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { SiegelensePruneResponder } from './siegelense-prune-responder';
import { SiegelensePruneResponderProxy } from './siegelense-prune-responder.proxy';

const DRY_RUN_NOTICE = 'DRY RUN — nothing was deleted. Pass --confirm to actually remove these.\n';

describe('SiegelensePruneResponder', () => {
  describe('the JSON default', () => {
    it('VALID: {isJson: true, confirm: true} => writes the whole PruneAnswer as one indented JSON document, refusal and citing file included', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const answer = PruneAnswerStub();
      proxy.stageAnswer({ answer });

      const result = await SiegelensePruneResponder({
        query: PruneQueryStub(),
        isJson: true,
        confirm: true,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {an all-empty answer, confirm: true} => still writes a document, so a caller never reads silence as success', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const answer = PruneAnswerStub({
        freedMB: 0,
        freedBytes: 0,
        removed: [],
        refused: [],
        unresolved: [],
      });
      proxy.stageAnswer({ answer });

      await SiegelensePruneResponder({ query: PruneQueryStub(), isJson: true, confirm: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('the operator table', () => {
    it('VALID: {confirm: true, no isJson param} => writes the four-line reclaim table by default', async () => {
      const proxy = SiegelensePruneResponderProxy();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      const result = await SiegelensePruneResponder({ query: PruneQueryStub(), confirm: true });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        'FREED: 4100MB (4299161600 bytes)\n' +
          'REMOVED: inst_9b2c (everything, 4100MB, 4299161600 bytes, tombstoned)\n' +
          'REFUSED: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md)\n' +
          'NOT CHECKED: open-issue (no issue record exists on disk to check)\n',
      ]);
    });

    it('VALID: {isJson: false, confirm: true} => writes the four-line reclaim table instead of JSON', async () => {
      const proxy = SiegelensePruneResponderProxy();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      const result = await SiegelensePruneResponder({
        query: PruneQueryStub(),
        isJson: false,
        confirm: true,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        'FREED: 4100MB (4299161600 bytes)\n' +
          'REMOVED: inst_9b2c (everything, 4100MB, 4299161600 bytes, tombstoned)\n' +
          'REFUSED: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md)\n' +
          'NOT CHECKED: open-issue (no issue record exists on disk to check)\n',
      ]);
    });
  });

  describe('the dry-run default', () => {
    it('VALID: {no confirm param} => pruneRunBroker is called with dryRun: true', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const query = PruneQueryStub();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      await SiegelensePruneResponder({ query });

      expect(proxy.getPruneRunCalls()).toStrictEqual([{ query, dryRun: true }]);
    });

    it('VALID: {confirm: false} => pruneRunBroker is called with dryRun: true', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const query = PruneQueryStub();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      await SiegelensePruneResponder({ query, confirm: false });

      expect(proxy.getPruneRunCalls()).toStrictEqual([{ query, dryRun: true }]);
    });

    it('VALID: {confirm: true} => pruneRunBroker is called with dryRun: false', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const query = PruneQueryStub();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      await SiegelensePruneResponder({ query, confirm: true });

      expect(proxy.getPruneRunCalls()).toStrictEqual([{ query, dryRun: false }]);
    });

    it('VALID: {no confirm param, table mode} => the DRY RUN notice is written to stdout before the table', async () => {
      const proxy = SiegelensePruneResponderProxy();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      await SiegelensePruneResponder({ query: PruneQueryStub() });

      expect(proxy.getStdoutWrites()[0]).toBe(DRY_RUN_NOTICE);
      expect(proxy.getStderrWrites()).toStrictEqual([]);
    });

    it('VALID: {no confirm param, isJson: true} => the DRY RUN notice goes to stderr, so stdout stays one valid JSON document', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const answer = PruneAnswerStub();
      proxy.stageAnswer({ answer });

      await SiegelensePruneResponder({ query: PruneQueryStub(), isJson: true });

      expect(proxy.getStderrWrites()).toStrictEqual([DRY_RUN_NOTICE]);
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {confirm: true} => no DRY RUN notice is written to either stream', async () => {
      const proxy = SiegelensePruneResponderProxy();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      await SiegelensePruneResponder({ query: PruneQueryStub(), confirm: true });

      expect(proxy.getStderrWrites()).toStrictEqual([]);
      expect(proxy.getStdoutWrites()).toStrictEqual([
        'FREED: 4100MB (4299161600 bytes)\n' +
          'REMOVED: inst_9b2c (everything, 4100MB, 4299161600 bytes, tombstoned)\n' +
          'REFUSED: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md)\n' +
          'NOT CHECKED: open-issue (no issue record exists on disk to check)\n',
      ]);
    });
  });
});
