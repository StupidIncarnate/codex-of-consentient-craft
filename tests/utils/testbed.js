const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class TestProject {
  constructor(name) {
    this.name = name;
    this.id = crypto.randomBytes(4).toString('hex');
    this.rootDir = path.join(process.cwd(), 'tests', 'tmp', `${name}-${this.id}`);
  }

  async setup() {
    // Create project directory
    fs.mkdirSync(this.rootDir, { recursive: true });
    
    // Create .claude directory structure
    const claudeDir = path.join(this.rootDir, '.claude');
    const commandsDir = path.join(claudeDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    
    // Create a basic package.json with required configs
    const packageJson = {
      name: `test-project-${this.name}`,
      version: '1.0.0',
      scripts: {
        test: 'jest',
        lint: 'eslint .',
        typecheck: 'echo "Type checking"'
      },
      eslintConfig: {
        env: {
          node: true,
          es2021: true
        }
      },
      jest: {
        testEnvironment: 'node'
      }
    };
    
    fs.writeFileSync(
      path.join(this.rootDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    return this;
  }

  async installQuestmaestro() {
    // Run the installer from the test project directory
    const installerPath = path.join(process.cwd(), 'bin', 'install.js');
    const result = execSync(`node ${installerPath}`, {
      cwd: this.rootDir,
      encoding: 'utf8'
    });
    return result;
  }

  // Check if a file exists relative to the test project root
  fileExists(relativePath) {
    return fs.existsSync(path.join(this.rootDir, relativePath));
  }

  // Read a file from the test project
  readFile(relativePath) {
    return fs.readFileSync(path.join(this.rootDir, relativePath), 'utf8');
  }

  // Write a file to the test project
  writeFile(relativePath, content) {
    const fullPath = path.join(this.rootDir, relativePath);
    const dir = path.dirname(fullPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content);
  }

  // Execute a command in the test project directory
  exec(command) {
    try {
      const result = execSync(command, {
        cwd: this.rootDir,
        encoding: 'utf8'
      });
      return { stdout: result, stderr: '', exitCode: 0 };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.status || 1
      };
    }
  }

  // Check if a quest command exists
  hasCommand(commandName) {
    // Handle both regular commands and quest: commands
    if (commandName.startsWith('quest:')) {
      const agentName = commandName.replace('quest:', '');
      const commandPath = path.join(this.rootDir, '.claude', 'commands', 'quest', `${agentName}.md`);
      return fs.existsSync(commandPath);
    } else {
      const commandPath = path.join(this.rootDir, '.claude', 'commands', `${commandName}.md`);
      return fs.existsSync(commandPath);
    }
  }

  // Get quest tracker data
  getQuestTracker() {
    const trackerPath = path.join(this.rootDir, 'questmaestro', 'quest-tracker.json');
    if (fs.existsSync(trackerPath)) {
      return JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
    }
    return null;
  }

  // Get configuration
  getConfig() {
    const configPath = path.join(this.rootDir, '.questmaestro');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return null;
  }

  // Clean up the test project
  async cleanup() {
    if (fs.existsSync(this.rootDir)) {
      fs.rmSync(this.rootDir, { recursive: true, force: true });
    }
  }
}

// Factory function to create and setup a test project
async function createTestProject(name = 'test') {
  const project = new TestProject(name);
  await project.setup();
  return project;
}

module.exports = { TestProject, createTestProject };