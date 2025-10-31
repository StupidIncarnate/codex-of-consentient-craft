import { formatNamedExportsSectionLayerBroker } from './format-named-exports-section-layer-broker';
import { formatNamedExportsSectionLayerBrokerProxy } from './format-named-exports-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatNamedExportsSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for named export rules', () => {
    formatNamedExportsSectionLayerBrokerProxy();

    const result = formatNamedExportsSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Named Exports',
        '',
        '**Always use named exports, never default exports**',
        '',
        '**Exceptions:**',
        '- Index files connecting to systems that require default exports',
        '',
        '**Examples:**',
        '- ✅ `export const userFetchBroker = ...`',
        '- ✅ `export type User = { ... }`',
        '',
        '**Violations:**',
        '- ❌ `export default function userFetchBroker() { ... }`',
        '- ❌ `export default class User { ... }`',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
