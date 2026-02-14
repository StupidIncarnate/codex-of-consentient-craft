import { rmSync } from 'fs';
import * as os from 'os';
import * as path from 'path';

const TEST_HOME = process.env.DUNGEONMASTER_HOME ?? path.join(os.tmpdir(), `dm-e2e-${process.pid}`);

export default function globalTeardown(): void {
  rmSync(TEST_HOME, { recursive: true, force: true });
}
