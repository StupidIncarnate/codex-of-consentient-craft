import * as ts from 'typescript';
import { ImportClauseStub } from './import-clause.stub';

describe('ImportClauseStub', () => {
  it('VALID: {} => the real clause of a type-only named import', () => {
    const clause = ImportClauseStub();

    expect({
      kind: clause.kind,
      phaseModifier: clause.phaseModifier,
      text: clause.getText(),
    }).toStrictEqual({
      kind: ts.SyntaxKind.ImportClause,
      phaseModifier: ts.SyntaxKind.TypeKeyword,
      text: 'type { Sample }',
    });
  });

  it("VALID: {code: import { X } from 'x'} => the real clause of that value import", () => {
    const clause = ImportClauseStub({ code: "import { X } from 'x';" });

    expect({ phaseModifier: clause.phaseModifier, text: clause.getText() }).toStrictEqual({
      phaseModifier: undefined,
      text: '{ X }',
    });
  });

  it('VALID: {parsedByTypescript5: true} => the same clause with no phaseModifier', () => {
    const clause = ImportClauseStub({ parsedByTypescript5: true });

    expect({ kind: clause.kind, phaseModifier: clause.phaseModifier }).toStrictEqual({
      kind: ts.SyntaxKind.ImportClause,
      phaseModifier: undefined,
    });
  });

  it("ERROR: {code: import 'x'} => throws, since a side-effect import has no clause", () => {
    expect(() => ImportClauseStub({ code: "import 'x';" })).toThrow(
      /^ImportClauseStub: no import clause in "import 'x';"$/u,
    );
  });
});
