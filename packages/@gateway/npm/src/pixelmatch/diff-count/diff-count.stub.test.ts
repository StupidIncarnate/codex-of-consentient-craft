import { DiffCountStub } from './diff-count.stub';

describe('DiffCountStub', () => {
  it('VALID: {} => the real diff count for two fully different 2x2 images', () => {
    expect(DiffCountStub()).toBe(4);
  });

  it('VALID: {differs: false} => zero real diffs for two identical images', () => {
    expect(DiffCountStub({ differs: false })).toBe(0);
  });
});
