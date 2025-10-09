# The Init Script - Post-Install Automation

## Purpose

The `init-claude-docs.js` script runs automatically after `npm install` to:

1. Create `.claude/` directory structure
2. Symlink framework docs from node_modules
3. Generate root CLAUDE.md if missing
4. Create .gitignore for framework docs
5. Set up custom docs directory

## Full Implementation

**File:** `@questmaestro/standards/bin/init-claude-docs.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Helpers
// ============================================================================

function findProjectRoot() {
  let currentDir = process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find project root (no package.json)');
}

function createSymlinkSafe(target, linkPath) {
  const isWindows = process.platform === 'win32';
  const targetIsDir = fs.statSync(target).isDirectory();

  // Remove existing symlink/file if it exists
  if (fs.existsSync(linkPath)) {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });

  try {
    if (isWindows && targetIsDir) {
      // Windows: Use junction for directories
      execSync(`mklink /J "${linkPath}" "${target}"`, { stdio: 'ignore' });
    } else {
      // Unix or Windows files: Use symlink
      fs.symlinkSync(target, linkPath, targetIsDir ? 'dir' : 'file');
    }
    console.log(`  ✓ Linked ${path.basename(linkPath)}`);
  } catch (error) {
    console.warn(`  ⚠ Could not create symlink for ${linkPath}, copying instead...`);
    copyRecursive(target, linkPath);
  }
}

function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function getPackageVersion(packageName) {
  try {
    const pkgJson = require(path.join(packageName, 'package.json'));
    return pkgJson.version;
  } catch {
    return 'unknown';
  }
}

function detectProjectInfo(projectRoot) {
  const pkgJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
  );

  return {
    name: pkgJson.name || 'unknown-project',
    hasReact: !!pkgJson.dependencies?.react || !!pkgJson.devDependencies?.react,
    hasVue: !!pkgJson.dependencies?.vue || !!pkgJson.devDependencies?.vue,
    hasExpress: !!pkgJson.dependencies?.express,
    hasFastify: !!pkgJson.dependencies?.fastify,
  };
}

function checkVersionAlignment() {
  const projectRoot = findProjectRoot();
  const pkgJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
  );
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

  const versions = {
    standards: deps['@questmaestro/standards'],
    testing: deps['@questmaestro/testing'],
    eslint: deps['@questmaestro/eslint-plugin'],
    hooks: deps['@questmaestro/hooks'],
  };

  const getMajor = (ver) => ver ? parseInt(ver.replace(/[^0-9.]/g, '').split('.')[0]) : null;

  const majors = Object.values(versions).filter(Boolean).map(getMajor);
  const allSame = majors.every(v => v === majors[0]);

  if (!allSame) {
    console.warn(`
⚠️  WARNING: Version mismatch detected!

  @questmaestro/standards:     ${versions.standards || 'not installed'}
  @questmaestro/testing:        ${versions.testing || 'not installed'}
  @questmaestro/eslint-plugin: ${versions.eslint || 'not installed'}
  @questmaestro/hooks:          ${versions.hooks || 'not installed'}

All @questmaestro packages should have matching major versions.
Run: npm update @questmaestro/standards @questmaestro/testing @questmaestro/eslint-plugin @questmaestro/hooks
    `);
  }
}

// ============================================================================
// Main Setup
// ============================================================================

async function initClaudeDocs() {
  console.log('\n🚀 Initializing Quest Maestro Claude documentation...\n');

  const projectRoot = findProjectRoot();
  const claudeDir = path.join(projectRoot, '.claude');
  const frameworkDir = path.join(claudeDir, '_framework');
  const customDir = path.join(claudeDir, 'custom');

  // Create directory structure
  fs.mkdirSync(frameworkDir, { recursive: true });
  fs.mkdirSync(customDir, { recursive: true });

  console.log('📁 Setting up framework documentation links...\n');

  // Link @questmaestro/standards docs
  try {
    const standardsPath = require.resolve('@questmaestro/standards/package.json');
    const standardsRoot = path.dirname(standardsPath);
    createSymlinkSafe(
      path.join(standardsRoot, 'docs'),
      path.join(frameworkDir, 'standards')
    );
  } catch (error) {
    console.warn('⚠ @questmaestro/standards not found, skipping...');
  }

  // Link @questmaestro/testing docs
  try {
    const testingPath = require.resolve('@questmaestro/testing/package.json');
    const testingRoot = path.dirname(testingPath);
    createSymlinkSafe(
      path.join(testingRoot, 'docs'),
      path.join(frameworkDir, 'testing')
    );
  } catch (error) {
    console.warn('⚠ @questmaestro/testing not found, skipping...');
  }

  // Link @questmaestro/eslint-plugin docs
  try {
    const eslintPath = require.resolve('@questmaestro/eslint-plugin/package.json');
    const eslintRoot = path.dirname(eslintPath);
    createSymlinkSafe(
      path.join(eslintRoot, 'docs'),
      path.join(frameworkDir, 'lint')
    );
  } catch (error) {
    console.warn('⚠ @questmaestro/eslint-plugin not found, skipping...');
  }

  // Generate .claude/.gitignore
  console.log('\n📝 Creating .gitignore...\n');
  fs.writeFileSync(
    path.join(claudeDir, '.gitignore'),
    `# Auto-generated framework docs (symlinked from node_modules)
