import { formatTypeExportsSectionLayerBroker } from './format-type-exports-section-layer-broker';
import { formatTypeExportsSectionLayerBrokerProxy } from './format-type-exports-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatTypeExportsSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for type export rules', () => {
    formatTypeExportsSectionLayerBrokerProxy();

    const result = formatTypeExportsSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Type Export Rules',
        '',
        '**Type export syntax varies by file type**',
        '',
        '- **Regular files:** Only define types with export type Name = { ... }',
        '- **Index files:** Only re-export with export type { Name } from "./types"',
        '- **Forbidden:** Never use export { type Name } (forbidden inline syntax)',
        '',
        '**Examples:**',
        '```typescript',
        'export type User = { id: UserId; name: UserName; }; // Regular file',
        'export type {User} from "./user-contract"; // index.ts re-export',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'export {type User} from "./user-contract"; // Forbidden inline syntax',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
