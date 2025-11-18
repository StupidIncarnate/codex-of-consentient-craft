import { fileMetadataContract as _fileMetadataContract } from './file-metadata-contract';
import { FileMetadataStub } from './file-metadata.stub';

describe('fileMetadataContract', () => {
  it('VALID: {complete metadata with empty arrays} => parses successfully', () => {
    const result = FileMetadataStub({
      name: 'testBroker',
      path: '/test/brokers/test-broker.ts',
      fileType: 'broker',
      purpose: 'Test purpose',
      signature: {
        raw: '(): void',
        parameters: [],
        returnType: 'void',
      },
      usage: 'testBroker();',
    });

    expect(result).toStrictEqual({
      name: 'testBroker',
      path: '/test/brokers/test-broker.ts',
      fileType: 'broker',
      purpose: 'Test purpose',
      signature: {
        raw: '(): void',
        parameters: [],
        returnType: 'void',
      },
      usage: 'testBroker();',
      relatedFiles: [],
    });
  });

  it('VALID: {with single parameter} => parses successfully', () => {
    const result = FileMetadataStub({
      name: 'userFetchBroker',
      path: '/src/brokers/user/fetch/user-fetch-broker.ts',
      fileType: 'broker',
      purpose: 'Fetches user data',
      signature: {
        raw: '({userId}: {userId: UserId}): Promise<User>',
        parameters: [
          {
            name: 'userId',
            type: 'UserId',
          },
        ],
        returnType: 'Promise<User>',
      },
      usage: 'await userFetchBroker({userId});',
    });

    expect(result).toStrictEqual({
      name: 'userFetchBroker',
      path: '/src/brokers/user/fetch/user-fetch-broker.ts',
      fileType: 'broker',
      purpose: 'Fetches user data',
      signature: {
        raw: '({userId}: {userId: UserId}): Promise<User>',
        parameters: [
          {
            name: 'userId',
            type: 'UserId',
          },
        ],
        returnType: 'Promise<User>',
      },
      usage: 'await userFetchBroker({userId});',
      relatedFiles: [],
    });
  });

  it('VALID: {with multiple parameters} => parses successfully', () => {
    const result = FileMetadataStub({
      name: 'userSearchBroker',
      path: '/src/brokers/user/search/user-search-broker.ts',
      fileType: 'broker',
      purpose: 'Searches for users',
      signature: {
        raw: '({query, limit}: {query: SearchQuery; limit: number}): Promise<User[]>',
        parameters: [
          {
            name: 'query',
            type: 'SearchQuery',
          },
          {
            name: 'limit',
            type: 'number',
          },
        ],
        returnType: 'Promise<User[]>',
      },
      usage: 'await userSearchBroker({query, limit: 10});',
    });

    expect(result).toStrictEqual({
      name: 'userSearchBroker',
      path: '/src/brokers/user/search/user-search-broker.ts',
      fileType: 'broker',
      purpose: 'Searches for users',
      signature: {
        raw: '({query, limit}: {query: SearchQuery; limit: number}): Promise<User[]>',
        parameters: [
          {
            name: 'query',
            type: 'SearchQuery',
          },
          {
            name: 'limit',
            type: 'number',
          },
        ],
        returnType: 'Promise<User[]>',
      },
      usage: 'await userSearchBroker({query, limit: 10});',
      relatedFiles: [],
    });
  });

  it('VALID: {with parameter type as record} => parses successfully', () => {
    const result = FileMetadataStub({
      name: 'configBroker',
      path: '/src/brokers/config/config-broker.ts',
      fileType: 'broker',
      purpose: 'Manages configuration',
      signature: {
        raw: '({options}: {options: Record<string, string>}): Config',
        parameters: [
          {
            name: 'options',
            type: {
              key: 'string',
              value: 'string',
            },
          },
        ],
        returnType: 'Config',
      },
      usage: 'configBroker({options: {debug: "true"}});',
    });

    expect(result).toStrictEqual({
      name: 'configBroker',
      path: '/src/brokers/config/config-broker.ts',
      fileType: 'broker',
      purpose: 'Manages configuration',
      signature: {
        raw: '({options}: {options: Record<string, string>}): Config',
        parameters: [
          {
            name: 'options',
            type: {
              key: 'string',
              value: 'string',
            },
          },
        ],
        returnType: 'Config',
      },
      usage: 'configBroker({options: {debug: "true"}});',
      relatedFiles: [],
    });
  });

  it('VALID: {without optional metadata field} => parses successfully', () => {
    const result = FileMetadataStub({
      name: 'simpleGuard',
      path: '/src/guards/simple/simple-guard.ts',
      fileType: 'guard',
      purpose: 'Simple validation',
      signature: {
        raw: '(): boolean',
        parameters: [],
        returnType: 'boolean',
      },
      usage: 'if (simpleGuard()) { ... }',
    });

    expect(result).toStrictEqual({
      name: 'simpleGuard',
      path: '/src/guards/simple/simple-guard.ts',
      fileType: 'guard',
      purpose: 'Simple validation',
      signature: {
        raw: '(): boolean',
        parameters: [],
        returnType: 'boolean',
      },
      usage: 'if (simpleGuard()) { ... }',
      relatedFiles: [],
    });
  });

  it('VALID: {with optional metadata field} => parses successfully', () => {
    const result = FileMetadataStub({
      name: 'complexBroker',
      path: '/src/brokers/complex/complex-broker.ts',
      fileType: 'broker',
      purpose: 'Complex operations',
      signature: {
        raw: '(): void',
        parameters: [],
        returnType: 'void',
      },
      usage: 'complexBroker();',
      metadata: {
        whenToUse: 'Use when you need X',
        whenNotToUse: 'Do not use when Y',
      },
    });

    expect(result).toStrictEqual({
      name: 'complexBroker',
      path: '/src/brokers/complex/complex-broker.ts',
      fileType: 'broker',
      purpose: 'Complex operations',
      signature: {
        raw: '(): void',
        parameters: [],
        returnType: 'void',
      },
      usage: 'complexBroker();',
      metadata: {
        whenToUse: 'Use when you need X',
        whenNotToUse: 'Do not use when Y',
      },
      relatedFiles: [],
    });
  });
});
