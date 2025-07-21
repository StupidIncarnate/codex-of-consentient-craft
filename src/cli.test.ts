import { detectCommand, detectTestFramework, getWardCommands } from './cli';
import * as fs from 'fs';

// Mock fs for testing
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('cli', () => {
  describe('detectCommand', () => {
    it('should detect list command', () => {
      const command = detectCommand('list');
      expect(command.type).toBe('list');
    });

    it('should detect abandon command', () => {
      const command = detectCommand('abandon');
      expect(command.type).toBe('abandon');
    });

    it('should detect start command with arguments', () => {
      const command = detectCommand('start 550e8400-e29b-41d4-a716-446655440000');
      expect(command.type).toBe('start');
      expect(command.args).toStrictEqual(['550e8400-e29b-41d4-a716-446655440000']);
    });

    it('should detect clean command', () => {
      const command = detectCommand('clean');
      expect(command.type).toBe('clean');
    });

    it('should default to create/resume for unknown commands', () => {
      const command = detectCommand('add authentication');
      expect(command.type).toBe('default');
      expect(command.args).toStrictEqual(['add authentication']);
    });

    it('should handle empty input', () => {
      const command = detectCommand('');
      expect(command.type).toBe('default');
      expect(command.args).toStrictEqual([]);
    });

    it('should handle mixed case commands', () => {
      const command = detectCommand('LIST');
      expect(command.type).toBe('list');
    });

    it('should handle commands with multiple arguments', () => {
      const command = detectCommand('start my awesome quest');
      expect(command.type).toBe('start');
      expect(command.args).toStrictEqual(['my', 'awesome', 'quest']);
    });
  });

  describe('detectTestFramework', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should detect jest framework', () => {
      const packageJson = JSON.stringify({
        dependencies: {},
        devDependencies: { jest: '^29.0.0' },
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const framework = detectTestFramework();
      expect(framework).toBe('jest');
    });

    it('should detect mocha framework', () => {
      const packageJson = JSON.stringify({
        dependencies: {},
        devDependencies: { mocha: '^10.0.0' },
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const framework = detectTestFramework();
      expect(framework).toBe('mocha');
    });

    it('should detect vitest framework', () => {
      const packageJson = JSON.stringify({
        dependencies: {},
        devDependencies: { vitest: '^1.0.0' },
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const framework = detectTestFramework();
      expect(framework).toBe('vitest');
    });

    it('should detect playwright framework', () => {
      const packageJson = JSON.stringify({
        dependencies: {},
        devDependencies: { playwright: '^1.0.0' },
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const framework = detectTestFramework();
      expect(framework).toBe('playwright');
    });

    it('should default to jest when no test framework found', () => {
      const packageJson = JSON.stringify({
        dependencies: {},
        devDependencies: {},
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const framework = detectTestFramework();
      expect(framework).toBe('jest');
    });

    it('should default to jest when package.json cannot be read', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const framework = detectTestFramework();
      expect(framework).toBe('jest');
    });

    it('should default to jest when package.json parsing fails', () => {
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const framework = detectTestFramework();
      expect(framework).toBe('jest');
    });
  });

  describe('getWardCommands', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should return ward:all script when available', () => {
      const packageJson = JSON.stringify({
        scripts: {
          'ward:all': 'npm run lint && npm run typecheck && npm run test:coverage',
        },
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const commands = getWardCommands();
      expect(commands).toBe('npm run lint && npm run typecheck && npm run test:coverage');
    });

    it('should return ward script when ward:all not available', () => {
      const packageJson = JSON.stringify({
        scripts: {
          ward: 'npm run lint && npm run test',
        },
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const commands = getWardCommands();
      expect(commands).toBe('npm run lint && npm run test');
    });

    it('should return default commands when no ward scripts available', () => {
      const packageJson = JSON.stringify({
        scripts: {
          build: 'tsc',
        },
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const commands = getWardCommands();
      expect(commands).toBe('npm run lint && npm run typecheck && npm run test');
    });

    it('should return default commands when package.json cannot be read', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const commands = getWardCommands();
      expect(commands).toBe('npm run lint && npm run typecheck && npm run test');
    });

    it('should return default commands when package.json parsing fails', () => {
      mockedFs.readFileSync.mockReturnValue('invalid json');

      const commands = getWardCommands();
      expect(commands).toBe('npm run lint && npm run typecheck && npm run test');
    });

    it('should return default commands when scripts property is missing', () => {
      const packageJson = JSON.stringify({
        dependencies: {},
      });
      mockedFs.readFileSync.mockReturnValue(packageJson);

      const commands = getWardCommands();
      expect(commands).toBe('npm run lint && npm run typecheck && npm run test');
    });
  });
});
