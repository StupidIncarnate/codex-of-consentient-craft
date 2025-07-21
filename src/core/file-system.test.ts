import * as path from 'path';
import * as fs from 'fs';
import { FileSystem } from './file-system';

// Mock fs module
jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    mkdirSync: jest.fn(),
    statSync: jest.fn(),
    readdirSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    renameSync: jest.fn(),
    rmSync: jest.fn(),
  };
});

// Get mocked functions
const mockFs = jest.mocked(fs);

// Helper to create mock Stats object
function createMockStats(options: { isDirectory: boolean }): fs.Stats {
  return {
    isDirectory: () => options.isDirectory,
    isFile: () => !options.isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    dev: 0,
    ino: 0,
    mode: 0,
    nlink: 0,
    uid: 0,
    gid: 0,
    rdev: 0,
    size: 0,
    blksize: 0,
    blocks: 0,
    atimeMs: 0,
    mtimeMs: 0,
    ctimeMs: 0,
    birthtimeMs: 0,
    atime: new Date(),
    mtime: new Date(),
    ctime: new Date(),
    birthtime: new Date(),
  } as fs.Stats;
}

// Helper to create mock Dirent object
function createMockDirent(name: string, isDirectory: boolean): fs.Dirent<string> {
  return {
    name,
    isDirectory: () => isDirectory,
    isFile: () => !isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  } as fs.Dirent<string>;
}

