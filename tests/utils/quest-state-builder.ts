// Quest state builder for test setup

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  QuestFile,
  QuestStatus,
  PhaseStatus,
  ComponentStatus,
  QuestTracker,
  Component,
  Blocker,
  QuestStateMachine,
  createEmptyQuest,
  validateQuest
} from './quest-state-machine';
import {
  StateOptions,
  PreparedEnvironment,
  ComponentTemplates,
  AgentReportTemplates,
  FileGenerators
} from './quest-state-options';

export class QuestStateBuilder {
  private quest: QuestFile;
  private projectDir: string;
  private fileSystem: Map<string, string> = new Map();
  private questTracker: QuestTracker;
  private stateHistory: string[] = [];

  constructor(projectDir: string, questTitle: string, questId?: string) {
    this.projectDir = projectDir;
    const id = questId || `${questTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    this.quest = createEmptyQuest(id, questTitle);
    this.questTracker = {
      active: [`${id}.json`],
      completed: [],
      abandoned: []
    };
  }

  // QUEST CREATION STATE (replaces Taskweaver - now handled by Pathseeker)
  inQuestCreationState(status: QuestStatus = QuestStatus.ACTIVE, options?: StateOptions): this {
    this.stateHistory.push('quest_creation');
    
    // Validate transition
    if (this.quest.status !== status) {
      QuestStateMachine.validateQuestTransition(this.quest, status);
    }
    
    this.quest.status = status;
    this.quest.complexity = 'medium';
    this.quest.tags = ['test', 'automated'];
    
    // Quest creation is now done by Pathseeker, so mark discovery as complete
    this.quest.phases.discovery.status = PhaseStatus.COMPLETE;
    this.quest.phases.discovery.findings = {
      components: (options?.customComponents || [
        { name: 'test-component', dependencies: [] }
      ]).map(c => ({ name: c.name, dependencies: c.dependencies || [] })),
      decisions: { approach: 'standard implementation' }
    };
    
    // Add pathseeker report since quest creation is now handled by pathseeker
    if (!this.quest.agentReports.pathseeker) {
      this.quest.agentReports.pathseeker = [];
    }
    this.quest.agentReports.pathseeker.push({
      agentId: `pathseeker-${String(this.quest.agentReports.pathseeker.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      fullReport: [
        '=== PATHSEEKER REPORT ===',
        `Quest: ${this.quest.title}`,
        'Status: SUCCESS',
        'Quest created from user request analysis',
        '=== END REPORT ==='
      ]
    });

    // Add activity
    this.addActivity('Quest created from Pathseeker exploration', 'pathseeker', {
      questDefinition: {
        id: this.quest.id,
        title: this.quest.title,
        status: status
      }
    });
    
    // Handle blocked status
    if (status === QuestStatus.BLOCKED && options?.withBlockers) {
      this.addBlocker('missing_requirements', options.errorMessage || 'Project missing required configuration');
    }
    
    return this;
  }

  // BACKWARD COMPATIBILITY - remove after updating all tests
  inTaskweaverState(status: QuestStatus = QuestStatus.ACTIVE, options?: StateOptions): this {
    return this.inQuestCreationState(status, options);
  }

