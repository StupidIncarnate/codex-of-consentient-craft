import { typescriptProgramDiagnosticsAdapter } from '../../packages/hydration/src/adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter';
import { repoRelativePathContract } from '@dungeonmaster/shared/contracts';

const result = typescriptProgramDiagnosticsAdapter({
  files: [repoRelativePathContract.parse('tmp/round-a/a3-fixture.ts')],
});

console.log(JSON.stringify(result));
