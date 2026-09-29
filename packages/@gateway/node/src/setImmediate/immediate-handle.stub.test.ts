import { ImmediateHandleStub } from './immediate-handle.stub';

describe('ImmediateHandleStub', () => {
  it('VALID: {} => a real, cleared handle whose hasRef is false', () => {
    const handle = ImmediateHandleStub();

    expect(handle.hasRef()).toBe(false);
  });

  it('VALID: {} => carries every method a real Node immediate handle exposes', () => {
    const handle = ImmediateHandleStub();

    expect({
      ref: handle.ref.bind(handle),
      unref: handle.unref.bind(handle),
      hasRef: handle.hasRef.bind(handle),
    }).toStrictEqual({
      ref: expect.any(Function),
      unref: expect.any(Function),
      hasRef: expect.any(Function),
    });
  });
});