# These update automatically when you update @questmaestro packages
_framework/

# Keep custom docs (commit these)
!custom/
`
  );
  console.log('  ✓ Created .claude/.gitignore');

  // Generate root CLAUDE.md if it doesn't exist
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    console.log('\n📝 Generating root CLAUDE.md...\n');

    const projectInfo = detectProjectInfo(projectRoot);
    const template = generateClaudeMdTemplate(projectInfo);

    fs.writeFileSync(claudeMdPath, template);
    console.log('  ✓ Created CLAUDE.md');
  } else {
    console.log('\n  ℹ CLAUDE.md already exists, skipping...');
  }

  // Create starter custom docs
  const customReadmePath = path.join(customDir, 'README.md');
  if (!fs.existsSync(customReadmePath)) {
    console.log('\n📝 Creating custom docs templates...\n');
    fs.writeFileSync(
      customReadmePath,
      `# Project-Specific Claude Documentation

This directory contains documentation specific to this project that supplements
the Quest Maestro framework docs.

## Files to Create

- **business-domain.md** - Your app's business logic, domain models, workflows
- **tech-stack.md** - Stack-specific patterns (React hooks, Express middleware, etc.)
- **team-conventions.md** - Team-specific preferences and conventions
- **api-endpoints.md** - API structure and endpoint documentation
- **database-schema.md** - Database tables, relationships, migrations

## Loading Strategy

Claude will load:
1. Framework docs from \`.claude/_framework/\` (universal patterns)
2. Your custom docs from here (project-specific context)

Keep each doc focused and < 500 lines for optimal LLM context loading.
`
    );
    console.log('  ✓ Created custom/README.md');
  }

  // Check version alignment
  console.log('\n🔍 Checking package version alignment...\n');
  checkVersionAlignment();

  console.log('\n✅ Quest Maestro documentation initialized!\n');
  console.log('📂 Structure:');
  console.log('   .claude/');
  console.log('   ├── _framework/     (auto-synced from @questmaestro packages)');
  console.log('   └── custom/         (your project-specific docs - commit these)');
  console.log('   CLAUDE.md           (root orchestrator)');
  console.log('\n💡 Next steps:');
  console.log('   1. Review CLAUDE.md and customize for your project');
  console.log('   2. Add project-specific docs to .claude/custom/');
  console.log('   3. Read .claude/_framework/standards/core-rules.md (10 min)');
  console.log('   4. Optional: Run `npx @questmaestro/standards scaffold` to generate starter files');
  console.log('');
}

function generateClaudeMdTemplate(projectInfo) {
  const versions = {
    standards: getPackageVersion('@questmaestro/standards'),
    testing: getPackageVersion('@questmaestro/testing'),
    eslint: getPackageVersion('@questmaestro/eslint-plugin'),
    hooks: getPackageVersion('@questmaestro/hooks'),
  };

  let techStackSection = '';
  if (projectInfo.hasReact) {
    techStackSection += '- **Frontend:** React\n';
  }
  if (projectInfo.hasVue) {
    techStackSection += '- **Frontend:** Vue\n';
  }
  if (projectInfo.hasExpress) {
    techStackSection += '- **Backend:** Express\n';
  }
  if (projectInfo.hasFastify) {
    techStackSection += '- **Backend:** Fastify\n';
  }

  return `# Project: ${projectInfo.name}

**Architecture:** Quest Maestro Standards

This project uses the Quest Maestro framework for LLM-guided development.
Framework documentation lives in \`.claude/_framework/\` (auto-synced from npm).

---

## 🚨 CRITICAL: Anti-Training-Data Mode Active

Your training data will mislead you. Read:
- \`.claude/_framework/standards/anti-patterns/training-data-traps.md\` (5 min)

**Core violations that will fail lint:**
- ❌ Creating \`utils/\`, \`helpers/\`, \`lib/\` folders
- ❌ Using raw \`string\`/\`number\` types
- ❌ Multiple exports per file
- ❌ Using \`export default\`

---

## 📚 Documentation Loading Strategy

### Always Loaded
1. This file (CLAUDE.md)
2. \`.claude/_framework/standards/core-rules.md\`

### Load On-Demand

| Task | Load Files |
|------|-----------|
| **Contracts/schemas** | \`.claude/_framework/standards/folders/contracts-guide.md\` |
| **Business logic** | \`.claude/_framework/standards/folders/brokers-guide.md\` |
| **Data transformation** | \`.claude/_framework/standards/folders/transformers-guide.md\` |
| **External package** | \`.claude/_framework/standards/folders/adapters-guide.md\` |
| **UI components** | \`.claude/_framework/standards/folders/frontend-guide.md\` |
| **Testing** | \`.claude/_framework/testing/testing-standards.md\` |
| **Unsure which folder** | \`.claude/_framework/standards/decisions/which-folder.md\` |
| **Create vs extend** | \`.claude/_framework/standards/decisions/extend-vs-create.md\` |

---

## 🔄 Workflow

1. Parse user request → Identify task type
2. Load framework guide (~400-500 lines)
3. Load project context from \`.claude/custom/\` if relevant
4. Search for existing files (extend vs create)
5. Generate code with inline rule annotations
6. Verify against checklist
7. Lint validates (pre-commit)

**Total context per task: ~800-1200 lines**

---

## 🎯 Project Info

### Tech Stack
${techStackSection || '- **Tech stack:** (Add to .claude/custom/tech-stack.md)'}

### Framework Versions

- **@questmaestro/standards**: v${versions.standards}
- **@questmaestro/testing**: v${versions.testing}
- **@questmaestro/eslint-plugin**: v${versions.eslint}
- **@questmaestro/hooks**: v${versions.hooks}

**To update:** \`npm update @questmaestro/standards\` (symlinks auto-sync)

---

## 🆘 Troubleshooting

**If lint fails:**
1. Read: \`.claude/_framework/lint/rule-explanations.md\`
2. Check: \`.claude/_framework/standards/anti-patterns/\`
3. Verify: \`.claude/_framework/standards/folders/[folder]-guide.md\`
`;
}

