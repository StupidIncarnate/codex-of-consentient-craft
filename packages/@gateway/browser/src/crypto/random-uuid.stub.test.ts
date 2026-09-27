import { RandomUuidStub } from './random-uuid.stub';

describe('RandomUuidStub', () => {
  it('VALID: {} => a real, correctly-shaped v4 UUID', () => {
    expect(RandomUuidStub()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
  });

  it('VALID: {two calls} => each call mints a distinct id', () => {
    const ids = new Set([RandomUuidStub(), RandomUuidStub()]);

    expect(ids.size).toBe(2);
  });
});
