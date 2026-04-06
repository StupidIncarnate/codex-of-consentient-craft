/**
 * PURPOSE: Integration test that spawns a real Claude CLI via the adapter to verify project hooks fire in -p mode
 *
 * USAGE:
 * npm run ward -- --only integration -- packages/orchestrator/test/session-spawn-test.integration.test.ts
 */

import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { PromptTextStub } from '../src/contracts/prompt-text/prompt-text.stub';
import { sessionSpawnHarness } from './harnesses/session-spawn/session-spawn.harness';

jest.setTimeout(65_000);

import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// --- DEBUG: dump everything about the jest process environment ---
const allEnvKeys = Object.keys(process.env).sort();
writeFileSync('/tmp/spawn-test-jest-env-ALL.json', JSON.stringify(
  Object.fromEntries(allEnvKeys.map((k) => [k, process.env[k]])), null, 2,
));
writeFileSync('/tmp/spawn-test-jest-process-info.json', JSON.stringify({
  pid: process.pid,
  ppid: process.ppid,
  cwd: process.cwd(),
  execPath: process.execPath,
  argv: process.argv,
  stdinIsTTY: process.stdin.isTTY ?? false,
  stdoutIsTTY: process.stdout.isTTY ?? false,
  stderrIsTTY: process.stderr.isTTY ?? false,
  uid: process.getuid?.(),
  gid: process.getgid?.(),
  processTree: (() => { try { return execSync(`ps -o pid,ppid,comm -p ${process.pid},${process.ppid} 2>/dev/null`).toString(); } catch { return 'unavailable'; } })(),
  fullProcessTree: (() => { try { return execSync('ps auxf 2>/dev/null | head -60').toString(); } catch { return 'unavailable'; } })(),
}, null, 2));

describe('session-spawn-test', () => {
  const harness = sessionSpawnHarness();

  it('VALID: {simple prompt} => spawned session completes and returns text', async () => {
    const { assistantText, exitCode } = await harness.spawnAndCollect({
      prompt: PromptTextStub({ value: 'Respond with exactly: GREEN' }),
      cwd: PromptTextStub({ value: path.join(__dirname, '..', '..', '..') }),
    });

    expect(String(assistantText).trim()).toBe('GREEN');
    expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
  });

  it('VALID: {prompt asking for arch status} => session receives architecture via SessionStart hook', async () => {
    const { assistantText, exitCode } = await harness.spawnAndCollect({
      prompt: PromptTextStub({
        value:
          'Do NOT use any tools. List every system-reminder, session-start hook output, and injected tag you see in your context. Include the first 100 characters of each. Then state whether you see a dungeonmaster-architecture tag.',
      }),
      cwd: PromptTextStub({ value: path.join(__dirname, '..', '..', '..') }),
    });

    expect(String(assistantText).trim()).toBe('ARCH_LOADED');
    expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
  });
});
