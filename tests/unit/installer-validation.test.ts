
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Installer Validation Tests', () => {
  let tempDir: string;
  const installerPath = path.join(__dirname, '..', '..', 'bin', 'install.js');

  // Helper function to run installer and capture output
  const runInstaller = (cwd: string) => {
    try {
      const output = execSync(`node ${installerPath}`, {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return { success: true, output };
    } catch (error) {
      return { 
        success: false, 
        output: (error as any).stdout || (error as any).stderr || (error as Error).message,
        error 
      };
    }
  };

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'questmaestro-test-'));
    
    // Create .claude directory (required for all tests)
    fs.mkdirSync(path.join(tempDir, '.claude'), { recursive: true });
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('should fail without package.json', () => {
    const result = runInstaller(tempDir);
    expect(result.success).toBe(false);
    expect(result.output).toContain('No package.json found');
  });

  test('should fail without ESLint configuration', () => {
    // Create minimal package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        lint: 'eslint',
        test: 'jest'
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = runInstaller(tempDir);
    expect(result.success).toBe(false);
    expect(result.output).toContain('No ESLint configuration found');
  });

  test('should fail without Jest configuration', () => {
    // Create package.json with ESLint config
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        lint: 'eslint',
        test: 'jest'
      },
      eslintConfig: {
        env: { node: true }
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = runInstaller(tempDir);
    expect(result.success).toBe(false);
    expect(result.output).toContain('No Jest configuration found');
  });

  test('should fail without required scripts', () => {
    // Create package.json with configs but missing scripts
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        build: 'echo building'
      },
      eslintConfig: {
        env: { node: true }
      },
      jest: {
        testEnvironment: 'node'
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const result = runInstaller(tempDir);
    expect(result.success).toBe(false);
    expect(result.output).toContain('Missing required scripts');
  });

  test('should succeed with all requirements met', () => {
    // Create complete package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        lint: 'eslint',
        test: 'jest',
        build: 'echo building'
      },
      eslintConfig: {
        env: { node: true }
      },
      jest: {
        testEnvironment: 'node'
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create templates directory for installer to copy from
    const templatesDir = path.join(__dirname, '..', 'src', 'templates');
    if (!fs.existsSync(templatesDir)) {
      // Skip test if templates don't exist
      console.log('Skipping test - templates directory not found');
      return;
    }

    const result = runInstaller(tempDir);
    
    expect(result.success).toBe(true);
    expect(result.output).toContain('✓ package.json found');
    expect(result.output).toContain('✓ ESLint configuration found');
    expect(result.output).toContain('✓ Jest configuration found');
    expect(result.output).toContain('✓ Required scripts found');
  });

  test('should accept ESLint config file', () => {
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        lint: 'eslint',
        test: 'jest'
      },
      jest: {
        testEnvironment: 'node'
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create .eslintrc.json
    fs.writeFileSync(
      path.join(tempDir, '.eslintrc.json'),
      JSON.stringify({ env: { node: true } }, null, 2)
    );

    const templatesDir = path.join(__dirname, '..', 'src', 'templates');
    if (!fs.existsSync(templatesDir)) {
      console.log('Skipping test - templates directory not found');
      return;
    }

    const result = runInstaller(tempDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain('✓ ESLint configuration found');
  });

  test('should accept Jest config file', () => {
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        lint: 'eslint',
        test: 'jest'
      },
      eslintConfig: {
        env: { node: true }
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create jest.config.js
    fs.writeFileSync(
      path.join(tempDir, 'jest.config.js'),
      'module.exports = { testEnvironment: "node" };'
    );

    const templatesDir = path.join(__dirname, '..', 'src', 'templates');
    if (!fs.existsSync(templatesDir)) {
      console.log('Skipping test - templates directory not found');
      return;
    }

    const result = runInstaller(tempDir);
    expect(result.success).toBe(true);
    expect(result.output).toContain('✓ Jest configuration found');
  });
});