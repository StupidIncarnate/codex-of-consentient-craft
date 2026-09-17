import { DocsScopeStub } from '../../../contracts/docs-scope/docs-scope.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { docsAnswerComposeTransformer } from '../../../transformers/docs-answer-compose/docs-answer-compose-transformer';

import { SiegelenseDocsResponder } from './siegelense-docs-responder';
import { SiegelenseDocsResponderProxy } from './siegelense-docs-responder.proxy';

describe('SiegelenseDocsResponder', () => {
  describe('the whole surface', () => {
    it('EMPTY: {scope: null, human: false} => writes every scope as one JSON document', async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({ scope: null, human: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(
          docsAnswerComposeTransformer({ scope: null }),
          null,
          siegelenseOutputStatics.json.indentSpaces,
        )}\n`,
      ]);
    });

    it('EMPTY: {scope: null, human: false} => the JSON says requested is null, so all-by-default is readable', async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({ scope: null, human: false });

      expect(proxy.getStdoutLines()[1]).toBe('  "requested": null,');
    });
  });

  describe('one scope', () => {
    it('VALID: {scope: operating, human: false} => writes that document alone, naming it in requested', async () => {
      const proxy = SiegelenseDocsResponderProxy();
      const scope = DocsScopeStub({ value: 'operating' });

      await SiegelenseDocsResponder({ scope, human: false });

      expect(proxy.getStdoutLines()[1]).toBe('  "requested": "operating",');
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(
          docsAnswerComposeTransformer({ scope }),
          null,
          siegelenseOutputStatics.json.indentSpaces,
        )}\n`,
      ]);
    });
  });

  describe('the rendered manual', () => {
    it('VALID: {scope: driving, human: true} => writes text, not JSON, opening on the ABOUT block', async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({ scope: DocsScopeStub({ value: 'driving' }), human: true });

      expect(proxy.getStdoutLines()[0]).toBe('ABOUT');
    });

    it("VALID: {scope: driving, human: true} => the driving table's first row reaches stdout verbatim", async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({ scope: DocsScopeStub({ value: 'driving' }), human: true });

      expect(proxy.getStdoutLines()[12]).toBe(
        '  FIVE THINGS TRUE OF YOU AND OF NO DISPATCHED ROLE',
      );
      expect(proxy.getStdoutLines()[13]).toBe(
        '    You are sharing this machine. Read capacity before you open anything, and know that start QUEUES rather than refusing — open three instances beside a running pass and that pass measures your pressure as if it were its own.',
      );
    });
  });

  describe('the return', () => {
    it('VALID: {scope: null, human: false} => answers success without starting anything', async () => {
      SiegelenseDocsResponderProxy();

      const result = await SiegelenseDocsResponder({ scope: null, human: false });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
