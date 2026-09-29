import { ProgramStub } from './program.stub';

describe('ProgramStub', () => {
  it('VALID: {} => a real program whose source file holds the default code', () => {
    const program = ProgramStub();

    expect({
      roots: program.getRootFileNames(),
      text: program.getSourceFile('gateway-stub-sample.ts')?.text,
    }).toStrictEqual({ roots: ['gateway-stub-sample.ts'], text: 'const a = 1;' });
  });

  it('VALID: {code, fileName} => the source file has the given name and text', () => {
    const program = ProgramStub({ code: 'function foo() {}', fileName: 'other.ts' });

    expect({
      text: program.getSourceFile('other.ts')?.text,
      statementCount: program.getSourceFile('other.ts')?.statements.length,
    }).toStrictEqual({ text: 'function foo() {}', statementCount: 1 });
  });
});
