import { questContractEntryContract } from './quest-contract-entry-contract';
import { QuestContractEntryStub } from './quest-contract-entry.stub';

describe('questContractEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {id, name, kind, status, properties with one property} => parses minimal entry', () => {
      const entry = QuestContractEntryStub();

      expect(entry).toStrictEqual({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        properties: [
          {
            name: 'email',
            type: 'EmailAddress',
            description: 'User email for authentication',
          },
        ],
      });
    });

    it('VALID: {all fields including source and multiple properties} => parses full entry', () => {
      const entry = QuestContractEntryStub({
        id: 'b58dc20c-69dd-5483-b678-1f13c3d4e590',
        name: 'UserProfile',
        kind: 'data',
        status: 'modified',
        source: 'packages/shared/src/contracts/user-profile/user-profile-contract.ts',
        properties: [
          {
            name: 'displayName',
            type: 'DisplayName',
            description: 'User display name',
          },
          {
            name: 'avatarUrl',
            type: 'AvatarUrl',
            description: 'URL to user avatar image',
            optional: true,
          },
          {
            name: 'bio',
            type: 'Biography',
            description: 'Short user biography',
            optional: true,
          },
        ],
      });

      expect(entry).toStrictEqual({
        id: 'b58dc20c-69dd-5483-b678-1f13c3d4e590',
        name: 'UserProfile',
        kind: 'data',
        status: 'modified',
        source: 'packages/shared/src/contracts/user-profile/user-profile-contract.ts',
        properties: [
          {
            name: 'displayName',
            type: 'DisplayName',
            description: 'User display name',
          },
          {
            name: 'avatarUrl',
            type: 'AvatarUrl',
            description: 'URL to user avatar image',
            optional: true,
          },
          {
            name: 'bio',
            type: 'Biography',
            description: 'Short user biography',
            optional: true,
          },
        ],
      });
    });

    it('VALID: {nested properties} => parses entry with recursive quest-contract-property', () => {
      const entry = QuestContractEntryStub({
        name: 'ShippingAddress',
        kind: 'data',
        status: 'new',
        properties: [
          {
            name: 'recipient',
            type: 'RecipientName',
            description: 'Full name of recipient',
          },
          {
            name: 'address',
            type: 'Address',
            description: 'Mailing address',
            properties: [
              {
                name: 'street',
                type: 'StreetName',
              },
              {
                name: 'city',
                type: 'CityName',
              },
              {
                name: 'zipCode',
                type: 'ZipCode',
              },
            ],
          },
        ],
      });

      expect(entry).toStrictEqual({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'ShippingAddress',
        kind: 'data',
        status: 'new',
        properties: [
          {
            name: 'recipient',
            type: 'RecipientName',
            description: 'Full name of recipient',
          },
          {
            name: 'address',
            type: 'Address',
            description: 'Mailing address',
            properties: [
              {
                name: 'street',
                type: 'StreetName',
              },
              {
                name: 'city',
                type: 'CityName',
              },
              {
                name: 'zipCode',
                type: 'ZipCode',
              },
            ],
          },
        ],
      });
    });

    it('VALID: {endpoint kind with method/path properties} => parses endpoint entry', () => {
      const entry = QuestContractEntryStub({
        name: 'AuthLoginEndpoint',
        kind: 'endpoint',
        status: 'new',
        properties: [
          {
            name: 'method',
            value: 'POST',
            description: 'HTTP method',
          },
          {
            name: 'path',
            value: '/api/auth/login',
            description: 'API endpoint path',
          },
          {
            name: 'request',
            type: 'LoginCredentials',
            description: 'Request body contract',
          },
          {
            name: 'response',
            type: 'AuthToken',
            description: 'Response body contract',
          },
        ],
      });

      expect(entry).toStrictEqual({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'AuthLoginEndpoint',
        kind: 'endpoint',
        status: 'new',
        properties: [
          {
            name: 'method',
            value: 'POST',
            description: 'HTTP method',
          },
          {
            name: 'path',
            value: '/api/auth/login',
            description: 'API endpoint path',
          },
          {
            name: 'request',
            type: 'LoginCredentials',
            description: 'Request body contract',
          },
          {
            name: 'response',
            type: 'AuthToken',
            description: 'Response body contract',
          },
        ],
      });
    });

    it('VALID: {default stub} => creates valid entry', () => {
      const entry = QuestContractEntryStub();

      const result = questContractEntryContract.parse(entry);

      expect(result).toStrictEqual({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        properties: [
          {
            name: 'email',
            type: 'EmailAddress',
            description: 'User email for authentication',
          },
        ],
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID_ID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return questContractEntryContract.parse({
          id: 'not-a-uuid',
          name: 'ValidName',
          kind: 'data',
          status: 'new',
          properties: [{ name: 'field' }],
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID_NAME: {name: ""} => throws validation error', () => {
      expect(() => {
        return questContractEntryContract.parse({
          id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
          name: '',
          kind: 'data',
          status: 'new',
          properties: [{ name: 'field' }],
        });
      }).toThrow(/too_small/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {properties: []} => parses with empty properties array', () => {
      const entry = QuestContractEntryStub({
        properties: [],
      });

      expect(entry).toStrictEqual({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        properties: [],
      });
    });

    it('EDGE: {without source} => parses entry without optional source field', () => {
      const entry = QuestContractEntryStub();

      expect(entry).toStrictEqual({
        id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        properties: [
          {
            name: 'email',
            type: 'EmailAddress',
            description: 'User email for authentication',
          },
        ],
      });
      expect('source' in entry).toBe(false);
    });
  });
});
