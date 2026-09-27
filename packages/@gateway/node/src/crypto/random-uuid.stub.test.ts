import { RandomUuidStub } from './random-uuid.stub';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

describe('RandomUuidStub', () => {
  it('VALID: {} => returns a real v4 UUID', () => {
    expect(RandomUuidStub()).toMatch(UUID_PATTERN);
  });

  it('VALID: {} => returns a distinct id on each of two calls', () => {
    const ids = new Set([RandomUuidStub(), RandomUuidStub()]);

    expect(ids.size).toBe(2);
  });
});
