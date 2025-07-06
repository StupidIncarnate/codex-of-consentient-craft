const { ProjectBootstrapper } = require('../utils/project-bootstrapper');
const { ClaudeE2ERunner } = require('../utils/claude-runner');
const fs = require('fs');
const path = require('path');

jest.setTimeout(6000000);

// Increase max listeners to handle parallel sub-agents
require('events').EventEmitter.defaultMaxListeners = 20;

describe('Questmaestro E2E Tests', () => {
  const bootstrapper = new ProjectBootstrapper();
  let project;
  let runner;

  beforeAll(() => {
    console.log('\n📋 Starting Questmaestro E2E Tests\n');
    
    // Check if claude CLI is available
    try {
      const { execSync } = require('child_process');
      const version = execSync('claude --version 2>&1', { encoding: 'utf8' });
      console.log(`   ✓ Claude CLI found: ${version.trim()}`);
    } catch (e) {
      console.error('   ❌ Claude CLI not found or not in PATH');
      console.error('   💡 Install with: npm install -g @anthropic-ai/claude-code');
    }
  });

  // Cleanup happens on git commit, not after tests
  // This allows debugging of test artifacts

  test('Full parallel quest execution from implementation to completion', async () => {
    // Load scenario to get setup data
    const scenarioPath = path.join(__dirname, 'scenarios', 'parallel-agents.json');
    const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));

    // Create project with existing quest
    project = await bootstrapper.createProjectWithQuests('simple', [
      scenario.setup.questFile
    ]);
    runner = new ClaudeE2ERunner(project.rootDir);

    console.log('\n🚀 Testing full quest flow with parallel agents...\n');
    
    // Execute the main command with streaming to see multiple agents
    const result = await runner.executeCommand(
      '/questmaestro',
      '',
      { streaming: true, timeout: 1200000 } // 20 min timeout
    );
    
    expect(result.success).toBe(true);
    
    // Verify output contains expected phases
    expect(result.stdout).toContain('Spawning');
    expect(result.stdout).toContain('Codeweaver');
    expect(result.stdout).toContain('implementations complete');
    expect(result.stdout).toContain('Lawbringer');
    expect(result.stdout).toContain('Siegemaster');
    expect(result.stdout).toContain('Quest complete!');
    
    // Check that implementation files were created
    const files = ['addNumbers.ts', 'multiplyNumbers.ts'];
    for (const file of files) {
      const filePath = path.join(project.rootDir, 'src', file);
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Verify files have actual content
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('function');
      expect(content).toContain('export');
    }
    
    // Check that test files were created by Siegemaster
    const testFiles = ['addNumbers.test.ts', 'multiplyNumbers.test.ts'];
    for (const file of testFiles) {
      const filePath = path.join(project.rootDir, 'src', file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
    
    // Verify quest moved to completed
    const completedQuests = fs.readdirSync(
      path.join(project.rootDir, 'questmaestro/completed')
    );
    expect(completedQuests).toHaveLength(1);
    expect(completedQuests[0]).toContain('add-math-utils');
    
    // Verify quest file has all expected data
    const questData = JSON.parse(
      fs.readFileSync(
        path.join(project.rootDir, 'questmaestro/completed', completedQuests[0]),
        'utf8'
      )
    );
    
    // Check all phases completed
    expect(questData.status).toBe('completed');
    expect(questData.phases.discovery.status).toBe('complete');
    expect(questData.phases.implementation.status).toBe('complete');
    expect(questData.phases.review.status).toBe('complete');
    expect(questData.phases.testing.status).toBe('complete');
    
    // Verify agent reports were stored
    expect(questData.agentReports).toBeDefined();
    expect(questData.agentReports.codeweaver).toBeInstanceOf(Array);
    expect(questData.agentReports.codeweaver.length).toBeGreaterThanOrEqual(2);
    expect(questData.agentReports.lawbringer).toBeInstanceOf(Array);
    expect(questData.agentReports.lawbringer.length).toBeGreaterThan(0);
    expect(questData.agentReports.siegemaster).toBeInstanceOf(Array);
    expect(questData.agentReports.siegemaster.length).toBeGreaterThan(0);
    
    // Check agent reports are arrays of strings
    const firstCodeweaverReport = questData.agentReports.codeweaver[0];
    expect(firstCodeweaverReport.fullReport).toBeInstanceOf(Array);
    expect(firstCodeweaverReport.fullReport[0]).toBe('=== CODEWEAVER IMPLEMENTATION REPORT ===');
    
    // Verify retrospective was created
    const retros = fs.readdirSync(
      path.join(project.rootDir, 'questmaestro/retros')
    );
    expect(retros.length).toBeGreaterThan(0);
    expect(retros[0]).toMatch(/\d{8}-add-math-utils\.md/);
    
    // Verify activity log has entries
    expect(questData.activity).toBeDefined();
    expect(questData.activity.length).toBeGreaterThan(5); // Should have many activities
    
    // Check quest was moved to completed folder
    const activeFiles = fs.readdirSync(path.join(project.rootDir, 'questmaestro/active'));
    expect(activeFiles).toHaveLength(0);
    
    const completedFiles = fs.readdirSync(path.join(project.rootDir, 'questmaestro/completed'));
    expect(completedFiles).toContain(completedQuests[0]);
  }, 1200000); // 20 minute timeout

});

