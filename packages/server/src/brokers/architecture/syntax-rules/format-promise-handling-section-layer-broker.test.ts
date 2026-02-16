import { formatPromiseHandlingSectionLayerBroker } from './format-promise-handling-section-layer-broker';
import { formatPromiseHandlingSectionLayerBrokerProxy } from './format-promise-handling-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatPromiseHandlingSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for promise handling rules', () => {
    formatPromiseHandlingSectionLayerBrokerProxy();

    const result = formatPromiseHandlingSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Promise Handling',
        '',
        '**Always use async/await over .then() chains for readability**',
        '',
        '- Not every async call needs try/catch - handle errors at appropriate level',
        '- Use Promise.all() for parallel operations when independent',
        '- Await sequentially only when operations are dependent',
        '',
        '**Examples:**',
        '```typescript',
        'const [user, config, permissions] = await Promise.all([fetchUser({id: userId}), loadConfig(), getPermissions({id: userId})]); // Parallel when independent',
        '',
        'const user = await fetchUser({id: userId}); const company = await fetchCompany({companyId: user.companyId}); // Sequential when dependent',
        '',
        '```',
        '',
        '**Violations:**',
        '```typescript',
        'const user = await fetchUser({id: userId}); const config = await loadConfig(); const permissions = await getPermissions({id: userId}); // Should be parallel',
        '```',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
