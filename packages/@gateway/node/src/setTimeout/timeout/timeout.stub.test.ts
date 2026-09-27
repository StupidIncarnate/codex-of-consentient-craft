import { TimeoutStub } from './timeout.stub';

describe('TimeoutStub', () => {
  it('VALID: {} => a real, cleared timer handle whose hasRef is true', () => {
    const handle = TimeoutStub();

    expect(handle.hasRef()).toBe(true);
  });

  it('VALID: {unref: true} => a real, cleared timer handle whose hasRef is false', () => {
    const handle = TimeoutStub({ unref: true });

    expect(handle.hasRef()).toBe(false);
  });

  it('VALID: {} => carries every method a real Node timer handle exposes', () => {
    const handle = TimeoutStub();

    expect({
      ref: handle.ref.bind(handle),
      unref: handle.unref.bind(handle),
      hasRef: handle.hasRef.bind(handle),
      refresh: handle.refresh.bind(handle),
    }).toStrictEqual({
      ref: expect.any(Function),
      unref: expect.any(Function),
      hasRef: expect.any(Function),
      refresh: expect.any(Function),
    });
  });
});