  // PATHSEEKER STATE  
  inPathseekerState(status: PhaseStatus = PhaseStatus.COMPLETE, options?: StateOptions): this {
    // Ensure quest creation happened first
    if (!this.stateHistory.includes('quest_creation') && !this.stateHistory.includes('taskweaver')) {
      this.inQuestCreationState();
    }
    
    this.stateHistory.push('pathseeker');
    
    // Handle phase transition - if going from NOT_STARTED to COMPLETE or BLOCKED, go through IN_PROGRESS
    const currentStatus = this.quest.phases.discovery.status;
    if (currentStatus === PhaseStatus.NOT_STARTED && (status === PhaseStatus.COMPLETE || status === PhaseStatus.BLOCKED)) {
      // Transition through IN_PROGRESS
      this.quest.phases.discovery.status = PhaseStatus.IN_PROGRESS;
    }
    // Now validate and apply the final transition if needed
    if (this.quest.phases.discovery.status !== status) {
      QuestStateMachine.validatePhaseTransition(this.quest.phases.discovery.status, status);
      this.quest.phases.discovery.status = status;
    }
    
    // Determine components
    const components = options?.customComponents || this.generateDefaultComponents();
    
    if (status === PhaseStatus.COMPLETE) {
      // Set discovery findings
      this.quest.phases.discovery.findings = {
        components: components.map(c => ({
          name: `Create ${c.name}.ts with ${c.description}`,
          dependencies: (c as any).dependencies || []
        })),
        decisions: {
          architecture: 'functional',
          testing: 'jest',
          language: 'typescript'
        }
      };
      
      // Initialize implementation components
      this.quest.phases.implementation.components = components.map(c => ({
        name: `Create ${c.name}.ts with ${c.description}`,
        status: ComponentStatus.QUEUED,
        dependencies: (c as any).dependencies || [],
        componentType: 'implementation'
      }));
      
      // Set implementation to not started (ready to begin)
      this.quest.phases.implementation.status = PhaseStatus.NOT_STARTED;
      
    } else if (status === PhaseStatus.BLOCKED) {
      this.quest.status = QuestStatus.BLOCKED;
      this.addBlocker('discovery_failed', options?.errorMessage || 'Unable to analyze codebase structure');
      
    } else if (status === PhaseStatus.IN_PROGRESS) {
      // Partial discovery
      this.quest.phases.discovery.findings = {
        components: components.slice(0, Math.ceil(components.length / 2)).map(c => ({
          name: `Create ${c.name}.ts with ${c.description}`,
          dependencies: []
        }))
      };
    }
    
    // Add activity
    this.addActivity(`Discovery ${status}`, 'pathseeker', {
      componentsFound: components.length,
      status
    });
    
    // Add Pathseeker report
    if (!this.quest.agentReports.pathseeker) {
      this.quest.agentReports.pathseeker = [];
    }
    this.quest.agentReports.pathseeker.push({
      agentId: `pathseeker-${String(this.quest.agentReports.pathseeker.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      fullReport: AgentReportTemplates.pathseeker(this.quest.title, components)
    });
    
    return this;
  }

  // CODEWEAVER STATE
  inCodeweaverState(status: PhaseStatus = PhaseStatus.COMPLETE, options?: StateOptions): this {
    // Ensure discovery is complete
    if (this.quest.phases.discovery.status !== PhaseStatus.COMPLETE) {
      this.inPathseekerState();
    }
    
    this.stateHistory.push('codeweaver');
    
    // Handle phase transition - if going from NOT_STARTED to COMPLETE or BLOCKED, go through IN_PROGRESS
    const currentStatus = this.quest.phases.implementation.status;
    if (currentStatus === PhaseStatus.NOT_STARTED && (status === PhaseStatus.COMPLETE || status === PhaseStatus.BLOCKED)) {
      // Transition through IN_PROGRESS
      this.quest.phases.implementation.status = PhaseStatus.IN_PROGRESS;
    }
    // Now validate and apply the final transition if needed
    if (this.quest.phases.implementation.status !== status) {
      QuestStateMachine.validatePhaseTransition(this.quest.phases.implementation.status, status);
      this.quest.phases.implementation.status = status;
    }
    
    const components = this.quest.phases.implementation.components;
    
    if (status === PhaseStatus.COMPLETE) {
      // Implement all components
      this.implementComponents(components, options);
      
    } else if (status === PhaseStatus.IN_PROGRESS) {
      // Partial implementation
      let componentsToImplement: Component[];
      
      if (options?.partialOnly) {
        // Only implement components without dependencies, up to half
        const independentComponents = components.filter(c => c.dependencies.length === 0);
        componentsToImplement = independentComponents.slice(0, Math.max(1, Math.floor(independentComponents.length / 2)));
      } else {
        // Implement half of all components
        componentsToImplement = components.slice(0, Math.ceil(components.length / 2));
      }
      
      this.implementComponents(componentsToImplement, options);
      
    } else if (status === PhaseStatus.BLOCKED) {
      // Implement first component, block on second
      if (components.length > 0) {
        this.implementComponents([components[0]], options);
        
        if (components.length > 1) {
          components[1].status = ComponentStatus.BLOCKED;
          this.quest.status = QuestStatus.BLOCKED;
          this.addBlocker(
            'implementation_error',
            `Failed to implement ${components[1].name}: ${options?.errorMessage || 'Type errors'}`
          );
        }
      }
    }
    
    return this;
  }

  // LAWBRINGER STATE
  inLawbringerState(status: PhaseStatus = PhaseStatus.COMPLETE, options?: StateOptions): this {
    // Ensure implementation has at least started
    if (this.quest.phases.implementation.status === PhaseStatus.NOT_STARTED) {
      this.inCodeweaverState();
    }
    
    this.stateHistory.push('lawbringer');
    
    // Handle phase transition - if going from NOT_STARTED to COMPLETE, go through IN_PROGRESS
    const currentStatus = this.quest.phases.review.status;
    if (currentStatus === PhaseStatus.NOT_STARTED && status === PhaseStatus.COMPLETE) {
      // Transition through IN_PROGRESS
      this.quest.phases.review.status = PhaseStatus.IN_PROGRESS;
    }
    // Now validate and apply the final transition if needed
    if (this.quest.phases.review.status !== status) {
      QuestStateMachine.validatePhaseTransition(this.quest.phases.review.status, status);
      this.quest.phases.review.status = status;
    }
    
    if (status === PhaseStatus.COMPLETE) {
      // Generate review issues
      let issues: any[] = options?.reviewIssues || [];
      
      if (!issues.length && options?.withErrors && this.quest.phases.implementation.components.length > 0) {
        // Generate default issues based on actual components
        const firstComponent = this.quest.phases.implementation.components[0];
        const firstFile = firstComponent.files?.[0] || 'src/unknown.ts';
        const secondComponent = this.quest.phases.implementation.components[1];
        const secondFile = secondComponent?.files?.[0] || firstFile;
        
        issues = [
          { severity: 'minor' as const, file: firstFile, line: 5, message: 'Missing JSDoc comment' },
          { severity: 'major' as const, file: secondFile, line: 10, message: 'Variable used before declaration' }
        ];
      }
      
      this.quest.phases.review.issues = issues;
      this.quest.phases.review.recommendations = [
        'Add comprehensive error handling',
        'Include JSDoc documentation for all public APIs',
        'Consider adding input validation'
      ];
      
      // If major issues found, set components to need revision
      if (issues.some(i => i.severity === 'major')) {
        const problematicFile = issues.find(i => i.severity === 'major')?.file;
        const component = this.quest.phases.implementation.components.find(c => 
          c.files?.some(f => f.includes(problematicFile!))
        );
        
        if (component) {
          component.status = ComponentStatus.NEEDS_REVISION;
          this.quest.phases.implementation.status = PhaseStatus.IN_PROGRESS;
        }
      }
      
      // Add Lawbringer report
      if (!this.quest.agentReports.lawbringer) {
        this.quest.agentReports.lawbringer = [];
      }
      this.quest.agentReports.lawbringer.push({
        agentId: `lawbringer-${String(this.quest.agentReports.lawbringer.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        fullReport: AgentReportTemplates.lawbringer(issues, status)
      });
      
    } else if (status === PhaseStatus.IN_PROGRESS) {
      this.quest.phases.review.progress = options?.percentComplete ? `${options.percentComplete}%` : '50%';
    }
    
    this.addActivity(`Code review ${status}`, 'lawbringer', {
      issuesFound: this.quest.phases.review.issues?.length || 0
    });
    
    return this;
  }

  // GAP ANALYSIS STATE (Siegemaster)
  inSiegemasterState(status: PhaseStatus = PhaseStatus.COMPLETE, options?: StateOptions): this {
    // Ensure implementation is complete
    if (this.quest.phases.implementation.status !== PhaseStatus.COMPLETE) {
      this.inCodeweaverState();
    }
    
    this.stateHistory.push('siegemaster');
    
    // Handle phase transition - if going from NOT_STARTED to COMPLETE or BLOCKED, go through IN_PROGRESS
    const currentStatus = this.quest.phases.gapAnalysis.status;
    if (currentStatus === PhaseStatus.NOT_STARTED && (status === PhaseStatus.COMPLETE || status === PhaseStatus.BLOCKED)) {
      // Transition through IN_PROGRESS
      this.quest.phases.gapAnalysis.status = PhaseStatus.IN_PROGRESS;
    }
    // Now validate and apply the final transition if needed
    if (this.quest.phases.gapAnalysis.status !== status) {
      QuestStateMachine.validatePhaseTransition(this.quest.phases.gapAnalysis.status, status);
      this.quest.phases.gapAnalysis.status = status;
    }
    
    if (status === PhaseStatus.COMPLETE) {
      // Create gap analysis results
      const gapsFound = options?.gapsFound || (options?.withErrors ? 5 : 2);
      this.quest.phases.gapAnalysis.analysisResults = this.quest.phases.implementation.components.map(comp => ({
        component: comp.name,
        gapsFound: Math.floor(gapsFound / this.quest.phases.implementation.components.length),
        priority: options?.withErrors ? 'high' : 'medium'
      }));
      
      if (options?.additionalTestsNeeded) {
        this.quest.phases.gapAnalysis.additionalTestsNeeded = options.additionalTestsNeeded;
      }
      
      // Add Siegemaster report
      if (!this.quest.agentReports.siegemaster) {
        this.quest.agentReports.siegemaster = [];
      }
      this.quest.agentReports.siegemaster.push({
        agentId: `siegemaster-${String(this.quest.agentReports.siegemaster.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        fullReport: AgentReportTemplates.siegemaster(String(gapsFound), this.quest.phases.gapAnalysis.analysisResults || [])
      });
      
    } else if (status === PhaseStatus.BLOCKED) {
      this.quest.status = QuestStatus.BLOCKED;
      this.addBlocker(
        'discovery_failed',
        options?.errorMessage || 'Gap analysis failed: Unable to analyze test coverage'
      );
    }
    
    this.addActivity(`Gap analysis ${status}`, 'siegemaster', {
      gapsFound: this.quest.phases.gapAnalysis.analysisResults?.reduce((sum, r) => sum + r.gapsFound, 0) || 0
    });
    
    return this;
  }

  // SPIRITMENDER STATE
  inSpiritMenderState(resolved: boolean = true, options?: StateOptions): this {
    // Create a blocker if none exist
    if (!this.quest.blockers || this.quest.blockers.length === 0) {
      this.quest.status = QuestStatus.BLOCKED;
      this.addBlocker(
        'ward_failure',
        options?.errorMessage || 'ESLint errors: Unused variables'
      );
    }
    
    this.stateHistory.push('spiritmender');
    
    const blockers = [...(this.quest.blockers || [])];
    
    if (resolved) {
      // Clear blockers and unblock quest
      this.quest.blockers = [];
      this.quest.status = QuestStatus.ACTIVE;
      
      // Fix any blocked/needs_revision components
      this.quest.phases.implementation.components.forEach(c => {
        if (c.status === ComponentStatus.BLOCKED || c.status === ComponentStatus.NEEDS_REVISION) {
          c.status = ComponentStatus.COMPLETE;
        }
      });
      
      // Update phase statuses - if any phase is blocked, set it to IN_PROGRESS
      if (this.quest.phases.discovery.status === PhaseStatus.BLOCKED) {
        this.quest.phases.discovery.status = PhaseStatus.IN_PROGRESS;
      }
      if (this.quest.phases.implementation.status === PhaseStatus.BLOCKED) {
        this.quest.phases.implementation.status = PhaseStatus.IN_PROGRESS;
      }
      if (this.quest.phases.review.status === PhaseStatus.BLOCKED) {
        this.quest.phases.review.status = PhaseStatus.IN_PROGRESS;
      }
      if (this.quest.phases.gapAnalysis.status === PhaseStatus.BLOCKED) {
        this.quest.phases.gapAnalysis.status = PhaseStatus.IN_PROGRESS;
      }
      
      // If all implementation components are complete, mark the phase as complete
      if (this.quest.phases.implementation.components.every(c => c.status === ComponentStatus.COMPLETE)) {
        this.quest.phases.implementation.status = PhaseStatus.COMPLETE;
      }
    }
    
    // Add Spiritmender report
    if (!this.quest.agentReports.spiritmender) {
      this.quest.agentReports.spiritmender = [];
    }
    this.quest.agentReports.spiritmender.push({
      agentId: `spiritmender-${String(this.quest.agentReports.spiritmender.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      fullReport: AgentReportTemplates.spiritmender(blockers, resolved)
    });
    
    this.addActivity(`Healing ${resolved ? 'complete' : 'in progress'}`, 'spiritmender', {
      blockersResolved: resolved ? blockers.length : 0
    });
    
    return this;
  }

  // COMPLETION STATE
  inCompletedState(): this {
    // Ensure all phases are complete
    if (this.quest.phases.gapAnalysis.status !== PhaseStatus.COMPLETE) {
      this.inSiegemasterState();
    }
    
    this.quest.status = QuestStatus.COMPLETED;
    this.quest.outcome = {
      status: 'success',
      completedAt: new Date().toISOString(),
      summary: `Successfully implemented ${this.quest.title}`
    };
    
    // Update tracker
    this.questTracker.active = this.questTracker.active.filter(q => q !== `${this.quest.id}.json`);
    this.questTracker.completed.push(`${this.quest.id}.json`);
    
    this.addActivity('Quest completed', 'questmaestro', {
      duration: this.quest.activity.length * 5 // Simulated minutes
    });
    
    return this;
  }

  // ABANDONED STATE
  inAbandonedState(reason: string = 'User requested abandonment'): this {
    this.quest.status = QuestStatus.ABANDONED;
    this.quest.outcome = {
      status: 'abandoned',
      abandonedAt: new Date().toISOString(),
      reason
    };
    
    // Update tracker
    this.questTracker.active = this.questTracker.active.filter(q => q !== `${this.quest.id}.json`);
    this.questTracker.abandoned.push(`${this.quest.id}.json`);
    
    this.addActivity('Quest abandoned', 'questmaestro', { reason });
    
    return this;
  }

  // PREPARE TEST ENVIRONMENT
  async prepareTestEnvironment(): Promise<PreparedEnvironment> {
    // Validate quest before writing
    const errors = validateQuest(this.quest);
    if (errors.length > 0) {
      throw new Error(`Invalid quest state: ${errors.join(', ')}`);
    }
    
    // Create directory structure
    const questDir = path.join(this.projectDir, 'questmaestro');
    await fs.mkdir(path.join(questDir, 'active'), { recursive: true });
    await fs.mkdir(path.join(questDir, 'completed'), { recursive: true });
    await fs.mkdir(path.join(questDir, 'abandoned'), { recursive: true });
    await fs.mkdir(path.join(questDir, 'retros'), { recursive: true });
    await fs.mkdir(path.join(questDir, 'lore'), { recursive: true });
    
    // Write quest-tracker.json
    const trackerPath = path.join(questDir, 'quest-tracker.json');
    await fs.writeFile(trackerPath, JSON.stringify(this.questTracker, null, 2));
    
    // Determine quest folder based on status
    let questFolder = 'active';
    if (this.quest.status === QuestStatus.COMPLETED) questFolder = 'completed';
    if (this.quest.status === QuestStatus.ABANDONED) questFolder = 'abandoned';
    
    // Write quest file
    const questPath = path.join(questDir, questFolder, `${this.quest.id}.json`);
    await fs.writeFile(questPath, JSON.stringify(this.quest, null, 2));
    
    // Write all code files
    const srcDir = path.join(this.projectDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    
    for (const [filePath, content] of this.fileSystem) {
      const fullPath = path.join(this.projectDir, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
    
    // Get current state info
    const currentPhase = QuestStateMachine.getNextPhase(this.quest);
    const expectedAction = QuestStateMachine.getExpectedAction(this.quest);
    const readyComponents = QuestStateMachine.getReadyComponents(this.quest);
    
    return {
      questId: this.quest.id,
      questPath,
      trackerPath,
      files: Array.from(this.fileSystem.keys()),
      currentPhase: currentPhase || 'completed',
      expectedNextAction: expectedAction,
      readyComponents,
      blockers: this.quest.blockers?.map(b => b.description)
    };
  }

  // HELPER METHODS
  private generateDefaultComponents() {
    // Determine component type from quest title
    if (this.quest.title.toLowerCase().includes('math')) {
      return ComponentTemplates.math.slice(0, 2);
    } else if (this.quest.title.toLowerCase().includes('api')) {
      return ComponentTemplates.api;
    } else if (this.quest.title.toLowerCase().includes('simple')) {
      return ComponentTemplates.simple;
    }
    
    return ComponentTemplates.utils;
  }

  private implementComponents(components: Component[], options?: StateOptions) {
    components.forEach((component, index) => {
      const match = component.name.match(/Create (\w+)\.ts/);
      const fileName = match ? match[1] : 'unknown';
      const description = component.name;
      
      // Generate implementation - inject error in first component if withErrors is true
      const hasError = options?.withErrors && index === 0;
      const implementation = FileGenerators.implementation(fileName, description, hasError);
      const test = FileGenerators.test(fileName, description);
      
      // Add to file system
      this.fileSystem.set(`src/${fileName}.ts`, implementation);
      this.fileSystem.set(`src/${fileName}.test.ts`, test);
      
      // Update component
      component.status = ComponentStatus.COMPLETE;
      component.files = [`src/${fileName}.ts`, `src/${fileName}.test.ts`];
      
      // Add Codeweaver report
      if (!this.quest.agentReports.codeweaver) {
        this.quest.agentReports.codeweaver = [];
      }
      
      this.quest.agentReports.codeweaver.push({
        agentId: `codeweaver-${fileName}-${String(this.quest.agentReports.codeweaver.length + 1).padStart(3, '0')}`,
        component: component.name,
        timestamp: new Date().toISOString(),
        fullReport: AgentReportTemplates.codeweaver(component.name, 'Complete')
      });
      
      this.addActivity(`Implemented ${fileName}`, 'codeweaver', {
        component: component.name,
        files: component.files
      });
    });
  }

  private addActivity(action: string, agent: string, details: any) {
    this.quest.activity.push({
      timestamp: new Date().toISOString(),
      agent,
      action,
      details
    });
    this.quest.updatedAt = new Date().toISOString();
  }

  private addBlocker(type: Blocker['type'], description: string) {
    if (!this.quest.blockers) {
      this.quest.blockers = [];
    }
    
    this.quest.blockers.push({
      type,
      description,
      timestamp: new Date().toISOString()
    });
  }

  // GETTERS
  getQuest(): QuestFile {
    return this.quest;
  }

  getFiles(): Map<string, string> {
    return this.fileSystem;
  }

  getStateHistory(): string[] {
    return this.stateHistory;
  }
}