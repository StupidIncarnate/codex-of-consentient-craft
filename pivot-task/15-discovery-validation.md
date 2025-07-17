# Task 15: Discovery Validation

## Objective
Verify ward commands and CLAUDE.md files are properly set up after discovery, with automated fixes where possible.

## Dependencies
- Task 14: Voidpoker Integration (for discovery results)
- Task 03: Config Management (for ward detection)

## Implementation

### 1. Ward Command Validator

**File: src/cli/discovery/ward-validator.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export interface WardValidationResult {
  valid: boolean;
  commands: {
    all?: string;
    lint?: string;
    typecheck?: string;
    test?: string;
  };
  missing: string[];
  suggestions: string[];
  autoFixAvailable: boolean;
}

/**
 * Validates ward commands in a package
 */
export async function validateWardCommands(packagePath: string): Promise<WardValidationResult> {
  const result: WardValidationResult = {
    valid: false,
    commands: {},
    missing: [],
    suggestions: [],
    autoFixAvailable: false,
  };
  
  try {
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    const scripts = pkg.scripts || {};
    
    // Check for ward:all or ward
    if (scripts['ward:all']) {
      result.commands.all = scripts['ward:all'];
    } else if (scripts.ward) {
      result.commands.all = scripts.ward;
    }
    
    // Check individual commands
    if (scripts.lint) result.commands.lint = scripts.lint;
    if (scripts.typecheck) result.commands.typecheck = scripts.typecheck;
    if (scripts.test) result.commands.test = scripts.test;
    
    // Analyze what's missing
    if (!result.commands.all) {
      if (result.commands.lint || result.commands.typecheck || result.commands.test) {
        // Can create ward:all from existing commands
        result.suggestions.push('Create ward:all combining existing commands');
        result.autoFixAvailable = true;
      } else {
        // Need to detect and suggest commands
        const detected = await detectPossibleCommands(path.dirname(packagePath), pkg);
        result.missing.push(...detected.missing);
        result.suggestions.push(...detected.suggestions);
        result.autoFixAvailable = detected.canAutoFix;
      }
    }
    
    // Check if commands actually work
    if (result.commands.all) {
      const testResult = await testWardCommand(result.commands.all, path.dirname(packagePath));
      if (!testResult.works) {
        result.valid = false;
        result.suggestions.push(`Ward command fails: ${testResult.error}`);
      } else {
        result.valid = true;
      }
    }
    
  } catch (error) {
    result.suggestions.push(`Failed to read package.json: ${error.message}`);
  }
  
  return result;
}

/**
 * Detects possible lint/test commands based on dependencies
 */
async function detectPossibleCommands(
  projectDir: string,
  pkg: any
): Promise<{
  missing: string[];
  suggestions: string[];
  canAutoFix: boolean;
}> {
  const result = {
    missing: [] as string[],
    suggestions: [] as string[],
    canAutoFix: false,
  };
  
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  // Detect linter
  if (!pkg.scripts?.lint) {
    if (deps.eslint) {
      result.suggestions.push('Add lint script: "eslint src --ext .ts,.tsx"');
      result.canAutoFix = true;
    } else if (deps.tslint) {
      result.suggestions.push('Add lint script: "tslint -c tslint.json \'src/**/*.ts\'"');
      result.canAutoFix = true;
    } else {
      result.missing.push('No linter detected (eslint recommended)');
    }
  }
  
  // Detect type checker
  if (!pkg.scripts?.typecheck) {
    if (deps.typescript) {
      result.suggestions.push('Add typecheck script: "tsc --noEmit"');
      result.canAutoFix = true;
    } else if (projectDir.includes('.ts')) {
      result.missing.push('TypeScript files found but no typescript dependency');
    }
  }
  
  // Detect test runner
  if (!pkg.scripts?.test) {
    if (deps.jest) {
      result.suggestions.push('Add test script: "jest"');
      result.canAutoFix = true;
    } else if (deps.mocha) {
      result.suggestions.push('Add test script: "mocha"');
      result.canAutoFix = true;
    } else if (deps.vitest) {
      result.suggestions.push('Add test script: "vitest run"');
      result.canAutoFix = true;
    } else {
      result.missing.push('No test runner detected (jest recommended)');
    }
  }
  
  return result;
}

