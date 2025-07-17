# Task 19: Retrospectives

## Objective
Generate comprehensive quest retrospectives from agent reports, capturing lessons learned and patterns discovered.

## Dependencies
- Task 18: Quest Completion (for retrospective trigger)
- Task 08: Report Parsing (for collecting notes)

## Implementation

### 1. Retrospective Analyzer

**File: src/cli/retrospectives/retrospective-analyzer.ts**
```typescript
import { GroupedRetrospectives, AnnotatedRetrospectiveNote } from '../report-aggregator';
import { Quest } from '../types/quest';

export interface RetrospectiveAnalysis {
  themes: Theme[];
  patterns: Pattern[];
  insights: Insight[];
  recommendations: string[];
}

export interface Theme {
  name: string;
  frequency: number;
  notes: AnnotatedRetrospectiveNote[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Pattern {
  type: 'success' | 'challenge' | 'blocker';
  description: string;
  occurrences: number;
  agents: string[];
}

export interface Insight {
  category: string;
  finding: string;
  evidence: string[];
  actionable: boolean;
}

/**
 * Analyzes retrospective notes to find themes and patterns
 */
export function analyzeRetrospectives(
  quest: Quest,
  retrospectives: GroupedRetrospectives
): RetrospectiveAnalysis {
  const themes = extractThemes(retrospectives);
  const patterns = findPatterns(retrospectives);
  const insights = generateInsights(quest, retrospectives);
  const recommendations = generateRecommendations(themes, patterns, insights);
  
  return {
    themes,
    patterns,
    insights,
    recommendations,
  };
}

/**
 * Extracts common themes from notes
 */
function extractThemes(retrospectives: GroupedRetrospectives): Theme[] {
  const themeMap = new Map<string, Theme>();
  
  // Common theme keywords
  const themeKeywords = {
    'Type System': ['type', 'typescript', 'interface', 'generic', 'typing'],
    'Testing': ['test', 'coverage', 'jest', 'unit', 'integration'],
    'Architecture': ['architecture', 'structure', 'pattern', 'design'],
    'Dependencies': ['dependency', 'package', 'module', 'import'],
    'Performance': ['performance', 'speed', 'optimization', 'efficient'],
    'Code Quality': ['quality', 'clean', 'maintainable', 'readable'],
    'Error Handling': ['error', 'exception', 'catch', 'handle'],
    'Documentation': ['documentation', 'docs', 'comment', 'readme'],
  };
  
  // Analyze all notes
  for (const note of retrospectives.all) {
    const noteText = note.note.toLowerCase();
    
    for (const [themeName, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => noteText.includes(keyword))) {
        if (!themeMap.has(themeName)) {
          themeMap.set(themeName, {
            name: themeName,
            frequency: 0,
            notes: [],
            sentiment: 'neutral',
          });
        }
        
        const theme = themeMap.get(themeName)!;
        theme.frequency++;
        theme.notes.push(note);
      }
    }
  }
  
  // Determine sentiment for each theme
  for (const theme of themeMap.values()) {
    const sentiment = analyzeSentiment(theme.notes);
    theme.sentiment = sentiment;
  }
  
  // Sort by frequency
  return Array.from(themeMap.values())
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Finds patterns in retrospectives
 */
function findPatterns(retrospectives: GroupedRetrospectives): Pattern[] {
  const patterns: Pattern[] = [];
  
  // Success patterns
  const successNotes = retrospectives.byCategory['what_worked_well'] || [];
  if (successNotes.length >= 2) {
    const successAgents = [...new Set(successNotes.map(n => n.agent))];
    
    patterns.push({
      type: 'success',
      description: 'Consistent successful implementations',
      occurrences: successNotes.length,
      agents: successAgents,
    });
  }
  
  // Challenge patterns
  const challengeNotes = retrospectives.byCategory['challenges_encountered'] || [];
  const challengeTypes = groupChallenges(challengeNotes);
  
  for (const [type, notes] of challengeTypes.entries()) {
    if (notes.length >= 2) {
      patterns.push({
        type: 'challenge',
        description: `Recurring ${type} challenges`,
        occurrences: notes.length,
        agents: [...new Set(notes.map(n => n.agent))],
      });
    }
  }
  
  // Blocker patterns
  const blockerKeywords = ['blocked', 'failed', 'unable', 'could not'];
  const blockerNotes = retrospectives.all.filter(note =>
    blockerKeywords.some(keyword => note.note.toLowerCase().includes(keyword))
  );
  
  if (blockerNotes.length > 0) {
    patterns.push({
      type: 'blocker',
      description: 'Blocking issues encountered',
      occurrences: blockerNotes.length,
      agents: [...new Set(blockerNotes.map(n => n.agent))],
    });
  }
  
  return patterns;
}

/**
 * Generates insights from analysis
 */
function generateInsights(
  quest: Quest,
  retrospectives: GroupedRetrospectives
): Insight[] {
  const insights: Insight[] = [];
  
  // Task completion insights
  const completionRate = quest.tasks.filter(t => t.status === 'complete').length / quest.tasks.length;
  if (completionRate === 1) {
    insights.push({
      category: 'Execution',
      finding: 'All tasks completed successfully',
      evidence: [`${quest.tasks.length} tasks completed`],
      actionable: false,
    });
  } else if (completionRate < 0.8) {
    insights.push({
      category: 'Execution',
      finding: 'Low task completion rate',
      evidence: [`Only ${Math.round(completionRate * 100)}% of tasks completed`],
      actionable: true,
    });
  }
  
  // Agent collaboration insights
  const agentCount = Object.keys(retrospectives.byAgent).length;
  if (agentCount > 4) {
    insights.push({
      category: 'Collaboration',
      finding: 'High agent collaboration',
      evidence: [`${agentCount} different agents contributed`],
      actionable: false,
    });
  }
  
  // Learning insights
  const learningNotes = retrospectives.byCategory['lessons_for_future'] || [];
  if (learningNotes.length > 3) {
    insights.push({
      category: 'Learning',
      finding: 'Rich learning experience',
      evidence: learningNotes.map(n => n.note.substring(0, 50) + '...'),
      actionable: true,
    });
  }
  
  // Technical debt insights
  const debtKeywords = ['todo', 'fixme', 'hack', 'temporary', 'refactor'];
  const debtNotes = retrospectives.all.filter(note =>
    debtKeywords.some(keyword => note.note.toLowerCase().includes(keyword))
  );
  
  if (debtNotes.length > 0) {
    insights.push({
      category: 'Technical Debt',
      finding: 'Technical debt introduced',
      evidence: debtNotes.map(n => `${n.agent}: ${n.note.substring(0, 50)}...`),
      actionable: true,
    });
  }
  
  return insights;
}

/**
 * Generates actionable recommendations
 */
function generateRecommendations(
  themes: Theme[],
  patterns: Pattern[],
  insights: Insight[]
): string[] {
  const recommendations: string[] = [];
  
  // Theme-based recommendations
  for (const theme of themes) {
    if (theme.sentiment === 'negative' && theme.frequency > 2) {
      recommendations.push(
        `Address ${theme.name.toLowerCase()} issues - ${theme.frequency} concerns raised`
      );
    }
  }
  
  // Pattern-based recommendations
  const challengePatterns = patterns.filter(p => p.type === 'challenge');
  if (challengePatterns.length > 0) {
    recommendations.push(
      'Create guidelines to address recurring challenges'
    );
  }
  
  const blockerPatterns = patterns.filter(p => p.type === 'blocker');
  if (blockerPatterns.length > 0) {
    recommendations.push(
      'Investigate and document solutions for common blockers'
    );
  }
  
  // Insight-based recommendations
  const actionableInsights = insights.filter(i => i.actionable);
  for (const insight of actionableInsights) {
    if (insight.category === 'Technical Debt') {
      recommendations.push(
        'Schedule technical debt cleanup tasks'
      );
    } else if (insight.category === 'Learning') {
      recommendations.push(
        'Document learnings in project knowledge base'
      );
    }
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Continue with current practices');
  }
  
  return [...new Set(recommendations)]; // Remove duplicates
}

/**
 * Analyzes sentiment of notes
 */
function analyzeSentiment(notes: AnnotatedRetrospectiveNote[]): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['success', 'well', 'good', 'great', 'excellent', 'easy', 'smooth'];
  const negativeWords = ['fail', 'error', 'difficult', 'hard', 'problem', 'issue', 'challenge'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const note of notes) {
    const noteText = note.note.toLowerCase();
    
    positiveCount += positiveWords.filter(word => noteText.includes(word)).length;
    negativeCount += negativeWords.filter(word => noteText.includes(word)).length;
  }
  
  if (positiveCount > negativeCount * 1.5) return 'positive';
  if (negativeCount > positiveCount * 1.5) return 'negative';
  return 'neutral';
}

/**
 * Groups challenges by type
 */
function groupChallenges(
  challenges: AnnotatedRetrospectiveNote[]
): Map<string, AnnotatedRetrospectiveNote[]> {
  const groups = new Map<string, AnnotatedRetrospectiveNote[]>();
  
  const typeKeywords = {
    'type-system': ['type', 'typescript', 'interface'],
    'dependency': ['dependency', 'package', 'module'],
    'testing': ['test', 'jest', 'coverage'],
    'integration': ['integration', 'api', 'connection'],
  };
  
  for (const challenge of challenges) {
    const noteText = challenge.note.toLowerCase();
    let grouped = false;
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => noteText.includes(keyword))) {
        if (!groups.has(type)) {
          groups.set(type, []);
        }
        groups.get(type)!.push(challenge);
        grouped = true;
        break;
      }
    }
    
    if (!grouped) {
      if (!groups.has('other')) {
        groups.set('other', []);
      }
      groups.get('other')!.push(challenge);
    }
  }
  
  return groups;
}
```