// ============================================================================
// Run
// ============================================================================

initClaudeDocs().catch((error) => {
  console.error('❌ Error initializing Claude docs:', error.message);
  process.exit(1);
});
```

## package.json Integration

```json
{
  "name": "@questmaestro/standards",
  "version": "1.0.0",
  "bin": {
    "init-claude-docs": "./bin/init-claude-docs.js"
  },
  "scripts": {
    "postinstall": "node ./bin/init-claude-docs.js || true"
  }
}
```

**Note:** `|| true` ensures installation doesn't fail if script errors (graceful degradation)

## Execution Flow

### Automatic (Post-Install)

```bash
npm install @questmaestro/standards
# → Triggers postinstall script
# → Runs init-claude-docs.js automatically
```

### Manual

```bash
npx @questmaestro/standards init-claude-docs
# → Runs script manually
# → Useful for re-initialization
```

## What Gets Created

**Directory structure:**

```
.claude/
├── .gitignore              ← Generated
├── _framework/             ← Symlinks (or copies)
│   ├── standards/
│   ├── testing/
│   └── lint/
└── custom/                 ← Template
    └── README.md
```

**Root file:**

```
CLAUDE.md                   ← Generated if missing
```

## Console Output

```
🚀 Initializing Quest Maestro Claude documentation...

📁 Setting up framework documentation links...

  ✓ Linked standards
  ✓ Linked testing
  ✓ Linked lint

📝 Creating .gitignore...
  ✓ Created .claude/.gitignore

📝 Generating root CLAUDE.md...
  ✓ Created CLAUDE.md

📝 Creating custom docs templates...
  ✓ Created custom/README.md

🔍 Checking package version alignment...

✅ Quest Maestro documentation initialized!

📂 Structure:
   .claude/
   ├── _framework/     (auto-synced from @questmaestro packages)
   └── custom/         (your project-specific docs - commit these)
   CLAUDE.md           (root orchestrator)

💡 Next steps:
   1. Review CLAUDE.md and customize for your project
   2. Add project-specific docs to .claude/custom/
   3. Read .claude/_framework/standards/core-rules.md (10 min)
   4. Optional: Run `npx @questmaestro/standards scaffold` to generate starter files
```

## Error Handling

### Graceful Degradation

**If symlink fails:**

```javascript
try {
    fs.symlinkSync(target, linkPath);
} catch (error) {
    console.warn('⚠ Symlink failed, copying instead...');
    copyRecursive(target, linkPath);
}
```

**If package not found:**

```javascript
try {
    const pkgPath = require.resolve('@questmaestro/testing/package.json');
    // ...link docs
} catch (error) {
    console.warn('⚠ @questmaestro/testing not found, skipping...');
    // Continue without error
}
```

**If CLAUDE.md exists:**

```javascript
if (fs.existsSync(claudeMdPath)) {
    console.log('ℹ CLAUDE.md already exists, skipping...');
    // Don't overwrite
}
```

## Key Takeaways

1. **Runs automatically** on `npm install` (postinstall hook)
2. **Cross-platform** symlinks (junctions on Windows)
3. **Graceful fallback** to copy if symlinks fail
4. **Idempotent** - safe to run multiple times
5. **Version checking** - warns about mismatched packages
6. **Smart detection** - discovers project tech stack

## Next Steps

- **[Root CLAUDE.md Orchestrator](07-root-claude-orchestrator.md)** - Template details
- **[Scaffold System](11-scaffold-system.md)** - Generating starter files
- **[Version Management](12-version-management.md)** - Keeping packages aligned
