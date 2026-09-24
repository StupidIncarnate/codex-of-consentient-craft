import { DocsScopeStub } from '../../../contracts/docs-scope/docs-scope.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { docsAnswerComposeTransformer } from '../../../transformers/docs-answer-compose/docs-answer-compose-transformer';
import { docsAnswerRenderTransformer } from '../../../transformers/docs-answer-render/docs-answer-render-transformer';

import { SiegelenseDocsResponder } from './siegelense-docs-responder';
import { SiegelenseDocsResponderProxy } from './siegelense-docs-responder.proxy';

describe('SiegelenseDocsResponder', () => {
  describe('one scope', () => {
    it('VALID: {scope: fixing, isJson: true} => writes that document alone as JSON, naming it in requested, with no about preamble', async () => {
      const proxy = SiegelenseDocsResponderProxy();
      const scope = DocsScopeStub({ value: 'fixing' });

      await SiegelenseDocsResponder({ scope, isJson: true });

      expect(proxy.getStdoutLines()[1]).toBe('  "requested": "fixing",');
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(
          docsAnswerComposeTransformer({ scope }),
          null,
          siegelenseOutputStatics.json.indentSpaces,
        )}\n`,
      ]);
    });

    it('VALID: {scope: fixing, isJson: false} => writes that document alone as Markdown by default', async () => {
      const proxy = SiegelenseDocsResponderProxy();
      const scope = DocsScopeStub({ value: 'fixing' });

      await SiegelenseDocsResponder({ scope, isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        docsAnswerRenderTransformer({
          answer: docsAnswerComposeTransformer({ scope }),
        }),
      ]);
    });
  });

  describe('the rendered manual', () => {
    it('VALID: {scope: fixing, isJson: false} => writes Markdown opening on title, with no About block', async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({
        scope: DocsScopeStub({ value: 'fixing' }),
        isJson: false,
      });

      expect(proxy.getStdoutLines()[0]).toBe('# Siegelense Documentation');
      expect(proxy.getStdoutLines().some((line) => line === '## About')).toBe(false);
    });

    it("VALID: {scope: fixing, isJson: false} => the fixing page's first section reaches stdout formatted", async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({
        scope: DocsScopeStub({ value: 'fixing' }),
        isJson: false,
      });

      expect(proxy.getStdoutLines()[6]).toBe(
        '### WHAT YOU WERE HANDED, AND WHAT THE FIRST FOUR READS COST',
      );
      expect(proxy.getStdoutLines()[8]).toBe(
        '- You will receive a test record containing the instance ID, the run ID, the step that failed, the setup sequence, and paths to the saved evidence.',
      );
    });
  });

  describe('the return', () => {
    it('VALID: {scope: fixing, isJson: false} => answers success without starting anything', async () => {
      SiegelenseDocsResponderProxy();

      const result = await SiegelenseDocsResponder({
        scope: DocsScopeStub({ value: 'fixing' }),
        isJson: false,
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
