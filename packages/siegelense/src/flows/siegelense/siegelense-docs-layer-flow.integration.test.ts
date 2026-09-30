import { stdout } from '#gateway/node/process';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { DocsScopeStub } from '../../contracts/docs-scope/docs-scope.stub';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { docsAnswerComposeTransformer } from '../../transformers/docs-answer-compose/docs-answer-compose-transformer';
import { docsAnswerRenderTransformer } from '../../transformers/docs-answer-render/docs-answer-render-transformer';

import { SiegelenseDocsLayerFlow } from './siegelense-docs-layer-flow';

describe('SiegelenseDocsLayerFlow', () => {
  describe('the --for flag missing entirely', () => {
    it('EMPTY: {callArgs: []} => serves the about overview alone rather than refusing', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await SiegelenseDocsLayerFlow({ callArgs: [] });

      const writes = stdoutSpy.callsMatching([]).map((call) => String(call[0]));

      const [wholeOutput] = writes;
      const expectedMarkdown = docsAnswerRenderTransformer({
        answer: docsAnswerComposeTransformer({ scope: null }),
      });

      expect(wholeOutput).toBe(expectedMarkdown);
    });
  });

  describe('an unrecognised scope', () => {
    it('INVALID: {callArgs: [--for, reader]} => refuses naming reader, lists the four scopes and the bare-docs overview', async () => {
      await expect(SiegelenseDocsLayerFlow({ callArgs: ['--for', 'reader'] })).rejects.toThrow(
        'Unknown docs scope: reader\n\n' +
          'docs serves one scope per tool-using role. The scopes that exist are: walking, attacking, fixing, seeding. ' +
          'Omit --for entirely to get the tool overview alone.\n\n' +
          'Usage: dungeonmaster siegelense docs [--for <scope>] [--json]',
      );
    });
  });

  describe('every one of the four scopes, through --json', () => {
    it.each(siegelenseCallStatics.docs.scopes)(
      'VALID: {callArgs: [--for, %s, --json]} => serves the %s document alone, carrying its own audience',
      async (scope) => {
        const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
        stdoutSpy.calledWith([]).returns(true);

        await SiegelenseDocsLayerFlow({ callArgs: ['--for', scope, '--json'] });

        const writes = stdoutSpy.callsMatching([]).map((call) => String(call[0]));

        const [wholeOutput] = writes;
        const expectedJson = `${JSON.stringify(
          docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: scope }) }),
          null,
          siegelenseOutputStatics.json.indentSpaces,
        )}\n`;

        expect(wholeOutput).toBe(expectedJson);
      },
    );
  });

  describe('walking, JSON versus the default Markdown rendering', () => {
    it('VALID: {callArgs: [--for, walking, --json]} => outputs raw JSON for the walking scope', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await SiegelenseDocsLayerFlow({ callArgs: ['--for', 'walking', '--json'] });

      const writes = stdoutSpy.callsMatching([]).map((call) => String(call[0]));

      const [wholeOutput] = writes;
      const expectedJson = `${JSON.stringify(
        docsAnswerComposeTransformer({ scope: 'walking' }),
        null,
        siegelenseOutputStatics.json.indentSpaces,
      )}\n`;

      expect(wholeOutput).toBe(expectedJson);
    });

    it('INVALID: {callArgs: [--for, walking, --human]} => rejects --human as an unknown flag', async () => {
      await expect(
        SiegelenseDocsLayerFlow({ callArgs: ['--for', 'walking', '--human'] }),
      ).rejects.toThrow(
        'Unknown flag: --human\n\n' +
          'Accepted flags: --for, --json\n\n' +
          'Usage: dungeonmaster siegelense docs [--for <scope>] [--json]',
      );
    });

    it('VALID: {callArgs: [--for, walking]} => outputs formatted Markdown for the walking scope', async () => {
      const stdoutSpy = registerSpyOn({ object: stdout, method: 'write' });
      stdoutSpy.calledWith([]).returns(true);

      await SiegelenseDocsLayerFlow({ callArgs: ['--for', 'walking'] });

      const writes = stdoutSpy.callsMatching([]).map((call) => String(call[0]));

      const [wholeOutput] = writes;
      const expectedMarkdown = docsAnswerRenderTransformer({
        answer: docsAnswerComposeTransformer({ scope: 'walking' }),
      });

      expect(wholeOutput).toBe(expectedMarkdown);
    });
  });
});
