import { typescriptProgramDiagnosticsAdapter } from '../../packages/hydration/src/adapters/typescript/program-diagnostics/typescript-program-diagnostics-adapter';
import { repoRelativePathContract } from '@dungeonmaster/shared/contracts';

const result = typescriptProgramDiagnosticsAdapter({
  files: [repoRelativePathContract.parse('tmp/round-b/b5-probe.ts')],
});
console.log(JSON.stringify(result));
