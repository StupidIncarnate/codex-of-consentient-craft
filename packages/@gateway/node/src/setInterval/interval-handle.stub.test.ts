import { IntervalHandleStub } from './interval-handle.stub';

describe('IntervalHandleStub', () => {
  it('VALID: {} => a real, cleared timer handle whose hasRef is true', () => {
    const handle = IntervalHandleStub();

    expect(handle.hasRef()).toBe(true);
  });

  it('VALID: {} => carries every method a real Node timer handle exposes', () => {
    const handle = IntervalHandleStub();

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
