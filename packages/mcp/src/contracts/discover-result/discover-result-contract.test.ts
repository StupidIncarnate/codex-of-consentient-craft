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
});
