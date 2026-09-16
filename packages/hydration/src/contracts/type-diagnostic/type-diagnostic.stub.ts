import type { StubArgument } from '@dungeonmaster/shared/@types';
import { repoRelativePathContract, lineCountContract } from '@dungeonmaster/shared/contracts';
import { typeDiagnosticContract } from './type-diagnostic-contract';
import type { TypeDiagnostic } from './type-diagnostic-contract';

export const TypeDiagnosticStub = ({
  ...props
}: StubArgument<TypeDiagnostic> = {}): TypeDiagnostic =>
  typeDiagnosticContract.parse({
    file: repoRelativePathContract.parse(
      'packages/hydration/test/type-fixtures/call-site/out-of-bounds.ts',
    ),
    line: lineCountContract.parse(12),
    code: 2345,
    message: "Argument of type '3' is not assignable to parameter of type '0 | 1 | 2'.",
    ...props,
  });
