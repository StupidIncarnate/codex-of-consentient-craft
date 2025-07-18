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
import { PathseekerTask } from '../models/agent';
import { FileOperationResult } from '../types';

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
      console.error(
        `Failed to save quest: ${error instanceof Error ? error.message : String(error)}`,
      );
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
      console.error('Invalid task dependencies detected');
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
  updateTaskStatus(
    questFolder: string,
    taskId: string,
    status: TaskStatus,
    reportFile?: string,
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
    const task = quest.tasks.find((t) => t.id === taskId);

    if (!task) {
      console.error(`Task ${taskId} not found in quest ${questFolder}`);
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
  updatePhaseStatus(
    questFolder: string,
    phase: PhaseType,
    status: PhaseStatus,
    reportFile?: string,
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
    } catch (error) {
      console.error('Failed to update quest tracker:', error);
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
          console.error(`Task ${task.id} depends on non-existent task ${depId}`);
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
        console.error(`Circular dependency detected involving task ${task.id}`);
        return false;
      }
    }

    return true;
  }
}
