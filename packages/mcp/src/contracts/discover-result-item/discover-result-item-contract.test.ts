import { DiscoverResultItemStub } from './discover-result-item.stub';

describe('discoverResultItemContract', () => {
  it('VALID: {name: "test", path: "/path", type: "broker"} => parses successfully', () => {
    const result = DiscoverResultItemStub({
      name: 'test',
      path: '/path',
      type: 'broker',
    });

    expect(result).toStrictEqual({
      name: 'test',
      path: '/path',
      type: 'broker',
      purpose: 'Fetches user data from the API by user ID',
      usage:
        "const user = await userFetchBroker({ userId: UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479') });",
      related: ['userCreateBroker', 'userUpdateBroker'],
    });
  });

  it('VALID: {name: "widget", path: "/ui", type: "widget", purpose: "Displays user info"} => parses successfully', () => {
    const result = DiscoverResultItemStub({
      name: 'widget',
      path: '/ui',
      type: 'widget',
      purpose: 'Displays user info',
    });

    expect(result).toStrictEqual({
      name: 'widget',
      path: '/ui',
      type: 'widget',
      purpose: 'Displays user info',
      usage:
        "const user = await userFetchBroker({ userId: UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479') });",
      related: ['userCreateBroker', 'userUpdateBroker'],
    });
  });

  it('VALID: {name: "guard", path: "/guards", type: "guard"} => parses successfully without optional fields', () => {
    const {
      purpose: _purpose,
      usage: _usage,
      related: _related,
      ...itemWithoutOptionals
    } = DiscoverResultItemStub({
      name: 'guard',
      path: '/guards',
      type: 'guard',
    });

    expect(itemWithoutOptionals).toStrictEqual({
      name: 'guard',
      path: '/guards',
      type: 'guard',
    });
  });
});
