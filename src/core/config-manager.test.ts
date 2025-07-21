import * as path from 'path';
import { ConfigManager, CONFIG_FILE_NAME } from './config-manager';
import { FileSystem } from './file-system';
import { QuestmaestroConfig, DEFAULT_CONFIG } from '../models/config';

// Mock FileSystem
jest.mock('./file-system');

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockFileSystem: jest.Mocked<Pick<FileSystem, 'readJson' | 'writeJson' | 'fileExists'>>;

  beforeEach(() => {
    // Create a mock FileSystem with only the methods used by ConfigManager
    mockFileSystem = {
      readJson: jest.fn(),
      writeJson: jest.fn(),
      fileExists: jest.fn(),
    };

    configManager = new ConfigManager(mockFileSystem as unknown as FileSystem);

    // Clear any caches
    configManager.clearCache();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load valid configuration from file', () => {
      const mockConfig: QuestmaestroConfig = {
        questFolder: 'custom-quests',
        discoveryComplete: true,
        wardCommands: {
          all: 'npm run validate',
        },
      };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: mockConfig,
      });

      const config = configManager.loadConfig('/test/dir');

      expect(config).toStrictEqual({
        ...mockConfig,
        project: undefined,
      });
      expect(mockFileSystem.readJson).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
      );
    });

    it("should return default config when file doesn't exist", () => {
      mockFileSystem.readJson.mockReturnValue({
        success: false,
        error: 'File not found',
      });

      const config = configManager.loadConfig('/test/dir');

      expect(config).toStrictEqual(DEFAULT_CONFIG);
    });

    it('should return default config for invalid configuration', () => {
      const invalidConfig = {
        questFolder: 123, // Should be string
        discoveryComplete: 'yes', // Should be boolean
      };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: invalidConfig,
      });

      const config = configManager.loadConfig('/test/dir');

      expect(config).toStrictEqual(DEFAULT_CONFIG);
    });

    it('should use cached config on subsequent calls', () => {
      const mockConfig: QuestmaestroConfig = {
        questFolder: 'cached-quests',
        discoveryComplete: false,
      };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: mockConfig,
      });

      // First call
      const config1 = configManager.loadConfig('/test/dir');
      // Second call
      const config2 = configManager.loadConfig('/test/dir');

      expect(config1).toBe(config2); // Same reference
      expect(mockFileSystem.readJson).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should merge partial config with defaults', () => {
      const partialConfig: Partial<QuestmaestroConfig> = {
        discoveryComplete: true,
        // questFolder not specified
      };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: partialConfig,
      });

      const config = configManager.loadConfig('/test/dir');

      expect(config).toStrictEqual({
        questFolder: DEFAULT_CONFIG.questFolder, // From defaults
        discoveryComplete: true, // From file
        wardCommands: undefined,
        project: undefined,
      });
    });
  });

  describe('saveConfig', () => {
    it('should save valid configuration', () => {
      const config: QuestmaestroConfig = {
        questFolder: 'my-quests',
        discoveryComplete: true,
      };

      mockFileSystem.writeJson.mockReturnValue({ success: true });

      const result = configManager.saveConfig(config, '/test/dir');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
        config,
      );
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        questFolder: 123, // Invalid type
        discoveryComplete: true,
      } as unknown as QuestmaestroConfig;

      const result = configManager.saveConfig(invalidConfig, '/test/dir');

      expect(result).toBe(false);
      expect(mockFileSystem.writeJson).not.toHaveBeenCalled();
    });

    it('should handle write errors', () => {
      const config: QuestmaestroConfig = DEFAULT_CONFIG;

      mockFileSystem.writeJson.mockReturnValue({
        success: false,
        error: 'Permission denied',
      });

      const result = configManager.saveConfig(config, '/test/dir');

      expect(result).toBe(false);
    });

    it('should update cache after successful save', () => {
      const config: QuestmaestroConfig = {
        questFolder: 'updated-quests',
        discoveryComplete: false,
      };

      mockFileSystem.writeJson.mockReturnValue({ success: true });

      configManager.saveConfig(config, '/test/dir');

      // Load should return cached version without reading file
      mockFileSystem.readJson.mockClear();
      const loadedConfig = configManager.loadConfig('/test/dir');

      expect(loadedConfig).toStrictEqual(config);
      expect(mockFileSystem.readJson).not.toHaveBeenCalled();
    });
  });

  describe('initializeConfig', () => {
    it('should create new config file with defaults', () => {
      mockFileSystem.fileExists.mockReturnValue(false);
      mockFileSystem.writeJson.mockReturnValue({ success: true });

      const result = configManager.initializeConfig('/test/dir');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
        DEFAULT_CONFIG,
      );
    });

    it('should create config with custom options', () => {
      mockFileSystem.fileExists.mockReturnValue(false);
      mockFileSystem.writeJson.mockReturnValue({ success: true });

      const options: Partial<QuestmaestroConfig> = {
        wardCommands: {
          all: 'npm run check',
        },
      };

      const result = configManager.initializeConfig('/test/dir', options);

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
        {
          ...DEFAULT_CONFIG,
          ...options,
        },
      );
    });

    it('should not overwrite existing config', () => {
      mockFileSystem.fileExists.mockReturnValue(true);

      const result = configManager.initializeConfig('/test/dir');

      expect(result).toBe(false);
      expect(mockFileSystem.writeJson).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update existing configuration', () => {
      const existingConfig: QuestmaestroConfig = {
        questFolder: 'quests',
        discoveryComplete: false,
      };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: existingConfig,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });

      const updates = { discoveryComplete: true };
      const result = configManager.updateConfig(updates, '/test/dir');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
        {
          ...existingConfig,
          ...updates,
        },
      );
    });
  });

  describe('markDiscoveryComplete', () => {
    it('should set discoveryComplete to true', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: DEFAULT_CONFIG,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });

      const result = configManager.markDiscoveryComplete('/test/dir');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
        expect.objectContaining({
          discoveryComplete: true,
        }),
      );
    });
  });

  describe('getWardCommands', () => {
    it('should return ward commands from config', () => {
      const wardCommands = {
        all: 'npm run validate',
        lint: 'npm run lint',
      };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: {
          ...DEFAULT_CONFIG,
          wardCommands,
        },
      });

      const result = configManager.getWardCommands('/test/dir');

      expect(result).toStrictEqual(wardCommands);
    });

    it('should return empty object when no ward commands', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: DEFAULT_CONFIG,
      });

      const result = configManager.getWardCommands('/test/dir');

      expect(result).toStrictEqual({});
    });
  });

  describe('setWardCommands', () => {
    it('should update ward commands', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: DEFAULT_CONFIG,
      });
      mockFileSystem.writeJson.mockReturnValue({ success: true });

      const commands = {
        all: 'npm run check',
        lint: 'eslint .',
        typecheck: 'tsc --noEmit',
      };

      const result = configManager.setWardCommands(commands, '/test/dir');

      expect(result).toBe(true);
      expect(mockFileSystem.writeJson).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
        expect.objectContaining({
          wardCommands: commands,
        }),
      );
    });
  });

  describe('getProjectConfig', () => {
    it('should return project config when present', () => {
      const projectConfig = {
        name: 'my-project',
        type: 'web' as const,
        technologies: ['react', 'typescript'],
      };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: {
          ...DEFAULT_CONFIG,
          project: projectConfig,
        },
      });

      const result = configManager.getProjectConfig('/test/dir');

      expect(result).toStrictEqual(projectConfig);
    });

    it('should return undefined when no project config', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: DEFAULT_CONFIG,
      });

      const result = configManager.getProjectConfig('/test/dir');

      expect(result).toBeUndefined();
    });
  });

  describe('configExists', () => {
    it('should return true when config file exists', () => {
      mockFileSystem.fileExists.mockReturnValue(true);

      const result = configManager.configExists('/test/dir');

      expect(result).toBe(true);
      expect(mockFileSystem.fileExists).toHaveBeenCalledWith(
        path.join('/test/dir', CONFIG_FILE_NAME),
      );
    });

    it("should return false when config file doesn't exist", () => {
      mockFileSystem.fileExists.mockReturnValue(false);

      const result = configManager.configExists('/test/dir');

      expect(result).toBe(false);
    });
  });

  describe('findNearestConfig', () => {
    it('should find config in current directory', () => {
      const mockConfig = { ...DEFAULT_CONFIG, questFolder: 'found' };

      mockFileSystem.fileExists.mockReturnValueOnce(true);
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: mockConfig,
      });

      const result = configManager.findNearestConfig('/test/dir/sub');

      expect(result).toStrictEqual({
        directory: path.resolve('/test/dir/sub'),
        config: {
          ...mockConfig,
          wardCommands: undefined,
          project: undefined,
        },
      });
    });

    it('should find config in parent directory', () => {
      const mockConfig = { ...DEFAULT_CONFIG, questFolder: 'parent' };

      // First call - current dir doesn't have config
      mockFileSystem.fileExists.mockReturnValueOnce(false);
      // Second call - parent dir has config
      mockFileSystem.fileExists.mockReturnValueOnce(true);

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: mockConfig,
      });

      const result = configManager.findNearestConfig('/test/dir/sub');

      expect(result).toStrictEqual({
        directory: path.resolve('/test/dir'),
        config: {
          ...mockConfig,
          wardCommands: undefined,
          project: undefined,
        },
      });
    });

    it('should return null when no config found', () => {
      mockFileSystem.fileExists.mockReturnValue(false);

      const result = configManager.findNearestConfig('/test/dir/sub');

      expect(result).toBeNull();
    });
  });

  describe('getEffectiveWardCommand', () => {
    it('should return "all" command when available', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: {
          ...DEFAULT_CONFIG,
          wardCommands: {
            all: 'npm run validate',
            lint: 'npm run lint',
            typecheck: 'npm run typecheck',
          },
        },
      });

      const result = configManager.getEffectiveWardCommand('/test/dir');

      expect(result).toBe('npm run validate');
    });

    it('should construct command from individual commands', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: {
          ...DEFAULT_CONFIG,
          wardCommands: {
            lint: 'npm run lint',
            typecheck: 'npm run typecheck',
            test: 'npm test',
          },
        },
      });

      const result = configManager.getEffectiveWardCommand('/test/dir');

      expect(result).toBe('npm run lint && npm run typecheck && npm test');
    });

    it('should return null when no ward commands defined', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: DEFAULT_CONFIG,
      });

      const result = configManager.getEffectiveWardCommand('/test/dir');

      expect(result).toBeNull();
    });

    it('should skip undefined commands when constructing', () => {
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: {
          ...DEFAULT_CONFIG,
          wardCommands: {
            lint: 'npm run lint',
            typecheck: undefined,
            test: 'npm test',
          },
        },
      });

      const result = configManager.getEffectiveWardCommand('/test/dir');

      expect(result).toBe('npm run lint && npm test');
    });
  });

  describe('clearCache', () => {
    it('should clear cached configurations', () => {
      const mockConfig = { ...DEFAULT_CONFIG, questFolder: 'cached' };

      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: mockConfig,
      });

      // Load config to cache it
      configManager.loadConfig('/test/dir');

      // Clear cache
      configManager.clearCache();

      // Modify mock response
      mockFileSystem.readJson.mockReturnValue({
        success: true,
        data: { ...DEFAULT_CONFIG, questFolder: 'new' },
      });

      // Load again - should read from file
      const config = configManager.loadConfig('/test/dir');

      expect(config.questFolder).toBe('new');
      expect(mockFileSystem.readJson).toHaveBeenCalledTimes(2);
    });
  });
});
