import * as fs from 'fs';
import { ReportParser } from './report-parser';
import type {
  PathseekerReport,
  CodeweaverReport,
  SiegemasterReport,
  LawbringerReport,
  SpiritmenderReport,
  VoidpokerReport,
} from '../models/agent';

jest.mock('fs');

const mockFs = jest.mocked(fs);

describe('ReportParser', () => {
  let parser: ReportParser;

  beforeEach(() => {
    jest.clearAllMocks();
    parser = new ReportParser();
  });

  describe('parseReport', () => {
    it('should parse a valid report', () => {
      const mockReport = {
        agentType: 'pathseeker',
        status: 'complete',
        report: { tasks: [] },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      const result = parser.parseReport('/path/to/report.json');

      expect(result).toStrictEqual(mockReport);
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/report.json', 'utf8');
    });

    it('should throw error if report file not found', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => parser.parseReport('/path/to/report.json')).toThrow(
        'Report file not found: /path/to/report.json',
      );
    });

    it('should throw error for invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      expect(() => parser.parseReport('/path/to/report.json')).toThrow();
    });

    it('should throw error for missing required fields', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ report: {} }));

      expect(() => parser.parseReport('/path/to/report.json')).toThrow(
        'Invalid report format: missing required fields',
      );
    });

    it('should validate both status and agentType are present', () => {
      mockFs.existsSync.mockReturnValue(true);

      // Missing status
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ agentType: 'pathseeker' }));
      expect(() => parser.parseReport('/path/to/report.json')).toThrow(
        'Invalid report format: missing required fields',
      );

      // Missing agentType
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ status: 'complete' }));
      expect(() => parser.parseReport('/path/to/report.json')).toThrow(
        'Invalid report format: missing required fields',
      );
    });
  });

  describe('parsePathseekerReport', () => {
    it('should parse a valid pathseeker report', () => {
      const mockReport: PathseekerReport = {
        agentType: 'pathseeker',
        status: 'complete',
        report: {
          tasks: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Create auth service',
              type: 'implementation',
              description: 'Create authentication service',
              dependencies: [],
              filesToCreate: ['auth.service.ts'],
              filesToEdit: [],
            },
          ],
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      const result = parser.parsePathseekerReport('/path/to/report.json');

      expect(result).toStrictEqual(mockReport);
    });

    it('should throw error for wrong agent type', () => {
      const mockReport = {
        agentType: 'codeweaver',
        status: 'complete',
        report: {},
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      expect(() => parser.parsePathseekerReport('/path/to/report.json')).toThrow(
        'Invalid report type: expected pathseeker',
      );
    });
  });

  describe('parseCodeweaverReport', () => {
    it('should parse a valid codeweaver report', () => {
      const mockReport: CodeweaverReport = {
        agentType: 'codeweaver',
        status: 'complete',
        report: {
          filesCreated: ['auth.service.ts'],
          filesModified: ['app.module.ts'],
          summary: 'Created authentication service',
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      const result = parser.parseCodeweaverReport('/path/to/report.json');

      expect(result).toStrictEqual(mockReport);
    });

    it('should throw error for wrong agent type', () => {
      const mockReport = {
        agentType: 'pathseeker',
        status: 'complete',
        report: {},
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      expect(() => parser.parseCodeweaverReport('/path/to/report.json')).toThrow(
        'Invalid report type: expected codeweaver',
      );
    });
  });

  describe('parseSiegemasterReport', () => {
    it('should parse a valid siegemaster report', () => {
      const mockReport: SiegemasterReport = {
        agentType: 'siegemaster',
        status: 'complete',
        report: {
          testsCreated: ['auth.service.spec.ts'],
          testGapsFound: [
            {
              file: 'user.service.ts',
              description: 'Missing error handling tests',
              priority: 'high',
            },
          ],
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      const result = parser.parseSiegemasterReport('/path/to/report.json');

      expect(result).toStrictEqual(mockReport);
    });

    it('should throw error for wrong agent type', () => {
      const mockReport = {
        agentType: 'lawbringer',
        status: 'complete',
        report: {},
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      expect(() => parser.parseSiegemasterReport('/path/to/report.json')).toThrow(
        'Invalid report type: expected siegemaster',
      );
    });
  });

  describe('parseLawbringerReport', () => {
    it('should parse a valid lawbringer report', () => {
      const mockReport: LawbringerReport = {
        agentType: 'lawbringer',
        status: 'complete',
        report: {
          filesReviewed: ['auth.service.ts'],
          issues: [],
          overallAssessment: 'approved',
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      const result = parser.parseLawbringerReport('/path/to/report.json');

      expect(result).toStrictEqual(mockReport);
    });

    it('should throw error for wrong agent type', () => {
      const mockReport = {
        agentType: 'spiritmender',
        status: 'complete',
        report: {},
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      expect(() => parser.parseLawbringerReport('/path/to/report.json')).toThrow(
        'Invalid report type: expected lawbringer',
      );
    });
  });

  describe('parseSpiritmenderReport', () => {
    it('should parse a valid spiritmender report', () => {
      const mockReport: SpiritmenderReport = {
        agentType: 'spiritmender',
        status: 'complete',
        report: {
          errorsFixed: [
            {
              file: 'auth.service.ts',
              errorType: 'typecheck',
              description: 'Missing return type',
              resolution: 'Added return type annotation',
            },
          ],
          filesModified: ['auth.service.ts'],
          attemptNumber: 1,
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      const result = parser.parseSpiritmenderReport('/path/to/report.json');

      expect(result).toStrictEqual(mockReport);
    });

    it('should throw error for wrong agent type', () => {
      const mockReport = {
        agentType: 'voidpoker',
        status: 'complete',
        report: {},
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      expect(() => parser.parseSpiritmenderReport('/path/to/report.json')).toThrow(
        'Invalid report type: expected spiritmender',
      );
    });
  });

  describe('parseVoidpokerReport', () => {
    it('should parse a valid voidpoker report', () => {
      const mockReport: VoidpokerReport = {
        agentType: 'voidpoker',
        status: 'complete',
        report: {
          projectStructure: {
            type: 'web',
            mainTechnologies: ['express', 'typescript'],
            testFramework: 'jest',
            buildTool: 'webpack',
          },
          discovery: {
            entryPoints: ['src/index.ts'],
            keyDirectories: ['src', 'tests'],
            configFiles: ['package.json', 'tsconfig.json'],
            conventions: {
              testPattern: '*.test.ts',
              sourcePattern: 'src/**/*.ts',
            },
          },
          recommendations: {
            wardCommands: {
              all: 'npm run ward:all',
              lint: 'npm run lint',
              typecheck: 'npm run typecheck',
              test: 'npm test',
              build: 'npm run build',
            },
            architectureNotes: [
              'Consider using dependency injection',
              'Add error handling middleware',
            ],
          },
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      const result = parser.parseVoidpokerReport('/path/to/report.json');

      expect(result).toStrictEqual(mockReport);
    });

    it('should throw error for wrong agent type', () => {
      const mockReport = {
        agentType: 'pathseeker',
        status: 'complete',
        report: {},
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockReport));

      expect(() => parser.parseVoidpokerReport('/path/to/report.json')).toThrow(
        'Invalid report type: expected voidpoker',
      );
    });
  });

  describe('extractTasksFromPathseeker', () => {
    it('should extract tasks from pathseeker report', () => {
      const report: PathseekerReport = {
        agentType: 'pathseeker',
        status: 'complete',
        report: {
          tasks: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Create auth service',
              type: 'implementation',
              description: 'Create authentication service',
              dependencies: [],
              filesToCreate: ['auth.service.ts'],
              filesToEdit: [],
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'Add auth middleware',
              type: 'implementation',
              description: 'Add authentication middleware',
              dependencies: ['550e8400-e29b-41d4-a716-446655440001'],
              filesToCreate: ['auth.middleware.ts'],
              filesToEdit: ['app.ts'],
            },
          ],
        },
      };

      const tasks = parser.extractTasksFromPathseeker(report);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(tasks[1].id).toBe('550e8400-e29b-41d4-a716-446655440002');
    });

    it('should return empty array if no tasks', () => {
      const report: PathseekerReport = {
        agentType: 'pathseeker',
        status: 'complete',
        report: {
          tasks: [],
        },
      };

      const tasks = parser.extractTasksFromPathseeker(report);

      expect(tasks).toStrictEqual([]);
    });
  });

  describe('extractGapsFromSiegemaster', () => {
    it('should extract test gaps from siegemaster report', () => {
      const report: SiegemasterReport = {
        agentType: 'siegemaster',
        status: 'complete',
        report: {
          testsCreated: [],
          testGapsFound: [
            {
              file: 'auth.service.ts',
              description: 'Missing error handling tests',
              priority: 'high',
            },
            {
              file: 'user.service.ts',
              description: 'Missing edge case tests',
              priority: 'medium',
            },
          ],
        },
      };

      const gaps = parser.extractGapsFromSiegemaster(report);

      expect(gaps).toHaveLength(2);
      expect(gaps[0].file).toBe('auth.service.ts');
      expect(gaps[0].priority).toBe('high');
    });

    it('should return empty array if no gaps found', () => {
      const report: SiegemasterReport = {
        agentType: 'siegemaster',
        status: 'complete',
        report: {
          testsCreated: ['auth.service.spec.ts'],
          testGapsFound: [],
        },
      };

      const gaps = parser.extractGapsFromSiegemaster(report);

      expect(gaps).toStrictEqual([]);
    });
  });

  describe('extractErrorsFromSpiritmender', () => {
    it('should extract errors from spiritmender report', () => {
      const report: SpiritmenderReport = {
        agentType: 'spiritmender',
        status: 'complete',
        report: {
          errorsFixed: [
            {
              file: 'auth.service.ts',
              errorType: 'lint',
              description: 'Missing semicolon',
              resolution: 'Added semicolon',
            },
            {
              file: 'user.controller.ts',
              errorType: 'typecheck',
              description: 'Implicit any type',
              resolution: 'Added explicit type annotation',
            },
          ],
          filesModified: ['auth.service.ts', 'user.controller.ts'],
          attemptNumber: 1,
        },
      };

      const errors = parser.extractErrorsFromSpiritmender(report);

      expect(errors).toHaveLength(2);
      expect(errors[0].errorType).toBe('lint');
      expect(errors[1].errorType).toBe('typecheck');
    });

    it('should return empty array if no errors fixed', () => {
      const report: SpiritmenderReport = {
        agentType: 'spiritmender',
        status: 'complete',
        report: {
          filesModified: [],
          errorsFixed: [],
          attemptNumber: 1,
        },
      };

      const errors = parser.extractErrorsFromSpiritmender(report);

      expect(errors).toStrictEqual([]);
    });
  });
});
