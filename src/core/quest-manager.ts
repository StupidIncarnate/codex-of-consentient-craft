/**
 * Quest management for Questmaestro
 * Handles quest lifecycle, state transitions, and task management
 */

import * as path from 'path';
import { FileSystem } from './file-system';
import { ConfigManager } from './config-manager';
import {
  Quest,
  QuestStatus,
  QuestTask,
  createQuest,
  getCurrentPhase,
  canProceedToNextPhase,
  toTrackerEntry,
  QuestTrackerEntry,
  PhaseStatus,
  TaskStatus,
  ExecutionLogEntry,
  PhaseType,
} from '../models/quest';
import { PathseekerTask, CodeweaverReport, ReconciliationPlan, AgentReport } from '../models/agent';
import { FileOperationResult } from '../types';

/**
 * Options for updating task status
 */
export interface UpdateTaskStatusOptions {
  questFolder: string;
  taskId: string;
  status: TaskStatus;
  reportFile?: string;
  basePath?: string;
}

/**
 * Options for updating phase status
 */
export interface UpdatePhaseStatusOptions {
  questFolder: string;
  phase: PhaseType;
  status: PhaseStatus;
  reportFile?: string;
  basePath?: string;
}

/**
 * QuestManager class for managing quest lifecycle
 */
export class QuestManager {
  private fileSystem: FileSystem;
  private configManager: ConfigManager;

  constructor(fileSystem: FileSystem, configManager: ConfigManager) {
    this.fileSystem = fileSystem;
    this.configManager = configManager;
  }

