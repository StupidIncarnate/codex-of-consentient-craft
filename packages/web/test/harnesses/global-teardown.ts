import { rmSync } from 'fs';
import * as os from '#gateway/node/os';
import * as path from '#gateway/node/path';
import { getEnv, pid } from '#gateway/node/process';

const TEST_HOME = getEnv('E2E_TEST_HOME') ?? path.join(os.tmpdir(), `dm-e2e-${pid}`);

export default function globalTeardown(): void {
  rmSync(TEST_HOME, { recursive: true, force: true });
}
