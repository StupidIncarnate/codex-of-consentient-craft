/**
 * Configuration management for Questmaestro
 * Handles loading, validation, and saving of .questmaestro config files
 */

import * as path from 'path';
import { FileSystem } from './file-system';
import {
  QuestmaestroConfig,
  DEFAULT_CONFIG,
  isValidConfig,
  WardCommands,
  ProjectConfig,
} from '../models/config';

/**
 * Configuration file name
 */
export const CONFIG_FILE_NAME = '.questmaestro';

/**
 * ConfigManager class for managing Questmaestro configuration
 */
export class ConfigManager {
  private fileSystem: FileSystem;
  private configCache: Map<string, QuestmaestroConfig> = new Map();

  constructor(fileSystem: FileSystem) {
    this.fileSystem = fileSystem;
  }

  /**
   * Load configuration from a directory
   */
  loadConfig(directory: string = process.cwd()): QuestmaestroConfig {
    // Check cache first
    if (this.configCache.has(directory)) {
      return this.configCache.get(directory)!;
    }

    const configPath = path.join(directory, CONFIG_FILE_NAME);

    // Try to read config file
    const result = this.fileSystem.readJson<QuestmaestroConfig>(configPath);

    if (result.success && result.data) {
      // Validate config
      if (!isValidConfig(result.data)) {
        // Invalid configuration found, using defaults
        return this.getDefaultConfig();
      }

      // Merge with defaults
      const config = this.mergeWithDefaults(result.data);
      this.configCache.set(directory, config);
      return config;
    }

    // Config file doesn't exist or couldn't be read
    return this.getDefaultConfig();
  }

  /**
   * Save configuration to a directory
   */
  saveConfig(config: QuestmaestroConfig, directory: string = process.cwd()): boolean {
    // Validate config before saving
    if (!isValidConfig(config)) {
      // Invalid configuration, cannot save
      return false;
    }

    const configPath = path.join(directory, CONFIG_FILE_NAME);
    const result = this.fileSystem.writeJson(configPath, config);

    if (result.success) {
      // Update cache
      this.configCache.set(directory, config);
      return true;
    }

    // Failed to save config: result.error contains details
    return false;
  }

  /**
   * Create initial configuration file
   */
  initializeConfig(
    directory: string = process.cwd(),
    options?: Partial<QuestmaestroConfig>,
  ): boolean {
    // Check if config already exists
    const configPath = path.join(directory, CONFIG_FILE_NAME);
    if (this.fileSystem.fileExists(configPath)) {
      // Configuration already exists at configPath
      return false;
    }

    // Create config with defaults and any provided options
    const config: QuestmaestroConfig = {
      ...DEFAULT_CONFIG,
      ...options,
    };

    return this.saveConfig(config, directory);
  }

  /**
   * Update specific configuration fields
   */
  updateConfig(updates: Partial<QuestmaestroConfig>, directory: string = process.cwd()): boolean {
    const currentConfig = this.loadConfig(directory);
    const newConfig = { ...currentConfig, ...updates };

    return this.saveConfig(newConfig, directory);
  }

  /**
   * Mark discovery as complete
   */
  markDiscoveryComplete(directory: string = process.cwd()): boolean {
    return this.updateConfig({ discoveryComplete: true }, directory);
  }

  /**
   * Get ward commands from config
   */
  getWardCommands(directory: string = process.cwd()): WardCommands {
    const config = this.loadConfig(directory);
    return config.wardCommands || {};
  }

  /**
   * Set ward commands
   */
  setWardCommands(commands: WardCommands, directory: string = process.cwd()): boolean {
    return this.updateConfig({ wardCommands: commands }, directory);
  }

  /**
   * Get project configuration
   */
  getProjectConfig(directory: string = process.cwd()): ProjectConfig | undefined {
    const config = this.loadConfig(directory);
    return config.project;
  }

  /**
   * Check if configuration exists
   */
  configExists(directory: string = process.cwd()): boolean {
    const configPath = path.join(directory, CONFIG_FILE_NAME);
    return this.fileSystem.fileExists(configPath);
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * Get the default configuration
   */
  private getDefaultConfig(): QuestmaestroConfig {
    return { ...DEFAULT_CONFIG } as QuestmaestroConfig;
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(userConfig: QuestmaestroConfig): QuestmaestroConfig {
    return {
      questFolder: userConfig.questFolder ?? DEFAULT_CONFIG.questFolder,
      discoveryComplete: userConfig.discoveryComplete ?? DEFAULT_CONFIG.discoveryComplete,
      wardCommands: userConfig.wardCommands,
      project: userConfig.project,
    };
  }

  /**
   * Find the nearest .questmaestro file by traversing up directories
   */
  findNearestConfig(
    startDirectory: string = process.cwd(),
  ): { directory: string; config: QuestmaestroConfig } | null {
    let currentDir = path.resolve(startDirectory);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      if (this.configExists(currentDir)) {
        const config = this.loadConfig(currentDir);
        return { directory: currentDir, config };
      }

      // Move up one directory
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // We've reached the root
        break;
      }
      currentDir = parentDir;
    }

    return null;
  }

  /**
   * Get effective ward command
   * Returns the 'all' command if available, otherwise tries to construct from individual commands
   */
  getEffectiveWardCommand(directory: string = process.cwd()): string | null {
    const wardCommands = this.getWardCommands(directory);

    // If 'all' command is defined, use it
    if (wardCommands.all) {
      return wardCommands.all;
    }

    // Otherwise, try to construct from individual commands
    const commands: string[] = [];

    if (wardCommands.lint) commands.push(wardCommands.lint);
    if (wardCommands.typecheck) commands.push(wardCommands.typecheck);
    if (wardCommands.test) commands.push(wardCommands.test);
    if (wardCommands.build) commands.push(wardCommands.build);

    if (commands.length === 0) {
      return null;
    }

    // Join commands with && to run them sequentially
    return commands.join(' && ');
  }
}
