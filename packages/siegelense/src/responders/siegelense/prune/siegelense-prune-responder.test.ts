import { PruneAnswerStub } from '../../../contracts/prune-answer/prune-answer.stub';
import { PruneQueryStub } from '../../../contracts/prune-query/prune-query.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { SiegelensePruneResponder } from './siegelense-prune-responder';
import { SiegelensePruneResponderProxy } from './siegelense-prune-responder.proxy';

describe('SiegelensePruneResponder', () => {
  describe('the JSON default', () => {
    it('VALID: {isJson: true} => writes the whole PruneAnswer as one indented JSON document, refusal and citing file included', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const answer = PruneAnswerStub();
      proxy.stageAnswer({ answer });

      const result = await SiegelensePruneResponder({ query: PruneQueryStub(), isJson: true });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {an all-empty answer} => still writes a document, so a caller never reads silence as success', async () => {
      const proxy = SiegelensePruneResponderProxy();
      const answer = PruneAnswerStub({
        freedMB: 0 as never,
        freedBytes: 0 as never,
        removed: [],
        refused: [],
        unresolved: [],
      });
      proxy.stageAnswer({ answer });

      await SiegelensePruneResponder({ query: PruneQueryStub(), isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });
  });

  describe('the operator table', () => {
    it('VALID: {no isJson param} => writes the four-line reclaim table by default', async () => {
      const proxy = SiegelensePruneResponderProxy();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      const result = await SiegelensePruneResponder({ query: PruneQueryStub() });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        'FREED: 4100MB (4299161600 bytes)\n' +
          'REMOVED: inst_9b2c (everything, 4100MB, 4299161600 bytes, tombstoned)\n' +
          'REFUSED: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md)\n' +
          'NOT CHECKED: open-issue (no issue record exists on disk to check)\n',
      ]);
    });

    it('VALID: {isJson: false} => writes the four-line reclaim table instead of JSON', async () => {
      const proxy = SiegelensePruneResponderProxy();
      proxy.stageAnswer({ answer: PruneAnswerStub() });

      const result = await SiegelensePruneResponder({ query: PruneQueryStub(), isJson: false });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStdoutWrites()).toStrictEqual([
        'FREED: 4100MB (4299161600 bytes)\n' +
          'REMOVED: inst_9b2c (everything, 4100MB, 4299161600 bytes, tombstoned)\n' +
          'REFUSED: inst_1d09 (run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md)\n' +
          'NOT CHECKED: open-issue (no issue record exists on disk to check)\n',
      ]);
    });
  });
});
