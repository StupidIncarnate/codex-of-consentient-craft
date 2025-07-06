import {
  QuestStatus,
  PhaseStatus,
  ComponentStatus,
  QuestStateMachine,
  createEmptyQuest,
  validateQuest
} from '../utils/quest-state-machine';

describe('Quest State Machine', () => {
  describe('Quest Status Transitions', () => {
    test('should allow valid quest transitions', () => {
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.ACTIVE, QuestStatus.BLOCKED)).toBe(true);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.ACTIVE, QuestStatus.PAUSED)).toBe(true);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.ACTIVE, QuestStatus.COMPLETED)).toBe(true);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.ACTIVE, QuestStatus.ABANDONED)).toBe(true);
      
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.BLOCKED, QuestStatus.ACTIVE)).toBe(true);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.BLOCKED, QuestStatus.ABANDONED)).toBe(true);
      
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.PAUSED, QuestStatus.ACTIVE)).toBe(true);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.PAUSED, QuestStatus.ABANDONED)).toBe(true);
    });

    test('should prevent invalid quest transitions', () => {
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.COMPLETED, QuestStatus.ACTIVE)).toBe(false);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.ABANDONED, QuestStatus.ACTIVE)).toBe(false);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.BLOCKED, QuestStatus.COMPLETED)).toBe(false);
      expect(QuestStateMachine.canTransitionQuest(QuestStatus.PAUSED, QuestStatus.BLOCKED)).toBe(false);
    });

    test('should throw error on invalid quest transition', () => {
      const quest = createEmptyQuest('test-quest', 'Test Quest');
      quest.status = QuestStatus.COMPLETED;
      
      expect(() => {
        QuestStateMachine.validateQuestTransition(quest, QuestStatus.ACTIVE);
      }).toThrow('Invalid quest transition: completed -> active');
    });
  });

  describe('Phase Status Transitions', () => {
    test('should allow valid phase transitions', () => {
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.NOT_STARTED, PhaseStatus.IN_PROGRESS)).toBe(true);
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.IN_PROGRESS, PhaseStatus.COMPLETE)).toBe(true);
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.IN_PROGRESS, PhaseStatus.BLOCKED)).toBe(true);
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.COMPLETE, PhaseStatus.IN_PROGRESS)).toBe(true);
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.BLOCKED, PhaseStatus.IN_PROGRESS)).toBe(true);
    });

    test('should prevent invalid phase transitions', () => {
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.NOT_STARTED, PhaseStatus.COMPLETE)).toBe(false);
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.NOT_STARTED, PhaseStatus.BLOCKED)).toBe(false);
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.COMPLETE, PhaseStatus.NOT_STARTED)).toBe(false);
      expect(QuestStateMachine.canTransitionPhase(PhaseStatus.BLOCKED, PhaseStatus.COMPLETE)).toBe(false);
    });

    test('should throw error on invalid phase transition', () => {
      expect(() => {
        QuestStateMachine.validatePhaseTransition(PhaseStatus.NOT_STARTED, PhaseStatus.COMPLETE);
      }).toThrow('Invalid phase transition: not_started -> complete');
    });
  });

  describe('Component Status Transitions', () => {
    test('should allow valid component transitions', () => {
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.QUEUED, ComponentStatus.IN_PROGRESS)).toBe(true);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.IN_PROGRESS, ComponentStatus.COMPLETE)).toBe(true);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.IN_PROGRESS, ComponentStatus.BLOCKED)).toBe(true);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.IN_PROGRESS, ComponentStatus.NEEDS_REVISION)).toBe(true);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.COMPLETE, ComponentStatus.NEEDS_REVISION)).toBe(true);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.NEEDS_REVISION, ComponentStatus.IN_PROGRESS)).toBe(true);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.BLOCKED, ComponentStatus.IN_PROGRESS)).toBe(true);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.BLOCKED, ComponentStatus.QUEUED)).toBe(true);
    });

    test('should prevent invalid component transitions', () => {
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.QUEUED, ComponentStatus.COMPLETE)).toBe(false);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.QUEUED, ComponentStatus.BLOCKED)).toBe(false);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.COMPLETE, ComponentStatus.QUEUED)).toBe(false);
      expect(QuestStateMachine.canTransitionComponent(ComponentStatus.NEEDS_REVISION, ComponentStatus.COMPLETE)).toBe(false);
    });
  });

  describe('getNextPhase', () => {
    test('should return discovery when not started', () => {
      const quest = createEmptyQuest('test', 'Test');
      expect(QuestStateMachine.getNextPhase(quest)).toBe('discovery');
    });

    test('should return implementation after discovery complete', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getNextPhase(quest)).toBe('implementation');
    });

    test('should return review after implementation complete', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getNextPhase(quest)).toBe('review');
    });

    test('should return testing after review complete', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.COMPLETE;
      quest.phases.review.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getNextPhase(quest)).toBe('testing');
    });

    test('should return null when all phases complete', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.COMPLETE;
      quest.phases.review.status = PhaseStatus.COMPLETE;
      quest.phases.gapAnalysis.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getNextPhase(quest)).toBe(null);
    });

    test('should return current phase if blocked', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.BLOCKED;
      expect(QuestStateMachine.getNextPhase(quest)).toBe('discovery');
    });

    test('should return current phase if in progress', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.IN_PROGRESS;
      expect(QuestStateMachine.getNextPhase(quest)).toBe('discovery');
    });
  });

  describe('getReadyComponents', () => {
    test('should return components with no dependencies', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.implementation.components = [
        { name: 'comp1', status: ComponentStatus.QUEUED, dependencies: [], componentType: 'implementation', componentType: 'implementation' },
        { name: 'comp2', status: ComponentStatus.QUEUED, dependencies: [], componentType: 'implementation', componentType: 'implementation' },
        { name: 'comp3', status: ComponentStatus.QUEUED, dependencies: ['comp1'], componentType: 'implementation' }
      ];
      
      const ready = QuestStateMachine.getReadyComponents(quest);
      expect(ready).toHaveLength(2);
      expect(ready.map(c => c.name)).toEqual(['comp1', 'comp2']);
    });

    test('should return components with completed dependencies', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.implementation.components = [
        { name: 'comp1', status: ComponentStatus.COMPLETE, dependencies: [], componentType: 'implementation' },
        { name: 'comp2', status: ComponentStatus.QUEUED, dependencies: ['comp1'], componentType: 'implementation' },
        { name: 'comp3', status: ComponentStatus.QUEUED, dependencies: ['comp2'], componentType: 'implementation' }
      ];
      
      const ready = QuestStateMachine.getReadyComponents(quest);
      expect(ready).toHaveLength(1);
      expect(ready[0].name).toBe('comp2');
    });

    test('should not return in-progress components', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.implementation.components = [
        { name: 'comp1', status: ComponentStatus.IN_PROGRESS, dependencies: [], componentType: 'implementation' },
        { name: 'comp2', status: ComponentStatus.QUEUED, dependencies: [], componentType: 'implementation' }
      ];
      
      const ready = QuestStateMachine.getReadyComponents(quest);
      expect(ready).toHaveLength(1);
      expect(ready[0].name).toBe('comp2');
    });

    test('should handle partial name matches for dependencies', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.implementation.components = [
        { name: 'Create config.ts with configuration', status: ComponentStatus.COMPLETE, dependencies: [], componentType: 'implementation' },
        { name: 'Create logger.ts with logging', status: ComponentStatus.QUEUED, dependencies: ['config'], componentType: 'implementation' }
      ];
      
      const ready = QuestStateMachine.getReadyComponents(quest);
      expect(ready).toHaveLength(1);
      expect(ready[0].name).toBe('Create logger.ts with logging');
    });
  });

  describe('shouldSpawnSpiritMender', () => {
    test('should return true when quest is blocked with blockers', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.status = QuestStatus.BLOCKED;
      quest.blockers = [
        { type: 'build_failure', description: 'Build failed', timestamp: new Date().toISOString() }
      ];
      
      expect(QuestStateMachine.shouldSpawnSpiritMender(quest)).toBe(true);
    });

    test('should return false when quest is blocked without blockers', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.status = QuestStatus.BLOCKED;
      
      expect(QuestStateMachine.shouldSpawnSpiritMender(quest)).toBe(false);
    });

    test('should return false when quest is not blocked', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.status = QuestStatus.ACTIVE;
      quest.blockers = [
        { type: 'build_failure', description: 'Build failed', timestamp: new Date().toISOString() }
      ];
      
      expect(QuestStateMachine.shouldSpawnSpiritMender(quest)).toBe(false);
    });
  });

  describe('getExpectedAction', () => {
    test('should return spawn_spiritmender when blocked', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.status = QuestStatus.BLOCKED;
      quest.blockers = [
        { type: 'build_failure', description: 'Build failed', timestamp: new Date().toISOString() }
      ];
      
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('spawn_spiritmender');
    });

    test('should return none for terminal states', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.status = QuestStatus.COMPLETED;
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('none');
      
      quest.status = QuestStatus.ABANDONED;
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('none');
    });

    test('should return complete_quest when all phases done', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.COMPLETE;
      quest.phases.review.status = PhaseStatus.COMPLETE;
      quest.phases.gapAnalysis.status = PhaseStatus.COMPLETE;
      
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('complete_quest');
    });

    test('should return spawn_pathseeker for discovery not started', () => {
      const quest = createEmptyQuest('test', 'Test');
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('spawn_pathseeker');
    });

    test('should return continue_pathseeker for discovery in progress', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.IN_PROGRESS;
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('continue_pathseeker');
    });

    test('should return check_components for implementation not started', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('check_components');
    });

    test('should return spawn_codeweaver when components ready', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.IN_PROGRESS;
      quest.phases.implementation.components = [
        { name: 'comp1', status: ComponentStatus.QUEUED, dependencies: [], componentType: 'implementation' }
      ];
      
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('spawn_codeweaver');
    });

    test('should return wait_for_dependencies when no components ready', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.IN_PROGRESS;
      quest.phases.implementation.components = [
        { name: 'comp1', status: ComponentStatus.IN_PROGRESS, dependencies: [], componentType: 'implementation' },
        { name: 'comp2', status: ComponentStatus.QUEUED, dependencies: ['comp1'], componentType: 'implementation' }
      ];
      
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('wait_for_dependencies');
    });

    test('should return spawn_lawbringer for review not started', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('spawn_lawbringer');
    });

    test('should return spawn_siegemaster for testing not started', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.COMPLETE;
      quest.phases.review.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('spawn_siegemaster');
    });

    test('should return complete_quest when all phases complete', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.implementation.status = PhaseStatus.COMPLETE;
      quest.phases.review.status = PhaseStatus.COMPLETE;
      quest.phases.gapAnalysis.status = PhaseStatus.COMPLETE;
      expect(QuestStateMachine.getExpectedAction(quest)).toBe('complete_quest');
    });
  });

  describe('createEmptyQuest', () => {
    test('should create valid empty quest', () => {
      const quest = createEmptyQuest('test-123', 'Test Quest');
      
      expect(quest.id).toBe('test-123');
      expect(quest.title).toBe('Test Quest');
      expect(quest.status).toBe(QuestStatus.ACTIVE);
      expect(quest.phases.discovery.status).toBe(PhaseStatus.NOT_STARTED);
      expect(quest.phases.implementation.status).toBe(PhaseStatus.NOT_STARTED);
      expect(quest.phases.review.status).toBe(PhaseStatus.NOT_STARTED);
      expect(quest.phases.gapAnalysis.status).toBe(PhaseStatus.NOT_STARTED);
      expect(quest.activity).toEqual([]);
      expect(quest.agentReports).toEqual({});
      expect(quest.createdAt).toBeDefined();
      expect(quest.updatedAt).toBeDefined();
    });

    test('should set timestamps correctly', () => {
      const before = new Date().toISOString();
      const quest = createEmptyQuest('test', 'Test');
      const after = new Date().toISOString();
      
      expect(quest.createdAt >= before).toBe(true);
      expect(quest.createdAt <= after).toBe(true);
      expect(quest.createdAt).toBe(quest.updatedAt);
    });
  });

  describe('validateQuest', () => {
    test('should validate valid quest', () => {
      const quest = createEmptyQuest('test', 'Test');
      const errors = validateQuest(quest);
      expect(errors).toEqual([]);
    });

    test('should catch missing required fields', () => {
      const quest: any = {};
      const errors = validateQuest(quest);
      
      expect(errors).toContain('Quest must have an id');
      expect(errors).toContain('Quest must have a title');
      expect(errors).toContain('Quest must have a status');
      expect(errors).toContain('Quest must have phases');
    });

    test('should catch invalid quest status', () => {
      const quest = createEmptyQuest('test', 'Test');
      (quest as any).status = 'invalid';
      const errors = validateQuest(quest);
      
      expect(errors).toContain('Invalid quest status: invalid');
    });

    test('should catch missing phases', () => {
      const quest = createEmptyQuest('test', 'Test');
      delete (quest.phases as any).review;
      const errors = validateQuest(quest);
      
      expect(errors).toContain('Missing required phase: review');
    });

    test('should catch invalid phase status', () => {
      const quest = createEmptyQuest('test', 'Test');
      (quest.phases.discovery as any).status = 'invalid';
      const errors = validateQuest(quest);
      
      expect(errors).toContain('Invalid status for phase discovery: invalid');
    });

    test('should validate components', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.phases.implementation.components = [
        { name: '', status: ComponentStatus.QUEUED, dependencies: [], componentType: 'implementation' },
        { name: 'comp2', status: 'invalid' as any, dependencies: [] }
      ];
      const errors = validateQuest(quest);
      
      expect(errors).toContain('Component must have a name');
      expect(errors).toContain('Invalid component status: invalid');
    });

    test('should validate complex quest', () => {
      const quest = createEmptyQuest('test', 'Test');
      quest.complexity = 'medium';
      quest.phases.discovery.status = PhaseStatus.COMPLETE;
      quest.phases.discovery.findings = {
        components: [
          { name: 'comp1', dependencies: [] },
          { name: 'comp2', dependencies: ['comp1'] }
        ]
      };
      quest.phases.implementation.status = PhaseStatus.IN_PROGRESS;
      quest.phases.implementation.components = [
        { name: 'comp1', status: ComponentStatus.COMPLETE, dependencies: [], componentType: 'implementation' },
        { name: 'comp2', status: ComponentStatus.QUEUED, dependencies: ['comp1'], componentType: 'implementation' }
      ];
      quest.activity = [
        { timestamp: new Date().toISOString(), agent: 'pathseeker', action: 'discovery complete', details: {} }
      ];
      quest.agentReports = {
        pathseeker: { timestamp: new Date().toISOString(), fullReport: ['test'] }
      };
      
      const errors = validateQuest(quest);
      expect(errors).toEqual([]);
    });
  });
});