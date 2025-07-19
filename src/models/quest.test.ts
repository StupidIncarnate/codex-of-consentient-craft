import {
  createQuest,
  getCurrentPhase,
  calculateTaskProgress,
  canProceedToNextPhase,
  toTrackerEntry,
  Quest,
  QuestTask,
} from './quest';

describe('quest model', () => {
  describe('createQuest', () => {
    it('should create a new quest with default values', () => {
      const quest = createQuest('add-auth', '001-add-auth', 'Add Authentication');

      expect(quest).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: expect.any(String),
        updatedAt: quest.createdAt,
        userRequest: undefined,
        phases: {
          discovery: { status: 'pending' },
          implementation: { status: 'pending' },
          testing: { status: 'pending' },
          review: { status: 'pending' },
        },
        tasks: [],
        executionLog: [],
      });
    });

    it('should include user request when provided', () => {
      const quest = createQuest(
        'add-auth',
        '001-add-auth',
        'Add Authentication',
        'Please add JWT authentication to the API',
      );

      expect(quest.userRequest).toBe('Please add JWT authentication to the API');
    });

    it('should set timestamps correctly', () => {
      const beforeTime = new Date().toISOString();
      const quest = createQuest('test', '001-test', 'Test Quest');
      const afterTime = new Date().toISOString();

      expect(quest.createdAt >= beforeTime).toBe(true);
      expect(quest.createdAt <= afterTime).toBe(true);
      expect(quest.updatedAt).toBe(quest.createdAt);
    });
  });

  describe('getCurrentPhase', () => {
    it('should return discovery when starting', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.phases.discovery.status = 'in_progress';

      expect(getCurrentPhase(quest)).toBe('discovery');
    });

    it('should return implementation when in progress', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'in_progress';

      expect(getCurrentPhase(quest)).toBe('implementation');
    });

    it('should return blocked phase', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'blocked';

      expect(getCurrentPhase(quest)).toBe('implementation');
    });

    it('should return next pending phase', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'complete';
      quest.phases.testing.status = 'pending';

      expect(getCurrentPhase(quest)).toBe('testing');
    });

    it('should return null when all phases complete', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'complete';
      quest.phases.testing.status = 'complete';
      quest.phases.review.status = 'complete';

      expect(getCurrentPhase(quest)).toBe(null);
    });

    it('should handle skipped phases', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'complete';
      quest.phases.testing.status = 'skipped';
      quest.phases.review.status = 'in_progress';

      expect(getCurrentPhase(quest)).toBe('review');
    });
  });

  describe('calculateTaskProgress', () => {
    it('should return 0/0 for quest with no tasks', () => {
      const quest = createQuest('test', '001-test', 'Test');
      expect(calculateTaskProgress(quest)).toBe('0/0');
    });

    it('should calculate progress correctly', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.tasks = [
        { id: '1', status: 'complete' } as QuestTask,
        { id: '2', status: 'complete' } as QuestTask,
        { id: '3', status: 'in_progress' } as QuestTask,
        { id: '4', status: 'pending' } as QuestTask,
      ];

      expect(calculateTaskProgress(quest)).toBe('2/4');
    });

    it('should handle all tasks complete', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.tasks = [
        { id: '1', status: 'complete' } as QuestTask,
        { id: '2', status: 'complete' } as QuestTask,
        { id: '3', status: 'complete' } as QuestTask,
      ];

      expect(calculateTaskProgress(quest)).toBe('3/3');
    });

    it('should not count failed or skipped as complete', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.tasks = [
        { id: '1', status: 'complete' } as QuestTask,
        { id: '2', status: 'failed' } as QuestTask,
        { id: '3', status: 'skipped' } as QuestTask,
      ];

      expect(calculateTaskProgress(quest)).toBe('1/3');
    });
  });

  describe('canProceedToNextPhase', () => {
    describe('from discovery phase', () => {
      it('should return true when discovery complete with tasks', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.discovery.status = 'complete';
        quest.tasks = [{ id: '1' } as QuestTask];

        expect(canProceedToNextPhase(quest, 'discovery')).toBe(true);
      });

      it('should return false when discovery not complete', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.discovery.status = 'in_progress';
        quest.tasks = [{ id: '1' } as QuestTask];

        expect(canProceedToNextPhase(quest, 'discovery')).toBe(false);
      });

      it('should return false when no tasks discovered', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.discovery.status = 'complete';
        quest.tasks = [];

        expect(canProceedToNextPhase(quest, 'discovery')).toBe(false);
      });
    });

    describe('from implementation phase', () => {
      it('should return true when all implementation tasks complete', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.tasks = [
          { id: '1', type: 'implementation', status: 'complete' } as QuestTask,
          { id: '2', type: 'implementation', status: 'complete' } as QuestTask,
          { id: '3', type: 'testing', status: 'pending' } as QuestTask,
        ];

        expect(canProceedToNextPhase(quest, 'implementation')).toBe(true);
      });

      it('should return false when implementation tasks pending', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.tasks = [
          { id: '1', type: 'implementation', status: 'complete' } as QuestTask,
          { id: '2', type: 'implementation', status: 'in_progress' } as QuestTask,
        ];

        expect(canProceedToNextPhase(quest, 'implementation')).toBe(false);
      });

      it('should handle skipped tasks', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.tasks = [
          { id: '1', type: 'implementation', status: 'complete' } as QuestTask,
          { id: '2', type: 'implementation', status: 'skipped' } as QuestTask,
        ];

        expect(canProceedToNextPhase(quest, 'implementation')).toBe(true);
      });
    });

    describe('from testing phase', () => {
      it('should return true when testing complete', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.testing.status = 'complete';

        expect(canProceedToNextPhase(quest, 'testing')).toBe(true);
      });

      it('should return true when testing skipped', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.testing.status = 'skipped';

        expect(canProceedToNextPhase(quest, 'testing')).toBe(true);
      });

      it('should return false when testing in progress', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.testing.status = 'in_progress';

        expect(canProceedToNextPhase(quest, 'testing')).toBe(false);
      });
    });

    describe('from review phase', () => {
      it('should return true when review complete', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.review.status = 'complete';

        expect(canProceedToNextPhase(quest, 'review')).toBe(true);
      });

      it('should return false when review not complete', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.review.status = 'in_progress';

        expect(canProceedToNextPhase(quest, 'review')).toBe(false);
      });
    });
  });

  describe('toTrackerEntry', () => {
    it('should create tracker entry from quest', () => {
      const quest = createQuest('add-auth', '001-add-auth', 'Add Authentication');
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'in_progress';
      quest.tasks = [
        { id: '1', status: 'complete' } as QuestTask,
        { id: '2', status: 'in_progress' } as QuestTask,
        { id: '3', status: 'pending' } as QuestTask,
      ];

      const entry = toTrackerEntry(quest);

      expect(entry).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: quest.createdAt,
        currentPhase: 'implementation',
        taskProgress: '1/3',
      });
    });

    it('should handle completed quest', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.status = 'complete';
      quest.phases.discovery.status = 'complete';
      quest.phases.implementation.status = 'complete';
      quest.phases.testing.status = 'complete';
      quest.phases.review.status = 'complete';

      const entry = toTrackerEntry(quest);

      expect(entry).toStrictEqual({
        id: 'test',
        folder: '001-test',
        title: 'Test',
        status: 'complete',
        createdAt: quest.createdAt,
        currentPhase: undefined,
        taskProgress: '0/0',
      });
    });
  });

  describe('TypeScript types', () => {
    it('should enforce correct quest structure', () => {
      // This is a compile-time test
      const quest: Quest = {
        id: 'test',
        folder: '001-test',
        title: 'Test Quest',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        phases: {
          discovery: { status: 'complete', report: '001-pathseeker-report.json' },
          implementation: { status: 'in_progress', progress: '2/4' },
          testing: { status: 'pending' },
          review: { status: 'pending' },
        },
        executionLog: [
          {
            report: '001-pathseeker-report.json',
            timestamp: new Date().toISOString(),
            agentType: 'pathseeker',
          },
        ],
        tasks: [
          {
            id: 'create-service',
            name: 'CreateService',
            type: 'implementation',
            description: 'Create the service',
            dependencies: [],
            filesToCreate: ['src/service.ts'],
            filesToEdit: [],
            status: 'complete',
            completedBy: '002-codeweaver-report.json',
          },
        ],
      };

      expect(quest.id).toBe('test');
    });
  });
});
