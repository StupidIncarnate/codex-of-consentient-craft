const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class ProjectBootstrapper {
  constructor() {
    this.tempRoot = path.join(process.cwd(), 'tests', 'tmp');
  }

  /**
   * Copy a fixture project to a temporary test location
   */
  async copyFixture(fixtureName, testName) {
    const fixtureDir = path.join(process.cwd(), 'tests', 'fixtures', fixtureName);
    const testId = crypto.randomBytes(4).toString('hex');
    const targetDir = path.join(this.tempRoot, `${testName}-${testId}`);

    // Ensure temp directory exists
    fs.mkdirSync(this.tempRoot, { recursive: true });

    // Copy fixture to temp location
    this.copyDirectorySync(fixtureDir, targetDir);

    return targetDir;
  }

  /**
   * Create a simple Node.js project
   */
  async createSimpleProject(name = 'simple-project') {
    const projectDir = await this.copyFixture('simple-project', name);
    
    // Create .claude directory structure BEFORE installing
    const claudeDir = path.join(projectDir, '.claude');
    fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });
    
    // Run the actual npx questmaestro installer
    await this.runNpxInstall(projectDir);
    
    return {
      rootDir: projectDir,
      type: 'simple',
      cleanup: () => this.cleanup(projectDir)
    };
  }

  /**
   * Create a monorepo project
   */
  async createMonorepo(name = 'monorepo-project') {
    const projectDir = await this.copyFixture('monorepo', name);
    
    // Create .claude directory structure BEFORE installing
    const claudeDir = path.join(projectDir, '.claude');
    fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });
    
    // Run the actual npx questmaestro installer
    await this.runNpxInstall(projectDir);
    
    // Update .questmaestro config for monorepo
    const configPath = path.join(projectDir, '.questmaestro');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.commands = {
      "ward": "npm run lint --workspace=$WORKSPACE -- $FILE",
      "ward:all": "npm run lint && npm run typecheck && npm run build && npm run test"
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return {
      rootDir: projectDir,
      type: 'monorepo',
      workspaces: ['packages/api', 'packages/web'],
      cleanup: () => this.cleanup(projectDir)
    };
  }

  /**
   * Create a project with existing quests
   */
  async createProjectWithQuests(baseType = 'simple', quests = []) {
    const project = baseType === 'monorepo' 
      ? await this.createMonorepo('project-with-quests')
      : await this.createSimpleProject('project-with-quests');
    
    // Add quest files
    const questDir = path.join(project.rootDir, 'questmaestro');
    const activeDir = path.join(questDir, 'active');
    
    for (const quest of quests) {
      const questPath = path.join(activeDir, quest.filename);
      fs.writeFileSync(questPath, JSON.stringify(quest.data, null, 2));
    }
    
    // Update quest tracker
    const trackerPath = path.join(questDir, 'quest-tracker.json');
    const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
    tracker.active = quests.map(q => q.filename);
    fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
    
    return project;
  }

  /**
   * Run npx questmaestro installer (simulating real user experience)
   */
  async runNpxInstall(projectDir) {
    const installerPath = path.join(process.cwd(), 'bin', 'install.js');
    
    console.log(`   📦 Installing Questmaestro in ${path.basename(projectDir)}...`);
    
    // Ensure .claude directory exists before running installer
    const claudeDir = path.join(projectDir, '.claude');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    
    const result = execSync(`node ${installerPath}`, {
      cwd: projectDir,
      encoding: 'utf8'
    });
    
    // Verify installation succeeded
    const commandsDir = path.join(projectDir, '.claude', 'commands');
    const questmaestroCmd = path.join(commandsDir, 'questmaestro.md');
    
    if (!fs.existsSync(questmaestroCmd)) {
      throw new Error('Questmaestro installation failed - commands not found');
    }
    
    return result;
  }

  /**
   * Install Questmaestro in a project (legacy method)
   */
  async installQuestmaestro(projectDir) {
    return this.runNpxInstall(projectDir);
  }

  /**
   * Recursively copy directory
   */
  copyDirectorySync(source, target) {
    fs.mkdirSync(target, { recursive: true });
    
    const files = fs.readdirSync(source);
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      
      if (fs.statSync(sourcePath).isDirectory()) {
        this.copyDirectorySync(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  /**
   * Clean up test project
   */
  cleanup(projectDir) {
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  }

  /**
   * Clean up all temp projects
   */
  cleanupAll() {
    if (fs.existsSync(this.tempRoot)) {
      fs.rmSync(this.tempRoot, { recursive: true, force: true });
    }
  }
}

module.exports = { ProjectBootstrapper };