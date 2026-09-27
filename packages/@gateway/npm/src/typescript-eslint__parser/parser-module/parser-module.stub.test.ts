import { ParserModuleStub } from './parser-module.stub';

describe('ParserModuleStub', () => {
  it('VALID: {} => the real parser module, with a real parseForESLint function', () => {
    const parser = ParserModuleStub();

    expect(parser.parseForESLint.name).toBe('parseForESLint');
  });
});
