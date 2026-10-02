import { ExportSymbolStub } from './export-symbol.stub';

describe('ExportSymbolStub', () => {
  it('VALID: {} => the real symbol of the default sample export', () => {
    const { symbol } = ExportSymbolStub();

    expect(symbol.getName()).toBe('sample');
  });

  it('VALID: {code, name} => the real symbol of the named export, with its JSDoc tags readable', () => {
    const { symbol, checker } = ExportSymbolStub({
      code: '/** @deprecated use fresh */\nexport const old = 1;\nexport const fresh = 2;\n',
      name: 'old',
    });

    expect({
      name: symbol.getName(),
      tags: symbol.getJsDocTags(checker).map((tag) => tag.name),
    }).toStrictEqual({ name: 'old', tags: ['deprecated'] });
  });

  it("ERROR: {name: 'missing'} => throws, naming the export it could not find", () => {
    expect(() => ExportSymbolStub({ name: 'missing' })).toThrow(
      /^ExportSymbolStub: no export named missing in "export const sample = 1;"$/u,
    );
  });
});
