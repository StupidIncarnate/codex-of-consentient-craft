# Task 14: Voidpoker Integration

## Objective
Integrate Voidpoker for automatic project discovery, ensuring ward commands and CLAUDE.md files are set up properly.

## Dependencies
- Task 03: Config Management (for discovery tracking)
- Task 07: Agent Spawning (for Voidpoker execution)

## Implementation

### 1. Discovery Manager

**File: src/cli/discovery/discovery-manager.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawnAndWait } from '../agent-spawner';
import { findPackageJsons, detectProjectSettings, updateConfig } from '../config-manager';
import { createDiscoveryFilename, DIRECTORIES } from '../directory-manager';
import chalk from 'chalk';

export interface ProjectDiscoveryResult {
  complete: boolean;
  packages: PackageInfo[];
  errors: string[];
  recommendations: string[];
}

export interface PackageInfo {
  name: string;
  path: string;
  directory: string;
  hasWardCommands: boolean;
  hasClaudeMd: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

/**
 * Runs project discovery with Voidpoker
 */
export async function runProjectDiscovery(): Promise<ProjectDiscoveryResult> {
  console.log(chalk.cyan('\n🔍 PROJECT DISCOVERY REQUIRED 🔍\n'));
  
  const result: ProjectDiscoveryResult = {
    complete: false,
    packages: [],
    errors: [],
    recommendations: [],
  };
  
  try {
    // Get user input for standards
    const standards = await getUserStandardsInput();
    
    // Find all package.json files
    const packagePaths = await findPackageJsons();
    
    if (packagePaths.length === 0) {
      result.errors.push('No package.json files found in project');
      return result;
    }
    
    console.log(chalk.gray(`Found ${packagePaths.length} package(s) to analyze\n`));
    
    // Analyze each package
    for (const pkgPath of packagePaths) {
      const pkgInfo = await analyzePackage(pkgPath);
      result.packages.push(pkgInfo);
      
      // Spawn Voidpoker for this package
      console.log(chalk.blue(`\n📦 Analyzing: ${pkgInfo.name}`));
      
      const reportFilename = createDiscoveryFilename(pkgInfo.name);
      const reportPath = path.join(DIRECTORIES.discovery, reportFilename);
      
      try {
        await spawnAndWait('voidpoker', {
          questFolder: '', // Voidpoker doesn't need quest folder
          discoveryType: 'Project Analysis',
          packageLocation: pkgInfo.directory,
          userStandards: standards,
          reportPath: reportPath,
        });
        
        console.log(chalk.green(`✓ Discovery complete for ${pkgInfo.name}`));
      } catch (error) {
        console.error(chalk.red(`✗ Discovery failed for ${pkgInfo.name}: ${error.message}`));
        result.errors.push(`Failed to analyze ${pkgInfo.name}`);
      }
    }
    
    // Verify setup
    const verification = await verifyProjectSetup(result.packages);
    result.complete = verification.isComplete;
    result.recommendations.push(...verification.recommendations);
    
    // Update config
    if (result.complete) {
      await updateConfig({
        discoveryComplete: true,
        project: await detectProjectSettings(),
      });
    }
    
  } catch (error) {
    result.errors.push(`Discovery failed: ${error.message}`);
  }
  
  return result;
}

/**
 * Gets user input for standards
 */
async function getUserStandardsInput(): Promise<string> {
  const readline = await import('readline/promises');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  try {
    console.log(chalk.yellow('Project Standards Configuration\n'));
    
    const answer = await rl.question(
      'Any specific directories with standards/conventions?\n' +
      '(e.g., "docs/standards, .github/CONTRIBUTING.md" or "none"): '
    );
    
    return answer.trim() || 'none';
  } finally {
    rl.close();
  }
}

/**
 * Analyzes a single package
 */
async function analyzePackage(packagePath: string): Promise<PackageInfo> {
  const content = await fs.readFile(packagePath, 'utf-8');
  const pkg = JSON.parse(content);
  const dir = path.dirname(packagePath);
  
  // Check for ward commands
  const scripts = pkg.scripts || {};
  const hasWardCommands = !!(
    scripts['ward:all'] || 
    scripts.ward || 
    (scripts.lint && scripts.typecheck)
  );
  
  // Check for CLAUDE.md
  const claudeMdPath = path.join(dir, 'CLAUDE.md');
  const hasClaudeMd = await fileExists(claudeMdPath);
  
  // Detect package manager
  let packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm';
  if (await fileExists(path.join(dir, 'yarn.lock'))) {
    packageManager = 'yarn';
  } else if (await fileExists(path.join(dir, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  }
  
  return {
    name: pkg.name || path.basename(dir),
    path: packagePath,
    directory: dir,
    hasWardCommands,
    hasClaudeMd,
    packageManager,
  };
}

/**
 * Verifies project setup after discovery
 */
async function verifyProjectSetup(packages: PackageInfo[]): Promise<{
  isComplete: boolean;
  recommendations: string[];
}> {
  const recommendations: string[] = [];
  let allGood = true;
  
  console.log(chalk.cyan('\n🔍 Verifying project setup...\n'));
  
  for (const pkg of packages) {
    console.log(chalk.bold(`Package: ${pkg.name}`));
    
    // Check ward commands
    if (pkg.hasWardCommands) {
      console.log(chalk.green('  ✓ Ward commands configured'));
    } else {
      console.log(chalk.red('  ✗ No ward commands found'));
      recommendations.push(
        `Add ward commands to ${pkg.name}: "ward:all": "npm run lint && npm run typecheck && npm run test"`
      );
      allGood = false;
    }
    
    // Check CLAUDE.md
    if (pkg.hasClaudeMd) {
      console.log(chalk.green('  ✓ CLAUDE.md present'));
    } else {
      console.log(chalk.red('  ✗ No CLAUDE.md found'));
      recommendations.push(
        `Create CLAUDE.md in ${pkg.directory} with project-specific guidelines`
      );
      allGood = false;
    }
  }
  
  if (!allGood) {
    console.log(chalk.yellow('\n⚠️  Project setup incomplete'));
    console.log(chalk.gray('Run discovery again after fixing issues'));
  } else {
    console.log(chalk.green('\n✅ Project setup complete!'));
  }
  
  return {
    isComplete: allGood,
    recommendations,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

### 2. Discovery Checker

**File: src/cli/discovery/discovery-checker.ts**
```typescript
import { loadConfig, updateConfig } from '../config-manager';
import { runProjectDiscovery } from './discovery-manager';
import { getDiscoveryReports } from './discovery-reports';
import chalk from 'chalk';

/**
 * Checks and runs project discovery if needed
 */
export async function checkProjectDiscovery(): Promise<void> {
  const config = await loadConfig();
  
  // Check if discovery has been run
  if (config.discoveryComplete) {
    // Check if discovery is stale (older than 30 days)
    const lastDiscovery = config.project.lastDiscoveryRun;
    if (lastDiscovery) {
      const daysSince = getDaysSince(lastDiscovery);
      if (daysSince > 30) {
        console.log(chalk.yellow(`\n⚠️  Project discovery is ${daysSince} days old`));
        const shouldRerun = await askUserConfirmation(
          'Re-run discovery to check for changes?'
        );
        
        if (shouldRerun) {
          await runDiscovery();
        }
      }
    }
    return;
  }
  
  // Discovery not complete - run it
  await runDiscovery();
}

/**
 * Runs discovery and handles results
 */
async function runDiscovery(): Promise<void> {
  const result = await runProjectDiscovery();
  
  if (result.errors.length > 0) {
    console.error(chalk.red('\n❌ Discovery errors:'));
    result.errors.forEach(err => console.error(`  - ${err}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log(chalk.yellow('\n💡 Recommendations:'));
    result.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  if (!result.complete) {
    console.log(chalk.yellow('\n⚠️  Please address issues and run questmaestro again'));
    process.exit(1);
  }
  
  // Update last discovery run
  await updateConfig({
    runtime: {
      lastDiscoveryRun: new Date().toISOString(),
    },
  });
}

/**
 * Forces a fresh discovery run
 */
export async function forceDiscovery(): Promise<void> {
  console.log(chalk.cyan('🔄 Running fresh project discovery...\n'));
  
  // Clear discovery flag to force re-run
  await updateConfig({
    discoveryComplete: false,
  });
  
  await runDiscovery();
}

/**
 * Lists discovery reports
 */
export async function listDiscoveryReports(): Promise<void> {
  const reports = await getDiscoveryReports();
  
  if (reports.length === 0) {
    console.log(chalk.gray('No discovery reports found'));
    return;
  }
  
  console.log(chalk.bold('\n📊 Discovery Reports:\n'));
  
  for (const report of reports) {
    console.log(`${chalk.cyan(report.filename)}`);
    console.log(`  Package: ${report.packageName}`);
    console.log(`  Date: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`  Status: ${report.status}`);
  }
}

// Helper functions

function getDaysSince(dateString: string): number {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

async function askUserConfirmation(question: string): Promise<boolean> {
  const readline = await import('readline/promises');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  try {
    const answer = await rl.question(`${question} [Y/n]: `);
    return answer.toLowerCase() !== 'n';
  } finally {
    rl.close();
  }
}
```

### 3. Discovery Reports

**File: src/cli/discovery/discovery-reports.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { DIRECTORIES } from '../directory-manager';

export interface DiscoveryReportSummary {
  filename: string;
  packageName: string;
  timestamp: string;
  status: 'complete' | 'failed';
  hasWardSetup?: boolean;
  hasClaudeMd?: boolean;
}

/**
 * Gets all discovery reports
 */
export async function getDiscoveryReports(): Promise<DiscoveryReportSummary[]> {
  try {
    const files = await fs.readdir(DIRECTORIES.discovery);
    const reports: DiscoveryReportSummary[] = [];
    
    for (const file of files) {
      if (file.endsWith('-report.json')) {
        try {
          const summary = await parseDiscoveryReport(file);
          reports.push(summary);
        } catch {
          // Skip invalid reports
        }
      }
    }
    
    // Sort by timestamp (newest first)
    return reports.sort((a, b) => 
      b.timestamp.localeCompare(a.timestamp)
    );
  } catch {
    return [];
  }
}

/**
 * Parses a discovery report file
 */
async function parseDiscoveryReport(filename: string): Promise<DiscoveryReportSummary> {
  const filepath = path.join(DIRECTORIES.discovery, filename);
  const content = await fs.readFile(filepath, 'utf-8');
  const report = JSON.parse(content);
  
  // Extract package name from filename
  const match = filename.match(/voidpoker-.*-(.+)-report\.json$/);
  const packageName = match ? match[1] : 'unknown';
  
  // Extract timestamp from filename
  const timestampMatch = filename.match(/voidpoker-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
  const timestamp = timestampMatch 
    ? timestampMatch[1].replace(/-/g, ':').replace('T', 'T').replace(/:/g, ':', 2)
    : new Date().toISOString();
  
  return {
    filename,
    packageName,
    timestamp,
    status: report.status || 'complete',
    hasWardSetup: report.report?.recommendations?.wardCommands ? true : false,
    hasClaudeMd: report.report?.recommendations?.structure?.includes('CLAUDE.md') ? true : false,
  };
}

/**
 * Gets the latest discovery report for a package
 */
export async function getLatestDiscoveryReport(packageName: string): Promise<any | null> {
  const reports = await getDiscoveryReports();
  const packageReports = reports.filter(r => 
    r.packageName === packageName || r.packageName.includes(packageName)
  );
  
  if (packageReports.length === 0) {
    return null;
  }
  
  // Get the latest report
  const latest = packageReports[0];
  const filepath = path.join(DIRECTORIES.discovery, latest.filename);
  const content = await fs.readFile(filepath, 'utf-8');
  
  return JSON.parse(content);
}
```

### 4. CLI Discovery Integration

**Update: src/cli/discovery.ts**
```typescript
import { checkProjectDiscovery, forceDiscovery, listDiscoveryReports } from './discovery/discovery-checker';

export { checkProjectDiscovery };

/**
 * Discovery-related CLI commands
 */
export const discoveryCommands = {
  discover: forceDiscovery,
  'discovery:list': listDiscoveryReports,
};
```

## Unit Tests

**File: src/cli/discovery/discovery-manager.test.ts**
```typescript
import { runProjectDiscovery, analyzePackage } from './discovery-manager';
import { spawnAndWait } from '../agent-spawner';
import { findPackageJsons, updateConfig } from '../config-manager';
import * as fs from 'fs/promises';
import * as readline from 'readline/promises';

jest.mock('../agent-spawner');
jest.mock('../config-manager');
jest.mock('fs/promises');
jest.mock('readline/promises');

describe('DiscoveryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runProjectDiscovery', () => {
    it('should run discovery for all packages', async () => {
      // Mock user input
      const rlMock = {
        question: jest.fn().mockResolvedValue('none'),
        close: jest.fn(),
      };
      (readline.createInterface as jest.Mock).mockReturnValue(rlMock);

      // Mock package discovery
      (findPackageJsons as jest.Mock).mockResolvedValue([
        '/project/package.json',
        '/project/packages/core/package.json',
      ]);

      // Mock file reads
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        name: 'test-package',
        scripts: { 'ward:all': 'npm run lint && npm run test' },
      }));

      // Mock file existence checks
      (fs.access as jest.Mock).mockResolvedValue(undefined); // CLAUDE.md exists

      // Mock agent spawning
      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: {},
      });

      const result = await runProjectDiscovery();

      expect(result.complete).toBe(true);
      expect(result.packages).toHaveLength(2);
      expect(spawnAndWait).toHaveBeenCalledTimes(2);
      expect(updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({ discoveryComplete: true })
      );
    });

    it('should handle missing ward commands', async () => {
      const rlMock = {
        question: jest.fn().mockResolvedValue('none'),
        close: jest.fn(),
      };
      (readline.createInterface as jest.Mock).mockReturnValue(rlMock);

      (findPackageJsons as jest.Mock).mockResolvedValue(['/project/package.json']);
      
      // Package without ward commands
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        name: 'test-package',
        scripts: {},
      }));

      // No CLAUDE.md
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));

      (spawnAndWait as jest.Mock).mockResolvedValue({
        status: 'complete',
        report: {},
      });

      const result = await runProjectDiscovery();

      expect(result.complete).toBe(false);
      expect(result.recommendations).toContain(
        expect.stringContaining('Add ward commands')
      );
      expect(result.recommendations).toContain(
        expect.stringContaining('Create CLAUDE.md')
      );
    });

    it('should handle discovery failures', async () => {
      const rlMock = {
        question: jest.fn().mockResolvedValue('none'),
        close: jest.fn(),
      };
      (readline.createInterface as jest.Mock).mockReturnValue(rlMock);

      (findPackageJsons as jest.Mock).mockResolvedValue(['/project/package.json']);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        name: 'test-package',
      }));

      // Agent fails
      (spawnAndWait as jest.Mock).mockRejectedValue(new Error('Agent failed'));

      const result = await runProjectDiscovery();

      expect(result.complete).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Failed to analyze')
      );
    });
  });
});
```

**File: src/cli/discovery/discovery-checker.test.ts**
```typescript
import { checkProjectDiscovery, forceDiscovery } from './discovery-checker';
import { loadConfig, updateConfig } from '../config-manager';
import { runProjectDiscovery } from './discovery-manager';

