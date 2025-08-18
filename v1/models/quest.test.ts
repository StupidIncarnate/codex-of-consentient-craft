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
        { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', status: 'complete' } as QuestTask,
        { id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', status: 'complete' } as QuestTask,
        { id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', status: 'in_progress' } as QuestTask,
        { id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', status: 'pending' } as QuestTask,
      ];

      expect(calculateTaskProgress(quest)).toBe('2/4');
    });

    it('should handle all tasks complete', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.tasks = [
        { id: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', status: 'complete' } as QuestTask,
        { id: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', status: 'complete' } as QuestTask,
        { id: 'a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', status: 'complete' } as QuestTask,
      ];

      expect(calculateTaskProgress(quest)).toBe('3/3');
    });

    it('should not count failed or skipped as complete', () => {
      const quest = createQuest('test', '001-test', 'Test');
      quest.tasks = [
        { id: 'b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e', status: 'complete' } as QuestTask,
        { id: 'c9d0e1f2-a3b4-5c6d-7e8f-9a0b1c2d3e4f', status: 'failed' } as QuestTask,
        { id: 'd0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a', status: 'skipped' } as QuestTask,
      ];

      expect(calculateTaskProgress(quest)).toBe('1/3');
    });
  });

  describe('canProceedToNextPhase', () => {
    describe('from discovery phase', () => {
      it('should return true when discovery complete with tasks', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.discovery.status = 'complete';
        quest.tasks = [{ id: 'e1f2a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b' } as QuestTask];

        expect(canProceedToNextPhase(quest, 'discovery')).toBe(true);
      });

      it('should return false when discovery not complete', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.phases.discovery.status = 'in_progress';
        quest.tasks = [{ id: 'f2a3b4c5-d6e7-8f9a-0b1c-2d3e4f5a6b7c' } as QuestTask];

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
          {
            id: 'a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d',
            type: 'implementation',
            status: 'complete',
          } as QuestTask,
          {
            id: 'b4c5d6e7-f8a9-0b1c-2d3e-4f5a6b7c8d9e',
            type: 'implementation',
            status: 'complete',
          } as QuestTask,
          {
            id: 'c5d6e7f8-a9b0-1c2d-3e4f-5a6b7c8d9e0f',
            type: 'testing',
            status: 'pending',
          } as QuestTask,
        ];

        expect(canProceedToNextPhase(quest, 'implementation')).toBe(true);
      });

      it('should return false when implementation tasks pending', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.tasks = [
          {
            id: 'd6e7f8a9-b0c1-2d3e-4f5a-6b7c8d9e0f1a',
            type: 'implementation',
            status: 'complete',
          } as QuestTask,
          {
            id: 'e7f8a9b0-c1d2-3e4f-5a6b-7c8d9e0f1a2b',
            type: 'implementation',
            status: 'in_progress',
          } as QuestTask,
        ];

        expect(canProceedToNextPhase(quest, 'implementation')).toBe(false);
      });

      it('should handle skipped tasks', () => {
        const quest = createQuest('test', '001-test', 'Test');
        quest.tasks = [
          {
            id: 'f8a9b0c1-d2e3-4f5a-6b7c-8d9e0f1a2b3c',
            type: 'implementation',
            status: 'complete',
          } as QuestTask,
          {
            id: 'a9b0c1d2-e3f4-5a6b-7c8d-9e0f1a2b3c4d',
            type: 'implementation',
            status: 'skipped',
          } as QuestTask,
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
        { id: 'b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e', status: 'complete' } as QuestTask,
        { id: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f', status: 'in_progress' } as QuestTask,
        { id: 'd2e3f4a5-b6c7-8d9e-0f1a-2b3c4d5e6f7a', status: 'pending' } as QuestTask,
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
            id: 'e3f4a5b6-c7d8-9e0f-1a2b-3c4d5e6f7a8b',
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