  /**
   * Create a new quest
   */
  createNewQuest(
    title: string,
    userRequest: string,
    basePath?: string,
  ): FileOperationResult<Quest> {
    try {
      // Generate quest ID and folder name
      const questId = this.generateQuestId(title);
      const nextNumberResult = this.fileSystem.getNextQuestNumber(basePath);

      if (!nextNumberResult.success || !nextNumberResult.data) {
        return {
          success: false,
          error: 'Failed to generate quest number',
        };
      }

      const questFolder = `${nextNumberResult.data}-${questId}`;

      // Create quest folder
      const folderResult = this.fileSystem.createQuestFolder(questFolder, basePath);
      if (!folderResult.success) {
        return {
          success: false,
          error: folderResult.error,
        };
      }

      // Create quest object
      const quest = createQuest(questId, questFolder, title, userRequest);

      // Save quest.json
      const questPath = this.getQuestJsonPath(questFolder, basePath);
      const saveResult = this.fileSystem.writeJson(questPath, quest);

      if (!saveResult.success) {
        return {
          success: false,
          error: `Failed to save quest: ${saveResult.error}`,
        };
      }

      // Update quest tracker
      this.updateQuestTracker(basePath);

      return {
        success: true,
        data: quest,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create quest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Load a quest by folder name
   */
  loadQuest(questFolder: string, basePath?: string): FileOperationResult<Quest> {
    try {
      const questPath = this.getQuestJsonPath(questFolder, basePath);
      const result = this.fileSystem.readJson<Quest>(questPath);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || 'Quest not found',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load quest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Save quest changes
   */
  saveQuest(quest: Quest, basePath?: string): FileOperationResult<void> {
    try {
      const questPath = this.getQuestJsonPath(quest.folder, basePath);
      quest.updatedAt = new Date().toISOString();

      const result = this.fileSystem.writeJson(questPath, quest);

      if (result.success) {
        this.updateQuestTracker(basePath);
      }

      return result;
    } catch (error) {
      // Failed to save quest: error details in return value
      return {
        success: false,
        error: `Failed to save quest: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Update quest status
   */
  updateQuestStatus(
    questFolder: string,
    status: QuestStatus,
    basePath?: string,
  ): FileOperationResult<Quest> {
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error || 'Failed to load quest',
      };
    }

    const quest = loadResult.data;
    quest.status = status;

    if (status === 'complete') {
      quest.completedAt = new Date().toISOString();
    }

    const saveResult = this.saveQuest(quest, basePath);
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || 'Failed to save quest',
      };
    }
    return {
      success: true,
      data: quest,
    };
  }

  /**
   * Add tasks to a quest
   */
  addTasks(
    questFolder: string,
    tasks: PathseekerTask[],
    basePath?: string,
  ): FileOperationResult<Quest> {
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error || 'Failed to load quest',
      };
    }

    const quest = loadResult.data;

    // Convert PathseekerTask to QuestTask
    const questTasks: QuestTask[] = tasks.map((task) => ({
      ...task,
      status: 'pending' as TaskStatus,
    }));

    quest.tasks = questTasks;

    // Validate task dependencies
    if (!this.validateTaskDependencies(questTasks)) {
      // Invalid task dependencies detected
      return {
        success: false,
        error: 'Invalid task dependencies detected',
      };
    }

    const saveResult = this.saveQuest(quest, basePath);
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || 'Failed to save quest',
      };
    }
    return {
      success: true,
      data: quest,
    };
  }

  /**
   * Update task status
   */
  updateTaskStatus(options: UpdateTaskStatusOptions): FileOperationResult<Quest> {
    const { questFolder, taskId, status, reportFile, basePath } = options;
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error || 'Failed to load quest',
      };
    }

    const quest = loadResult.data;
    const task = quest.tasks.find((t) => t.id === taskId);

    if (!task) {
      // Task not found in quest
      return {
        success: false,
        error: `Task ${taskId} not found in quest ${questFolder}`,
      };
    }

    task.status = status;

    if (status === 'in_progress') {
      task.startedAt = new Date().toISOString();
    } else if (status === 'complete') {
      task.completedAt = new Date().toISOString();
      if (reportFile) {
        task.completedBy = reportFile;
      }
    }

    // Update implementation phase progress
    const implementationTasks = quest.tasks.filter((t) => t.type === 'implementation');
    const completedTasks = implementationTasks.filter((t) => t.status === 'complete').length;
    quest.phases.implementation.progress = `${completedTasks}/${implementationTasks.length}`;

    const saveResult = this.saveQuest(quest, basePath);
    if (!saveResult) {
      return {
        success: false,
        error: 'Failed to save quest',
      };
    }
    return {
      success: true,
      data: quest,
    };
  }

  /**
   * Update phase status
   */
  updatePhaseStatus(options: UpdatePhaseStatusOptions): FileOperationResult<Quest> {
    const { questFolder, phase, status, reportFile, basePath } = options;
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error || 'Failed to load quest',
      };
    }

    const quest = loadResult.data;
    quest.phases[phase].status = status;

    if (status === 'in_progress') {
      quest.phases[phase].startedAt = new Date().toISOString();
    } else if (status === 'complete') {
      quest.phases[phase].completedAt = new Date().toISOString();
      if (reportFile) {
        quest.phases[phase].report = reportFile;
      }
    }

    const saveResult = this.saveQuest(quest, basePath);
    if (!saveResult) {
      return {
        success: false,
        error: 'Failed to save quest',
      };
    }
    return {
      success: true,
      data: quest,
    };
  }

  /**
   * Add execution log entry
   */
  addExecutionLogEntry(
    questFolder: string,
    entry: Omit<ExecutionLogEntry, 'timestamp'>,
    basePath?: string,
  ): FileOperationResult<Quest> {
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error || 'Failed to load quest',
      };
    }

    const quest = loadResult.data;
    quest.executionLog.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    const saveResult = this.saveQuest(quest, basePath);
    if (!saveResult) {
      return {
        success: false,
        error: 'Failed to save quest',
      };
    }
    return {
      success: true,
      data: quest,
    };
  }

  /**
   * Get active quests
   */
  getActiveQuests(basePath?: string): QuestTrackerEntry[] {
    const questsResult = this.fileSystem.listQuests('active', basePath);
    if (!questsResult.success || !questsResult.data) {
      return [];
    }

    const quests: QuestTrackerEntry[] = [];

    for (const questFolder of questsResult.data) {
      const loadResult = this.loadQuest(questFolder, basePath);
      if (loadResult.success && loadResult.data) {
        quests.push(toTrackerEntry(loadResult.data));
      }
    }

    return quests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Find quest by search term
   */
  findQuest(
    searchTerm: string,
    basePath?: string,
  ): FileOperationResult<{ quest: Quest; state: 'active' | 'completed' | 'abandoned' }> {
    const findResult = this.fileSystem.findQuest(searchTerm, basePath);

    if (!findResult.success || !findResult.data) {
      return {
        success: false,
        error: findResult.error,
      };
    }

    const { folder, state } = findResult.data;
    const structure = this.fileSystem.getFolderStructure(basePath);
    const questPath = path.join(structure[state], folder, 'quest.json');

    const questResult = this.fileSystem.readJson<Quest>(questPath);

    if (!questResult.success || !questResult.data) {
      return {
        success: false,
        error: 'Failed to load quest data',
      };
    }

    return {
      success: true,
      data: {
        quest: questResult.data,
        state,
      },
    };
  }

  /**
   * Move quest between states
   */
  moveQuest(
    questFolder: string,
    fromState: 'active' | 'completed' | 'abandoned',
    toState: 'active' | 'completed' | 'abandoned',
    basePath?: string,
  ): FileOperationResult<string> {
    // Update quest status before moving
    const newStatus: QuestStatus =
      toState === 'active' ? 'in_progress' : toState === 'completed' ? 'complete' : 'abandoned';

    const updated = this.updateQuestStatus(questFolder, newStatus, basePath);
    if (!updated.success) {
      return {
        success: false,
        error: updated.error || 'Failed to update quest status',
      };
    }

    // Move the folder
    const moveResult = this.fileSystem.moveQuest(questFolder, fromState, toState, basePath);

    if (moveResult.success) {
      this.updateQuestTracker(basePath);
    }

    return moveResult;
  }

  /**
   * Abandon a quest
   */
  abandonQuest(questFolder: string, reason: string, basePath?: string): FileOperationResult<Quest> {
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error || 'Failed to load quest',
      };
    }

    const quest = loadResult.data;
    quest.status = 'abandoned';
    quest.abandonReason = reason;

    const saved = this.saveQuest(quest, basePath);
    if (!saved.success) {
      return {
        success: false,
        error: saved.error || 'Failed to save quest',
      };
    }

    const moveResult = this.moveQuest(questFolder, 'active', 'abandoned', basePath);
    if (!moveResult.success) {
      return {
        success: false,
        error: moveResult.error || 'Failed to move quest to abandoned',
      };
    }
    return {
      success: true,
      data: quest,
    };
  }

  /**
   * Get next tasks to execute
   */
  getNextTasks(questFolder: string, basePath?: string): QuestTask[] {
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return [];
    }

    const quest = loadResult.data;

    // Get all pending tasks
    const pendingTasks = quest.tasks.filter((t) => t.status === 'pending');

    // Get tasks whose dependencies are all complete
    const availableTasks = pendingTasks.filter((task) =>
      task.dependencies.every((depId) => {
        const depTask = quest.tasks.find((t) => t.id === depId);
        return depTask && (depTask.status === 'complete' || depTask.status === 'skipped');
      }),
    );

    return availableTasks;
  }

  /**
   * Check if quest can proceed to next phase
   */
  checkPhaseCompletion(
    questFolder: string,
    basePath?: string,
  ): { canProceed: boolean; currentPhase: PhaseType | null; nextPhase: PhaseType | null } {
    const loadResult = this.loadQuest(questFolder, basePath);
    if (!loadResult.success || !loadResult.data) {
      return {
        canProceed: false,
        currentPhase: null,
        nextPhase: null,
      };
    }

    const quest = loadResult.data;
    const currentPhase = getCurrentPhase(quest);

    if (!currentPhase) {
      return {
        canProceed: false,
        currentPhase: null,
        nextPhase: null,
      };
    }

    const canProceed = canProceedToNextPhase(quest, currentPhase);

    const phaseOrder: PhaseType[] = ['discovery', 'implementation', 'testing', 'review'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const nextPhase = currentIndex < phaseOrder.length - 1 ? phaseOrder[currentIndex + 1] : null;

    return {
      canProceed,
      currentPhase,
      nextPhase,
    };
  }

  /**
   * Update quest tracker file
   */
  private updateQuestTracker(basePath?: string): void {
    try {
      this.configManager.loadConfig(basePath);
      const structure = this.fileSystem.getFolderStructure(basePath);
      const trackerPath = path.join(structure.root, 'quest-tracker.json');

      const activeQuests = this.getActiveQuests(basePath);

      const tracker = {
        updated: new Date().toISOString(),
        activeQuests: activeQuests.length,
        quests: activeQuests,
      };

      this.fileSystem.writeJson(trackerPath, tracker);
    } catch (_error) {
      // Failed to update quest tracker: error details captured
    }
  }

  /**
   * Generate quest ID from title
   */
  private generateQuestId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Get quest.json path
   */
  private getQuestJsonPath(questFolder: string, basePath?: string): string {
    const structure = this.fileSystem.getFolderStructure(basePath);
    return path.join(structure.active, questFolder, 'quest.json');
  }

  /**
   * Validate task dependencies
   */
  private validateTaskDependencies(tasks: QuestTask[]): boolean {
    const taskIds = new Set(tasks.map((t) => t.id));

    // Check all dependencies exist
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          // Task depends on non-existent task
          return false;
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      if (visiting.has(taskId)) {
        return true;
      }

      if (visited.has(taskId)) {
        return false;
      }

      visiting.add(taskId);

      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);

      return false;
    };

    for (const task of tasks) {
      if (hasCycle(task.id)) {
        // Circular dependency detected
        return false;
      }
    }

    return true;
  }

  /**
   * Get all quests from all states
   */
  getAllQuests(basePath?: string): QuestTrackerEntry[] {
    const allQuests: QuestTrackerEntry[] = [];
    const states: Array<'active' | 'completed' | 'abandoned'> = [
      'active',
      'completed',
      'abandoned',
    ];

    for (const state of states) {
      const questsResult = this.fileSystem.listQuests(state, basePath);
      if (questsResult.success && questsResult.data) {
        for (const questFolder of questsResult.data) {
          const loadResult = this.loadQuest(questFolder, basePath);
          if (loadResult.success && loadResult.data) {
            allQuests.push(toTrackerEntry(loadResult.data));
          }
        }
      }
    }

    return allQuests.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Get quest by folder name
   */
  getQuest(questFolder: string, basePath?: string): Quest | null {
    const loadResult = this.loadQuest(questFolder, basePath);
    return loadResult.success && loadResult.data ? loadResult.data : null;
  }

  /**
   * Get the next report number for a quest
   */
  getNextReportNumber(questFolder: string, basePath?: string): string {
    const structure = this.fileSystem.getFolderStructure(basePath);
    const questPath = path.join(structure.active, questFolder);

    if (!this.fileSystem.directoryExists(questPath)) {
      return '001';
    }

    const files = this.fileSystem.listFiles(questPath);
    const reportNumbers = files
      .filter((f) => f.match(/^\d{3}-.*-report\.json$/))
      .map((f) => parseInt(f.substring(0, 3)))
      .filter((n) => !isNaN(n));

    const maxNumber = reportNumbers.length > 0 ? Math.max(...reportNumbers) : 0;
    return (maxNumber + 1).toString().padStart(3, '0');
  }

  /**
   * Complete a quest
   */
  completeQuest(questFolder: string, basePath?: string): FileOperationResult<Quest> {
    const updateResult = this.updateQuestStatus(questFolder, 'complete', basePath);
    if (!updateResult.success) {
      return updateResult;
    }

    const moveResult = this.moveQuest(questFolder, 'active', 'completed', basePath);
    if (!moveResult.success) {
      return {
        success: false,
        error: moveResult.error || 'Failed to move quest to completed',
      };
    }

    return updateResult;
  }

  /**
   * Check if quest is complete
   */
  isQuestComplete(quest: Quest): boolean {
    if (quest.status !== 'in_progress') {
      return quest.status === 'complete';
    }

    // Check if all tasks are complete
    const allTasksComplete = quest.tasks.every(
      (task) => task.status === 'complete' || task.status === 'skipped',
    );

    // Check if all phases are complete or skipped
    const allPhasesComplete = Object.values(quest.phases).every(
      (phase) => phase.status === 'complete' || phase.status === 'skipped',
    );

    return allTasksComplete && allPhasesComplete;
  }

  /**
   * Get current phase of a quest
   */
  getCurrentPhase(quest: Quest): PhaseType | null {
    return getCurrentPhase(quest);
  }

  /**
   * Get files created in a quest
   */
  getCreatedFiles(questFolder: string, basePath?: string): string[] {
    const quest = this.getQuest(questFolder, basePath);
    if (!quest) return [];

    const createdFiles = new Set<string>();
    const questPath = this.getQuestJsonPath(questFolder, basePath);
    const questDir = path.dirname(questPath);

    try {
      // Read all files in quest folder
      const files = this.fileSystem.listFiles(questDir);
      if (!files || files.length === 0) {
        return [];
      }

      // Filter for codeweaver reports
      const codeweaverReports = files.filter((f) => f.includes('codeweaver-report.json'));

      // Extract filesCreated from each report
      for (const reportFile of codeweaverReports) {
        const reportPath = path.join(questDir, reportFile);
        const reportResult = this.fileSystem.readJson<CodeweaverReport>(reportPath);

        if (reportResult.success && reportResult.data?.agentType === 'codeweaver') {
          const report = reportResult.data.report;
          if (report.filesCreated && Array.isArray(report.filesCreated)) {
            report.filesCreated.forEach((file: string) => {
              createdFiles.add(file);
            });
          }
        }
      }
    } catch (error) {
      // Log error but don't throw - return what we have
      console.error(`Error reading created files for quest ${questFolder}:`, error);
    }

    return Array.from(createdFiles);
  }

  /**
   * Get files changed in a quest
   */
  getChangedFiles(questFolder: string, basePath?: string): string[] {
    const quest = this.getQuest(questFolder, basePath);
    if (!quest) return [];

    const modifiedFiles = new Set<string>();
    const questPath = this.getQuestJsonPath(questFolder, basePath);
    const questDir = path.dirname(questPath);

    try {
      const files = this.fileSystem.listFiles(questDir);
      if (!files || files.length === 0) {
        return [];
      }

      const codeweaverReports = files.filter((f) => f.includes('codeweaver-report.json'));

      for (const reportFile of codeweaverReports) {
        const reportPath = path.join(questDir, reportFile);
        const reportResult = this.fileSystem.readJson<CodeweaverReport>(reportPath);

        if (reportResult.success && reportResult.data?.agentType === 'codeweaver') {
          const report = reportResult.data.report;
          if (report.filesModified && Array.isArray(report.filesModified)) {
            report.filesModified.forEach((file: string) => {
              modifiedFiles.add(file);
            });
          }
        }
      }
    } catch (error) {
      // Log error but don't throw - return what we have
      console.error(`Error reading modified files for quest ${questFolder}:`, error);
    }

    return Array.from(modifiedFiles);
  }

  /**
   * Validate quest freshness
   */
  validateQuestFreshness(quest: Quest): { isStale: boolean; reason?: string } {
    const MAX_QUEST_AGE_DAYS = 30;

    // Parse quest creation date
    const createdAt = new Date(quest.createdAt);
    const now = new Date();

    // Calculate age in days
    const ageMs = now.getTime() - createdAt.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    if (ageDays > MAX_QUEST_AGE_DAYS) {
      return {
        isStale: true,
        reason: `Quest is ${ageDays} days old (maximum recommended: ${MAX_QUEST_AGE_DAYS} days)`,
      };
    }

    // Future enhancement: Check git log for major changes
    // Would need to spawn git process and analyze commit history

    return { isStale: false };
  }

  /**
   * Apply reconciliation plan to quest
   */
  applyReconciliation(questId: string, plan: ReconciliationPlan): void {
    const questResult = this.loadQuest(questId);
    if (!questResult.success || !questResult.data) {
      throw new Error(`Failed to load quest ${questId}`);
    }

    const quest = questResult.data;

    switch (plan.mode) {
      case 'EXTEND':
        // Add new tasks to the end of task list
        if (plan.newTasks && plan.newTasks.length > 0) {
          // Convert PathseekerTask to QuestTask
          const newQuestTasks: QuestTask[] = plan.newTasks.map((task) => ({
            ...task,
            status: 'pending' as TaskStatus,
            startedAt: undefined,
            completedAt: undefined,
            completedBy: undefined,
            errorMessage: undefined,
          }));

          quest.tasks.push(...newQuestTasks);
        }
        break;

      case 'REPLAN':
        // Keep completed/failed tasks, replace pending ones
        if (plan.newTasks) {
          const nonPendingTasks = quest.tasks.filter((t) => t.status !== 'pending');

          const newQuestTasks: QuestTask[] = plan.newTasks.map((task) => ({
            ...task,
            status: 'pending' as TaskStatus,
            startedAt: undefined,
            completedAt: undefined,
            completedBy: undefined,
            errorMessage: undefined,
          }));

          quest.tasks = [...nonPendingTasks, ...newQuestTasks];
        }
        break;

      case 'CONTINUE':
        // No changes to task list
        break;
    }

    // Apply dependency updates
    if (plan.taskUpdates) {
      for (const update of plan.taskUpdates) {
        const task = quest.tasks.find((t) => t.id === update.taskId);
        if (task) {
          task.dependencies = update.newDependencies;
        }
      }
    }

    // Mark obsolete tasks
    if (plan.obsoleteTasks) {
      for (const obsolete of plan.obsoleteTasks) {
        const task = quest.tasks.find((t) => t.id === obsolete.taskId);
        if (task && task.status === 'pending') {
          task.status = 'skipped';
          task.errorMessage = `Obsolete: ${obsolete.reason}`;
        }
      }
    }

    // Validate all dependencies still exist
    const validTaskIds = new Set(quest.tasks.map((t) => t.id));
    for (const task of quest.tasks) {
      const invalidDeps = task.dependencies.filter((dep) => !validTaskIds.has(dep));
      if (invalidDeps.length > 0) {
        task.dependencies = task.dependencies.filter((dep) => validTaskIds.has(dep));
      }
    }

    // Update quest
    quest.updatedAt = new Date().toISOString();

    // Save quest
    const saveResult = this.saveQuest(quest);
    if (!saveResult.success) {
      throw new Error(`Failed to save quest after reconciliation: ${saveResult.error}`);
    }
  }

  /**
   * Generate retrospective for completed quest
   */
  generateRetrospective(questId: string): string {
    const questResult = this.loadQuest(questId);
    if (!questResult.success || !questResult.data) {
      throw new Error(`Cannot generate retrospective: quest ${questId} not found`);
    }

    const quest = questResult.data;
    const questJsonPath = this.getQuestJsonPath(questId);
    const questDir = path.dirname(questJsonPath);

    // Collect all reports
    const reports: Array<{
      number: string;
      agentType: string;
      filename: string;
      status: string;
      report: unknown;
    }> = [];

    try {
      const files = this.fileSystem.listFiles(questDir);
      if (files && files.length > 0) {
        const reportFiles = files.filter((f) => f.endsWith('-report.json')).sort(); // Chronological order

        for (const file of reportFiles) {
          const reportPath = path.join(questDir, file);
          const reportResult = this.fileSystem.readJson<AgentReport>(reportPath);

          if (reportResult.success && reportResult.data) {
            const reportNumber = file.match(/^(\d{3})-/)?.[1] || '???';
            reports.push({
              number: reportNumber,
              agentType: reportResult.data.agentType,
              filename: file,
              status: reportResult.data.status,
              report: reportResult.data.report,
            });
          }
        }
      }
    } catch (_error) {
      // Error collecting reports
    }

    // Build retrospective content
    const lines: string[] = [];

    // Header
    lines.push(`# Quest Retrospective: ${quest.title}`);
    lines.push('');
    lines.push(`**Quest ID**: ${quest.id}`);
    lines.push(`**Folder**: ${quest.folder}`);
    lines.push(`**Status**: ${quest.status}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    const startDate = new Date(quest.createdAt);
    const endDate = quest.completedAt ? new Date(quest.completedAt) : new Date();
    const duration = this.formatDuration(endDate.getTime() - startDate.getTime());

    lines.push(
      `- **Started**: ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()}`,
    );
    lines.push(`- **Completed**: ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString()}`);
    lines.push(`- **Duration**: ${duration}`);
    lines.push(`- **Total Tasks**: ${quest.tasks.length}`);

    // Task breakdown
    const completedTasks = quest.tasks.filter((t) => t.status === 'complete').length;
    const failedTasks = quest.tasks.filter((t) => t.status === 'failed').length;
    const skippedTasks = quest.tasks.filter((t) => t.status === 'skipped').length;

    lines.push(
      `- **Task Results**: ${completedTasks} completed, ${failedTasks} failed, ${skippedTasks} skipped`,
    );
    lines.push(`- **Reports Generated**: ${reports.length}`);
    lines.push('');

    // Phase Summary
    lines.push('## Phase Progression');
    lines.push('');
    const phases: Array<keyof typeof quest.phases> = [
      'discovery',
      'implementation',
      'testing',
      'review',
    ];
    for (const phase of phases) {
      const phaseData = quest.phases[phase];
      const icon =
        phaseData.status === 'complete'
          ? '✅'
          : phaseData.status === 'skipped'
            ? '⏭️'
            : phaseData.status === 'in_progress'
              ? '🔄'
              : '⏸️';
      lines.push(
        `- ${icon} **${phase.charAt(0).toUpperCase() + phase.slice(1)}**: ${phaseData.status}`,
      );
      if (phaseData.progress) {
        lines.push(`  - Progress: ${phaseData.progress}`);
      }
    }
    lines.push('');

    // Agent Reports Section
    lines.push('## Agent Reports');
    lines.push('');

    // Group by agent type
    const agentGroups = new Map<string, typeof reports>();
    for (const report of reports) {
      const group = agentGroups.get(report.agentType) || [];
      group.push(report);
      agentGroups.set(report.agentType, group);
    }

    // Process each agent type
    agentGroups.forEach((agentReports, agentType) => {
      lines.push(`### ${agentType.charAt(0).toUpperCase() + agentType.slice(1)}`);
      lines.push('');

      for (const report of agentReports) {
        lines.push(`#### Report ${report.number} (${report.status})`);
        lines.push('');

        // Extract agent-specific insights
        const r = report.report as Record<string, unknown>;

        if (agentType === 'pathseeker' && r.tasks && Array.isArray(r.tasks)) {
          const tasks = r.tasks as unknown[];
          lines.push(`- Generated ${tasks.length} tasks`);
          if (r.retrospectiveNotes && Array.isArray(r.retrospectiveNotes)) {
            const notes = r.retrospectiveNotes as Array<{ note: string }>;
            notes.forEach((n) => {
              lines.push(`- Insight: ${n.note}`);
            });
          }
        } else if (agentType === 'codeweaver') {
          if (r.filesCreated) {
            const created = r.filesCreated as string[];
            lines.push(`- Created ${created.length} files`);
          }
          if (r.filesModified) {
            const modified = r.filesModified as string[];
            lines.push(`- Modified ${modified.length} files`);
          }
          if (r.retrospectiveNotes && Array.isArray(r.retrospectiveNotes)) {
            const notes = r.retrospectiveNotes as Array<{ note: string }>;
            notes.forEach((n) => {
              lines.push(`- Insight: ${n.note}`);
            });
          }
        } else if (agentType === 'siegemaster' && r.testsCreated) {
          const tests = r.testsCreated as unknown[];
          lines.push(`- Created ${tests.length} test files`);
        }

        lines.push('');
      }
    });

    // Execution Timeline
    lines.push('## Execution Timeline');
    lines.push('');

    if (quest.executionLog.length > 0) {
      for (const entry of quest.executionLog) {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const taskInfo = entry.taskId ? ` [Task: ${entry.taskId}]` : '';
        const agent = entry.agentType || 'system';
        lines.push(`- ${time} - **${agent}** - ${entry.report}${taskInfo}`);
      }
    } else {
      lines.push('*No execution log available*');
    }
    lines.push('');

    // Recovery Attempts
    if (quest.recoveryHistory && quest.recoveryHistory.length > 0) {
      lines.push('## Recovery Attempts');
      lines.push('');
      for (const recovery of quest.recoveryHistory) {
        lines.push(
          `- ${recovery.agentType} (attempt ${recovery.attemptNumber}): ${recovery.failureReason}`,
        );
      }
      lines.push('');
    }

    // Lessons Learned (template)
    lines.push('## Lessons Learned');
    lines.push('');
    lines.push('_This section can be manually updated with insights gained from this quest._');
    lines.push('');
    lines.push('### What Went Well');
    lines.push('- ');
    lines.push('');
    lines.push('### Challenges Encountered');
    lines.push('- ');
    lines.push('');
    lines.push('### Recommendations for Future Quests');
    lines.push('- ');

    return lines.join('\n');
  }

  /**
   * Save retrospective to file
   */
  saveRetrospective(questId: string, content: string): void {
    const structure = this.fileSystem.getFolderStructure();
    const retrosPath = structure.retros;

    // Load quest for metadata
    const questResult = this.loadQuest(questId);
    if (!questResult.success || !questResult.data) {
      throw new Error('Cannot save retrospective: quest not found');
    }

    const quest = questResult.data;
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${quest.folder}-retrospective-${timestamp}.md`;
    const filepath = path.join(retrosPath, filename);

    // Save retrospective (writeFile will create directory if needed)
    const saveResult = this.fileSystem.writeFile(filepath, content);
    if (!saveResult.success) {
      throw new Error(`Failed to save retrospective: ${saveResult.error}`);
    }

    // Update index
    const indexPath = path.join(retrosPath, 'index.json');
    let index: Array<{
      questId: string;
      questTitle: string;
      filename: string;
      completedAt: string;
      tasksTotal: number;
      tasksCompleted: number;
      duration: string;
    }> = [];

    // Load existing index
    const indexResult = this.fileSystem.readJson<typeof index>(indexPath);
    if (indexResult.success && indexResult.data) {
      index = indexResult.data;
    }

    // Calculate duration
    const startTime = new Date(quest.createdAt).getTime();
    const endTime = quest.completedAt ? new Date(quest.completedAt).getTime() : Date.now();
    const duration = this.formatDuration(endTime - startTime);

    // Add new entry
    index.push({
      questId: quest.id,
      questTitle: quest.title,
      filename,
      completedAt: new Date().toISOString(),
      tasksTotal: quest.tasks.length,
      tasksCompleted: quest.tasks.filter((t) => t.status === 'complete').length,
      duration,
    });

    // Save updated index
    this.fileSystem.writeJson(indexPath, index);
  }

  /**
   * Format duration helper
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
