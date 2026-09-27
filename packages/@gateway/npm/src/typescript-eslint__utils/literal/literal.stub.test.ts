import { LiteralStub } from './literal.stub';

describe('LiteralStub', () => {
  it('VALID: {} => a real numeric Literal, 1', () => {
    const node = LiteralStub();

    expect({ value: node.value, raw: node.raw }).toStrictEqual({ value: 1, raw: '1' });
  });

  it('VALID: {code: a string literal} => real value reflects the given code', () => {
    const node = LiteralStub({ code: "const a = 'x';" });

    expect(node.value).toBe('x');
  });
});
