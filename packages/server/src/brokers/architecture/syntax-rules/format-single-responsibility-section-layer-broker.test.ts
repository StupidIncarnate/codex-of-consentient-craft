import { formatSingleResponsibilitySectionLayerBroker } from './format-single-responsibility-section-layer-broker';
import { formatSingleResponsibilitySectionLayerBrokerProxy } from './format-single-responsibility-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatSingleResponsibilitySectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for single responsibility rules', () => {
    formatSingleResponsibilitySectionLayerBrokerProxy();

    const result = formatSingleResponsibilitySectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Single Responsibility Per File',
        '',
        '**Each file must contain and export exactly one primary piece of functionality**',
        '',
        '**Allowed co-exports:**',
        '- Supporting types and interfaces directly related to that functionality',
        '',
        '**Examples:**',
        '```typescript',
        'export type UserFetchParams = { userId: UserId; }; export const userFetchBroker = async ({userId}: UserFetchParams): Promise<User> => { /* implementation */ };',
        '',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'export const userFetchBroker = async ({userId}: {userId: UserId}): Promise<User> => {}; export const userCreateBroker = async ({data}: {data: UserData}): Promise<User> => {}; export const userDeleteBroker = async ({userId}: {userId: UserId}): Promise<void> => {};',
        '',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