### 2. Lore Extractor

**File: src/cli/retrospectives/lore-extractor.ts**
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { GroupedRetrospectives } from '../report-aggregator';
import { DIRECTORIES } from '../directory-manager';
import { RetrospectiveAnalysis } from './retrospective-analyzer';
import chalk from 'chalk';

export interface LoreEntry {
  title: string;
  category: string;
  content: string;
  source: string;
  date: string;
  tags: string[];
}

/**
 * Extracts lore entries from retrospectives
 */
export async function extractLore(
  questTitle: string,
  analysis: RetrospectiveAnalysis,
  retrospectives: GroupedRetrospectives
): Promise<LoreEntry[]> {
  const loreEntries: LoreEntry[] = [];
  
  // Extract from patterns
  for (const pattern of analysis.patterns) {
    if (pattern.type === 'success' && pattern.occurrences >= 3) {
      loreEntries.push({
        title: `Successful Pattern: ${pattern.description}`,
        category: 'patterns',
        content: formatPatternLore(pattern, retrospectives),
        source: questTitle,
        date: new Date().toISOString(),
        tags: ['pattern', 'success', ...pattern.agents],
      });
    }
  }
  
  // Extract from insights
  for (const insight of analysis.insights) {
    if (insight.actionable && insight.category === 'Learning') {
      loreEntries.push({
        title: insight.finding,
        category: 'learnings',
        content: formatInsightLore(insight),
        source: questTitle,
        date: new Date().toISOString(),
        tags: ['learning', insight.category.toLowerCase()],
      });
    }
  }
  
  // Extract from specific categories
  const architectureNotes = retrospectives.byCategory['architecture'] || [];
  const gotchaNotes = retrospectives.byCategory['gotcha'] || [];
  const bestPracticeNotes = retrospectives.byCategory['best_practice'] || [];
  
  // Architecture decisions
  for (const note of architectureNotes) {
    loreEntries.push({
      title: `Architecture: ${note.note.substring(0, 50)}...`,
      category: 'architecture',
      content: note.note,
      source: questTitle,
      date: new Date().toISOString(),
      tags: ['architecture', note.agent],
    });
  }
  
  // Gotchas
  for (const note of gotchaNotes) {
    loreEntries.push({
      title: `Gotcha: ${note.note.substring(0, 50)}...`,
      category: 'gotchas',
      content: note.note,
      source: questTitle,
      date: new Date().toISOString(),
      tags: ['gotcha', 'warning', note.agent],
    });
  }
  
  return loreEntries;
}

