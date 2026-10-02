import type * as ts from 'typescript';
import { ProgramStub } from '../program/program.stub';

export const ExportSymbolStub = ({
  code = 'export const sample = 1;',
  name = 'sample',
}: {
  code?: string;
  name?: string;
} = {}): { symbol: ts.Symbol; checker: ts.TypeChecker } => {
  const fileName = 'gateway-stub-sample.ts';
  const program = ProgramStub({ code, fileName });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(fileName);
  const moduleSymbol =
    sourceFile === undefined ? undefined : checker.getSymbolAtLocation(sourceFile);
  const symbol =
    moduleSymbol === undefined
      ? undefined
      : checker.getExportsOfModule(moduleSymbol).find((candidate) => candidate.getName() === name);

  if (symbol === undefined) {
    throw new Error(`ExportSymbolStub: no export named ${name} in ${JSON.stringify(code)}`);
  }

  return { symbol, checker };
};
