import { DiscoverResultStub } from './discover-result.stub';

describe('discoverResultContract', () => {
  it('VALID: {results: [], count: 0} => parses successfully', () => {
    const result = DiscoverResultStub({ results: [], count: 0 });

    expect(result).toStrictEqual({
      results: [],
      count: 0,
    });
  });

  it('VALID: {results: [{...}], count: 1} => parses successfully', () => {
    const result = DiscoverResultStub({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          purpose: 'Test purpose',
        },
      ],
      count: 1,
    });

    expect(result).toStrictEqual({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          purpose: 'Test purpose',
        },
      ],
      count: 1,
    });
  });

  it('VALID: {results: [{...}, {...}], count: 2} => parses successfully with multiple results', () => {
    const result = DiscoverResultStub({
      results: [
        {
          name: 'broker1',
          path: '/path1',
          type: 'broker',
        },
        {
          name: 'broker2',
          path: '/path2',
          type: 'broker',
        },
      ],
      count: 2,
    });

    expect(result).toStrictEqual({
      results: [
        {
          name: 'broker1',
          path: '/path1',
          type: 'broker',
        },
        {
          name: 'broker2',
          path: '/path2',
          type: 'broker',
        },
      ],
      count: 2,
    });
  });

  it('VALID: {results: [{name, path, type, usage}], count: 1} => parses successfully with usage field', () => {
    const result = DiscoverResultStub({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          usage: 'const result = await testBroker();',
        },
      ],
      count: 1,
    });

    expect(result).toStrictEqual({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          usage: 'const result = await testBroker();',
        },
      ],
      count: 1,
    });
  });

  it('VALID: {results: [{name, path, type, related: []}], count: 1} => parses successfully with empty related array', () => {
    const result = DiscoverResultStub({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          related: [],
        },
      ],
      count: 1,
    });

    expect(result).toStrictEqual({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          related: [],
        },
      ],
      count: 1,
    });
  });

  it('VALID: {results: [{name, path, type, related: [...]}], count: 1} => parses successfully with multiple related files', () => {
    const result = DiscoverResultStub({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          related: ['broker1', 'broker2', 'broker3'],
        },
      ],
      count: 1,
    });

    expect(result).toStrictEqual({
      results: [
        {
          name: 'testBroker',
          path: '/test/path',
          type: 'broker',
          related: ['broker1', 'broker2', 'broker3'],
        },
      ],
      count: 1,
    });
  });
});