/**
 * Saves lore entries to files
 */
export async function saveLoreEntries(entries: LoreEntry[]): Promise<void> {
  if (entries.length === 0) return;
  
  console.log(chalk.cyan(`\n📚 Saving ${entries.length} lore entries...`));
  
  for (const entry of entries) {
    const filename = generateLoreFilename(entry);
    const filepath = path.join(DIRECTORIES.lore, filename);
    
    const content = formatLoreFile(entry);
    
    try {
      await fs.writeFile(filepath, content);
      console.log(chalk.gray(`  ✓ ${filename}`));
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to save ${filename}: ${error.message}`));
    }
  }
}

/**
 * Formats pattern as lore content
 */
function formatPatternLore(
  pattern: Pattern,
  retrospectives: GroupedRetrospectives
): string {
  const lines = [pattern.description];
  
  lines.push(`\nObserved ${pattern.occurrences} times across: ${pattern.agents.join(', ')}`);
  
  // Include relevant notes
  const relevantNotes = retrospectives.all.filter(note =>
    pattern.agents.includes(note.agent)
  ).slice(0, 3);
  
  if (relevantNotes.length > 0) {
    lines.push('\nExamples:');
    relevantNotes.forEach(note => {
      lines.push(`- ${note.agent}: ${note.note}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Formats insight as lore content
 */
function formatInsightLore(insight: Insight): string {
  const lines = [insight.finding];
  
  if (insight.evidence.length > 0) {
    lines.push('\nEvidence:');
    insight.evidence.forEach(e => lines.push(`- ${e}`));
  }
  
  return lines.join('\n');
}

/**
 * Generates filename for lore entry
 */
function generateLoreFilename(entry: LoreEntry): string {
  const category = entry.category.toLowerCase().replace(/\s+/g, '-');
  const title = entry.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 50);
  
  return `${category}-${title}.md`;
}

/**
 * Formats lore entry as markdown file
 */
function formatLoreFile(entry: LoreEntry): string {
  return `# ${entry.title}

**Category**: ${entry.category}
**Source**: ${entry.source}
**Date**: ${new Date(entry.date).toLocaleDateString()}
**Tags**: ${entry.tags.join(', ')}

## Content

${entry.content}

## Context

This knowledge was extracted from the quest "${entry.source}" based on patterns and insights discovered during implementation.

---

*Generated by Questmaestro retrospective analysis*
`;
}

/**
 * Searches existing lore for similar entries
 */
export async function findSimilarLore(entry: LoreEntry): Promise<string[]> {
  try {
    const files = await fs.readdir(DIRECTORIES.lore);
    const similar: string[] = [];
    
    // Simple keyword matching
    const keywords = entry.tags.concat(
      entry.title.toLowerCase().split(/\s+/)
    );
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(
          path.join(DIRECTORIES.lore, file),
          'utf-8'
        );
        
        const matches = keywords.filter(keyword =>
          content.toLowerCase().includes(keyword)
        ).length;
        
        if (matches >= 2) {
          similar.push(file);
        }
      }
    }
    
    return similar;
  } catch {
    return [];
  }
}
```

## Unit Tests

**File: src/cli/retrospectives/retrospective-analyzer.test.ts**
```typescript
import { analyzeRetrospectives } from './retrospective-analyzer';
import { GroupedRetrospectives } from '../report-aggregator';
import { Quest } from '../types/quest';

