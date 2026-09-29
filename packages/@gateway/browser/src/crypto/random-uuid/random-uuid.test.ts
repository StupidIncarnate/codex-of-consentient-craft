import { crypto } from '../crypto';
import { randomUuid } from './random-uuid';
import { randomUuidProxy } from './random-uuid.proxy';

describe('randomUuid', () => {
  it('VALID: {nothing staged} => mints a real v4 UUID', () => {
    randomUuidProxy();

    expect(randomUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
  });

  it('VALID: {returns staged} => every mint returns the staged id', () => {
    const proxy = randomUuidProxy();
    proxy.returns({ uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    expect([randomUuid(), randomUuid()]).toStrictEqual([
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ]);
  });

  it('VALID: {two returnsOnce then returns} => one-shots answer in order, then the sticky id', () => {
    const proxy = randomUuidProxy();
    proxy.returns({ uuid: '00000000-0000-4000-8000-000000000009' });
    proxy.returnsOnce({ uuid: '00000000-0000-4000-8000-000000000001' });
    proxy.returnsOnce({ uuid: '00000000-0000-4000-8000-000000000002' });

    expect([randomUuid(), randomUuid(), randomUuid()]).toStrictEqual([
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000009',
    ]);
  });

  it('VALID: {caller mints through the barrel crypto object} => the same staging answers it', () => {
    const proxy = randomUuidProxy();
    proxy.returnsOnce({ uuid: '11111111-1111-4111-8111-111111111111' });

    expect(crypto.randomUUID()).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('VALID: {three mints} => getCalls records one empty argument tuple per mint', () => {
    const proxy = randomUuidProxy();
    proxy.returns({ uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

    randomUuid();
    randomUuid();
    randomUuid();

    expect(proxy.getCalls()).toStrictEqual([[], [], []]);
  });
});
