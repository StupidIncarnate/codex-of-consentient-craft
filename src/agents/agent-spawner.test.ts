import * as fs from 'fs';
import { spawn } from 'child_process';
import { AgentSpawner } from './agent-spawner';
import type { AgentContext } from '../models/agent';
import { Logger } from '../utils/logger';

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('../utils/logger');

const mockFs = jest.mocked(fs);
const mockSpawn = jest.mocked(spawn);
const MockLogger = jest.mocked(Logger);

describe('AgentSpawner', () => {
  let agentSpawner: AgentSpawner;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      success: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
    MockLogger.mockImplementation(() => mockLogger);

    // Default fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('Agent markdown content with $ARGUMENTS');
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});

    // Mock spawn to prevent actual process spawning
    const mockProcess = {
      kill: jest.fn(),
      on: jest.fn(),
      pid: 1234,
      stdin: null,
      stdout: null,
      stderr: null,
      stdio: [null, null, null],
      killed: false,
      connected: false,
      exitCode: null,
      signalCode: null,
      spawnargs: [],
      spawnfile: '',
      send: jest.fn(),
      disconnect: jest.fn(),
      unref: jest.fn(),
      ref: jest.fn(),
      addListener: jest.fn(),
      emit: jest.fn(),
      once: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      listeners: jest.fn(),
      rawListeners: jest.fn(),
      listenerCount: jest.fn(),
      eventNames: jest.fn(),
      off: jest.fn(),
    } as unknown as ReturnType<typeof spawn>;
    mockSpawn.mockReturnValue(mockProcess);

    agentSpawner = new AgentSpawner();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('agent context formatting', () => {
    const baseContext: AgentContext = {
      userRequest: 'Add authentication',
      questFolder: '001-add-auth',
      reportNumber: '1',
      wardCommands: {},
      workingDirectory: '/test/project',
    };

    it('should read agent markdown file', () => {
      // Create a mock that captures the formatted context
      const capturedContext = { content: '' };
      mockFs.writeFileSync.mockImplementation(
        (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
          if (typeof path === 'string' && path.includes('.md')) {
            capturedContext.content = content as string;
          }
        },
      );

      // This will throw because spawn is not properly mocked, but we can catch it
      agentSpawner.spawnAndWait('pathseeker', baseContext).catch(() => {});

      // Verify agent file was read
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('pathseeker.md'),
        'utf8',
      );
    });

    it('should format pathseeker context with user request and working directory', () => {
      const capturedContext = { content: '' };
      mockFs.writeFileSync.mockImplementation(
        (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
          if (typeof path === 'string' && path.includes('.md')) {
            capturedContext.content = content as string;
          }
        },
      );

      const context = {
        ...baseContext,
        mode: 'creation' as const,
      };

      agentSpawner.spawnAndWait('pathseeker', context).catch(() => {});

      const expectedContent = `Agent markdown content with User request: Add authentication
Working directory: ${process.cwd()}
Quest folder: 001-add-auth
Report number: 1
Quest mode: creation`;
      expect(capturedContext.content).toBe(expectedContent);
    });

    it('should format pathseeker context with validation mode and existing tasks', () => {
      const capturedContext = { content: '' };
      mockFs.writeFileSync.mockImplementation(
        (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
          if (typeof path === 'string' && path.includes('.md')) {
            capturedContext.content = content as string;
          }
        },
      );

      const context = {
        ...baseContext,
        mode: 'validation' as const,
        additionalContext: {
          existingTasks: [
            { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Create auth service' },
          ],
        },
      };

      agentSpawner.spawnAndWait('pathseeker', context).catch(() => {});

      const expectedContent = `Agent markdown content with User request: Add authentication
Working directory: ${process.cwd()}
Quest folder: 001-add-auth
Report number: 1
Quest mode: validation

Existing tasks:
${JSON.stringify([{ id: '550e8400-e29b-41d4-a716-446655440001', name: 'Create auth service' }], null, 2)}`;
      expect(capturedContext.content).toBe(expectedContent);
    });

    it('should format codeweaver context', () => {
      const capturedContext = { content: '' };
      mockFs.writeFileSync.mockImplementation(
        (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
          if (typeof path === 'string' && path.includes('.md')) {
            capturedContext.content = content as string;
          }
        },
      );

      const context = {
        ...baseContext,
        additionalContext: {
          questTitle: 'Add Authentication',
          task: { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Create auth service' },
        },
      };

      agentSpawner.spawnAndWait('codeweaver', context).catch(() => {});

      const expectedContent = `Agent markdown content with Quest: Add Authentication
Quest folder: 001-add-auth
Report number: 1
Task: ${JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440002', name: 'Create auth service' }, null, 2)}
Ward commands: npm run ward:all`;
      expect(capturedContext.content).toBe(expectedContent);
    });

    it('should format siegemaster context', () => {
      const capturedContext = { content: '' };
      mockFs.writeFileSync.mockImplementation(
        (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
          if (typeof path === 'string' && path.includes('.md')) {
            capturedContext.content = content as string;
          }
        },
      );

      const context = {
        ...baseContext,
        additionalContext: {
          questTitle: 'Add Authentication',
          filesCreated: ['auth.service.ts', 'auth.controller.ts'],
          testFramework: 'jest',
        },
      };

      agentSpawner.spawnAndWait('siegemaster', context).catch(() => {});

      const expectedContent = `Agent markdown content with Quest: Add Authentication
Quest folder: 001-add-auth
Report number: 1
Files created: ${JSON.stringify(['auth.service.ts', 'auth.controller.ts'], null, 2)}
Test framework: jest`;
      expect(capturedContext.content).toBe(expectedContent);
    });

    it('should format spiritmender context', () => {
      const capturedContext = { content: '' };
      mockFs.writeFileSync.mockImplementation(
        (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
          if (typeof path === 'string' && path.includes('.md')) {
            capturedContext.content = content as string;
          }
        },
      );

      const context = {
        ...baseContext,
        additionalContext: {
          questTitle: 'Add Authentication',
          errors: 'TypeError: Cannot read property of undefined',
          attemptNumber: 2,
        },
      };

      agentSpawner.spawnAndWait('spiritmender', context).catch(() => {});

      const expectedContent = `Agent markdown content with Quest: Add Authentication
Quest folder: 001-add-auth
Report number: 1
Ward errors:
TypeError: Cannot read property of undefined
Attempt number: 2`;
      expect(capturedContext.content).toBe(expectedContent);
    });

    it('should format voidpoker context', () => {
      const capturedContext = { content: '' };
      mockFs.writeFileSync.mockImplementation(
        (path: fs.PathOrFileDescriptor, content: string | NodeJS.ArrayBufferView) => {
          if (typeof path === 'string' && path.includes('.md')) {
            capturedContext.content = content as string;
          }
        },
      );

      const context = {
        ...baseContext,
        additionalContext: {
          discoveryType: 'framework',
          packageLocation: '/path/to/package.json',
          userStandards: 'Use TypeScript',
          reportPath: '/path/to/report.json',
        },
      };

      agentSpawner.spawnAndWait('voidpoker', context).catch(() => {});

      const expectedContent = `Agent markdown content with Discovery type: framework
Package location: /path/to/package.json
User standards: Use TypeScript
Report path: /path/to/report.json`;
      expect(capturedContext.content).toBe(expectedContent);
    });

    it('should throw error for unknown agent type', async () => {
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        // Return false for unknown agent markdown
        if (typeof path === 'string' && path.includes('unknown-agent.md')) return false;
        return true;
      });

      await expect(agentSpawner.spawnAndWait('unknown-agent', baseContext)).rejects.toThrow(
        'Agent markdown not found',
      );
    });
  });

  describe('report path handling', () => {
    it('should use custom report path for voidpoker', () => {
      const context: AgentContext = {
        userRequest: 'Discover framework',
        questFolder: '001-discover',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test/project',
        additionalContext: {
          reportPath: '/custom/discovery/path/report.json',
        },
      };

      // Track which paths are checked for existence
      const checkedPaths: string[] = [];
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        if (typeof path === 'string') {
          checkedPaths.push(path);
          return path.includes('voidpoker.md');
        }
        return false;
      });

      // Start the spawn process
      agentSpawner.spawnAndWait('voidpoker', context).catch(() => {});

      // Allow microtasks to run
      jest.runAllTimers();

      // The custom report path should be checked
      expect(checkedPaths).toContain('/custom/discovery/path/report.json');
    });

    it('should use standard report path for non-voidpoker agents', () => {
      const context: AgentContext = {
        userRequest: 'Add authentication',
        questFolder: '001-add-auth',
        reportNumber: '2',
        wardCommands: {},
        workingDirectory: '/test/project',
      };

      const checkedPaths: string[] = [];
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        if (typeof path === 'string') {
          checkedPaths.push(path);
          return path.includes('pathseeker.md');
        }
        return false;
      });

      // Start the spawn process
      agentSpawner.spawnAndWait('pathseeker', context).catch(() => {});

      // Allow microtasks to run
      jest.runAllTimers();

      // Should check for report in questmaestro/active/questFolder
      const expectedPath = 'questmaestro/active/001-add-auth/002-pathseeker-report.json';
      expect(checkedPaths).toContain(expectedPath);
    });
  });

  describe('error handling', () => {
    it('should handle missing agent markdown file', async () => {
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        if (typeof path === 'string' && path.includes('.md')) return false;
        return true;
      });

      const context: AgentContext = {
        userRequest: 'Test',
        questFolder: '001-test',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test',
      };

      await expect(agentSpawner.spawnAndWait('pathseeker', context)).rejects.toThrow(
        'Agent markdown not found',
      );
    });

    it('should log warning for blocked agent', async () => {
      // Create a test that simulates a blocked agent by mocking the report file
      const context: AgentContext = {
        userRequest: 'Test',
        questFolder: '001-test',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test',
      };

      // Mock the report file to contain a blocked status
      let reportCheckCount = 0;
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        if (typeof path === 'string' && path.includes('-report.json')) {
          reportCheckCount++;
          // Return true after a few checks to simulate the report appearing
          return reportCheckCount > 2;
        }
        return true;
      });

      mockFs.readFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
        if (typeof path === 'string' && path.includes('-report.json')) {
          return JSON.stringify({
            agentType: 'pathseeker',
            status: 'blocked',
            blockReason: 'Insufficient context',
          });
        }
        return 'Agent markdown content with $ARGUMENTS';
      });

      const promise = agentSpawner.spawnAndWait('pathseeker', context);

      // Run timers to trigger the check
      jest.advanceTimersByTime(1500);

      // Wait for the promise to reject
      await expect(promise).rejects.toThrow('pathseeker is blocked: Insufficient context');

      expect(mockLogger.warn).toHaveBeenCalledWith('Agent blocked: Insufficient context');
    });

    it('should handle agent recovery when exit without report', async () => {
      const context: AgentContext = {
        userRequest: 'Test',
        questFolder: '001-test',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test',
      };

      // Set up mock process
      let exitCallback: ((code: number) => void) | undefined;
      const mockProcess = {
        kill: jest.fn(),
        on: jest.fn().mockImplementation((event: string, callback: unknown) => {
          if (event === 'exit') {
            exitCallback = callback as (code: number) => void;
          }
          return mockProcess;
        }),
        pid: 1234,
        stdin: null,
        stdout: null,
        stderr: null,
        stdio: [null, null, null],
        killed: false,
        connected: false,
        exitCode: null,
        signalCode: null,
        spawnargs: [],
        spawnfile: '',
        send: jest.fn(),
        disconnect: jest.fn(),
        unref: jest.fn(),
        ref: jest.fn(),
        addListener: jest.fn(),
        emit: jest.fn(),
        once: jest.fn(),
        prependListener: jest.fn(),
        prependOnceListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        setMaxListeners: jest.fn(),
        getMaxListeners: jest.fn(),
        listeners: jest.fn(),
        rawListeners: jest.fn(),
        listenerCount: jest.fn(),
        eventNames: jest.fn(),
        off: jest.fn(),
      } as unknown as ReturnType<typeof spawn>;
      mockSpawn.mockReturnValue(mockProcess);

      // Mock for the recovery spawn
      let recoveryReportCheckCount = 0;
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        if (typeof path === 'string' && path.includes('-report.json')) {
          // First call is for original spawn (no report)
          // After recovery spawn, report exists
          if (path.includes('002-')) {
            recoveryReportCheckCount++;
            return recoveryReportCheckCount > 1;
          }
          return false;
        }
        return true;
      });

      mockFs.readFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
        if (typeof path === 'string' && path.includes('002-pathseeker-report.json')) {
          return JSON.stringify({
            agentType: 'pathseeker',
            status: 'complete',
            report: {},
          });
        }
        return 'Agent markdown content with $ARGUMENTS';
      });

      const promise = agentSpawner.spawnAndWait('pathseeker', context);

      // Simulate process exit without report
      if (exitCallback) {
        exitCallback(0);
      }

      // Allow recovery to proceed
      jest.advanceTimersByTime(1000);

      const result = await promise;
      expect(result.status).toBe('complete');
      expect(mockLogger.info).toHaveBeenCalledWith('Attempting recovery for pathseeker...');
    });

    it('should handle recovery for codeweaver with special context', async () => {
      const context: AgentContext = {
        userRequest: 'Test',
        questFolder: '001-test',
        reportNumber: '1',
        wardCommands: {},
        workingDirectory: '/test',
      };

      // Set up mock process
      let exitCallback: ((code: number) => void) | undefined;
      const mockProcess = {
        kill: jest.fn(),
        on: jest.fn().mockImplementation((event: string, callback: unknown) => {
          if (event === 'exit') {
            exitCallback = callback as (code: number) => void;
          }
          return mockProcess;
        }),
        pid: 1234,
        stdin: null,
        stdout: null,
        stderr: null,
        stdio: [null, null, null],
        killed: false,
        connected: false,
        exitCode: null,
        signalCode: null,
        spawnargs: [],
        spawnfile: '',
        send: jest.fn(),
        disconnect: jest.fn(),
        unref: jest.fn(),
        ref: jest.fn(),
        addListener: jest.fn(),
        emit: jest.fn(),
        once: jest.fn(),
        prependListener: jest.fn(),
        prependOnceListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        setMaxListeners: jest.fn(),
        getMaxListeners: jest.fn(),
        listeners: jest.fn(),
        rawListeners: jest.fn(),
        listenerCount: jest.fn(),
        eventNames: jest.fn(),
        off: jest.fn(),
      } as unknown as ReturnType<typeof spawn>;
      mockSpawn.mockReturnValue(mockProcess);

      // Mock for the recovery spawn
      let recoveryReportCheckCount = 0;
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        if (typeof path === 'string' && path.includes('-report.json')) {
          if (path.includes('002-')) {
            recoveryReportCheckCount++;
            return recoveryReportCheckCount > 1;
          }
          return false;
        }
        return true;
      });

      mockFs.readFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
        if (typeof path === 'string' && path.includes('002-codeweaver-report.json')) {
          return JSON.stringify({
            agentType: 'codeweaver',
            status: 'complete',
            report: {},
          });
        }
        return 'Agent markdown content with $ARGUMENTS';
      });

      // Capture the recovery context
      let recoveryContext:
        | (AgentContext & { recoveryMode?: boolean; instruction?: string })
        | undefined;
      const originalSpawnAndWait = agentSpawner.spawnAndWait.bind(agentSpawner);
      jest.spyOn(agentSpawner, 'spawnAndWait').mockImplementation(async (agentType, ctx) => {
        if (ctx.reportNumber === '2') {
          recoveryContext = ctx as AgentContext & { recoveryMode?: boolean; instruction?: string };
        }
        return originalSpawnAndWait(agentType, ctx);
      });

      const promise = agentSpawner.spawnAndWait('codeweaver', context);

      // Simulate process exit without report
      if (exitCallback) {
        exitCallback(0);
      }

      // Allow recovery to proceed
      jest.advanceTimersByTime(1000);

      await promise;

      expect(recoveryContext).toBeDefined();
      expect(recoveryContext?.reportNumber).toBe('2');
      expect(recoveryContext?.recoveryMode).toBe(true);
      expect(recoveryContext?.instruction).toBe(
        'The previous agent exited unexpectedly. Continue the task.',
      );
    });
  });
});
