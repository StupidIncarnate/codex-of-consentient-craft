import { QuestContractPropertyStub } from '../../contracts/quest-contract-property/quest-contract-property.stub';

import { renderMermaidContractPropertyTransformer } from './render-mermaid-contract-property-transformer';

describe('renderMermaidContractPropertyTransformer', () => {
  describe('basic properties', () => {
    it('VALID: {name: email, type: EmailAddress, depth: 0} => renders indented property line', () => {
      const property = QuestContractPropertyStub({
        name: 'email',
        type: 'EmailAddress',
        description: 'User email',
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 0 });

      expect(result).toBe('<br/><small>&nbsp;&nbsp;email: EmailAddress</small>');
    });

    it('VALID: {depth: 1} => renders with double indentation', () => {
      const property = QuestContractPropertyStub({
        name: 'street',
        type: 'StreetAddress',
        description: 'Street line',
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 1 });

      expect(result).toBe('<br/><small>&nbsp;&nbsp;&nbsp;&nbsp;street: StreetAddress</small>');
    });
  });

  describe('property with value', () => {
    it('VALID: {value: POST} => renders name: type = value', () => {
      const property = QuestContractPropertyStub({
        name: 'method',
        type: 'HttpMethod',
        value: 'POST',
        description: 'HTTP method',
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 0 });

      expect(result).toBe('<br/><small>&nbsp;&nbsp;method: HttpMethod = POST</small>');
    });

    it('VALID: {value with special chars} => escapes mermaid-breaking characters in value', () => {
      const property = QuestContractPropertyStub({
        name: 'path',
        type: 'UrlPath',
        value: '/api/quests/:questId',
        description: 'Endpoint path',
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 0 });

      expect(result).toBe('<br/><small>&nbsp;&nbsp;path: UrlPath = /api/quests/:questId</small>');
    });
  });

  describe('optional properties', () => {
    it('VALID: {optional: true} => renders question mark after name', () => {
      const property = QuestContractPropertyStub({
        name: 'nickname',
        type: 'UserNickname',
        description: 'Optional nickname',
        optional: true,
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 0 });

      expect(result).toBe('<br/><small>&nbsp;&nbsp;nickname?: UserNickname</small>');
    });
  });

  describe('special characters', () => {
    it('VALID: {value with quotes} => escapes quotes as &quot;', () => {
      const property = QuestContractPropertyStub({
        name: 'header',
        type: 'HeaderValue',
        value: 'application/json',
        description: 'Content type header',
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 0 });

      expect(result).toBe('<br/><small>&nbsp;&nbsp;header: HeaderValue = application/json</small>');
    });

    it('VALID: {value with brackets} => escapes brackets in value', () => {
      const property = QuestContractPropertyStub({
        name: 'format',
        type: 'FormatString',
        value: '[date] {time}',
        description: 'Log format',
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 0 });

      expect(result).toBe(
        '<br/><small>&nbsp;&nbsp;format: FormatString = #91;date#93; #123;time#125;</small>',
      );
    });
  });

  describe('nested properties', () => {
    it('VALID: {properties: [child]} => renders parent and child with increasing depth', () => {
      const property = QuestContractPropertyStub({
        name: 'address',
        type: 'AddressShape',
        description: 'Mailing address',
        properties: [
          QuestContractPropertyStub({
            name: 'city',
            type: 'CityName',
            description: 'City',
          }),
        ],
      });

      const result = renderMermaidContractPropertyTransformer({ property, depth: 0 });

      expect(result).toBe(
        '<br/><small>&nbsp;&nbsp;address: AddressShape</small><br/><small>&nbsp;&nbsp;&nbsp;&nbsp;city: CityName</small>',
      );
    });
  });
});
