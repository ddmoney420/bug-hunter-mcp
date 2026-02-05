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
  // Metadata
  title: string;
  date: string;
  difficulty: "easy" | "medium" | "hard";
  project: string;
  issueNumber?: number;
  outcome: "success" | "failed" | "abandoned" | "in-progress";

  // Four Required Sections
  learningOutcomes: LearningOutcome[];
  csConcepts: CSConcept[];
  transferablePrinciples: TransferablePrinciple[];
  gotchas: Gotcha[];

  // Optional: Supporting context
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
 * Quiz Validation Result: Detailed validation of quiz structure
 */
export interface QuizValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * User Quiz Answer: A user's answer to a single question
 */
export interface UserQuizAnswer {
  questionIndex: number;
  selectedOptionIndex: number;
}

/**
 * Quiz Attempt Result: Result of a user's quiz attempt
 */
export interface QuizAttemptResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  percentageCorrect: number;
  passed: boolean;
  attemptDate: string;
  answers: {
    questionIndex: number;
    selectedOptionIndex: number;
    correctOptionIndex: number;
    isCorrect: boolean;
    question: string;
    selectedText: string;
    correctText: string;
  }[];
}

/**
 * Validate a quiz has proper structure
 */
export function validateQuiz(quiz: any): QuizValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that quiz questions array exists and is non-empty
  if (!Array.isArray(quiz.quizQuestions)) {
    errors.push("Quiz must have a 'quizQuestions' array");
    return { isValid: false, errors, warnings };
  }

  if (quiz.quizQuestions.length === 0) {
    errors.push("Quiz must have at least one question");
    return { isValid: false, errors, warnings };
  }

  if (quiz.quizQuestions.length > 5) {
    errors.push("Quiz must have at most 5 questions");
  }

  // Validate each question
  quiz.quizQuestions.forEach((question: any, qIndex: number) => {
    // Check question text
    if (!question.question || typeof question.question !== "string") {
      errors.push(`Question ${qIndex + 1}: Missing or invalid 'question' text`);
    } else if (question.question.trim().length === 0) {
      errors.push(`Question ${qIndex + 1}: Question text cannot be empty`);
    } else if (question.question.length > 500) {
      errors.push(`Question ${qIndex + 1}: Question text exceeds 500 characters`);
    }

    // Check options array
    if (!Array.isArray(question.options)) {
      errors.push(`Question ${qIndex + 1}: Must have 'options' array`);
    } else {
      // Check that there are exactly 4 options
      if (question.options.length !== 4) {
        errors.push(
          `Question ${qIndex + 1}: Must have exactly 4 options, got ${question.options.length}`
        );
      }

      // Validate each option
      let correctCount = 0;
      question.options.forEach((option: any, oIndex: number) => {
        // Check option text
        if (!option.text || typeof option.text !== "string") {
          errors.push(
            `Question ${qIndex + 1}, Option ${String.fromCharCode(65 + oIndex)}: Missing or invalid 'text'`
          );
        } else if (option.text.trim().length === 0) {
          errors.push(
            `Question ${qIndex + 1}, Option ${String.fromCharCode(65 + oIndex)}: Option text cannot be empty`
          );
        } else if (option.text.length > 200) {
          errors.push(
            `Question ${qIndex + 1}, Option ${String.fromCharCode(65 + oIndex)}: Option text exceeds 200 characters`
          );
        }

        // Check isCorrect flag
        if (typeof option.isCorrect !== "boolean") {
          errors.push(
            `Question ${qIndex + 1}, Option ${String.fromCharCode(65 + oIndex)}: 'isCorrect' must be a boolean`
          );
        } else if (option.isCorrect) {
          correctCount++;
        }
      });

      // Check that exactly one option is correct
      if (correctCount !== 1) {
        errors.push(
          `Question ${qIndex + 1}: Must have exactly one correct answer, got ${correctCount}`
        );
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check a user's quiz answers and return detailed results
 */
export function checkQuizAnswers(
  quizQuestions: QuizQuestion[],
  userAnswers: UserQuizAnswer[],
  quizId: string = "unknown"
): QuizAttemptResult {
  const results = {
    questionIndex: 0,
    selectedOptionIndex: 0,
    correctOptionIndex: 0,
    isCorrect: false,
    question: "",
    selectedText: "",
    correctText: "",
  };

  const detailedAnswers = userAnswers.map((answer) => {
    const question = quizQuestions[answer.questionIndex];
    const selectedOption = question.options[answer.selectedOptionIndex];
    const correctOptionIndex = question.options.findIndex((opt) => opt.isCorrect);
    const correctOption = question.options[correctOptionIndex];
    const isCorrect = answer.selectedOptionIndex === correctOptionIndex;

    return {
      questionIndex: answer.questionIndex,
      selectedOptionIndex: answer.selectedOptionIndex,
      correctOptionIndex,
      isCorrect,
      question: question.question,
      selectedText: selectedOption.text,
      correctText: correctOption.text,
    };
  });

  const correctCount = detailedAnswers.filter((a) => a.isCorrect).length;
  const totalQuestions = quizQuestions.length;
  const percentageCorrect = Math.round((correctCount / totalQuestions) * 100);

  return {
    quizId,
    score: correctCount,
    totalQuestions,
    percentageCorrect,
    passed: percentageCorrect >= 80,
    attemptDate: new Date().toISOString(),
    answers: detailedAnswers,
  };
}

/**
 * Validate that a lesson follows the template structure
 */
export function validateLesson(lesson: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

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
    errors.push(
      "Missing or invalid 'outcome' (must be success, failed, abandoned, or in-progress)"
    );
  }

  // Check four required sections
  if (!Array.isArray(lesson.learningOutcomes) || lesson.learningOutcomes.length === 0) {
    errors.push("Missing or empty 'learningOutcomes' array");
  } else {
    lesson.learningOutcomes.forEach((lo: any, index: number) => {
      if (!lo.title || !lo.description) {
        errors.push(
          `Learning Outcome ${index} missing 'title' or 'description'`
        );
      }
    });
  }

  if (!Array.isArray(lesson.csConcepts) || lesson.csConcepts.length === 0) {
    errors.push("Missing or empty 'csConcepts' array");
  } else {
    lesson.csConcepts.forEach((concept: any, index: number) => {
      if (!concept.name || !concept.explanation) {
        errors.push(
          `CS Concept ${index} missing 'name' or 'explanation'`
        );
      }
    });
  }

  if (!Array.isArray(lesson.transferablePrinciples) || lesson.transferablePrinciples.length === 0) {
    errors.push("Missing or empty 'transferablePrinciples' array");
  } else {
    lesson.transferablePrinciples.forEach((tp: any, index: number) => {
      if (!tp.principle || !tp.application) {
        errors.push(
          `Transferable Principle ${index} missing 'principle' or 'application'`
        );
      }
    });
  }

  if (!Array.isArray(lesson.gotchas) || lesson.gotchas.length === 0) {
    errors.push("Missing or empty 'gotchas' array");
  } else {
    lesson.gotchas.forEach((gotcha: any, index: number) => {
      if (!gotcha.title || !gotcha.description || !gotcha.prevention) {
        errors.push(
          `Gotcha ${index} missing 'title', 'description', or 'prevention'`
        );
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
export function lessonToMarkdown(lesson: LessonTemplate): string {
  const lines: string[] = [];

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
      lines.push(
        `**Quiz Result:** ${lesson.quizResult.passed ? "Pass ✓" : "Fail ✗"} (${lesson.quizResult.score}/${lesson.quizResult.totalQuestions} correct, ${lesson.quizResult.percentageCorrect}%)`
      );
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Create a template lesson object with all required sections
 */
export function createLessonTemplate(overrides: Partial<LessonTemplate> = {}): LessonTemplate {
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
