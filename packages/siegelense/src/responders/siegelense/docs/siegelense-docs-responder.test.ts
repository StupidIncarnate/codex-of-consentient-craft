import { DocsScopeStub } from '../../../contracts/docs-scope/docs-scope.stub';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { docsAnswerComposeTransformer } from '../../../transformers/docs-answer-compose/docs-answer-compose-transformer';
import { docsAnswerRenderTransformer } from '../../../transformers/docs-answer-render/docs-answer-render-transformer';

import { SiegelenseDocsResponder } from './siegelense-docs-responder';
import { SiegelenseDocsResponderProxy } from './siegelense-docs-responder.proxy';

describe('SiegelenseDocsResponder', () => {
  describe('one scope', () => {
    it('VALID: {scope: planning, isJson: true} => writes that document alone as JSON, naming it in requested', async () => {
      const proxy = SiegelenseDocsResponderProxy();
      const scope = DocsScopeStub({ value: 'planning' });

      await SiegelenseDocsResponder({ scope, isJson: true });

      expect(proxy.getStdoutLines()[1]).toBe('  "requested": "planning",');
      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(
          docsAnswerComposeTransformer({ scope }),
          null,
          siegelenseOutputStatics.json.indentSpaces,
        )}\n`,
      ]);
    });

    it('VALID: {scope: planning, isJson: false} => writes that document alone as Markdown by default', async () => {
      const proxy = SiegelenseDocsResponderProxy();
      const scope = DocsScopeStub({ value: 'planning' });

      await SiegelenseDocsResponder({ scope, isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        docsAnswerRenderTransformer({
          answer: docsAnswerComposeTransformer({ scope }),
        }),
      ]);
    });
  });

  describe('the rendered manual', () => {
    it('VALID: {scope: driving, isJson: false} => writes Markdown opening on title', async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({
        scope: DocsScopeStub({ value: 'driving' }),
        isJson: false,
      });

      expect(proxy.getStdoutLines()[0]).toBe('# Siegelense Documentation');
    });

    it("VALID: {scope: driving, isJson: false} => the driving table's first row reaches stdout formatted", async () => {
      const proxy = SiegelenseDocsResponderProxy();

      await SiegelenseDocsResponder({
        scope: DocsScopeStub({ value: 'driving' }),
        isJson: false,
      });

      expect(proxy.getStdoutLines()[17]).toBe(
        '### FIVE THINGS TRUE OF YOU AND OF NO DISPATCHED ROLE',
      );
      expect(proxy.getStdoutLines()[19]).toBe(
        '- You are sharing this machine with other agents. Run capacity before starting anything. The start command will queue your request if the machine is busy, so starting multiple instances will slow down other tests.',
      );
    });
  });

  describe('the return', () => {
    it('VALID: {scope: planning, isJson: false} => answers success without starting anything', async () => {
      SiegelenseDocsResponderProxy();

      const result = await SiegelenseDocsResponder({
        scope: DocsScopeStub({ value: 'planning' }),
        isJson: false,
      });

      expect(result).toStrictEqual({ success: true });
    });
  });
});
