import * as path from 'path';
import * as readline from 'readline';
import type { ConfigManager } from './config-manager';
import type { FileSystem } from './file-system';
import type { Logger } from '../utils/logger';
import { AgentSpawner } from '../agents/agent-spawner';

/**
 * Manages project discovery phase for Questmaestro
 * Handles initial project analysis using Voidpoker agents
 */
export class DiscoveryManager {
  private agentSpawner: AgentSpawner;

  constructor(
    private configManager: ConfigManager,
    private fileSystem: FileSystem,
    private logger: Logger,
  ) {
    this.agentSpawner = new AgentSpawner();
  }

  /**
   * Run project discovery if not already complete
   */
  async runProjectDiscovery(): Promise<void> {
    const config = this.configManager.loadConfig();

    if (!config.discoveryComplete) {
      await this.performDiscovery();
    }
  }

  private async performDiscovery(): Promise<void> {
    this.logger.bright('🔍 PROJECT DISCOVERY REQUIRED 🔍\n');

    // Get user input for standards
    const standards = await this.getUserInput(
      'Any specific directories with standards? (or "none"): ',
    );

    // Find all package.json files
    const packages = this.fileSystem.findPackageJsons();

    if (packages.length === 0) {
      throw new Error('No package.json files found in project');
    }

    this.logger.info(`Found ${packages.length} package(s) to analyze\n`);

    // Sequential Voidpoker spawning
    for (const pkg of packages) {
      await this.analyzePackage(pkg, standards);
    }

    // Update config
    const config = this.configManager.loadConfig();
    config.discoveryComplete = true;
    this.configManager.saveConfig(config);

    this.logger.success('\n✅ Project discovery complete!\n');
  }

  private async analyzePackage(
    pkg: { dir: string; packageJson: unknown },
    standards: string,
  ): Promise<void> {
    this.logger.info(`Analyzing: ${pkg.dir}`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const packageName = path.basename(pkg.dir);
    const reportPath = `questmaestro/discovery/voidpoker-${timestamp}-${packageName}-report.json`;

    await this.agentSpawner.spawnAndWait('voidpoker', {
      workingDirectory: pkg.dir,
      questFolder: 'discovery',
      reportNumber: timestamp,
      additionalContext: {
        discoveryType: 'Project Analysis',
        packageLocation: pkg.dir,
        userStandards: standards,
        reportPath: reportPath,
      },
    });
  }

  private async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }
}
