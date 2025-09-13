#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import {execSync} from 'child_process';
import {
    isError,
    isPackageJson,
    parseJsonSafely,
    type PackageJson,
} from '../src/utils/type-guards';
import {Logger} from '../src/utils/logger';

// Directory and file constants
const CONFIG_FILE = '.questmaestro';
const PACKAGE_JSON = 'package.json';
const GITIGNORE_FILE = '.gitignore';

// Quest directory structure
const QUEST_DIR = 'questmaestro';
const QUEST_SUBDIRS = {
    active: 'active',
    completed: 'completed',
    abandoned: 'abandoned',
    retros: 'retros',
    lore: 'lore',
    discovery: 'discovery',
} as const;

// Gitignore entries
const GITIGNORE_ENTRIES = [
    '# Questmaestro local quest folders',
    'questmaestro/active/',
    'questmaestro/completed/',
    'questmaestro/abandoned/',
];

// ESLint configuration files
const ESLINT_CONFIG_FILES = [
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    'eslint.config.js',
    'eslint.config.mjs',
];

// Jest configuration files
const JEST_CONFIG_FILES = [
    'jest.config.js',
    'jest.config.ts',
    'jest.config.mjs',
    'jest.config.cjs',
    'jest.config.json',
];

// Default ESLint configuration
const DEFAULT_ESLINT_CONFIG = {
    extends: ['@eslint/js/recommended'],
    env: {
        node: true,
        es2022: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'no-unused-vars': 'warn',
        'no-console': 'off',
    },
};

// Colors for console output (used only for type)
const _colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
} as const;

type ColorKey = keyof typeof _colors;

const logger = new Logger({useColors: true, useIcons: false});

function log(message: string, color: ColorKey = 'reset') {
    switch (color) {
        case 'bright':
            logger.bright(message);
            break;
        case 'green':
            logger.green(message);
            break;
        case 'yellow':
            logger.yellow(message);
            break;
        case 'blue':
            logger.blue(message);
            break;
        case 'red':
            logger.red(message);
            break;
        default:
            logger.info(message);
    }
}

function ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
}

function setupQuestmaestroDirectories() {
    log('\n📁 Setting up Questmaestro directories...', 'bright');

    // Create questmaestro directory structure
    ensureDirectoryExists(QUEST_DIR);
    Object.entries(QUEST_SUBDIRS).forEach(([_key, subdir]) => {
        const dirPath = path.join(QUEST_DIR, subdir);
        ensureDirectoryExists(dirPath);
        log(`  ✓ Created ${dirPath}`, 'green');
    });

    // Add discovery directory for Voidpoker
    const discoveryDir = path.join(QUEST_DIR, 'discovery');
    ensureDirectoryExists(discoveryDir);
    log(`  ✓ Created ${discoveryDir}`, 'green');
}

function installEslint() {
    try {
        log('    Installing ESLint...', 'blue');
        execSync('npm install --save-dev eslint @eslint/js', {stdio: 'inherit'});

        fs.writeFileSync('.eslintrc.json', JSON.stringify(DEFAULT_ESLINT_CONFIG, null, 2));
        log('    ✓ ESLint installed and configured', 'green');

        // Add lint script to package.json if missing
        const packageJson = getPackageJson();
        if (!packageJson.scripts) packageJson.scripts = {};
        if (!packageJson.scripts.lint) {
            packageJson.scripts.lint = 'eslint .';
            fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));
            packageJsonCache = null; // Clear cache after modification
            log('    ✓ Added lint script to package.json', 'green');
        }
    } catch (error) {
        const message = isError(error) ? error.message : String(error);
        log(`    ❌ Failed to install ESLint: ${message}`, 'red');
        throw new Error('ESLint installation failed');
    }
}

function updateGitignore() {
    const gitignorePath = GITIGNORE_FILE;

    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    // Check if questmaestro entries already exist
    const hasQuestmaestroEntries = GITIGNORE_ENTRIES.some((entry) =>
        gitignoreContent.includes(entry.replace('# ', '').trim()),
    );

    if (!hasQuestmaestroEntries) {
        // Add questmaestro entries
        const entriesToAdd =
            gitignoreContent.length > 0
                ? '\n' + GITIGNORE_ENTRIES.join('\n')
                : GITIGNORE_ENTRIES.join('\n');

        fs.writeFileSync(gitignorePath, gitignoreContent + entriesToAdd + '\n');
        log('  ✓ Added questmaestro folders to .gitignore', 'green');
    } else {
        log('  ⚠️  Questmaestro gitignore entries already exist, skipping...', 'yellow');
    }
}

function installClaudeCommands() {
    log('\n🔮 Skipping Claude Commands (CLI mode)...', 'bright');

    // In CLI mode, we don't install Claude commands anymore
    // The CLI handles all quest functionality directly
    log('  ✓ CLI mode active - no Claude commands needed', 'green');
}

function updateClaudeSettings() {
    log('\n🔧 Skipping Claude Settings (CLI mode)...', 'bright');

    // In CLI mode, we don't need to update Claude settings
    // The CLI operates independently of Claude
    log('  ✓ CLI mode active - no Claude settings needed', 'green');
}

