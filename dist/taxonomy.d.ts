/**
 * Issue Taxonomy with Problem-Solving Strategy Patterns
 *
 * Categorizes issues by problem type and pairs each with proven debugging strategies.
 * This teaches metacognitive skills: "how to approach different problem types."
 */
/**
 * Debugging strategy with recommended tools
 */
export interface DebuggingStrategy {
    name: string;
    description: string;
    steps: string[];
    tools: string[];
}
/**
 * Issue category with debugging strategies and success tips
 */
export interface IssueCategory {
    id: string;
    name: string;
    description: string;
    keywords: string[];
    strategies: DebuggingStrategy[];
    successTips: string[];
}
/**
 * Complete issue taxonomy with 8+ categories
 */
export declare const ISSUE_TAXONOMY: Record<string, IssueCategory>;
/**
 * Get strategy for a category
 */
export declare function getStrategy(categoryId: string): IssueCategory | null;
/**
 * List all category IDs
 */
export declare function listCategories(): string[];
/**
 * Search categories by keyword
 */
export declare function searchCategories(keyword: string): IssueCategory[];
/**
 * Suggest category based on issue keywords
 */
export declare function suggestCategory(issueTitle: string, issueBody: string): string | null;
