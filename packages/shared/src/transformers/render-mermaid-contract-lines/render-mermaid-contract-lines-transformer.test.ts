import { QuestContractEntryStub } from '../../contracts/quest-contract-entry/quest-contract-entry.stub';
import { QuestContractPropertyStub } from '../../contracts/quest-contract-property/quest-contract-property.stub';

import { renderMermaidContractLinesTransformer } from './render-mermaid-contract-lines-transformer';

describe('renderMermaidContractLinesTransformer', () => {
  describe('single contract', () => {
    it('VALID: {1 contract with 1 property} => renders header and property', () => {
      const contracts = [
        QuestContractEntryStub({
          name: 'LoginCredentials',
          properties: [
            QuestContractPropertyStub({
              name: 'email',
              type: 'EmailAddress',
              description: 'User email',
            }),
          ],
        }),
      ];

      const result = renderMermaidContractLinesTransformer({ contracts });

      expect(result).toBe(
        '<br/><small>#91;LoginCredentials#93;</small><br/><small>&nbsp;&nbsp;email: EmailAddress</small>',
      );
    });

    it('VALID: {contract with multiple properties} => renders all properties', () => {
      const contracts = [
        QuestContractEntryStub({
          name: 'AuthEndpoint',
          properties: [
            QuestContractPropertyStub({
              name: 'method',
              type: 'HttpMethod',
              value: 'POST',
              description: 'HTTP method',
            }),
            QuestContractPropertyStub({
              name: 'path',
              type: 'UrlPath',
              value: '/api/auth',
              description: 'Endpoint path',
            }),
          ],
        }),
      ];

      const result = renderMermaidContractLinesTransformer({ contracts });

      expect(result).toBe(
        '<br/><small>#91;AuthEndpoint#93;</small><br/><small>&nbsp;&nbsp;method: HttpMethod = POST</small><br/><small>&nbsp;&nbsp;path: UrlPath = /api/auth</small>',
      );
    });
  });

  describe('multiple contracts', () => {
    it('VALID: {2 contracts} => renders both headers and properties', () => {
      const contracts = [
        QuestContractEntryStub({
          id: 'contract-1',
          name: 'RequestBody',
          properties: [
            QuestContractPropertyStub({
              name: 'title',
              type: 'QuestTitle',
              description: 'Quest title',
            }),
          ],
        }),
        QuestContractEntryStub({
          id: 'contract-2',
          name: 'ResponseShape',
          properties: [
            QuestContractPropertyStub({
              name: 'id',
              type: 'QuestId',
              description: 'Created quest ID',
            }),
          ],
        }),
      ];

      const result = renderMermaidContractLinesTransformer({ contracts });

      expect(result).toBe(
        '<br/><small>#91;RequestBody#93;</small><br/><small>&nbsp;&nbsp;title: QuestTitle</small><br/><small>#91;ResponseShape#93;</small><br/><small>&nbsp;&nbsp;id: QuestId</small>',
      );
    });
  });

  describe('empty contracts', () => {
    it('EMPTY: {contracts: []} => returns empty string', () => {
      const result = renderMermaidContractLinesTransformer({ contracts: [] });

      expect(result).toBe('');
    });
  });
});
