import { formatFunctionParametersSectionLayerBroker } from './format-function-parameters-section-layer-broker';
import { formatFunctionParametersSectionLayerBrokerProxy } from './format-function-parameters-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatFunctionParametersSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for function parameter rules', () => {
    formatFunctionParametersSectionLayerBrokerProxy();

    const result = formatFunctionParametersSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Function Parameters',
        '',
        '**All app code functions must use object destructuring with inline types**',
        '',
        '**Exceptions:**',
        '- Only when integrating with external APIs that require specific signatures',
        '',
        '**Examples:**',
        '```typescript',
        'export const updateUser = ({user, companyId}: {user: User; companyId: CompanyId}): Promise<User> => { /* implementation */ };',
        '',
        'export const processOrder = ({user, companyId}: {user: User; companyId: CompanyId}): Promise<Order> => { /* Type safety maintained - companyId is CompanyId branded type, not raw string */ };',
        '',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'export const updateUser = (user: User, companyId: string) => { /* implementation */ };',
        '',
        'export const processOrder = ({userName, userEmail, companyId}: {userName: string; userEmail: string; companyId: string;}): Promise<Order> => { /* Use UserName, EmailAddress, CompanyId contracts */ };',
        '',
        '```',
        '',
        '**Note:** Pass complete objects to preserve type relationships using contracts, not individual properties',
        '',
        "**ID Extraction:** When you need just an ID, extract it with Type['id'] notation",
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
