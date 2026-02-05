/**
 * Input Validation Module for Bug Hunter MCP
 *
 * Provides reusable validation functions for all MCP tools.
 * Returns helpful error messages when validation fails.
 */
export interface ValidationError {
    isValid: false;
    error: string;
}
export interface ValidationSuccess {
    isValid: true;
}
export type ValidationResult = ValidationSuccess | ValidationError;
/**
 * Validate that a string is not empty or whitespace-only
 */
export declare function validateNonEmptyString(value: string | undefined, fieldName: string, isRequired?: boolean): ValidationResult;
/**
 * Validate repository format (owner/repo)
 */
export declare function validateRepoFormat(repo: string | undefined): ValidationResult;
/**
 * Validate that a number is positive (> 0)
 */
export declare function validatePositiveNumber(value: number | undefined, fieldName: string, isRequired?: boolean): ValidationResult;
/**
 * Validate that a number is non-negative (>= 0)
 */
export declare function validateNonNegativeNumber(value: number | undefined, fieldName: string, isRequired?: boolean): ValidationResult;
/**
 * Validate that a number is within a range (inclusive)
 */
export declare function validateNumberRange(value: number | undefined, fieldName: string, min: number, max: number, isRequired?: boolean): ValidationResult;
/**
 * Validate that a value is one of allowed enum values
 */
export declare function validateEnum(value: string | undefined, fieldName: string, allowedValues: string[], isRequired?: boolean): ValidationResult;
/**
 * Validate spec ID format (basic check)
 */
export declare function validateSpecId(specId: string | undefined): ValidationResult;
/**
 * Validate programming language
 */
export declare function validateLanguage(language: string | undefined, isRequired?: boolean): ValidationResult;
/**
 * Validate keywords string
 */
export declare function validateKeywords(keywords: string | undefined, isRequired?: boolean): ValidationResult;
/**
 * Validate labels string (comma-separated)
 */
export declare function validateLabels(labels: string | undefined, isRequired?: boolean): ValidationResult;
/**
 * Validate agent name (for chant_init)
 */
export declare function validateAgent(agent: string | undefined): ValidationResult;
/**
 * Validate optional directory path
 */
export declare function validateDirectoryPath(dirPath: string | undefined, fieldName?: string, isRequired?: boolean): ValidationResult;
/**
 * Validate optional message string
 */
export declare function validateMessage(message: string | undefined, fieldName?: string, maxLength?: number): ValidationResult;
/**
 * Validate array of strings (research_questions)
 */
export declare function validateStringArray(arr: any[] | undefined, fieldName?: string, maxItems?: number, maxItemLength?: number): ValidationResult;
