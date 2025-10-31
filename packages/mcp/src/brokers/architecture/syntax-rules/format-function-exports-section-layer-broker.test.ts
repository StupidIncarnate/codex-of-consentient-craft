import { formatFunctionExportsSectionLayerBroker } from './format-function-exports-section-layer-broker';
import { formatFunctionExportsSectionLayerBrokerProxy } from './format-function-exports-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatFunctionExportsSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for function export rules', () => {
    formatFunctionExportsSectionLayerBrokerProxy();

    const result = formatFunctionExportsSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Function Exports',
        '',
        '**All functions must use export const with arrow function syntax**',
        '',
        '**Exceptions:**',
        '- Error classes use export class',
        '',
        '**Examples:**',
        '```typescript',
        'export const userFetchBroker = async ({userId}: {userId: UserId}): Promise<User> => { /* implementation */ };',
        '',
        'export class ValidationError extends Error { /* implementation */ }',
        '',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'export function userFetchBroker(userId: UserId): Promise<User> { /* implementation */ }',
        '',
        'export default function userFetchBroker(userId: UserId): Promise<User> { /* implementation */ }',
        '',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
