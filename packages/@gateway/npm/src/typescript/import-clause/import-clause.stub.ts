import * as ts from 'typescript';

export const ImportClauseStub = ({
  code = "import type { Sample } from 'gateway-stub-sample';",
  parsedByTypescript5 = false,
}: {
  code?: string;
  // TypeScript 5 has no `phaseModifier`; a clause it parsed carries `isTypeOnly` alone.
  parsedByTypescript5?: boolean;
} = {}): ts.ImportClause => {
  const sourceFile = ts.createSourceFile(
    'gateway-stub-sample.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
  );
  const clause = sourceFile.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => statement.importClause)
    .find((candidate) => candidate !== undefined);

  if (clause === undefined) {
    throw new Error(`ImportClauseStub: no import clause in ${JSON.stringify(code)}`);
  }

  return parsedByTypescript5 ? { ...clause, phaseModifier: undefined } : clause;
};
