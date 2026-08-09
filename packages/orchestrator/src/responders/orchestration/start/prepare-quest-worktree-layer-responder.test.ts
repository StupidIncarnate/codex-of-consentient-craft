import { configDefaultsStatics } from '@dungeonmaster/config';
import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  QuestBranchNameStub,
  QuestIdStub,
  QuestStub,
  QuestTitleStub,
} from '@dungeonmaster/shared/contracts';

import { PrepareQuestWorktreeLayerResponder } from './prepare-quest-worktree-layer-responder';
import { PrepareQuestWorktreeLayerResponderProxy } from './prepare-quest-worktree-layer-responder.proxy';

// Hand-computed from questToGitNamesTransformer's own rules (verified in its dedicated test
// suite): 'Add Authentication' slugs to 'add-authentication'; the questId's first 8 characters
// are '7bc217a1'. '/repo' is the fixed repo root PrepareQuestWorktreeLayerResponderProxy resolves
// questRepoRootBroker to for every test in this file.
const TITLE = QuestTitleStub({ value: 'Add Authentication' });
const QUEST_ID = QuestIdStub({ value: '7bc217a1-41e8-40bd-9e25-803d2716b3e8' });
const BRANCH_NAME = QuestBranchNameStub({ value: 'quest/add-authentication-7bc217a1' });
const WORKTREE_PATH = AbsoluteFilePathStub({
  value: '/repo/worktrees/add-authentication-7bc217a1',
});
const MAIN_BRANCH = BaseBranchNameStub({ value: 'main' });
const MASTER_BRANCH = BaseBranchNameStub({ value: 'master' });
const BASE_REF = '1234567890abcdef1234567890abcdef12345678';
const DEFAULT_BUILD_COMMAND = configDefaultsStatics.devServer.buildCommand;

