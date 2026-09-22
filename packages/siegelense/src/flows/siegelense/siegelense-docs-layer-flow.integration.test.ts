import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { DocsScopeStub } from '../../contracts/docs-scope/docs-scope.stub';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { docsAnswerComposeTransformer } from '../../transformers/docs-answer-compose/docs-answer-compose-transformer';
import { docsAnswerRenderTransformer } from '../../transformers/docs-answer-render/docs-answer-render-transformer';

import { SiegelenseDocsLayerFlow } from './siegelense-docs-layer-flow';

describe('SiegelenseDocsLayerFlow', () => {
  describe('the --for flag missing entirely', () => {
    it('INVALID: {callArgs: []} => refuses, listing the seven scopes so a bare call cannot flood context', async () => {
      await expect(SiegelenseDocsLayerFlow({ callArgs: [] })).rejects.toThrow(
        '--for <scope> is required: specify the role whose instructions to read.\n\n' +
          'Accepted scopes: operating, planning, walking, attacking, fixing, driving, operational\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });
  });

  describe('an unrecognised scope', () => {
    it('INVALID: {callArgs: [--for, reader]} => refuses naming reader and lists the seven scopes that exist', async () => {
      await expect(SiegelenseDocsLayerFlow({ callArgs: ['--for', 'reader'] })).rejects.toThrow(
        'Unknown docs scope: reader\n\n' +
          'docs serves one scope per tool-using role. The scopes that exist are: operating, planning, walking, attacking, fixing, driving, operational.\n\n' +
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });
  });

  describe('every one of the seven scopes, through --json', () => {
    it.each(siegelenseCallStatics.docs.scopes)(
      'VALID: {callArgs: [--for, %s, --json]} => serves the %s document alone, carrying its own audience',
      async (scope) => {
        const writes: ReturnType<typeof ContentTextStub>[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);
        process.stdout.write = ((chunk: string): boolean => {
          writes.push(ContentTextStub({ value: chunk }));
          return true;
        }) as unknown as typeof process.stdout.write;

        await SiegelenseDocsLayerFlow({ callArgs: ['--for', scope, '--json'] });

        process.stdout.write = originalWrite;

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
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseDocsLayerFlow({ callArgs: ['--for', 'walking', '--json'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const expectedJson = `${JSON.stringify(
        docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'walking' }) }),
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
          'Usage: dungeonmaster siegelense docs --for <scope> [--json]',
      );
    });

    it('VALID: {callArgs: [--for, walking]} => outputs formatted Markdown for the walking scope', async () => {
      const writes: ReturnType<typeof ContentTextStub>[] = [];
      const originalWrite = process.stdout.write.bind(process.stdout);
      process.stdout.write = ((chunk: string): boolean => {
        writes.push(ContentTextStub({ value: chunk }));
        return true;
      }) as unknown as typeof process.stdout.write;

      await SiegelenseDocsLayerFlow({ callArgs: ['--for', 'walking'] });

      process.stdout.write = originalWrite;

      const [wholeOutput] = writes;
      const expectedMarkdown = docsAnswerRenderTransformer({
        answer: docsAnswerComposeTransformer({ scope: DocsScopeStub({ value: 'walking' }) }),
      });

      expect(wholeOutput).toBe(expectedMarkdown);
    });
  });
});
