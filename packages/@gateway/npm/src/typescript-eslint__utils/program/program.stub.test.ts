import { ProgramStub } from './program.stub';

describe('ProgramStub', () => {
  it('VALID: {} => a real Program with one statement and no parent', () => {
    const node = ProgramStub();

    expect({ bodyLength: node.body.length, parent: node.parent }).toStrictEqual({
      bodyLength: 1,
      parent: undefined,
    });
  });

  it('VALID: {code: two statements} => real body reflects the given code', () => {
    const node = ProgramStub({ code: 'const a = 1; const b = 2;' });

    expect({ bodyLength: node.body.length }).toStrictEqual({ bodyLength: 2 });
  });
});
