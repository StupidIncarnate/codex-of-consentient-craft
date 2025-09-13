// Types
export type {
    MockPattern,
    MockCategory,
    TestType,
    RiskLevel,
    MockDetection,
    MockValidationResult,
    MockRailsConfig,
} from './types';

import type {MockRailsConfig} from './types';
import {validateMockBoundaries} from './validator';
import {getDefaultConfigurations} from './registry';

// Registry
export {
    MOCK_REGISTRY,
    findPatternById,
    findMatchingPatterns,
    findPatternsByModule,
    findPatternsForTestType,
    findForbiddenPatterns,
    findPatternsByRisk,
    findBestAlternative,
    getPatternsByCategory,
    getPatternsByModule,
    validatePatternId,
    validatePatternIds,
    getDefaultConfigurations,
    getRegistryStats,
} from './registry';

// Pattern collections
export {CHILD_PROCESS_PATTERNS} from './patterns/child-process';
export {FS_PATTERNS} from './patterns/fs';
export {NETWORK_PATTERNS} from './patterns/network';
export {APPLICATION_CODE_PATTERNS} from './patterns/application-code';

// Detection utilities
export {
    detectTestType,
    extractMockPatterns,
    findJestMocks,
    findJestSpies,
    detectApplicationCodeMocks,
    analyzeMockComplexity,
    detectAsyncPatterns,
    extractImports,
} from './detector';

// Validation
export {validateMockBoundaries, analyzeTestFile, generateEducationalReport} from './validator';

// Convenience functions for hook integration
export function createMockBoundaryHook(config: MockRailsConfig) {
    return function mockBoundaryHook({filePath, content}: { filePath: string; content: string }) {
        const result = validateMockBoundaries({filePath, content, config});

        if (result.blocked) {
            return {
                status: 'blocked' as const,
                message: result.message,
                educational: true,
            };
        }

        return {
            status: 'allowed' as const,
            message: result.message,
        };
    };
}

// Default configurations for common setups (lazy-loaded to avoid circular deps)
export const DEFAULT_CONFIGS = {
    get strict(): MockRailsConfig {
        return {
            enabled: true,
            rules: getDefaultConfigurations().strict,
            customPatterns: [],
            education: {
                level: 'verbose' as const,
                showAlternatives: true,
                showExamples: true,
            },
        };
    },

    get balanced(): MockRailsConfig {
        return {
            enabled: true,
            rules: getDefaultConfigurations().balanced,
            customPatterns: [],
            education: {
                level: 'normal' as const,
                showAlternatives: true,
                showExamples: true,
            },
        };
    },

    get permissive(): MockRailsConfig {
        return {
            enabled: true,
            rules: getDefaultConfigurations().permissive,
            customPatterns: [],
            education: {
                level: 'normal' as const,
                showAlternatives: true,
                showExamples: false,
            },
        };
    },

    get disabled(): MockRailsConfig {
        return {
            enabled: false,
            rules: {unit: [], integration: [], e2e: []},
            customPatterns: [],
            education: {
                level: 'quiet' as const,
                showAlternatives: false,
                showExamples: false,
            },
        };
    },
};
