import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

interface QuestData {
  filename: string;
  data: unknown;
}

interface QuestmaestroConfig {
  commands?: {
    [key: string]: string;
  };
  [key: string]: unknown;
}

export class ProjectBootstrapper {
  private tempRoot: string;

  constructor() {
    this.tempRoot = path.join(process.cwd(), 'tests', 'tmp');
  }

  /**
   * Copy a fixture project to a temporary test location
   */
  copyFixture(fixtureName: string, testName: string) {
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
  createSimpleProject(name: string = 'simple-project') {
    const projectDir = this.copyFixture('simple-project', name);

    // Create .claude directory structure BEFORE installing
    const claudeDir = path.join(projectDir, '.claude');
    fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });

    // Run the actual npx questmaestro installer
    this.runNpxInstall(projectDir);

    return {
      rootDir: projectDir,
      type: 'simple',
      cleanup: () => this.cleanup(projectDir),
    };
  }

  /**
   * Create a monorepo project
   */
  createMonorepo(name: string = 'monorepo-project') {
    const projectDir = this.copyFixture('monorepo', name);

    // Create .claude directory structure BEFORE installing
    const claudeDir = path.join(projectDir, '.claude');
    fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });

    // Run the actual npx questmaestro installer
    this.runNpxInstall(projectDir);

    // Update .questmaestro config for monorepo
    const configPath = path.join(projectDir, '.questmaestro');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as QuestmaestroConfig;
    config.commands = {
      ward: 'npm run lint --workspace=$WORKSPACE -- $FILE',
      'ward:all': 'npm run lint && npm run typecheck && npm run build && npm run test',
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return {
      rootDir: projectDir,
      type: 'monorepo',
      workspaces: ['packages/api', 'packages/web'],
      cleanup: () => this.cleanup(projectDir),
    };
  }

  /**
   * Create a project with existing quests
   */
  createProjectWithQuests(baseType: 'simple' | 'monorepo' = 'simple', quests: QuestData[] = []) {
    const project =
      baseType === 'monorepo'
        ? this.createMonorepo('project-with-quests')
        : this.createSimpleProject('project-with-quests');

    // Add quest files
    const questDir = path.join(project.rootDir, 'questmaestro');
    const activeDir = path.join(questDir, 'active');

    for (const quest of quests) {
      const questPath = path.join(activeDir, quest.filename);
      fs.writeFileSync(questPath, JSON.stringify(quest.data, null, 2));
    }

    // No quest tracker needed - files are managed by directory structure

    return project;
  }

  /**
   * Run npx questmaestro installer (simulating real user experience)
   */
  runNpxInstall(projectDir: string) {
    const installerPath = path.join(process.cwd(), 'bin', 'install.js');

    console.log(`   📦 Installing Questmaestro in ${path.basename(projectDir)}...`);

    // Ensure .claude directory exists before running installer
    const claudeDir = path.join(projectDir, '.claude');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    const result = execSync(`node ${installerPath}`, {
      cwd: projectDir,
      encoding: 'utf8',
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
  installQuestmaestro(projectDir: string) {
    return this.runNpxInstall(projectDir);
  }

  /**
   * Recursively copy directory
   */
  private copyDirectorySync(source: string, target: string) {
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
  cleanup(projectDir: string) {
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
