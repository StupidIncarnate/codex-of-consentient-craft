import { formatCliOutputSectionLayerBroker } from './format-cli-output-section-layer-broker';
import { formatCliOutputSectionLayerBrokerProxy } from './format-cli-output-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatCliOutputSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for CLI output rules', () => {
    formatCliOutputSectionLayerBrokerProxy();

    const result = formatCliOutputSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## CLI Output',
        '',
        '**Use process.stdout/stderr - Never use console.log() or console.error() in CLI implementations**',
        '',
        '- **process.stdout.write() for normal output**',
        '- **process.stderr.write() for errors**',
        '- **Append \\n explicitly to output strings**',
        '',
        '**Examples:**',
        '```typescript',
        'process.stdout.write("Processing " + count + " files...\\n");',
        'process.stderr.write("Error: " + errorMessage + "\\n");',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'console.log("Processing " + count + " files...");',
        'console.error("Error: " + errorMessage);',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
