/**
 * Lesson Template Schema and Utilities
 *
 * Defines the enhanced lesson template structure with four required sections:
 * 1. Learning Outcomes - what you'll learn
 * 2. CS Concepts - tagged concepts for pattern recognition
 * 3. Transferable Principles - applies beyond this bug
 * 4. Gotchas & Edge Cases - prevents conceptual blind spots
 */
/**
 * Learning Outcome: A single measurable learning outcome from a lesson
 */
export interface LearningOutcome {
    title: string;
    description: string;
}
/**
 * CS Concept: A tagged concept from the lesson
 */
export interface CSConcept {
    name: string;
    explanation: string;
}
/**
 * Transferable Principle: A principle that applies beyond this specific bug
 */
export interface TransferablePrinciple {
    principle: string;
    application: string;
}
/**
 * Gotcha: A tricky part or edge case that could catch others
 */
export interface Gotcha {
    title: string;
    description: string;
    prevention: string;
}
/**
 * Lesson Template: The enhanced lesson structure
 */
export interface LessonTemplate {
    title: string;
    date: string;
    difficulty: "easy" | "medium" | "hard";
    project: string;
    issueNumber?: number;
    outcome: "success" | "failed" | "abandoned" | "in-progress";
    learningOutcomes: LearningOutcome[];
    csConcepts: CSConcept[];
    transferablePrinciples: TransferablePrinciple[];
    gotchas: Gotcha[];
    rootCauseAnalysis?: string;
    solutionExplanation?: string;
    alternativesConsidered?: string[];
    relatedBugs?: string[];
    quizQuestions?: QuizQuestion[];
    quizResult?: QuizResult;
}
/**
 * Quiz Question: Multiple choice question for retention testing
 */
export interface QuizQuestion {
    question: string;
    options: QuizOption[];
}
/**
 * Quiz Option: A single option in a quiz question
 */
export interface QuizOption {
    text: string;
    isCorrect: boolean;
}
/**
 * Quiz Result: Tracking quiz performance
 */
export interface QuizResult {
    passed: boolean;
    score: number;
    totalQuestions: number;
    percentageCorrect: number;
    attemptNumber: number;
}
/**
 * Validate that a lesson follows the template structure
 */
export declare function validateLesson(lesson: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Generate a markdown representation of a lesson following the template
 */
export declare function lessonToMarkdown(lesson: LessonTemplate): string;
/**
 * Create a template lesson object with all required sections
 */
export declare function createLessonTemplate(overrides?: Partial<LessonTemplate>): LessonTemplate;