/**
 * Tests if a ward command actually works
 */
async function testWardCommand(
  command: string,
  cwd: string
): Promise<{ works: boolean; error?: string }> {
  try {
    // Run with --version or --help to test without side effects
    const testCommand = command.includes('&&') 
      ? command.split('&&')[0].trim() + ' --version'
      : command + ' --version';
    
    await execAsync(testCommand, { cwd });
    return { works: true };
  } catch (error) {
    return { 
      works: false, 
      error: error.message || 'Command failed',
    };
  }
}

/**
 * Auto-fixes ward commands where possible
 */
export async function autoFixWardCommands(packagePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    const scripts = pkg.scripts || {};
    
    let modified = false;
    
    // Add missing scripts based on dependencies
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    if (!scripts.lint && deps.eslint) {
      scripts.lint = 'eslint src --ext .ts,.tsx,.js,.jsx';
      modified = true;
    }
    
    if (!scripts.typecheck && deps.typescript) {
      scripts.typecheck = 'tsc --noEmit';
      modified = true;
    }
    
    if (!scripts.test && deps.jest) {
      scripts.test = 'jest';
      modified = true;
    }
    
    // Create ward:all if components exist
    if (!scripts['ward:all'] && !scripts.ward) {
      const components = [];
      if (scripts.lint) components.push('npm run lint');
      if (scripts.typecheck) components.push('npm run typecheck');
      if (scripts.test) components.push('npm run test');
      
      if (components.length > 0) {
        scripts['ward:all'] = components.join(' && ');
        modified = true;
      }
    }
    
    if (modified) {
      pkg.scripts = scripts;
      await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2));
      console.log(chalk.green('✓ Added ward commands to package.json'));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(`Failed to auto-fix: ${error.message}`));
    return false;
  }
}
```

### 2. CLAUDE.md Validator

**File: src/cli/discovery/claude-md-validator.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export interface ClaudeMdValidationResult {
  exists: boolean;
  valid: boolean;
  issues: string[];
  suggestions: string[];
  content?: string;
}

const REQUIRED_SECTIONS = [
  'Project Overview',
  'Key Design Decisions',
  'Development Guidelines',
  'Testing Strategy',
];

const RECOMMENDED_SECTIONS = [
  'Architecture',
  'Coding Standards',
  'Common Patterns',
  'Gotchas',
];

/**
 * Validates CLAUDE.md file
 */
export async function validateClaudeMd(projectDir: string): Promise<ClaudeMdValidationResult> {
  const result: ClaudeMdValidationResult = {
    exists: false,
    valid: false,
    issues: [],
    suggestions: [],
  };
  
  const claudePath = path.join(projectDir, 'CLAUDE.md');
  
  try {
    const content = await fs.readFile(claudePath, 'utf-8');
    result.exists = true;
    result.content = content;
    
    // Check for required sections
    const missingSections = REQUIRED_SECTIONS.filter(section => 
      !content.includes(`# ${section}`) && !content.includes(`## ${section}`)
    );
    
    if (missingSections.length > 0) {
      result.issues.push(`Missing required sections: ${missingSections.join(', ')}`);
    }
    
    // Check for recommended sections
    const missingRecommended = RECOMMENDED_SECTIONS.filter(section => 
      !content.includes(`# ${section}`) && !content.includes(`## ${section}`)
    );
    
    if (missingRecommended.length > 0) {
      result.suggestions.push(`Consider adding sections: ${missingRecommended.join(', ')}`);
    }
    
    // Check content quality
    if (content.length < 500) {
      result.issues.push('CLAUDE.md seems too brief (< 500 characters)');
      result.suggestions.push('Add more detailed guidelines and examples');
    }
    
    // Check for placeholder content
    if (content.includes('TODO') || content.includes('FIXME')) {
      result.issues.push('CLAUDE.md contains TODO/FIXME placeholders');
    }
    
    result.valid = result.issues.length === 0;
    
  } catch (error) {
    result.exists = false;
    result.issues.push('CLAUDE.md file not found');
    result.suggestions.push('Create CLAUDE.md with project-specific AI guidelines');
  }
  
  return result;
}

