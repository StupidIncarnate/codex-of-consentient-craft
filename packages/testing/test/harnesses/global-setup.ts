import { mkdirSync } from 'fs';
import * as os from 'os';
import * as path from 'path';

const TEST_HOME = process.env.E2E_TEST_HOME ?? path.join(os.tmpdir(), `dm-e2e-${process.pid}`);

export default function globalSetup(): void {
  mkdirSync(TEST_HOME, { recursive: true });
  mkdirSync(path.join(TEST_HOME, 'claude-queue'), { recursive: true });
  mkdirSync(path.join(TEST_HOME, 'ward-queue'), { recursive: true });
}