jest.mock('../config-manager');
jest.mock('./discovery-manager');

describe('DiscoveryChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkProjectDiscovery', () => {
    it('should skip if discovery complete and recent', async () => {
      (loadConfig as jest.Mock).mockResolvedValue({
        discoveryComplete: true,
        project: {
          lastDiscoveryRun: new Date().toISOString(),
        },
      });

      await checkProjectDiscovery();

      expect(runProjectDiscovery).not.toHaveBeenCalled();
    });

    it('should prompt for re-run if discovery is old', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40); // 40 days ago

      (loadConfig as jest.Mock).mockResolvedValue({
        discoveryComplete: true,
        project: {
          lastDiscoveryRun: oldDate.toISOString(),
        },
      });

      // Mock readline
      const mockQuestion = jest.fn().mockResolvedValue('n');
      jest.doMock('readline/promises', () => ({
        createInterface: () => ({
          question: mockQuestion,
          close: jest.fn(),
        }),
      }));

      await checkProjectDiscovery();

      expect(mockQuestion).toHaveBeenCalledWith(
        expect.stringContaining('Re-run discovery')
      );
    });

    it('should run discovery if not complete', async () => {
      (loadConfig as jest.Mock).mockResolvedValue({
        discoveryComplete: false,
      });

      (runProjectDiscovery as jest.Mock).mockResolvedValue({
        complete: true,
        packages: [],
        errors: [],
        recommendations: [],
      });

      await checkProjectDiscovery();

      expect(runProjectDiscovery).toHaveBeenCalled();
      expect(updateConfig).toHaveBeenCalled();
    });
  });

  describe('forceDiscovery', () => {
    it('should clear discovery flag and run', async () => {
      (runProjectDiscovery as jest.Mock).mockResolvedValue({
        complete: true,
        packages: [],
        errors: [],
        recommendations: [],
      });

      await forceDiscovery();

      expect(updateConfig).toHaveBeenCalledWith({
        discoveryComplete: false,
      });
      expect(runProjectDiscovery).toHaveBeenCalled();
    });
  });
});
```

## Validation Criteria

1. **Discovery Execution**
   - [ ] Finds all package.json files
   - [ ] Spawns Voidpoker for each
   - [ ] Collects user standards input
   - [ ] Handles multi-package repos

2. **Verification**
   - [ ] Checks ward commands exist
   - [ ] Checks CLAUDE.md exists
   - [ ] Provides clear recommendations
   - [ ] Blocks progress if incomplete

3. **Report Management**
   - [ ] Saves to discovery folder
   - [ ] Uses timestamped filenames
   - [ ] Lists discovery reports
   - [ ] Tracks latest discovery

4. **Auto-Discovery**
   - [ ] Runs on first CLI use
   - [ ] Detects stale discovery
   - [ ] Prompts for re-run
   - [ ] Updates config state

5. **Error Handling**
   - [ ] Handles missing packages
   - [ ] Handles agent failures
   - [ ] Provides recovery path
   - [ ] Clear error messages

## Next Steps

After completing this task:
1. Test discovery flow
2. Verify Voidpoker integration
3. Test multi-package projects
4. Check config updates
5. Proceed to [15-discovery-validation.md](15-discovery-validation.md)