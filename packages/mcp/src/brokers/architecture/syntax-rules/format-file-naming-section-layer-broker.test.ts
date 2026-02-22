import { formatFileNamingSectionLayerBroker } from './format-file-naming-section-layer-broker';
import { formatFileNamingSectionLayerBrokerProxy } from './format-file-naming-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatFileNamingSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for file naming rules', () => {
    formatFileNamingSectionLayerBrokerProxy();

    const result = formatFileNamingSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## File Naming',
        '',
        '**All filenames must use kebab-case**',
        '',
        'Pattern: Lowercase letters, numbers, and hyphens only, with valid file extensions',
        '',
        '**Examples:**',
        '- ✅ `user-fetch-broker.ts`',
        '- ✅ `format-date-transformer.ts`',
        '- ✅ `user-contract.ts`',
        '',
        '**Violations:**',
        '- ❌ `userFetchBroker.ts`',
        '- ❌ `format_date_transformer.ts`',
        '- ❌ `UserContract.ts`',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
