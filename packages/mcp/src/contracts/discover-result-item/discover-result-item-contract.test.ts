import { discoverResultItemContract as _discoverResultItemContract } from './discover-result-item-contract';
import { DiscoverResultItemStub } from './discover-result-item.stub';
import { GrepHitStub } from '../grep-hit/grep-hit.stub';

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
      signature: '({ userId }: { userId: UserId }): Promise<User>',
      relatedFiles: [],
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
      signature: '({ userId }: { userId: UserId }): Promise<User>',
      relatedFiles: [],
    });
  });

  it('VALID: {name: "guard", path: "/guards", type: "guard"} => parses successfully without optional fields', () => {
    const {
      purpose: _purpose,
      usage: _usage,
      signature: _signature,
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
      relatedFiles: [],
    });
  });

  it('VALID: {name: "broker", path: "/path", type: "broker", usage: "example code"} => parses successfully with usage only', () => {
    const result = DiscoverResultItemStub({
      name: 'broker',
      path: '/path',
      type: 'broker',
      usage: 'const result = await broker();',
    });

    expect(result).toStrictEqual({
      name: 'broker',
      path: '/path',
      type: 'broker',
      purpose: 'Fetches user data from the API by user ID',
      usage: 'const result = await broker();',
      signature: '({ userId }: { userId: UserId }): Promise<User>',
      relatedFiles: [],
    });
  });

  it('VALID: {with hits array} => parses successfully', () => {
    const result = DiscoverResultItemStub({
      name: 'fsAccessAdapter',
      path: '/src/adapters/fs-access-adapter.ts',
      type: 'adapter',
      hits: [
        GrepHitStub({ line: 14, text: 'if (error.code === "ENOENT") {' }),
        GrepHitStub({ line: 18, text: 'throw new FileNotFoundError("ENOENT");' }),
      ],
    });

    expect(result).toStrictEqual({
      name: 'fsAccessAdapter',
      path: '/src/adapters/fs-access-adapter.ts',
      type: 'adapter',
      purpose: 'Fetches user data from the API by user ID',
      usage:
        "const user = await userFetchBroker({ userId: UserIdStub('f47ac10b-58cc-4372-a567-0e02b2c3d479') });",
      signature: '({ userId }: { userId: UserId }): Promise<User>',
      relatedFiles: [],
      hits: [
        { line: 14, text: 'if (error.code === "ENOENT") {' },
        { line: 18, text: 'throw new FileNotFoundError("ENOENT");' },
      ],
    });
  });
});
