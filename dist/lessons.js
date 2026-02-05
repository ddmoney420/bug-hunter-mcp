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
 * Validate that a lesson follows the template structure
 */
export function validateLesson(lesson) {
    const errors = [];
    const warnings = [];
    // Check required metadata
    if (!lesson.title || typeof lesson.title !== "string") {
        errors.push("Missing or invalid 'title'");
    }
    if (!lesson.date || typeof lesson.date !== "string") {
        errors.push("Missing or invalid 'date'");
    }
    if (!lesson.difficulty || !["easy", "medium", "hard"].includes(lesson.difficulty)) {
        errors.push("Missing or invalid 'difficulty' (must be easy, medium, or hard)");
    }
    if (!lesson.project || typeof lesson.project !== "string") {
        errors.push("Missing or invalid 'project'");
    }
    if (!lesson.outcome || !["success", "failed", "abandoned", "in-progress"].includes(lesson.outcome)) {
        errors.push("Missing or invalid 'outcome' (must be success, failed, abandoned, or in-progress)");
    }
    // Check four required sections
    if (!Array.isArray(lesson.learningOutcomes) || lesson.learningOutcomes.length === 0) {
        errors.push("Missing or empty 'learningOutcomes' array");
    }
    else {
        lesson.learningOutcomes.forEach((lo, index) => {
            if (!lo.title || !lo.description) {
                errors.push(`Learning Outcome ${index} missing 'title' or 'description'`);
            }
        });
    }
    if (!Array.isArray(lesson.csConcepts) || lesson.csConcepts.length === 0) {
        errors.push("Missing or empty 'csConcepts' array");
    }
    else {
        lesson.csConcepts.forEach((concept, index) => {
            if (!concept.name || !concept.explanation) {
                errors.push(`CS Concept ${index} missing 'name' or 'explanation'`);
            }
        });
    }
    if (!Array.isArray(lesson.transferablePrinciples) || lesson.transferablePrinciples.length === 0) {
        errors.push("Missing or empty 'transferablePrinciples' array");
    }
    else {
        lesson.transferablePrinciples.forEach((tp, index) => {
            if (!tp.principle || !tp.application) {
                errors.push(`Transferable Principle ${index} missing 'principle' or 'application'`);
            }
        });
    }
    if (!Array.isArray(lesson.gotchas) || lesson.gotchas.length === 0) {
        errors.push("Missing or empty 'gotchas' array");
    }
    else {
        lesson.gotchas.forEach((gotcha, index) => {
            if (!gotcha.title || !gotcha.description || !gotcha.prevention) {
                errors.push(`Gotcha ${index} missing 'title', 'description', or 'prevention'`);
            }
        });
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Generate a markdown representation of a lesson following the template
 */
export function lessonToMarkdown(lesson) {
    const lines = [];
    // Header
    lines.push(`# ${lesson.title}`);
    lines.push("");
    lines.push(`**Date:** ${lesson.date}`);
    lines.push(`**Difficulty:** ${lesson.difficulty}`);
    lines.push(`**Project:** ${lesson.project}`);
    if (lesson.issueNumber) {
        lines.push(`**Issue:** #${lesson.issueNumber}`);
    }
    lines.push(`**Outcome:** ${lesson.outcome}`);
    lines.push("");
    // Root Cause Analysis (if present)
    if (lesson.rootCauseAnalysis) {
        lines.push("## Root Cause Analysis");
        lines.push("");
        lines.push(lesson.rootCauseAnalysis);
        lines.push("");
    }
    // Learning Outcomes (REQUIRED)
    lines.push("## Learning Outcomes");
    lines.push("");
    lesson.learningOutcomes.forEach((outcome) => {
        lines.push(`- **${outcome.title}:** ${outcome.description}`);
    });
    lines.push("");
    // CS Concepts (REQUIRED)
    lines.push("## CS Concepts");
    lines.push("");
    lesson.csConcepts.forEach((concept) => {
        lines.push(`- **${concept.name}:** ${concept.explanation}`);
    });
    lines.push("");
    // Transferable Principles (REQUIRED)
    lines.push("## Transferable Principles");
    lines.push("");
    lesson.transferablePrinciples.forEach((principle) => {
        lines.push(`- **${principle.principle}:** ${principle.application}`);
    });
    lines.push("");
    // Gotchas & Edge Cases (REQUIRED)
    lines.push("## Gotchas & Edge Cases");
    lines.push("");
    lesson.gotchas.forEach((gotcha) => {
        lines.push(`### ${gotcha.title}`);
        lines.push("");
        lines.push(`**Issue:** ${gotcha.description}`);
        lines.push(`**Prevention:** ${gotcha.prevention}`);
        lines.push("");
    });
    // Solution Explanation (if present)
    if (lesson.solutionExplanation) {
        lines.push("## Solution Explanation");
        lines.push("");
        lines.push(lesson.solutionExplanation);
        lines.push("");
    }
    // Alternatives Considered (if present)
    if (lesson.alternativesConsidered && lesson.alternativesConsidered.length > 0) {
        lines.push("## Alternatives Considered");
        lines.push("");
        lesson.alternativesConsidered.forEach((alt) => {
            lines.push(`- ${alt}`);
        });
        lines.push("");
    }
    // Related Bugs (if present)
    if (lesson.relatedBugs && lesson.relatedBugs.length > 0) {
        lines.push("## Related Bugs");
        lines.push("");
        lesson.relatedBugs.forEach((bug) => {
            lines.push(`- ${bug}`);
        });
        lines.push("");
    }
    // Quiz (if present)
    if (lesson.quizQuestions && lesson.quizQuestions.length > 0) {
        lines.push("## Quiz");
        lines.push("");
        lesson.quizQuestions.forEach((q, index) => {
            lines.push(`**Q${index + 1}: ${q.question}**`);
            q.options.forEach((opt, optIndex) => {
                const correctMarker = opt.isCorrect ? " ✓" : "";
                lines.push(`- ${String.fromCharCode(65 + optIndex)}) ${opt.text}${correctMarker}`);
            });
            lines.push("");
        });
        if (lesson.quizResult) {
            lines.push(`**Quiz Result:** ${lesson.quizResult.passed ? "Pass ✓" : "Fail ✗"} (${lesson.quizResult.score}/${lesson.quizResult.totalQuestions} correct, ${lesson.quizResult.percentageCorrect}%)`);
            lines.push("");
        }
    }
    return lines.join("\n");
}
/**
 * Create a template lesson object with all required sections
 */
export function createLessonTemplate(overrides = {}) {
    const today = new Date().toISOString().split("T")[0];
    return {
        title: overrides.title || "New Lesson",
        date: overrides.date || today,
        difficulty: overrides.difficulty || "easy",
        project: overrides.project || "Unknown",
        issueNumber: overrides.issueNumber,
        outcome: overrides.outcome || "in-progress",
        learningOutcomes: overrides.learningOutcomes || [
            {
                title: "Outcome 1",
                description: "Describe what you learned",
            },
        ],
        csConcepts: overrides.csConcepts || [
            {
                name: "Concept Name",
                explanation: "Explain the CS concept and how it applied",
            },
        ],
        transferablePrinciples: overrides.transferablePrinciples || [
            {
                principle: "Principle Name",
                application: "How this principle applies beyond this bug",
            },
        ],
        gotchas: overrides.gotchas || [
            {
                title: "Gotcha Title",
                description: "What was tricky or unexpected",
                prevention: "How to avoid this in the future",
            },
        ],
        rootCauseAnalysis: overrides.rootCauseAnalysis,
        solutionExplanation: overrides.solutionExplanation,
        alternativesConsidered: overrides.alternativesConsidered,
        relatedBugs: overrides.relatedBugs,
        quizQuestions: overrides.quizQuestions,
        quizResult: overrides.quizResult,
    };
}