describe('RetrospectiveAnalyzer', () => {
  const mockQuest: Quest = {
    id: 'test-123',
    folder: '01-test',
    title: 'Test Quest',
    status: 'complete',
    tasks: [
      { id: '1', status: 'complete' },
      { id: '2', status: 'complete' },
      { id: '3', status: 'failed' },
    ],
  } as Quest;

  const mockRetrospectives: GroupedRetrospectives = {
    byAgent: {
      'codeweaver': [
        { category: 'what_worked_well', note: 'TypeScript types helped catch errors', agent: 'codeweaver', report: '001' },
        { category: 'challenges_encountered', note: 'Complex type system requirements', agent: 'codeweaver', report: '002' },
      ],
      'pathseeker': [
        { category: 'architecture', note: 'Chose modular architecture for flexibility', agent: 'pathseeker', report: '001' },
      ],
    },
    byCategory: {
      'what_worked_well': [
        { category: 'what_worked_well', note: 'TypeScript types helped', agent: 'codeweaver', report: '001' },
        { category: 'what_worked_well', note: 'Good test coverage', agent: 'siegemaster', report: '003' },
      ],
      'challenges_encountered': [
        { category: 'challenges_encountered', note: 'Type system complexity', agent: 'codeweaver', report: '002' },
        { category: 'challenges_encountered', note: 'Integration testing difficult', agent: 'siegemaster', report: '004' },
      ],
    },
    all: [
      { category: 'what_worked_well', note: 'TypeScript types helped catch errors', agent: 'codeweaver', report: '001' },
      { category: 'challenges_encountered', note: 'Complex type system requirements', agent: 'codeweaver', report: '002' },
      { category: 'architecture', note: 'Chose modular architecture', agent: 'pathseeker', report: '001' },
      { category: 'what_worked_well', note: 'Good test coverage', agent: 'siegemaster', report: '003' },
      { category: 'challenges_encountered', note: 'Integration testing difficult', agent: 'siegemaster', report: '004' },
    ],
  };

  describe('analyzeRetrospectives', () => {
    it('should extract themes', () => {
      const analysis = analyzeRetrospectives(mockQuest, mockRetrospectives);

      const typeTheme = analysis.themes.find(t => t.name === 'Type System');
      expect(typeTheme).toBeDefined();
      expect(typeTheme!.frequency).toBe(2);
      expect(typeTheme!.notes).toHaveLength(2);
    });

    it('should identify patterns', () => {
      const analysis = analyzeRetrospectives(mockQuest, mockRetrospectives);

      const successPattern = analysis.patterns.find(p => p.type === 'success');
      expect(successPattern).toBeDefined();
      expect(successPattern!.occurrences).toBe(2);

      const challengePattern = analysis.patterns.find(p => p.type === 'challenge');
      expect(challengePattern).toBeDefined();
    });

    it('should generate insights', () => {
      const analysis = analyzeRetrospectives(mockQuest, mockRetrospectives);

      const executionInsight = analysis.insights.find(i => i.category === 'Execution');
      expect(executionInsight).toBeDefined();
      expect(executionInsight!.finding).toContain('Low task completion rate');
    });

    it('should provide recommendations', () => {
      const analysis = analyzeRetrospectives(mockQuest, mockRetrospectives);

      expect(analysis.recommendations).toContain(
        'Create guidelines to address recurring challenges'
      );
    });

    it('should detect sentiment correctly', () => {
      const positiveRetros: GroupedRetrospectives = {
        ...mockRetrospectives,
        all: [
          { category: 'success', note: 'Everything went great and smooth', agent: 'test', report: '001' },
          { category: 'success', note: 'Excellent results achieved easily', agent: 'test', report: '002' },
        ],
      };

      const analysis = analyzeRetrospectives(mockQuest, positiveRetros);
      
      // Should have positive sentiment themes
      expect(analysis.themes.some(t => t.sentiment === 'positive')).toBe(true);
    });
  });
});
```

**File: src/cli/retrospectives/lore-extractor.test.ts**
```typescript
import { extractLore, saveLoreEntries, generateLoreFilename } from './lore-extractor';
import { RetrospectiveAnalysis } from './retrospective-analyzer';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('LoreExtractor', () => {
  const mockAnalysis: RetrospectiveAnalysis = {
    themes: [],
    patterns: [
      {
        type: 'success',
        description: 'Consistent TypeScript usage',
        occurrences: 5,
        agents: ['codeweaver', 'pathseeker'],
      },
    ],
    insights: [
      {
        category: 'Learning',
        finding: 'Type safety prevents runtime errors',
        evidence: ['No type-related bugs in production'],
        actionable: true,
      },
    ],
    recommendations: [],
  };

  const mockRetrospectives = {
    byAgent: {},
    byCategory: {
      'architecture': [
        {
          category: 'architecture',
          note: 'Hexagonal architecture provides good separation',
          agent: 'pathseeker',
          report: '001',
        },
      ],
      'gotcha': [
        {
          category: 'gotcha',
          note: 'TypeScript strict mode can cause initial friction',
          agent: 'codeweaver',
          report: '002',
        },
      ],
    },
    all: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractLore', () => {
    it('should extract lore from patterns', async () => {
      const entries = await extractLore('Test Quest', mockAnalysis, mockRetrospectives);

      const patternEntry = entries.find(e => e.category === 'patterns');
      expect(patternEntry).toBeDefined();
      expect(patternEntry!.title).toContain('Consistent TypeScript usage');
      expect(patternEntry!.tags).toContain('success');
    });

    it('should extract lore from insights', async () => {
      const entries = await extractLore('Test Quest', mockAnalysis, mockRetrospectives);

      const learningEntry = entries.find(e => e.category === 'learnings');
      expect(learningEntry).toBeDefined();
      expect(learningEntry!.title).toBe('Type safety prevents runtime errors');
    });

    it('should extract architecture decisions', async () => {
      const entries = await extractLore('Test Quest', mockAnalysis, mockRetrospectives);

      const archEntry = entries.find(e => e.category === 'architecture');
      expect(archEntry).toBeDefined();
      expect(archEntry!.content).toContain('Hexagonal architecture');
    });

    it('should extract gotchas', async () => {
      const entries = await extractLore('Test Quest', mockAnalysis, mockRetrospectives);

      const gotchaEntry = entries.find(e => e.category === 'gotchas');
      expect(gotchaEntry).toBeDefined();
      expect(gotchaEntry!.tags).toContain('warning');
    });
  });

  describe('saveLoreEntries', () => {
    it('should save entries as markdown files', async () => {
      const entries = [
        {
          title: 'Test Pattern',
          category: 'patterns',
          content: 'Pattern content',
          source: 'Test Quest',
          date: new Date().toISOString(),
          tags: ['test'],
        },
      ];

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await saveLoreEntries(entries);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('patterns-test-pattern.md'),
        expect.stringContaining('# Test Pattern')
      );
    });

    it('should format lore files correctly', async () => {
      const entry = {
        title: 'Important Learning',
        category: 'learnings',
        content: 'Always validate inputs',
        source: 'Security Quest',
        date: '2024-01-01T00:00:00Z',
        tags: ['security', 'validation'],
      };

      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await saveLoreEntries([entry]);

      const writeCall = (fs.writeFile as jest.Mock).mock.calls[0];
      const content = writeCall[1];

      expect(content).toContain('**Category**: learnings');
      expect(content).toContain('**Source**: Security Quest');
      expect(content).toContain('**Tags**: security, validation');
      expect(content).toContain('Always validate inputs');
    });
  });
});
```

## Validation Criteria

1. **Analysis Quality**
   - [ ] Extracts meaningful themes
   - [ ] Identifies patterns correctly
   - [ ] Generates actionable insights
   - [ ] Provides useful recommendations

2. **Lore Extraction**
   - [ ] Captures important learnings
   - [ ] Identifies architectural decisions
   - [ ] Records gotchas and warnings
   - [ ] Tags entries appropriately

3. **File Generation**
   - [ ] Creates readable markdown
   - [ ] Uses consistent naming
   - [ ] Includes metadata
   - [ ] Preserves context

4. **Pattern Recognition**
   - [ ] Detects success patterns
   - [ ] Identifies challenges
   - [ ] Groups similar issues
   - [ ] Tracks frequency

5. **Knowledge Management**
   - [ ] Saves to lore directory
   - [ ] Searchable by tags
   - [ ] Links to source quest
   - [ ] Dated for relevance

## Next Steps

After completing this task:
1. Test retrospective analysis
2. Verify lore extraction
3. Check file generation
4. Test pattern detection
5. Proceed to [20-clean-command.md](20-clean-command.md)