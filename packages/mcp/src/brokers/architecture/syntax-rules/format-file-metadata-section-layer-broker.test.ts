import { formatFileMetadataSectionLayerBroker } from './format-file-metadata-section-layer-broker';
import { formatFileMetadataSectionLayerBrokerProxy } from './format-file-metadata-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatFileMetadataSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for file metadata rules', () => {
    formatFileMetadataSectionLayerBrokerProxy();

    const result = formatFileMetadataSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## File Metadata Documentation',
        '',
        '**Every implementation file must have structured metadata comments at the very top (before imports)**',
        '',
        '**Required format:**',
        '```typescript',
        '/** * PURPOSE: [One-line description] * * USAGE: * [Code example] * // [Comment explaining what it returns] */',
        '```',
        '',
        '**Required for:**',
        '- All implementation files (-adapter.ts, -broker.ts, -guard.ts, -transformer.ts, -contract.ts, -statics.ts, etc.)',
        '',
        '**Not required for:**',
        '- Test files (.test.ts)',
        '- Proxy files (.proxy.ts)',
        '- Stub files (.stub.ts)',
        '',
        '**Optional fields:**',
        '- WHEN-TO-USE',
        '- WHEN-NOT-TO-USE',
        '',
        '**Example:**',
        '```typescript',
        '/** * PURPOSE: Validates if a user has permission to perform an action * * USAGE: * hasPermissionGuard({user, permission: "admin:delete"}); * // Returns true if user has permission, false otherwise * * WHEN-TO-USE: Before executing privileged operations * WHEN-NOT-TO-USE: For public endpoints that don\'t require authorization */',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