describe('FileSystem', () => {
  let fileSystem: FileSystem;

  beforeEach(() => {
    fileSystem = new FileSystem('questmaestro');
    jest.clearAllMocks();
  });

  describe('getFolderStructure', () => {
    it('should return correct folder structure with default base path', () => {
      const structure = fileSystem.getFolderStructure();

      expect(structure.root).toBe(path.join(process.cwd(), 'questmaestro'));
      expect(structure.active).toBe(path.join(process.cwd(), 'questmaestro', 'active'));
      expect(structure.completed).toBe(path.join(process.cwd(), 'questmaestro', 'completed'));
      expect(structure.abandoned).toBe(path.join(process.cwd(), 'questmaestro', 'abandoned'));
      expect(structure.retros).toBe(path.join(process.cwd(), 'questmaestro', 'retros'));
      expect(structure.lore).toBe(path.join(process.cwd(), 'questmaestro', 'lore'));
      expect(structure.discovery).toBe(path.join(process.cwd(), 'questmaestro', 'discovery'));
    });

    it('should return correct folder structure with custom base path', () => {
      const basePath = '/custom/path';
      const structure = fileSystem.getFolderStructure(basePath);

      expect(structure.root).toBe(path.join(basePath, 'questmaestro'));
      expect(structure.active).toBe(path.join(basePath, 'questmaestro', 'active'));
    });

    it('should use custom quest folder name', () => {
      const customFs = new FileSystem('custom-quests');
      const structure = customFs.getFolderStructure();

      expect(structure.root).toBe(path.join(process.cwd(), 'custom-quests'));
      expect(structure.active).toBe(path.join(process.cwd(), 'custom-quests', 'active'));
    });
  });

  describe('initializeFolderStructure', () => {
    it('should create all required directories', () => {
      mockFs.mkdirSync.mockImplementation(() => undefined);

      const result = fileSystem.initializeFolderStructure();

      expect(result.success).toBe(true);
      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(7); // 7 directories

      const structure = fileSystem.getFolderStructure();
      Object.values(structure).forEach((folderPath) => {
        expect(mockFs.mkdirSync).toHaveBeenCalledWith(folderPath, {
          recursive: true,
        });
      });
    });

    it('should handle errors gracefully', () => {
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = fileSystem.initializeFolderStructure();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to initialize folder structure: Permission denied');
    });
  });

  describe('questExists', () => {
    it('should return true for existing quest directory', () => {
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));

      const exists = fileSystem.questExists('001-add-auth');

      expect(exists).toBe(true);
      expect(mockFs.statSync).toHaveBeenCalledWith(
        path.join(process.cwd(), 'questmaestro', 'active', '001-add-auth'),
      );
    });

    it('should return false for non-existent quest', () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const exists = fileSystem.questExists('001-add-auth');

      expect(exists).toBe(false);
    });

    it('should return false for files (not directories)', () => {
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: false }));

      const exists = fileSystem.questExists('001-add-auth');

      expect(exists).toBe(false);
    });
  });

  describe('createQuestFolder', () => {
    it('should create quest folder successfully', () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('ENOENT');
      }); // Quest doesn't exist
      mockFs.mkdirSync.mockImplementation(() => undefined);

      const result = fileSystem.createQuestFolder('001-add-auth');

      expect(result.success).toBe(true);
      expect(result.data).toBe(path.join(process.cwd(), 'questmaestro', 'active', '001-add-auth'));
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.join(process.cwd(), 'questmaestro', 'active', '001-add-auth'),
        { recursive: true },
      );
    });

    it('should fail if quest already exists', () => {
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));

      const result = fileSystem.createQuestFolder('001-add-auth');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quest folder 001-add-auth already exists');
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should handle creation errors', () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = fileSystem.createQuestFolder('001-add-auth');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create quest folder: Permission denied');
    });
  });

  describe('readJson', () => {
    it('should read and parse JSON file successfully', () => {
      const testData = { name: 'test', value: 123 };
      mockFs.readFileSync.mockReturnValue(JSON.stringify(testData));

      const result = fileSystem.readJson<typeof testData>('/path/to/file.json');

      expect(result.success).toBe(true);
      expect(result.data).toStrictEqual(testData);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/file.json', 'utf-8');
    });

    it('should handle file read errors', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = fileSystem.readJson('/path/to/file.json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read JSON file: File not found');
    });

    it('should handle JSON parse errors', () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      const result = fileSystem.readJson('/path/to/file.json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read JSON file');
    });
  });

  describe('writeJson', () => {
    it('should write JSON file with pretty formatting', () => {
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);
      const testData = { name: 'test', value: 123 };

      const result = fileSystem.writeJson('/path/to/file.json', testData);

      expect(result.success).toBe(true);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/path/to', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/path/to/file.json',
        JSON.stringify(testData, null, 2),
        'utf-8',
      );
    });

    it('should write JSON file without pretty formatting', () => {
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);
      const testData = { name: 'test', value: 123 };

      const result = fileSystem.writeJson('/path/to/file.json', testData, false);

      expect(result.success).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/path/to/file.json',
        JSON.stringify(testData),
        'utf-8',
      );
    });

    it('should handle write errors', () => {
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = fileSystem.writeJson('/path/to/file.json', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to write JSON file: Disk full');
    });
  });

  describe('moveQuest', () => {
    it('should move quest folder successfully', () => {
      mockFs.existsSync.mockReturnValueOnce(true); // Source exists
      mockFs.existsSync.mockReturnValueOnce(false); // Destination doesn't exist
      mockFs.renameSync.mockImplementation(() => undefined);

      const result = fileSystem.moveQuest('001-add-auth', 'active', 'completed');

      expect(result.success).toBe(true);
      expect(result.data).toBe(
        path.join(process.cwd(), 'questmaestro', 'completed', '001-add-auth'),
      );
      expect(mockFs.renameSync).toHaveBeenCalledWith(
        path.join(process.cwd(), 'questmaestro', 'active', '001-add-auth'),
        path.join(process.cwd(), 'questmaestro', 'completed', '001-add-auth'),
      );
    });

    it("should fail if source doesn't exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = fileSystem.moveQuest('001-add-auth', 'active', 'completed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quest folder 001-add-auth not found in active');
      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });

    it('should fail if destination already exists', () => {
      mockFs.existsSync.mockReturnValueOnce(true); // Source exists
      mockFs.existsSync.mockReturnValueOnce(true); // Destination exists

      const result = fileSystem.moveQuest('001-add-auth', 'active', 'completed');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quest folder 001-add-auth already exists in completed');
      expect(mockFs.renameSync).not.toHaveBeenCalled();
    });
  });

  describe('listQuests', () => {
    it('should list quest folders successfully', () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        createMockDirent('001-add-auth', true),
        createMockDirent('readme.txt', false),
        createMockDirent('002-fix-bug', true),
      ]);

      const result = fileSystem.listQuests('active');

      expect(result.success).toBe(true);
      expect(result.data).toStrictEqual(['001-add-auth', '002-fix-bug']);
    });

    it("should return empty array if directory doesn't exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = fileSystem.listQuests('active');

      expect(result.success).toBe(true);
      expect(result.data).toStrictEqual([]);
    });

    it('should handle read errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = fileSystem.listQuests('active');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to list quests: Permission denied');
    });
  });

  describe('getNextQuestNumber', () => {
    it('should return 001 when no quests exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = fileSystem.getNextQuestNumber();

      expect(result.success).toBe(true);
      expect(result.data).toBe('001');
    });

    it('should return next number based on existing quests', () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        createMockDirent('001-add-auth', true),
        createMockDirent('003-add-feature', true),
        createMockDirent('002-fix-bug', true),
      ]);

      const result = fileSystem.getNextQuestNumber();

      expect(result.success).toBe(true);
      expect(result.data).toBe('004');
    });

    it('should handle non-standard folder names', () => {
      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValue([
        createMockDirent('001-add-auth', true),
        createMockDirent('manual-quest', true),
        createMockDirent('002-fix-bug', true),
      ]);

      const result = fileSystem.getNextQuestNumber();

      expect(result.success).toBe(true);
      expect(result.data).toBe('003');
    });
  });

  describe('findQuest', () => {
    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
    });

    it('should find quest by exact folder name', () => {
      (mockFs.readdirSync as jest.Mock).mockReturnValueOnce([
        createMockDirent('001-add-auth', true),
        createMockDirent('002-fix-bug', true),
      ]);

      const result = fileSystem.findQuest('001-add-auth');

      expect(result.success).toBe(true);
      expect(result.data).toStrictEqual({ folder: '001-add-auth', state: 'active' });
    });

    it('should find quest by name without number', () => {
      (mockFs.readdirSync as jest.Mock).mockReturnValueOnce([
        createMockDirent('001-add-auth', true),
        createMockDirent('002-fix-bug', true),
      ]);

      const result = fileSystem.findQuest('add-auth');

      expect(result.success).toBe(true);
      expect(result.data).toStrictEqual({ folder: '001-add-auth', state: 'active' });
    });

    it('should find quest by partial match', () => {
      (mockFs.readdirSync as jest.Mock).mockReturnValueOnce([
        createMockDirent('001-add-authentication', true),
        createMockDirent('002-fix-bug', true),
      ]);

      const result = fileSystem.findQuest('auth');

      expect(result.success).toBe(true);
      expect(result.data).toStrictEqual({ folder: '001-add-authentication', state: 'active' });
    });

    it('should search in all states', () => {
      // Active - no match
      (mockFs.readdirSync as jest.Mock).mockReturnValueOnce([
        createMockDirent('001-add-auth', true),
      ]);

      // Completed - has match
      (mockFs.readdirSync as jest.Mock).mockReturnValueOnce([
        createMockDirent('002-fix-bug', true),
      ]);

      const result = fileSystem.findQuest('fix-bug');

      expect(result.success).toBe(true);
      expect(result.data).toStrictEqual({ folder: '002-fix-bug', state: 'completed' });
    });

    it('should return error when quest not found', () => {
      (mockFs.readdirSync as jest.Mock).mockReturnValue([]);

      const result = fileSystem.findQuest('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quest "non-existent" not found');
    });
  });

  describe('readFile', () => {
    it('should read file content successfully', () => {
      mockFs.readFileSync.mockReturnValue('file content');

      const result = fileSystem.readFile('/path/to/file.txt');

      expect(result.success).toBe(true);
      expect(result.data).toBe('file content');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/file.txt', 'utf-8');
    });

    it('should handle read errors', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = fileSystem.readFile('/path/to/file.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to read file: File not found');
    });
  });

  describe('writeFile', () => {
    it('should write file content successfully', () => {
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const result = fileSystem.writeFile('/path/to/file.txt', 'content');

      expect(result.success).toBe(true);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/path/to', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/path/to/file.txt', 'content', 'utf-8');
    });

    it('should handle write errors', () => {
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      const result = fileSystem.writeFile('/path/to/file.txt', 'content');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to write file: Disk full');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', () => {
      mockFs.existsSync.mockReturnValue(true);

      const exists = fileSystem.fileExists('/path/to/file.txt');

      expect(exists).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('should return false for non-existent file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const exists = fileSystem.fileExists('/path/to/file.txt');

      expect(exists).toBe(false);
    });
  });

  describe('directoryExists', () => {
    it('should return true for existing directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));

      const exists = fileSystem.directoryExists('/path/to/dir');

      expect(exists).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/dir');
      expect(mockFs.statSync).toHaveBeenCalledWith('/path/to/dir');
    });

    it('should return false for non-existent path', () => {
      mockFs.existsSync.mockReturnValue(false);

      const exists = fileSystem.directoryExists('/path/to/dir');

      expect(exists).toBe(false);
      expect(mockFs.statSync).not.toHaveBeenCalled();
    });

    it('should return false for file (not directory)', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: false }));

      const exists = fileSystem.directoryExists('/path/to/file.txt');

      expect(exists).toBe(false);
    });

    it('should return false on stat error', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const exists = fileSystem.directoryExists('/path/to/dir');

      expect(exists).toBe(false);
    });
  });

  describe('listFiles', () => {
    it('should return list of files in directory', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValueOnce(createMockStats({ isDirectory: true }));
      (mockFs.readdirSync as jest.Mock).mockReturnValue(['file1.txt', 'file2.js', 'subdir']);

      // Mock stat calls for each item
      mockFs.statSync
        .mockReturnValueOnce(createMockStats({ isDirectory: false })) // file1.txt
        .mockReturnValueOnce(createMockStats({ isDirectory: false })) // file2.js
        .mockReturnValueOnce(createMockStats({ isDirectory: true })); // subdir

      const files = fileSystem.listFiles('/path/to/dir');

      expect(files).toStrictEqual(['file1.txt', 'file2.js']);
      expect(files).not.toContain('subdir');
    });

    it('should return empty array for non-existent directory', () => {
      mockFs.existsSync.mockReturnValue(false);

      const files = fileSystem.listFiles('/path/to/dir');

      expect(files).toStrictEqual([]);
      expect(mockFs.readdirSync).not.toHaveBeenCalled();
    });

    it('should return empty array on read error', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const files = fileSystem.listFiles('/path/to/dir');

      expect(files).toStrictEqual([]);
    });
  });

  describe('cleanOldQuests', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-01'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clean old completed and abandoned quests', () => {
      const fileSystem = new FileSystem();

      // Mock directory exists
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));

      // Mock directory listings
      (mockFs.readdirSync as jest.Mock)
        .mockReturnValueOnce(['001-old-quest', '002-recent-quest']) // completed
        .mockReturnValueOnce(['003-old-abandoned', '004-recent-abandoned']); // abandoned

      // Mock quest.json reads
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify({ completedAt: '2024-01-01' })) // old completed
        .mockReturnValueOnce(JSON.stringify({ completedAt: '2024-01-20' })) // recent completed
        .mockReturnValueOnce(JSON.stringify({ updatedAt: '2023-12-01' })) // old abandoned
        .mockReturnValueOnce(JSON.stringify({ updatedAt: '2024-01-25' })); // recent abandoned

      // Clear previous rmSync calls
      mockFs.rmSync.mockClear();

      const result = fileSystem.cleanOldQuests();

      expect(result).toStrictEqual({ completed: 1, abandoned: 1 });
      expect(mockFs.rmSync).toHaveBeenCalledTimes(2);
      expect(mockFs.rmSync).toHaveBeenCalledWith(expect.stringContaining('001-old-quest'), {
        recursive: true,
      });
      expect(mockFs.rmSync).toHaveBeenCalledWith(expect.stringContaining('003-old-abandoned'), {
        recursive: true,
      });
    });

    it('should handle missing directories gracefully', () => {
      const fileSystem = new FileSystem();

      mockFs.existsSync.mockReturnValue(false);

      const result = fileSystem.cleanOldQuests();

      expect(result).toStrictEqual({ completed: 0, abandoned: 0 });
      expect(mockFs.readdirSync).not.toHaveBeenCalled();
    });

    it('should skip quests with parse errors', () => {
      const fileSystem = new FileSystem();

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));
      (mockFs.readdirSync as jest.Mock)
        .mockReturnValueOnce(['001-corrupt-quest']) // completed
        .mockReturnValueOnce([]); // abandoned
      mockFs.readFileSync.mockReturnValueOnce('invalid json');

      // Clear previous rmSync calls
      mockFs.rmSync.mockClear();

      const result = fileSystem.cleanOldQuests();

      expect(result).toStrictEqual({ completed: 0, abandoned: 0 });
      expect(mockFs.rmSync).not.toHaveBeenCalled();
    });
  });

  describe('findPackageJsons', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
      jest.resetAllMocks();
    });

    it('should find package.json files recursively', () => {
      const fileSystem = new FileSystem();

      // Set up directory structure mocks
      mockFs.existsSync.mockImplementation((path) => {
        const pathStr = String(path);
        return pathStr.includes('package.json') || !pathStr.includes('.');
      });

      (mockFs.readdirSync as jest.Mock)
        .mockReturnValueOnce(['src', 'package.json', 'node_modules']) // root
        .mockReturnValueOnce(['lib', 'package.json']) // src
        .mockReturnValueOnce([]); // src/lib

      mockFs.statSync.mockImplementation((path) => {
        const pathStr = String(path);
        if (pathStr.includes('package.json')) {
          return createMockStats({ isDirectory: false });
        }
        return createMockStats({ isDirectory: true });
      });

      mockFs.readFileSync
        .mockReturnValueOnce('{"name": "root-package"}')
        .mockReturnValueOnce('{"name": "src-package"}');

      const results = fileSystem.findPackageJsons('/test/project');

      expect(results).toHaveLength(2);
      expect(results[0]).toStrictEqual({
        dir: '/test/project',
        packageJson: { name: 'root-package' },
      });
      expect(results[1]).toStrictEqual({
        dir: path.join('/test/project', 'src'),
        packageJson: { name: 'src-package' },
      });
    });

    it('should skip node_modules and hidden directories', () => {
      const fileSystem = new FileSystem();

      mockFs.existsSync.mockReturnValue(true);
      (mockFs.readdirSync as jest.Mock).mockReturnValueOnce([
        'src',
        'node_modules',
        '.git',
        'dist',
        'build',
      ]);

      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));

      const results = fileSystem.findPackageJsons('/test/project');

      expect(results).toStrictEqual([]);
      // Should only check src directory, not the others
      expect(mockFs.readdirSync).toHaveBeenCalledTimes(2); // root + src
    });

    it('should handle max depth limit', () => {
      const fileSystem = new FileSystem();

      // Create a deep directory structure
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: true }));

      // Mock 7 levels deep
      for (let i = 0; i < 7; i++) {
        (mockFs.readdirSync as jest.Mock).mockReturnValueOnce([`level${i + 1}`]);
      }

      const results = fileSystem.findPackageJsons('/test/project');

      expect(results).toStrictEqual([]);
      // Should stop at depth 5 (6 calls: root + 5 levels)
      expect(mockFs.readdirSync).toHaveBeenCalledTimes(6);
    });

    it('should handle read errors gracefully', () => {
      const fileSystem = new FileSystem();

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const results = fileSystem.findPackageJsons('/test/project');

      expect(results).toStrictEqual([]);
    });

    it('should skip invalid package.json files', () => {
      const fileSystem = new FileSystem();

      mockFs.existsSync.mockImplementation((path) => String(path).includes('package.json'));
      (mockFs.readdirSync as jest.Mock).mockReturnValueOnce(['package.json']);
      mockFs.statSync.mockReturnValue(createMockStats({ isDirectory: false }));
      mockFs.readFileSync.mockReturnValueOnce('invalid json');

      const results = fileSystem.findPackageJsons('/test/project');

      expect(results).toStrictEqual([]);
    });
  });
});
