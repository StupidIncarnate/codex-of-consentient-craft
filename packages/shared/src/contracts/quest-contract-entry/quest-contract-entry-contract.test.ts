import { FlowNodeIdStub } from '../flow-node-id/flow-node-id.stub';

import { questContractEntryContract } from './quest-contract-entry-contract';
import { QuestContractEntryStub } from './quest-contract-entry.stub';

describe('questContractEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {id, name, kind, status, source, nodeId, properties with one property} => parses minimal entry', () => {
      const entry = QuestContractEntryStub();

      expect(entry).toStrictEqual({
        id: 'login-credentials',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
        nodeId: 'default-node',
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
        id: 'user-profile',
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
        id: 'user-profile',
        name: 'UserProfile',
        kind: 'data',
        status: 'modified',
        nodeId: 'default-node',
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
                description: 'Street name',
              },
              {
                name: 'city',
                type: 'CityName',
                description: 'City name',
              },
              {
                name: 'zipCode',
                type: 'ZipCode',
                description: 'Zip code',
              },
            ],
          },
        ],
      });

      expect(entry).toStrictEqual({
        id: 'login-credentials',
        name: 'ShippingAddress',
        kind: 'data',
        status: 'new',
        source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
        nodeId: 'default-node',
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
                description: 'Street name',
              },
              {
                name: 'city',
                type: 'CityName',
                description: 'City name',
              },
              {
                name: 'zipCode',
                type: 'ZipCode',
                description: 'Zip code',
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
            type: 'HttpMethod',
            value: 'POST',
            description: 'HTTP method',
          },
          {
            name: 'path',
            type: 'EndpointPath',
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
        id: 'login-credentials',
        name: 'AuthLoginEndpoint',
        kind: 'endpoint',
        status: 'new',
        source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
        nodeId: 'default-node',
        properties: [
          {
            name: 'method',
            type: 'HttpMethod',
            value: 'POST',
            description: 'HTTP method',
          },
          {
            name: 'path',
            type: 'EndpointPath',
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

    it('VALID: {with custom nodeId} => parses entry with flow node link', () => {
      const nodeId = FlowNodeIdStub({ value: 'submit-form' });
      const entry = QuestContractEntryStub({ nodeId });

      expect(entry).toStrictEqual({
        id: 'login-credentials',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
        nodeId: 'submit-form',
        properties: [
          {
            name: 'email',
            type: 'EmailAddress',
            description: 'User email for authentication',
          },
        ],
      });
    });

    it('VALID: {default stub} => creates valid entry', () => {
      const entry = QuestContractEntryStub();

      const result = questContractEntryContract.parse(entry);

      expect(result).toStrictEqual({
        id: 'login-credentials',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
        nodeId: 'default-node',
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
    it('INVALID: {id: "Not-Valid"} => throws validation error', () => {
      expect(() => {
        return questContractEntryContract.parse({
          id: 'Not-Valid',
          name: 'ValidName',
          kind: 'data',
          status: 'new',
          source: 'packages/shared/src/contracts/valid-name/valid-name-contract.ts',
          nodeId: 'some-node',
          properties: [{ name: 'field' }],
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {name: ""} => throws validation error', () => {
      expect(() => {
        return questContractEntryContract.parse({
          id: 'valid-id',
          name: '',
          kind: 'data',
          status: 'new',
          source: 'packages/shared/src/contracts/valid-name/valid-name-contract.ts',
          nodeId: 'some-node',
          properties: [{ name: 'field' }],
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {without nodeId} => throws validation error', () => {
      expect(() => {
        return questContractEntryContract.parse({
          id: 'valid-id',
          name: 'ValidName',
          kind: 'data',
          status: 'new',
          source: 'packages/shared/src/contracts/valid-name/valid-name-contract.ts',
          properties: [{ name: 'field' }],
        });
      }).toThrow(/invalid_type/u);
    });

    it('INVALID: {without source} => throws validation error (source is required)', () => {
      expect(() => {
        return questContractEntryContract.parse({
          id: 'valid-id',
          name: 'ValidName',
          kind: 'data',
          status: 'new',
          nodeId: 'some-node',
          properties: [{ name: 'field' }],
        });
      }).toThrow(/Required/u);
    });

    it('INVALID: {source: ""} => throws validation error (source must be non-empty)', () => {
      expect(() => {
        return questContractEntryContract.parse({
          id: 'valid-id',
          name: 'ValidName',
          kind: 'data',
          status: 'new',
          source: '',
          nodeId: 'some-node',
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
        id: 'login-credentials',
        name: 'LoginCredentials',
        kind: 'data',
        status: 'new',
        source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
        nodeId: 'default-node',
        properties: [],
      });
    });
  });
});
