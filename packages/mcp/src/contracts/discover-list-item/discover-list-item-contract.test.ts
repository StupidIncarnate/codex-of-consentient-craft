import { discoverListItemContract as _discoverListItemContract } from './discover-list-item-contract';
import { DiscoverListItemStub } from './discover-list-item.stub';

describe('discoverListItemContract', () => {
  it('VALID: {name, type, purpose} => parses successfully', () => {
    const result = DiscoverListItemStub({
      name: 'has-permission-guard',
      type: 'guard',
      purpose: 'Validates that user has permission to edit resource',
    });

    expect(result).toStrictEqual({
      name: 'has-permission-guard',
      type: 'guard',
      purpose: 'Validates that user has permission to edit resource',
    });
  });

  it('VALID: {name, type} without purpose => parses successfully', () => {
    const result = DiscoverListItemStub({
      name: 'plain-transformer',
      type: 'transformer',
    });

    expect(result).toStrictEqual({
      name: 'plain-transformer',
      type: 'transformer',
    });
  });

  it('VALID: {name, type, purpose: undefined} => parses successfully', () => {
    const result = DiscoverListItemStub({
      name: 'my-broker',
      type: 'broker',
      purpose: undefined,
    });

    expect(result.name).toBe('my-broker');
    expect(result.type).toBe('broker');
    expect(result.purpose).toBeUndefined();
  });
});