function createConfig() {
    log('\n📜 Creating Configuration...', 'bright');

    // Create .questmaestro config
    if (fs.existsSync(CONFIG_FILE)) {
        log('  ⚠️  .questmaestro already exists, skipping...', 'yellow');
    } else {
        const templatePath = getTemplatePath('templates/questmaestro.json');
        fs.copyFileSync(templatePath, CONFIG_FILE);
        log('  ✓ Created .questmaestro config file', 'green');
    }

    // Add lore categories guide
    const loreCategoriesPath = path.join(QUEST_DIR, QUEST_SUBDIRS.lore, 'README.md');
    if (!fs.existsSync(loreCategoriesPath)) {
        const categoriesTemplate = getTemplatePath('templates/lore-categories.md');
        fs.copyFileSync(categoriesTemplate, loreCategoriesPath);
        log('  ✓ Added lore categories guide', 'green');
    }

    // Add gitignore entries for local quest folders
    updateGitignore();
}

function printInstructions() {
    log('\n🏰 Quest System Installed!', 'bright');
    log('\nThe Questmaestro CLI is now available:', 'blue');
    log('  questmaestro               - Resume active quest or create new');
    log('  questmaestro list          - See all your quests');
    log('  questmaestro <task>        - Create new quest or work on existing');
    log('  questmaestro abandon       - Abandon current quest');
    log('  questmaestro start <name>  - Jump to specific quest');
    log('  questmaestro clean         - Remove old completed/abandoned quests');

    log('\n📚 Next Steps:', 'yellow');
    log('  1. Edit .questmaestro to configure for your project');
    log('  2. Start your first quest with: questmaestro <task-description>');

    log('\n⚡ Quick Examples:', 'bright');
    log('  questmaestro "add user authentication"');
    log('  questmaestro "fix login bug"');
    log('  questmaestro list');
    log('  questmaestro start auth');
}

// Cache for package.json to avoid multiple reads
let packageJsonCache: PackageJson | null = null;

function getPackageJson() {
    if (!packageJsonCache) {
        if (!fs.existsSync(PACKAGE_JSON)) {
            throw new Error('No package.json found! Questmaestro requires a Node.js project.');
        }
        const content = fs.readFileSync(PACKAGE_JSON, 'utf8');
        const parsed = parseJsonSafely(content, isPackageJson);
        if (!parsed) {
            throw new Error('Invalid package.json format');
        }
        packageJsonCache = parsed;
    }
    return packageJsonCache;
}

function getTemplatePath(relativePath: string) {
    // Try to find template in both development and compiled locations
    let templatePath = path.join(__dirname, '..', 'src', relativePath);
    if (!fs.existsSync(templatePath)) {
        templatePath = path.join(__dirname, '..', '..', 'src', relativePath);
    }
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${relativePath}`);
    }
    return templatePath;
}

function validateProject() {
    log('\n🔍 Validating Project Requirements...', 'bright');

    // Check for package.json and load it
    const packageJson = getPackageJson();
    log('  ✓ package.json found', 'green');

    // Check for ESLint configuration
    const hasEslintFile = ESLINT_CONFIG_FILES.some((file) => fs.existsSync(file));
    const hasEslintInPackage = packageJson.eslintConfig !== undefined;

    if (!hasEslintFile && !hasEslintInPackage) {
        log('  ⚠️  No ESLint configuration found, installing...', 'yellow');
        installEslint();
        // Reload package.json after ESLint installation
        packageJsonCache = null;
    } else {
        log('  ✓ ESLint configuration found', 'green');
    }

    // Check for Jest configuration (reload package.json in case it was modified)
    const currentPackageJson1 = getPackageJson();
    const hasJestFile = JEST_CONFIG_FILES.some((file) => fs.existsSync(file));
    const hasJestInPackage = currentPackageJson1.jest !== undefined;

    if (!hasJestFile && !hasJestInPackage) {
        throw new Error(
            'No Jest configuration found! Please set up Jest before installing Questmaestro.',
        );
    }
    log('  ✓ Jest configuration found', 'green');

    // Check for required scripts (reload package.json in case it was modified)
    const currentPackageJson = getPackageJson();
    const scripts = currentPackageJson.scripts || {};
    const requiredScripts = ['lint', 'test'];
    const missingScripts = requiredScripts.filter((script) => !scripts[script]);

    if (missingScripts.length > 0) {
        throw new Error(`Missing required scripts in package.json: ${missingScripts.join(', ')}`);
    }
    log('  ✓ Required scripts found', 'green');
}

export function main() {
    log('🗡️  Questmaestro Installation', 'bright');
    log('========================\n', 'bright');

    try {
        // Clear cache to ensure fresh reads
        packageJsonCache = null;

        // Validate project requirements
        validateProject();

        // Setup directories and configuration
        setupQuestmaestroDirectories();
        createConfig();
        installClaudeCommands();
        updateClaudeSettings();
        printInstructions();

        log('\n✨ May your quests be swift and your builds always green! ✨\n', 'bright');
    } catch (_error: unknown) {
        const message = isError(_error) ? _error.message : String(_error);
        log(`\nError during setup: ${message}`, 'red');
        process.exit(1);
    }
}

// Run the installer if called directly
if (require.main === module) {
    main();
}
