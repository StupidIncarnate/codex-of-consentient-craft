import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
} from 'node:fs';
import { resolve, join, relative } from 'node:path';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const pass = (msg: string) => console.log(`  ${GREEN}PASS${RESET} ${msg}`);
const fail = (msg: string) => console.log(`  ${RED}FAIL${RESET} ${msg}`);
const info = (msg: string) => console.log(`  ${DIM}${msg}${RESET}`);
const section = (title: string) =>
  console.log(`\n${BOLD}${CYAN}=== ${title} ===${RESET}`);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PackageInfo {
  name: string;
  dir: string;
  workspaceName: string;
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  hasPlaywrightConfig: boolean;
  hasJestConfig: boolean;
  hasSourceFiles: boolean;
  hasTestFiles: boolean;
  scripts: Record<string, string>;
}

interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface SectionResult {
  section: string;
  checks: { label: string; passed: boolean }[];
}

// ---------------------------------------------------------------------------
// Root path
// ---------------------------------------------------------------------------
const ROOT = resolve(
  import.meta.dirname
    ? join(import.meta.dirname, '..')
    : process.cwd(),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function exec({
  cmd,
  args,
  cwd,
}: {
  cmd: string;
  args: string[];
  cwd?: string;
}): ExecResult {
  const result: SpawnSyncReturns<Buffer> = spawnSync(cmd, args, {
    cwd: cwd ?? ROOT,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 5 * 60 * 1000,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout?.toString() ?? '',
    stderr: result.stderr?.toString() ?? '',
  };
}

function readFile(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

function writeFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf-8');
}

function hasFilesMatching(dir: string, pattern: RegExp, exclude?: RegExp): boolean {
  if (!existsSync(dir)) return false;
  try {
    const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
    return entries.some(
      (e) =>
        e.isFile() &&
        pattern.test(e.name) &&
        (!exclude || !exclude.test(e.name)),
    );
  } catch {
    return false;
  }
}

function findFile({
  dir,
  match,
  exclude,
}: {
  dir: string;
  match: RegExp;
  exclude?: RegExp;
}): string | undefined {
  if (!existsSync(dir)) return undefined;
  try {
    const entries = readdirSync(dir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const parentDir = (entry as unknown as Record<string, string>).parentPath
        ?? (entry as unknown as Record<string, string>).path
        ?? dir;
      const full = join(parentDir, entry.name);
      if (match.test(entry.name) && (!exclude || !exclude.test(entry.name))) {
        return full;
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

function injectAtTop({
  filePath,
  line,
}: {
  filePath: string;
  line: string;
}): string {
  const original = readFile(filePath);
  writeFile(filePath, line + '\n' + original);
  return original;
}

function injectInDescribe({
  filePath,
  code,
}: {
  filePath: string;
  code: string;
}): string {
  const original = readFile(filePath);
  // Find first describe( ... { and inject after the opening brace
  const describePattern = /describe\s*\([^)]*(?:\([^)]*\)[^)]*)*,\s*\(\)\s*=>\s*\{/;
  const match = describePattern.exec(original);
  if (!match) {
    // Fallback: find first describe( and opening brace
    const simplePattern = /describe\s*\([^{]*\{/;
    const simpleMatch = simplePattern.exec(original);
    if (!simpleMatch) {
      throw new Error(`No describe block found in ${filePath}`);
    }
    const insertPos = simpleMatch.index + simpleMatch[0].length;
    const modified =
      original.slice(0, insertPos) +
      '\n' +
      code +
      '\n' +
      original.slice(insertPos);
    writeFile(filePath, modified);
    return original;
  }
  const insertPos = match.index + match[0].length;
  const modified =
    original.slice(0, insertPos) +
    '\n' +
    code +
    '\n' +
    original.slice(insertPos);
  writeFile(filePath, modified);
  return original;
}

function revert({
  filePath,
  original,
}: {
  filePath: string;
  original: string;
}): void {
  writeFile(filePath, original);
}

// ---------------------------------------------------------------------------
// Package discovery
// ---------------------------------------------------------------------------
function discoverPackages(packagesDir: string): PackageInfo[] {
  const dirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const packages: PackageInfo[] = [];

  for (const name of dirs) {
    const dir = join(packagesDir, name);
    const pkgJsonPath = join(dir, 'package.json');
    const hasPackageJson = existsSync(pkgJsonPath);

    let workspaceName = `@dungeonmaster/${name}`;
    let scripts: Record<string, string> = {};

    if (hasPackageJson) {
      try {
        const pkgJson = JSON.parse(readFile(pkgJsonPath));
        workspaceName = pkgJson.name ?? workspaceName;
        scripts = pkgJson.scripts ?? {};
      } catch {
        // ignore parse errors
      }
    }

    const hasTsConfig = existsSync(join(dir, 'tsconfig.json'));
    const hasPlaywrightConfig =
      existsSync(join(dir, 'playwright.config.ts')) ||
      existsSync(join(dir, 'playwright.config.js'));
    const hasJestConfig =
      existsSync(join(dir, 'jest.config.ts')) ||
      existsSync(join(dir, 'jest.config.js')) ||
      existsSync(join(dir, 'jest.config.json'));
    const srcDir = join(dir, 'src');
    const hasSourceFiles = hasFilesMatching(srcDir, /\.tsx?$/, /\.test\.tsx?$/);
    const hasTestFiles = hasFilesMatching(srcDir, /\.test\.tsx?$/);

    packages.push({
      name,
      dir,
      workspaceName,
      hasPackageJson,
      hasTsConfig,
      hasPlaywrightConfig,
      hasJestConfig,
      hasSourceFiles,
      hasTestFiles,
      scripts,
    });
  }

  return packages;
}

// ---------------------------------------------------------------------------
// Capability checks
// ---------------------------------------------------------------------------
function canLint(pkg: PackageInfo): boolean {
  return pkg.hasPackageJson && !!pkg.scripts.lint && pkg.hasSourceFiles;
}
function canTypecheck(pkg: PackageInfo): boolean {
  return pkg.hasTsConfig && !!pkg.scripts.typecheck;
}
function canUnitTest(pkg: PackageInfo): boolean {
  return pkg.hasJestConfig && !!pkg.scripts.test && pkg.hasTestFiles;
}
function canE2eTest(pkg: PackageInfo): boolean {
  return pkg.hasPlaywrightConfig && !!pkg.scripts.test;
}
function canWard(pkg: PackageInfo): boolean {
  return !!pkg.scripts.ward;
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------
function assertExit(
  result: ExecResult,
  expected: 'zero' | 'nonzero',
  label: string,
): boolean {
  const ok =
    expected === 'zero' ? result.exitCode === 0 : result.exitCode !== 0;
  if (ok) {
    pass(label);
  } else {
    fail(
      `${label} (expected ${expected === 'zero' ? '0' : 'non-0'}, got ${result.exitCode})`,
    );
    if (result.stderr) {
      const lines = result.stderr.split('\n').slice(0, 5);
      for (const line of lines) info(`  stderr: ${line}`);
    }
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Results tracker
// ---------------------------------------------------------------------------
const allResults: SectionResult[] = [];

function track(sectionName: string): {
  record: (label: string, passed: boolean) => void;
  result: SectionResult;
} {
  const result: SectionResult = { section: sectionName, checks: [] };
  allResults.push(result);
  return {
    record(label: string, passed: boolean) {
      result.checks.push({ label, passed });
    },
    result,
  };
}

// ---------------------------------------------------------------------------
// Section 1: Per-Package Green Baseline
// ---------------------------------------------------------------------------
function runSection1(packages: PackageInfo[]): void {
  section('Section 1: Per-Package Green Baseline');
  const t = track('Per-Package Green Baseline');

  for (const pkg of packages) {
    if (canLint(pkg)) {
      const label = `${pkg.name} lint baseline`;
      const r = exec({ cmd: 'npm', args: ['run', 'lint', `--workspace=${pkg.workspaceName}`] });
      t.record(label, assertExit(r, 'zero', label));
    }
    if (canTypecheck(pkg)) {
      const label = `${pkg.name} typecheck baseline`;
      const r = exec({ cmd: 'npm', args: ['run', 'typecheck', `--workspace=${pkg.workspaceName}`] });
      t.record(label, assertExit(r, 'zero', label));
    }
    if (canUnitTest(pkg)) {
      const label = `${pkg.name} unit test baseline`;
      const r = exec({ cmd: 'npm', args: ['run', 'test', `--workspace=${pkg.workspaceName}`] });
      t.record(label, assertExit(r, 'zero', label));
    }
    if (canWard(pkg)) {
      const label = `${pkg.name} ward baseline`;
      const r = exec({ cmd: 'npm', args: ['run', 'ward', `--workspace=${pkg.workspaceName}`] });
      t.record(label, assertExit(r, 'zero', label));
    }
  }
}

// ---------------------------------------------------------------------------
// Section 2: Per-Package Lint Red/Green
// ---------------------------------------------------------------------------
function runSection2(packages: PackageInfo[]): void {
  section('Section 2: Per-Package Lint Red/Green');
  const t = track('Per-Package Lint Red/Green');

  for (const pkg of packages) {
    if (!canLint(pkg)) continue;

    const srcDir = join(pkg.dir, 'src');
    const file = findFile({ dir: srcDir, match: /\.ts$/, exclude: /\.test\.ts$/ });
    if (!file) {
      info(`${pkg.name}: no source file found, skipping lint mutation`);
      continue;
    }

    let original: string | undefined;
    try {
      original = injectAtTop({ filePath: file, line: "console.log('WARD_SMOKE_LINT');" });
      info(`${pkg.name}: injected lint failure into ${relative(ROOT, file)}`);

      const redLabel = `${pkg.name} lint red`;
      const red = exec({ cmd: 'npm', args: ['run', 'lint', `--workspace=${pkg.workspaceName}`] });
      t.record(redLabel, assertExit(red, 'nonzero', redLabel));
    } finally {
      if (original !== undefined) {
        revert({ filePath: file, original });
      }
    }

    const greenLabel = `${pkg.name} lint green after revert`;
    const green = exec({ cmd: 'npm', args: ['run', 'lint', `--workspace=${pkg.workspaceName}`] });
    t.record(greenLabel, assertExit(green, 'zero', greenLabel));
  }
}

// ---------------------------------------------------------------------------
// Section 3: Per-Package Typecheck Red/Green
// ---------------------------------------------------------------------------
function runSection3(packages: PackageInfo[]): void {
  section('Section 3: Per-Package Typecheck Red/Green');
  const t = track('Per-Package Typecheck Red/Green');

  for (const pkg of packages) {
    if (!canTypecheck(pkg) || !pkg.hasSourceFiles) continue;

    const srcDir = join(pkg.dir, 'src');
    const file = findFile({ dir: srcDir, match: /\.ts$/, exclude: /\.test\.ts$/ });
    if (!file) {
      info(`${pkg.name}: no source file found, skipping typecheck mutation`);
      continue;
    }

    let original: string | undefined;
    try {
      original = injectAtTop({
        filePath: file,
        line: 'const _wardSmokeTypecheck = (x) => x;',
      });
      info(`${pkg.name}: injected typecheck failure into ${relative(ROOT, file)}`);

      const redLabel = `${pkg.name} typecheck red`;
      const red = exec({ cmd: 'npm', args: ['run', 'typecheck', `--workspace=${pkg.workspaceName}`] });
      t.record(redLabel, assertExit(red, 'nonzero', redLabel));
    } finally {
      if (original !== undefined) {
        revert({ filePath: file, original });
      }
    }

    const greenLabel = `${pkg.name} typecheck green after revert`;
    const green = exec({ cmd: 'npm', args: ['run', 'typecheck', `--workspace=${pkg.workspaceName}`] });
    t.record(greenLabel, assertExit(green, 'zero', greenLabel));
  }
}

// ---------------------------------------------------------------------------
// Section 4: Per-Package Unit Test Red/Green
// ---------------------------------------------------------------------------
function runSection4(packages: PackageInfo[]): void {
  section('Section 4: Per-Package Unit Test Red/Green');
  const t = track('Per-Package Unit Test Red/Green');

  for (const pkg of packages) {
    if (!canUnitTest(pkg)) continue;

    const srcDir = join(pkg.dir, 'src');
    const file = findFile({ dir: srcDir, match: /\.test\.ts$/ });
    if (!file) {
      info(`${pkg.name}: no test file found, skipping unit test mutation`);
      continue;
    }

    const failingTest = `it('WARD_SMOKE_FAIL', () => { expect(true).toBe(false); });`;
    let original: string | undefined;
    try {
      original = injectInDescribe({ filePath: file, code: failingTest });
      info(`${pkg.name}: injected failing test into ${relative(ROOT, file)}`);

      const redLabel = `${pkg.name} unit test red`;
      const red = exec({ cmd: 'npm', args: ['run', 'test', `--workspace=${pkg.workspaceName}`] });
      t.record(redLabel, assertExit(red, 'nonzero', redLabel));
    } finally {
      if (original !== undefined) {
        revert({ filePath: file, original });
      }
    }

    const greenLabel = `${pkg.name} unit test green after revert`;
    const green = exec({ cmd: 'npm', args: ['run', 'test', `--workspace=${pkg.workspaceName}`] });
    t.record(greenLabel, assertExit(green, 'zero', greenLabel));
  }
}

// ---------------------------------------------------------------------------
// Section 5: E2E Red/Green
// ---------------------------------------------------------------------------
function runSection5(packages: PackageInfo[]): void {
  section('Section 5: E2E Red/Green');
  const t = track('E2E Red/Green');

  for (const pkg of packages) {
    if (!canE2eTest(pkg)) continue;

    // Look for playwright test files (commonly in tests/ or e2e/ or src/)
    const testDirs = ['tests', 'e2e', 'src', '.'].map((d) => join(pkg.dir, d));
    let file: string | undefined;
    for (const d of testDirs) {
      file = findFile({ dir: d, match: /\.spec\.ts$|\.e2e\.ts$|\.test\.ts$/ });
      if (file) break;
    }

    if (!file) {
      info(`${pkg.name}: no e2e test file found, skipping`);
      continue;
    }

    const failingTest = `it('WARD_SMOKE_E2E_FAIL', () => { expect(true).toBe(false); });`;
    let original: string | undefined;
    try {
      original = injectInDescribe({ filePath: file, code: failingTest });
      info(`${pkg.name}: injected failing e2e test into ${relative(ROOT, file)}`);

      const redLabel = `${pkg.name} e2e red`;
      const red = exec({ cmd: 'npm', args: ['run', 'test', `--workspace=${pkg.workspaceName}`] });
      t.record(redLabel, assertExit(red, 'nonzero', redLabel));
    } catch (err) {
      info(`${pkg.name}: could not inject into e2e file (no describe block?), skipping`);
    } finally {
      if (original !== undefined) {
        revert({ filePath: file, original });
      }
    }

    if (file) {
      const greenLabel = `${pkg.name} e2e green after revert`;
      const green = exec({ cmd: 'npm', args: ['run', 'test', `--workspace=${pkg.workspaceName}`] });
      t.record(greenLabel, assertExit(green, 'zero', greenLabel));
    }
  }
}

// ---------------------------------------------------------------------------
// Section 6: Root-Level Green Baseline
// ---------------------------------------------------------------------------
function runSection6(): void {
  section('Section 6: Root-Level Green Baseline');
  const t = track('Root-Level Green Baseline');

  const lintLabel = 'root lint baseline';
  const lintR = exec({ cmd: 'npm', args: ['run', 'lint'] });
  t.record(lintLabel, assertExit(lintR, 'zero', lintLabel));

  const tcLabel = 'root typecheck baseline';
  const tcR = exec({ cmd: 'npm', args: ['run', 'typecheck'] });
  t.record(tcLabel, assertExit(tcR, 'zero', tcLabel));

  const testLabel = 'root test baseline';
  const testR = exec({ cmd: 'npm', args: ['run', 'test'] });
  t.record(testLabel, assertExit(testR, 'zero', testLabel));

  const wardLabel = 'root ward baseline';
  const wardR = exec({ cmd: 'npm', args: ['run', 'ward'] });
  t.record(wardLabel, assertExit(wardR, 'zero', wardLabel));
}

// ---------------------------------------------------------------------------
// Section 7: Root-Level Lint Red/Green
// ---------------------------------------------------------------------------
function runSection7(packages: PackageInfo[]): void {
  section('Section 7: Root-Level Lint Red/Green');
  const t = track('Root-Level Lint Red/Green');

  const pkg = packages.find((p) => canLint(p));
  if (!pkg) {
    info('No package with lint capability found, skipping');
    return;
  }

  const srcDir = join(pkg.dir, 'src');
  const file = findFile({ dir: srcDir, match: /\.ts$/, exclude: /\.test\.ts$/ });
  if (!file) {
    info('No source file found, skipping');
    return;
  }

  let original: string | undefined;
  try {
    original = injectAtTop({ filePath: file, line: "console.log('WARD_SMOKE_LINT');" });
    info(`Injected lint failure into ${relative(ROOT, file)}`);

    const redLabel = 'root lint red';
    const red = exec({ cmd: 'npm', args: ['run', 'lint'] });
    t.record(redLabel, assertExit(red, 'nonzero', redLabel));
  } finally {
    if (original !== undefined) {
      revert({ filePath: file, original });
    }
  }

  const greenLabel = 'root lint green after revert';
  const green = exec({ cmd: 'npm', args: ['run', 'lint'] });
  t.record(greenLabel, assertExit(green, 'zero', greenLabel));
}

// ---------------------------------------------------------------------------
// Section 8: ward list Subcommand
// ---------------------------------------------------------------------------
function runSection8(packages: PackageInfo[]): void {
  section('Section 8: ward list Subcommand');
  const t = track('ward list Subcommand');

  const pkg = packages.find((p) => canLint(p));
  if (!pkg) {
    info('No package with lint capability found, skipping');
    return;
  }

  const srcDir = join(pkg.dir, 'src');
  const file = findFile({ dir: srcDir, match: /\.ts$/, exclude: /\.test\.ts$/ });
  if (!file) {
    info('No source file found, skipping');
    return;
  }

  let original: string | undefined;
  try {
    original = injectAtTop({ filePath: file, line: "console.log('WARD_SMOKE_LINT');" });
    info(`Injected lint failure into ${relative(ROOT, file)}`);

    // Run ward to get a failing run-id
    const wardResult = exec({ cmd: 'npx', args: ['dungeonmaster-ward', 'run'] });
    const combined = wardResult.stdout + wardResult.stderr;

    // Extract run-id from output (look for pattern like 'ward-list with runId "<id>"')
    const runIdMatch = /ward-list with runId "(\S+)"/.exec(combined);

    if (runIdMatch) {
      const runId = runIdMatch[1];
      info(`Captured run-id: ${runId}`);

      const listLabel = `ward list ${runId}`;
      const listResult = exec({ cmd: 'npx', args: ['dungeonmaster-ward', 'list', runId] });
      const listPassed =
        listResult.exitCode === 0 && listResult.stdout.trim().length > 0;
      if (listPassed) {
        pass(listLabel);
      } else {
        fail(listLabel);
      }
      t.record(listLabel, listPassed);
    } else {
      info('Could not extract run-id from ward output, skipping list <id> check');
    }

    // ward list (no args) should also work
    const listAllLabel = 'ward list (no args)';
    const listAllResult = exec({ cmd: 'npx', args: ['dungeonmaster-ward', 'list'] });
    t.record(listAllLabel, assertExit(listAllResult, 'zero', listAllLabel));
  } finally {
    if (original !== undefined) {
      revert({ filePath: file, original });
    }
  }
}

// ---------------------------------------------------------------------------
// Section 9: Summary
// ---------------------------------------------------------------------------
function printSummary(): boolean {
  section('Section 9: Summary');

  let totalPass = 0;
  let totalFail = 0;

  console.log('');
  console.log(
    `  ${BOLD}${'Section'.padEnd(35)}${'Pass'.padStart(6)}${'Fail'.padStart(6)}${RESET}`,
  );
  console.log(`  ${''.padEnd(47, '-')}`);

  for (const sr of allResults) {
    const passed = sr.checks.filter((c) => c.passed).length;
    const failed = sr.checks.filter((c) => !c.passed).length;
    totalPass += passed;
    totalFail += failed;

    const color = failed > 0 ? RED : GREEN;
    console.log(
      `  ${color}${sr.section.padEnd(35)}${String(passed).padStart(6)}${String(failed).padStart(6)}${RESET}`,
    );
  }

  console.log(`  ${''.padEnd(47, '-')}`);
  const totalColor = totalFail > 0 ? RED : GREEN;
  console.log(
    `  ${BOLD}${totalColor}${'TOTAL'.padEnd(35)}${String(totalPass).padStart(6)}${String(totalFail).padStart(6)}${RESET}`,
  );
  console.log('');

  if (totalFail > 0) {
    console.log(`${RED}${BOLD}SMOKE TEST FAILED${RESET} (${totalFail} failure(s))`);
    return false;
  } else {
    console.log(`${GREEN}${BOLD}SMOKE TEST PASSED${RESET} (${totalPass} check(s))`);
    return true;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main(): void {
  console.log(`${BOLD}Ward Smoke Test${RESET}`);
  console.log(`Root: ${ROOT}`);
  console.log('');

  const packagesDir = join(ROOT, 'packages');
  if (!existsSync(packagesDir)) {
    console.error(`${RED}packages/ directory not found at ${packagesDir}${RESET}`);
    process.exit(1);
  }

  const packages = discoverPackages(packagesDir);
  console.log(`Discovered ${packages.length} packages:`);
  for (const pkg of packages) {
    const caps: string[] = [];
    if (canLint(pkg)) caps.push('lint');
    if (canTypecheck(pkg)) caps.push('typecheck');
    if (canUnitTest(pkg)) caps.push('unit');
    if (canE2eTest(pkg)) caps.push('e2e');
    if (canWard(pkg)) caps.push('ward');
    console.log(
      `  ${YELLOW}${pkg.name}${RESET} (${pkg.workspaceName}) [${caps.join(', ') || 'none'}]`,
    );
  }

  runSection1(packages);
  runSection2(packages);
  runSection3(packages);
  runSection4(packages);
  runSection5(packages);
  runSection6();
  runSection7(packages);
  runSection8(packages);

  const ok = printSummary();
  process.exit(ok ? 0 : 1);
}

main();