describe('PrepareQuestWorktreeLayerResponder', () => {
  describe('idempotent skip', () => {
    it('VALID: {quest already carries branchName and worktreePath} => resolves undefined, spawning nothing', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ branchName: BRANCH_NAME, worktreePath: WORKTREE_PATH });

      const result = await PrepareQuestWorktreeLayerResponder({ quest });

      expect(result).toBe(undefined);
      expect(proxy.getSpawnedGitArgsList()).toStrictEqual([]);
    });

    it('VALID: {quest carries branchName only, no worktreePath} => does not skip; resolves the full git context', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        title: TITLE,
        branchName: QuestBranchNameStub({ value: 'quest/some-other-branch' }),
      });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupNameAvailable();
      proxy.setupConfigAbsent();
      proxy.setupWorktreePrepared({
        branchName: BRANCH_NAME,
        worktreePath: WORKTREE_PATH,
        baseBranch: MAIN_BRANCH,
        buildCommand: DEFAULT_BUILD_COMMAND,
        baseRef: BASE_REF,
      });

      const result = await PrepareQuestWorktreeLayerResponder({ quest });

      expect(result).toStrictEqual({
        branchName: BRANCH_NAME,
        baseBranch: MAIN_BRANCH,
        worktreePath: WORKTREE_PATH,
        baseRef: BASE_REF,
      });
    });

    it('VALID: {quest carries worktreePath only, no branchName} => does not skip; resolves the full git context', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({
        id: QUEST_ID,
        title: TITLE,
        worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/some-other-worktree' }),
      });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupNameAvailable();
      proxy.setupConfigAbsent();
      proxy.setupWorktreePrepared({
        branchName: BRANCH_NAME,
        worktreePath: WORKTREE_PATH,
        baseBranch: MAIN_BRANCH,
        buildCommand: DEFAULT_BUILD_COMMAND,
        baseRef: BASE_REF,
      });

      const result = await PrepareQuestWorktreeLayerResponder({ quest });

      expect(result).toStrictEqual({
        branchName: BRANCH_NAME,
        baseBranch: MAIN_BRANCH,
        worktreePath: WORKTREE_PATH,
        baseRef: BASE_REF,
      });
    });
  });

  describe('base branch detection', () => {
    it('VALID: {main exists} => baseBranch resolves to main', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupNameAvailable();
      proxy.setupConfigAbsent();
      proxy.setupWorktreePrepared({
        branchName: BRANCH_NAME,
        worktreePath: WORKTREE_PATH,
        baseBranch: MAIN_BRANCH,
        buildCommand: DEFAULT_BUILD_COMMAND,
        baseRef: BASE_REF,
      });

      const result = await PrepareQuestWorktreeLayerResponder({ quest });

      expect(result).toStrictEqual({
        branchName: BRANCH_NAME,
        baseBranch: MAIN_BRANCH,
        worktreePath: WORKTREE_PATH,
        baseRef: BASE_REF,
      });
    });

    it('VALID: {main missing, master exists} => baseBranch resolves to master', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupMasterExists();
      proxy.setupNameAvailable();
      proxy.setupConfigAbsent();
      proxy.setupWorktreePrepared({
        branchName: BRANCH_NAME,
        worktreePath: WORKTREE_PATH,
        baseBranch: MASTER_BRANCH,
        buildCommand: DEFAULT_BUILD_COMMAND,
        baseRef: BASE_REF,
      });

      const result = await PrepareQuestWorktreeLayerResponder({ quest });

      expect(result).toStrictEqual({
        branchName: BRANCH_NAME,
        baseBranch: MASTER_BRANCH,
        worktreePath: WORKTREE_PATH,
        baseRef: BASE_REF,
      });
    });

    it('ERROR: {neither main nor master exists} => rejects BaseBranchNotFoundError and never spawns worktree add', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupNeitherBaseBranchExists();

      const error = await PrepareQuestWorktreeLayerResponder({ quest }).catch(
        (thrown: unknown) => thrown,
      );

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'BaseBranchNotFoundError',
        message: 'No local main or master branch found',
      });
      expect(proxy.getSpawnedGitArgsList()).toStrictEqual([
        ['rev-parse', '--verify', 'main'],
        ['rev-parse', '--verify', 'master'],
      ]);
    });
  });

  describe('branch / worktree name collision', () => {
    it('ERROR: {branch ref already exists} => rejects QuestBranchNameTakenError naming the exact branch, and never creates a worktree', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupBranchRefTaken();

      const error = await PrepareQuestWorktreeLayerResponder({ quest }).catch(
        (thrown: unknown) => thrown,
      );

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'QuestBranchNameTakenError',
        message: `${BRANCH_NAME} already exists — name is in use by other work`,
      });
      expect(proxy.getSpawnedGitArgsList()).toStrictEqual([
        ['rev-parse', '--verify', 'main'],
        ['rev-parse', '--verify', BRANCH_NAME],
      ]);
    });

    it('ERROR: {worktree directory already exists, branch ref absent} => rejects QuestBranchNameTakenError, and never creates a worktree', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupWorktreeDirTaken();

      const error = await PrepareQuestWorktreeLayerResponder({ quest }).catch(
        (thrown: unknown) => thrown,
      );

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'QuestBranchNameTakenError',
        message: `${BRANCH_NAME} already exists — name is in use by other work`,
      });
      expect(proxy.getSpawnedGitArgsList()).toStrictEqual([
        ['rev-parse', '--verify', 'main'],
        ['rev-parse', '--verify', BRANCH_NAME],
      ]);
    });
  });

  describe('build command resolution', () => {
    it('VALID: {no .dungeonmaster.json} => falls back to the config contract default build command', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupNameAvailable();
      proxy.setupConfigAbsent();
      proxy.setupWorktreePrepared({
        branchName: BRANCH_NAME,
        worktreePath: WORKTREE_PATH,
        baseBranch: MAIN_BRANCH,
        buildCommand: DEFAULT_BUILD_COMMAND,
        baseRef: BASE_REF,
      });

      const result = await PrepareQuestWorktreeLayerResponder({ quest });

      expect(result).toStrictEqual({
        branchName: BRANCH_NAME,
        baseBranch: MAIN_BRANCH,
        worktreePath: WORKTREE_PATH,
        baseRef: BASE_REF,
      });
      expect(proxy.getBuildSpawnedArgs({ command: 'npm' })).toStrictEqual(['run', 'build']);
    });

    it('VALID: {.dungeonmaster.json declares devServer.buildCommand} => uses the configured build command', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupNameAvailable();
      proxy.setupConfigPresent({ buildCommand: 'yarn build' });
      proxy.setupWorktreePrepared({
        branchName: BRANCH_NAME,
        worktreePath: WORKTREE_PATH,
        baseBranch: MAIN_BRANCH,
        buildCommand: 'yarn build',
        baseRef: BASE_REF,
      });

      const result = await PrepareQuestWorktreeLayerResponder({ quest });

      expect(result).toStrictEqual({
        branchName: BRANCH_NAME,
        baseBranch: MAIN_BRANCH,
        worktreePath: WORKTREE_PATH,
        baseRef: BASE_REF,
      });
      expect(proxy.getBuildSpawnedArgs({ command: 'yarn' })).toStrictEqual(['build']);
    });
  });

  describe('worktree preparation failure', () => {
    it('ERROR: {worktreePrepareBroker rejects} => the WorktreePrepareError propagates unchanged', async () => {
      const proxy = PrepareQuestWorktreeLayerResponderProxy();
      const quest = QuestStub({ id: QUEST_ID, title: TITLE });
      proxy.setupQuestFound({ quest });
      proxy.setupMainExists();
      proxy.setupNameAvailable();
      proxy.setupConfigAbsent();
      proxy.setupWorktreePrepareFails({
        branchName: BRANCH_NAME,
        worktreePath: WORKTREE_PATH,
        baseBranch: MAIN_BRANCH,
        output: `fatal: '${BRANCH_NAME}' already exists`,
      });

      const error = await PrepareQuestWorktreeLayerResponder({ quest }).catch(
        (thrown: unknown) => thrown,
      );

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'WorktreePrepareError',
        message: `Worktree preparation failed at create: ${WORKTREE_PATH}: fatal: '${BRANCH_NAME}' already exists`,
      });
    });
  });
});