/**
 * Creates a template CLAUDE.md file
 */
export async function createClaudeMdTemplate(projectDir: string, projectName: string): Promise<boolean> {
  const claudePath = path.join(projectDir, 'CLAUDE.md');
  
  // Check if already exists
  try {
    await fs.access(claudePath);
    console.log(chalk.yellow('CLAUDE.md already exists'));
    return false;
  } catch {
    // File doesn't exist, create it
  }
  
  const template = `# ${projectName} - AI Assistant Guidelines

## Project Overview

${projectName} is [describe your project here].

### Key Technologies
- [List main technologies]
- [e.g., TypeScript, React, Node.js]

### Project Structure
\`\`\`
src/
├── [describe main directories]
└── [and their purposes]
\`\`\`

## Key Design Decisions

### Architecture
[Describe architectural patterns and why they were chosen]

### State Management
[How is state managed in the application?]

### Data Flow
[How does data flow through the system?]

## Development Guidelines

### Code Style
- [List specific code style preferences]
- [e.g., Functional components only, No default exports]

### Naming Conventions
- Files: [e.g., kebab-case for files]
- Components: [e.g., PascalCase for components]
- Functions: [e.g., camelCase for functions]

### File Organization
[Describe how files should be organized]

## Testing Strategy

### Unit Tests
- Test framework: [e.g., Jest]
- Coverage target: [e.g., 80%]
- Location: [e.g., *.test.ts files alongside source]

### Integration Tests
[Describe integration testing approach]

### E2E Tests
[Describe E2E testing approach if applicable]

## Common Patterns

### Error Handling
\`\`\`typescript
// Show preferred error handling pattern
\`\`\`

### API Calls
\`\`\`typescript
// Show preferred API call pattern
\`\`\`

### Component Structure
\`\`\`typescript
// Show preferred component structure
\`\`\`

## Gotchas and Warnings

- [List any non-obvious gotchas]
- [e.g., Don't modify X directly, use Y instead]

## External Documentation

- [Link to any external docs]
- [e.g., API documentation, design system]
`;
  
  try {
    await fs.writeFile(claudePath, template);
    console.log(chalk.green(`✓ Created CLAUDE.md template at ${claudePath}`));
    console.log(chalk.gray('Please customize it with project-specific information'));
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to create CLAUDE.md: ${error.message}`));
    return false;
  }
}

/**
 * Analyzes existing code to suggest CLAUDE.md content
 */
export async function suggestClaudeMdContent(projectDir: string): Promise<string[]> {
  const suggestions: string[] = [];
  
  try {
    // Check for common files/patterns
    const files = await fs.readdir(projectDir);
    
    // Framework detection
    if (files.includes('next.config.js')) {
      suggestions.push('Detected Next.js - document routing conventions');
    }
    
    if (files.includes('vite.config.ts')) {
      suggestions.push('Detected Vite - document build configuration');
    }
    
    // Check src structure
    const srcPath = path.join(projectDir, 'src');
    try {
      const srcFiles = await fs.readdir(srcPath);
      
      if (srcFiles.includes('components')) {
        suggestions.push('Document component organization and patterns');
      }
      
      if (srcFiles.includes('hooks')) {
        suggestions.push('Document custom hooks conventions');
      }
      
      if (srcFiles.includes('store') || srcFiles.includes('redux')) {
        suggestions.push('Document state management patterns');
      }
    } catch {
      // No src directory
    }
    
    // Check for config files
    if (files.includes('.eslintrc.js') || files.includes('.eslintrc.json')) {
      suggestions.push('Reference ESLint rules in coding standards');
    }
    
    if (files.includes('tsconfig.json')) {
      suggestions.push('Document TypeScript strict mode settings');
    }
    
  } catch (error) {
    suggestions.push('Could not analyze project structure');
  }
  
  return suggestions;
}
```

### 3. Discovery Validation Orchestrator

**File: src/cli/discovery/validation-orchestrator.ts**
```typescript
import { validateWardCommands, autoFixWardCommands } from './ward-validator';
import { validateClaudeMd, createClaudeMdTemplate, suggestClaudeMdContent } from './claude-md-validator';
import { PackageInfo } from './discovery-manager';
import chalk from 'chalk';

export interface ValidationReport {
  package: string;
  wardValidation: {
    valid: boolean;
    fixed: boolean;
    issues: string[];
  };
  claudeMdValidation: {
    valid: boolean;
    created: boolean;
    issues: string[];
  };
  overallValid: boolean;
}

/**
 * Validates and fixes project setup
 */
export async function validateAndFixProject(packages: PackageInfo[]): Promise<{
  allValid: boolean;
  reports: ValidationReport[];
  recommendations: string[];
}> {
  const reports: ValidationReport[] = [];
  const recommendations: string[] = [];
  
  console.log(chalk.cyan('\n🔧 Validating and fixing project setup...\n'));
  
  for (const pkg of packages) {
    console.log(chalk.bold(`\nPackage: ${pkg.name}`));
    
    const report: ValidationReport = {
      package: pkg.name,
      wardValidation: {
        valid: false,
        fixed: false,
        issues: [],
      },
      claudeMdValidation: {
        valid: false,
        created: false,
        issues: [],
      },
      overallValid: false,
    };
    
    // Validate ward commands
    console.log(chalk.gray('Checking ward commands...'));
    const wardResult = await validateWardCommands(pkg.path);
    
    if (!wardResult.valid) {
      report.wardValidation.issues.push(...wardResult.missing);
      
      if (wardResult.autoFixAvailable) {
        console.log(chalk.yellow('  ⚠️  Ward commands missing, attempting auto-fix...'));
        const fixed = await autoFixWardCommands(pkg.path);
        
        if (fixed) {
          report.wardValidation.fixed = true;
          console.log(chalk.green('  ✓ Ward commands added'));
          
          // Re-validate
          const recheck = await validateWardCommands(pkg.path);
          report.wardValidation.valid = recheck.valid;
        } else {
          console.log(chalk.red('  ✗ Auto-fix failed'));
          recommendations.push(`Manually add ward commands to ${pkg.name}`);
        }
      } else {
        recommendations.push(...wardResult.suggestions);
      }
    } else {
      report.wardValidation.valid = true;
      console.log(chalk.green('  ✓ Ward commands valid'));
    }
    
    // Validate CLAUDE.md
    console.log(chalk.gray('Checking CLAUDE.md...'));
    const claudeResult = await validateClaudeMd(pkg.directory);
    
    if (!claudeResult.exists) {
      console.log(chalk.yellow('  ⚠️  CLAUDE.md missing, creating template...'));
      const created = await createClaudeMdTemplate(pkg.directory, pkg.name);
      
      if (created) {
        report.claudeMdValidation.created = true;
        console.log(chalk.green('  ✓ CLAUDE.md template created'));
        
        // Get content suggestions
        const suggestions = await suggestClaudeMdContent(pkg.directory);
        if (suggestions.length > 0) {
          console.log(chalk.gray('\n  Suggestions for CLAUDE.md:'));
          suggestions.forEach(s => console.log(chalk.gray(`    - ${s}`)));
        }
      } else {
        console.log(chalk.red('  ✗ Failed to create CLAUDE.md'));
        recommendations.push(`Manually create CLAUDE.md in ${pkg.directory}`);
      }
    } else if (!claudeResult.valid) {
      report.claudeMdValidation.issues.push(...claudeResult.issues);
      console.log(chalk.yellow('  ⚠️  CLAUDE.md needs improvements:'));
      claudeResult.issues.forEach(issue => 
        console.log(chalk.yellow(`    - ${issue}`))
      );
      
      if (claudeResult.suggestions.length > 0) {
        claudeResult.suggestions.forEach(s => 
          recommendations.push(`${pkg.name}: ${s}`)
        );
      }
    } else {
      report.claudeMdValidation.valid = true;
      console.log(chalk.green('  ✓ CLAUDE.md valid'));
    }
    
    // Overall validation
    report.overallValid = 
      (report.wardValidation.valid || report.wardValidation.fixed) &&
      (report.claudeMdValidation.valid || report.claudeMdValidation.created);
    
    reports.push(report);
  }
  
  const allValid = reports.every(r => r.overallValid);
  
  // Summary
  console.log(chalk.cyan('\n📊 Validation Summary:\n'));
  
  const validCount = reports.filter(r => r.overallValid).length;
  console.log(chalk.bold(`Packages validated: ${validCount}/${reports.length}`));
  
  if (!allValid) {
    console.log(chalk.yellow('\nRemaining issues:'));
    reports.forEach(r => {
      if (!r.overallValid) {
        console.log(chalk.yellow(`\n${r.package}:`));
        r.wardValidation.issues.forEach(i => console.log(`  - ${i}`));
        r.claudeMdValidation.issues.forEach(i => console.log(`  - ${i}`));
      }
    });
  }
  
  return {
    allValid,
    reports,
    recommendations,
  };
}
```

## Unit Tests

**File: src/cli/discovery/ward-validator.test.ts**
```typescript
import * as fs from 'fs/promises';
import { validateWardCommands, autoFixWardCommands } from './ward-validator';
import { exec } from 'child_process';

jest.mock('fs/promises');
jest.mock('child_process');

describe('WardValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateWardCommands', () => {
    it('should validate existing ward:all command', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        scripts: {
          'ward:all': 'npm run lint && npm run test',
        },
      }));

      (exec as any).mockImplementation((cmd, opts, cb) => cb(null, { stdout: '' }));

      const result = await validateWardCommands('/project/package.json');

      expect(result.valid).toBe(true);
      expect(result.commands.all).toBe('npm run lint && npm run test');
    });

    it('should detect missing ward commands', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        scripts: {},
        devDependencies: {
          eslint: '^8.0.0',
          jest: '^29.0.0',
        },
      }));

      const result = await validateWardCommands('/project/package.json');

      expect(result.valid).toBe(false);
      expect(result.autoFixAvailable).toBe(true);
      expect(result.suggestions).toContain(
        expect.stringContaining('Add lint script')
      );
    });

    it('should suggest creating ward:all from existing commands', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        scripts: {
          lint: 'eslint .',
          test: 'jest',
        },
      }));

      const result = await validateWardCommands('/project/package.json');

      expect(result.valid).toBe(false);
      expect(result.autoFixAvailable).toBe(true);
      expect(result.suggestions).toContain(
        expect.stringContaining('Create ward:all combining')
      );
    });
  });

  describe('autoFixWardCommands', () => {
    it('should add missing scripts', async () => {
      const mockPackage = {
        scripts: {},
        devDependencies: {
          eslint: '^8.0.0',
          typescript: '^5.0.0',
          jest: '^29.0.0',
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPackage));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const fixed = await autoFixWardCommands('/project/package.json');

      expect(fixed).toBe(true);
      
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const written = JSON.parse(writeCall[1]);
      
      expect(written.scripts.lint).toBeDefined();
      expect(written.scripts.typecheck).toBeDefined();
      expect(written.scripts.test).toBeDefined();
      expect(written.scripts['ward:all']).toContain('lint');
      expect(written.scripts['ward:all']).toContain('typecheck');
      expect(written.scripts['ward:all']).toContain('test');
    });

    it('should create ward:all from existing scripts', async () => {
      const mockPackage = {
        scripts: {
          lint: 'eslint .',
          test: 'jest',
        },
      };

      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockPackage));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const fixed = await autoFixWardCommands('/project/package.json');

      expect(fixed).toBe(true);
      
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const written = JSON.parse(writeCall[1]);
      
      expect(written.scripts['ward:all']).toBe('npm run lint && npm run test');
    });
  });
});
```

**File: src/cli/discovery/claude-md-validator.test.ts**
```typescript
import * as fs from 'fs/promises';
import { validateClaudeMd, createClaudeMdTemplate } from './claude-md-validator';

jest.mock('fs/promises');

describe('ClaudeMdValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateClaudeMd', () => {
    it('should validate complete CLAUDE.md', async () => {
      const content = `# Project Name

## Project Overview
This is a test project.

## Key Design Decisions
We use TypeScript.

## Development Guidelines
Follow ESLint rules.

## Testing Strategy
Jest with 80% coverage.`;

      (fs.readFile as jest.Mock).mockResolvedValue(content);

      const result = await validateClaudeMd('/project');

      expect(result.exists).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing sections', async () => {
      const content = `# Project Name

## Project Overview
This is a test project.`;

      (fs.readFile as jest.Mock).mockResolvedValue(content);

      const result = await validateClaudeMd('/project');

      expect(result.exists).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain(
        expect.stringContaining('Missing required sections')
      );
    });

    it('should detect brief content', async () => {
      const content = `# Project
Brief description.`;

      (fs.readFile as jest.Mock).mockResolvedValue(content);

      const result = await validateClaudeMd('/project');

      expect(result.issues).toContain(
        expect.stringContaining('too brief')
      );
    });

    it('should handle missing file', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

      const result = await validateClaudeMd('/project');

      expect(result.exists).toBe(false);
      expect(result.issues).toContain('CLAUDE.md file not found');
    });
  });

  describe('createClaudeMdTemplate', () => {
    it('should create template file', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('Not found'));
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const created = await createClaudeMdTemplate('/project', 'TestProject');

      expect(created).toBe(true);
      
      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const content = writeCall[1];
      
      expect(content).toContain('# TestProject');
      expect(content).toContain('## Project Overview');
      expect(content).toContain('## Testing Strategy');
    });

    it('should not overwrite existing file', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const created = await createClaudeMdTemplate('/project', 'TestProject');

      expect(created).toBe(false);
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });
});
```

## Validation Criteria

1. **Ward Command Validation**
   - [ ] Detects existing ward commands
   - [ ] Tests if commands work
   - [ ] Suggests missing commands
   - [ ] Auto-fixes when possible

2. **CLAUDE.md Validation**
   - [ ] Checks file existence
   - [ ] Validates required sections
   - [ ] Detects placeholder content
   - [ ] Creates template when missing

3. **Auto-Fix Capabilities**
   - [ ] Adds missing lint/test scripts
   - [ ] Creates ward:all command
   - [ ] Generates CLAUDE.md template
   - [ ] Preserves existing content

4. **Validation Reports**
   - [ ] Clear status per package
   - [ ] Lists specific issues
   - [ ] Provides actionable fixes
   - [ ] Tracks what was fixed

5. **User Experience**
   - [ ] Shows progress during validation
   - [ ] Color-coded output
   - [ ] Summarizes results
   - [ ] Next steps guidance

## Next Steps

After completing this task:
1. Test validation flow
2. Verify auto-fix functionality
3. Test CLAUDE.md generation
4. Check multi-package handling
5. Proceed to [16-ward-validation.md](16-ward-validation.md)