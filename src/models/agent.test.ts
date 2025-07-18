import {
  isAgentReport,
  isValidAgentType,
  PathseekerReport,
  CodeweaverReport,
  AgentType,
  AgentReport,
} from './agent';

describe('agent model', () => {
  describe('isValidAgentType', () => {
    it('should return true for valid agent types', () => {
      const validTypes: AgentType[] = [
        'voidpoker',
        'pathseeker',
        'codeweaver',
        'siegemaster',
        'lawbringer',
        'spiritmender',
      ];

      validTypes.forEach((type) => {
        expect(isValidAgentType(type)).toBe(true);
      });
    });

    it('should return false for invalid agent types', () => {
      expect(isValidAgentType('invalid')).toBe(false);
      expect(isValidAgentType('')).toBe(false);
      expect(isValidAgentType('PATHSEEKER')).toBe(false);
      expect(isValidAgentType('path-seeker')).toBe(false);
    });
  });

  describe('isAgentReport', () => {
    it('should return true for valid pathseeker report', () => {
      const report: PathseekerReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          tasks: [
            {
              id: 'create-auth-service',
              name: 'CreateAuthService',
              type: 'implementation',
              description: 'Create authentication service',
              dependencies: [],
              filesToCreate: ['src/auth/auth-service.ts'],
              filesToEdit: [],
            },
          ],
        },
      };

      expect(isAgentReport(report)).toBe(true);
    });

    it('should return true for valid codeweaver report', () => {
      const report: CodeweaverReport = {
        status: 'complete',
        agentType: 'codeweaver',
        taskId: 'create-auth-service',
        report: {
          filesCreated: ['src/auth/auth-service.ts'],
          filesModified: ['src/app.ts'],
          summary: 'Created authentication service with JWT support',
        },
      };

      expect(isAgentReport(report)).toBe(true);
    });

    it('should return true for blocked agent report', () => {
      const report: AgentReport = {
        status: 'blocked',
        blockReason: 'Need database connection string',
        agentType: 'codeweaver',
        report: {
          filesCreated: [],
          filesModified: [],
          summary: 'Cannot proceed without database configuration',
        },
      };

      expect(isAgentReport(report)).toBe(true);
    });

    it('should return true for report with retrospective notes', () => {
      const report: PathseekerReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          tasks: [],
        },
        retrospectiveNotes: [
          {
            category: 'pattern_discovered',
            note: 'Project uses dependency injection pattern',
            relatedFiles: ['src/container.ts'],
          },
        ],
      };

      expect(isAgentReport(report)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isAgentReport(null)).toBe(false);
      expect(isAgentReport(undefined)).toBe(false);
    });

    it('should return false for non-object types', () => {
      expect(isAgentReport('string')).toBe(false);
      expect(isAgentReport(123)).toBe(false);
      expect(isAgentReport(true)).toBe(false);
      expect(isAgentReport([])).toBe(false);
    });

    it('should return false for missing status', () => {
      const report = {
        agentType: 'pathseeker',
        report: { tasks: [] },
      };
      expect(isAgentReport(report)).toBe(false);
    });

    it('should return false for invalid status', () => {
      const report = {
        status: 'pending', // Invalid status
        agentType: 'pathseeker',
        report: { tasks: [] },
      };
      expect(isAgentReport(report)).toBe(false);
    });

    it('should return false for missing agentType', () => {
      const report = {
        status: 'complete',
        report: { tasks: [] },
      };
      expect(isAgentReport(report)).toBe(false);
    });

    it('should return false for invalid agentType', () => {
      const report = {
        status: 'complete',
        agentType: 'wizard', // Invalid agent type
        report: { tasks: [] },
      };
      expect(isAgentReport(report)).toBe(false);
    });

    it('should return false for missing report field', () => {
      const report = {
        status: 'complete',
        agentType: 'pathseeker',
      };
      expect(isAgentReport(report)).toBe(false);
    });

    it('should return false for non-object report field', () => {
      const report = {
        status: 'complete',
        agentType: 'pathseeker',
        report: 'invalid',
      };
      expect(isAgentReport(report)).toBe(false);
    });
  });

  describe('TypeScript types', () => {
    it('should enforce correct structure for PathseekerReport', () => {
      // This is a compile-time test
      const report: PathseekerReport = {
        status: 'complete',
        agentType: 'pathseeker',
        report: {
          tasks: [
            {
              id: 'test-task',
              name: 'TestTask',
              type: 'testing',
              description: 'Create unit tests',
              dependencies: ['implementation-task'],
              filesToCreate: ['src/test.spec.ts'],
              filesToEdit: [],
              testTechnology: 'jest',
            },
          ],
          approach: 'Test-driven development',
          notes: ['Consider mocking external services'],
        },
        retrospectiveNotes: [
          {
            category: 'what_worked_well',
            note: 'Clear task dependencies',
          },
        ],
      };

      expect(report.agentType).toBe('pathseeker');
    });

    it('should enforce correct structure for CodeweaverReport', () => {
      const report: CodeweaverReport = {
        status: 'error',
        agentType: 'codeweaver',
        taskId: 'create-service',
        report: {
          filesCreated: [],
          filesModified: [],
          summary: 'Failed to create service',
          issues: ['Missing type definitions'],
        },
      };

      expect(report.agentType).toBe('codeweaver');
    });
  });
});
