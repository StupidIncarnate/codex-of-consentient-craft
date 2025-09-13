import type {MockPattern, TestType} from './types';
import {CHILD_PROCESS_PATTERNS} from './patterns/child-process';
import {FS_PATTERNS} from './patterns/fs';
import {NETWORK_PATTERNS} from './patterns/network';
import {APPLICATION_CODE_PATTERNS} from './patterns/application-code';

/**
 * Central registry of all mock patterns
 */
export const MOCK_REGISTRY: MockPattern[] = [
    ...CHILD_PROCESS_PATTERNS,
    ...FS_PATTERNS,
    ...NETWORK_PATTERNS,
    ...APPLICATION_CODE_PATTERNS,
];

/**
 * Find a mock pattern by its ID
 */
export function findPatternById(id: string): MockPattern | undefined {
    return MOCK_REGISTRY.find((pattern) => pattern.id === id);
}

/**
 * Find all patterns that match a given code string
 */
export function findMatchingPatterns(code: string): MockPattern[] {
    return MOCK_REGISTRY.filter((pattern) => pattern.pattern.test(code));
}

/**
 * Find patterns by module name
 */
export function findPatternsByModule(moduleName: string): MockPattern[] {
    return MOCK_REGISTRY.filter(
        (pattern) => pattern.module === moduleName || pattern.module === 'application-code', // Special case for application code patterns
    );
}

/**
 * Find patterns appropriate for a specific test type
 */
export function findPatternsForTestType(testType: TestType): MockPattern[] {
    return MOCK_REGISTRY.filter((pattern) => pattern.testTypes.includes(testType));
}

/**
 * Find patterns that are never appropriate (empty testTypes)
 */
export function findForbiddenPatterns(): MockPattern[] {
    return MOCK_REGISTRY.filter((pattern) => pattern.testTypes.length === 0);
}

/**
 * Find patterns with a specific risk level
 */
export function findPatternsByRisk(riskLevel: MockPattern['risk']): MockPattern[] {
    return MOCK_REGISTRY.filter((pattern) => pattern.risk === riskLevel);
}

/**
 * Find the best alternative pattern for a given pattern
 */
export function findBestAlternative(
    pattern: MockPattern,
    allowedPatternIds: string[],
): MockPattern | undefined {
    // First, try the explicit alternative if it's allowed
    if (pattern.education.alternative) {
        const alternative = findPatternById(pattern.education.alternative);
        if (alternative && allowedPatternIds.includes(alternative.id)) {
            return alternative;
        }
    }

    // Find patterns for the same module that are allowed
    const modulePatterns = findPatternsByModule(pattern.module)
        .filter((p) => allowedPatternIds.includes(p.id) && p.id !== pattern.id && p.risk !== 'extreme')
        .sort((a, b) => {
            // Sort by risk level (lower risk first)
            const riskOrder = ['none', 'low', 'medium', 'high', 'extreme'];
            return riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk);
        });

    return modulePatterns[0];
}

/**
 * Get patterns grouped by category
 */
export function getPatternsByCategory(): Record<MockPattern['category'], MockPattern[]> {
    const grouped: Record<MockPattern['category'], MockPattern[]> = {
        'system-boundary': [],
        'application-code': [],
        'third-party': [],
    };

    for (const pattern of MOCK_REGISTRY) {
        grouped[pattern.category].push(pattern);
    }

    return grouped;
}

/**
 * Get patterns grouped by module
 */
export function getPatternsByModule(): Record<string, MockPattern[]> {
    const grouped: Record<string, MockPattern[]> = {};

    for (const pattern of MOCK_REGISTRY) {
        if (!grouped[pattern.module]) {
            grouped[pattern.module] = [];
        }
        grouped[pattern.module].push(pattern);
    }

    return grouped;
}

/**
 * Validate that a pattern ID exists in the registry
 */
export function validatePatternId(id: string): boolean {
    return MOCK_REGISTRY.some((pattern) => pattern.id === id);
}

/**
 * Validate that an array of pattern IDs all exist in the registry
 */
export function validatePatternIds(ids: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const id of ids) {
        if (validatePatternId(id)) {
            valid.push(id);
        } else {
            invalid.push(id);
        }
    }

    return {valid, invalid};
}

/**
 * Get default configuration for different testing strategies
 */
export function getDefaultConfigurations() {
    const systemBoundaryPatterns = findPatternsForTestType('unit')
        .filter((p) => p.category === 'system-boundary' && p.risk !== 'extreme')
        .map((p) => p.id);

    const integrationPatterns = findPatternsForTestType('integration').map((p) => p.id);

    const e2ePatterns = findPatternsForTestType('e2e').map((p) => p.id);

    return {
        strict: {
            // Only test fixtures and real implementations
            unit: systemBoundaryPatterns.filter(
                (id) => findPatternById(id)?.risk === 'none' || findPatternById(id)?.risk === 'low',
            ),
            integration: integrationPatterns,
            e2e: e2ePatterns,
        },
        balanced: {
            // Allow reasonable mocking for unit tests
            unit: systemBoundaryPatterns,
            integration: integrationPatterns,
            e2e: e2ePatterns,
        },
        permissive: {
            // Allow more patterns but still block the worst ones
            unit: [...systemBoundaryPatterns, ...findPatternsByRisk('medium').map((p) => p.id)],
            integration: integrationPatterns,
            e2e: e2ePatterns,
        },
    };
}

/**
 * Get statistics about the pattern registry
 */
export function getRegistryStats() {
    const byCategory = getPatternsByCategory();
    const byRisk = {
        none: findPatternsByRisk('none').length,
        low: findPatternsByRisk('low').length,
        medium: findPatternsByRisk('medium').length,
        high: findPatternsByRisk('high').length,
        extreme: findPatternsByRisk('extreme').length,
    };

    return {
        total: MOCK_REGISTRY.length,
        byCategory: {
            'system-boundary': byCategory['system-boundary'].length,
            'application-code': byCategory['application-code'].length,
            'third-party': byCategory['third-party'].length,
        },
        byRisk,
        forbidden: findForbiddenPatterns().length,
    };
}
