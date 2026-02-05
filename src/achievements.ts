/**
 * Gamification & Achievement System
 *
 * Defines achievement badges and progress tracking tied to bug categories,
 * concept mastery, and developer progression. Integrates with LESSONS.md
 * and the conceptual dependency graph for meaningful achievement unlocking.
 */

/**
 * Represents a single achievement badge
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // Kaomoji or emoji
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  unlockCondition: AchievementCondition;
  progress?: string; // e.g., "3/5 concepts mastered"
}

/**
 * Categories of achievements
 */
export type AchievementCategory =
  | "concept-mastery"
  | "breadth"
  | "consistency"
  | "specialization"
  | "milestone";

/**
 * Condition for unlocking an achievement
 */
export interface AchievementCondition {
  type: "concept-count" | "bugs-solved" | "quiz-score" | "streak" | "specialization";
  target: number;
  details?: Record<string, any>;
}

/**
 * Concept Retention Metrics: Track quiz performance for a specific concept
 */
export interface ConceptRetentionMetrics {
  concept: string;
  quizAttempts: number;
  quizzesPassed: number;
  passRate: number;
  lastAttemptDate?: string;
  attemptHistory: QuizAttemptRecord[];
}

/**
 * Quiz Attempt Record: Individual quiz attempt for a concept
 */
export interface QuizAttemptRecord {
  date: string;
  score: number;
  totalQuestions: number;
  percentageCorrect: number;
  passed: boolean;
}

/**
 * Player profile and stats for achievement tracking
 */
export interface PlayerProfile {
  totalBugsSolved: number;
  totalQuizzesPassed: number;
  conceptsMastered: string[]; // Concept IDs from CONCEPT_GRAPH
  specializations: Record<string, number>; // concept -> mastery level (1-3)
  currentStreak: number;
  longestStreak: number;
  achievements: UnlockedAchievement[];
  conceptRetention?: Record<string, ConceptRetentionMetrics>; // concept -> retention metrics
  lastActivityDate?: string;
}

/**
 * An achievement that has been unlocked
 */
export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string; // ISO timestamp
  progress?: number; // For progressive achievements
}

/**
 * Define all achievements (10+ tiers across concept areas)
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ============================================================================
  // CONCEPT MASTERY ACHIEVEMENTS (Understanding & Depth)
  // ============================================================================
  {
    id: "race-condition-slayer",
    name: "Race Condition Slayer",
    description: "Master 5 race condition and concurrency concepts",
    category: "concept-mastery",
    icon: "⚡",
    rarity: "epic",
    unlockCondition: {
      type: "concept-count",
      target: 5,
      details: { concepts: ["race-conditions", "concurrency", "locks", "atomics", "memory-ordering"] },
    },
  },
  {
    id: "memory-expert",
    name: "Memory Expert",
    description: "Master memory management, allocation, and garbage collection concepts",
    category: "concept-mastery",
    icon: "💾",
    rarity: "rare",
    unlockCondition: {
      type: "concept-count",
      target: 4,
      details: { concepts: ["memory-management", "pointers", "references", "garbage-collection"] },
    },
  },
  {
    id: "async-master",
    name: "Async Master",
    description: "Master 4 async/await, concurrency, and event loop concepts",
    category: "concept-mastery",
    icon: "🔄",
    rarity: "rare",
    unlockCondition: {
      type: "concept-count",
      target: 4,
      details: { concepts: ["async-await", "promises", "callbacks", "event-loop"] },
    },
  },
  {
    id: "type-system-guru",
    name: "Type System Guru",
    description: "Master type systems, generics, and pattern matching",
    category: "concept-mastery",
    icon: "🔤",
    rarity: "rare",
    unlockCondition: {
      type: "concept-count",
      target: 3,
      details: { concepts: ["type-systems", "generics", "pattern-matching"] },
    },
  },
  {
    id: "error-handling-virtuoso",
    name: "Error Handling Virtuoso",
    description: "Master error handling, exception safety, and resilience",
    category: "concept-mastery",
    icon: "🛡️",
    rarity: "uncommon",
    unlockCondition: {
      type: "concept-count",
      target: 3,
      details: { concepts: ["error-handling", "exception-safety", "recovery"] },
    },
  },

  // ============================================================================
  // BREADTH ACHIEVEMENTS (Language & Domain Variety)
  // ============================================================================
  {
    id: "cross-language-hunter",
    name: "Cross-Language Bug Hunter",
    description: "Solve bugs in 5 different programming languages",
    category: "breadth",
    icon: "🌍",
    rarity: "epic",
    unlockCondition: {
      type: "bugs-solved",
      target: 5,
      details: { requireMultipleLanguages: true },
    },
  },
  {
    id: "polyglot-developer",
    name: "Polyglot Developer",
    description: "Solve bugs in 3 different programming languages",
    category: "breadth",
    icon: "🗣️",
    rarity: "uncommon",
    unlockCondition: {
      type: "bugs-solved",
      target: 3,
      details: { requireMultipleLanguages: true },
    },
  },
  {
    id: "full-stack-fixer",
    name: "Full-Stack Fixer",
    description: "Fix bugs across backend, frontend, and DevOps domains",
    category: "breadth",
    icon: "🏗️",
    rarity: "rare",
    unlockCondition: {
      type: "bugs-solved",
      target: 3,
      details: { requireMultipleDomains: true },
    },
  },

  // ============================================================================
  // CONSISTENCY ACHIEVEMENTS (Dedication & Learning Velocity)
  // ============================================================================
  {
    id: "relentless-learner",
    name: "Relentless Learner",
    description: "Maintain a 10-day streak of solving bugs",
    category: "consistency",
    icon: "🔥",
    rarity: "epic",
    unlockCondition: {
      type: "streak",
      target: 10,
    },
  },
  {
    id: "steady-grind",
    name: "Steady Grind",
    description: "Maintain a 5-day streak of solving bugs",
    category: "consistency",
    icon: "💪",
    rarity: "uncommon",
    unlockCondition: {
      type: "streak",
      target: 5,
    },
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    description: "Pass 10 quizzes with ≥80% score",
    category: "consistency",
    icon: "✅",
    rarity: "rare",
    unlockCondition: {
      type: "quiz-score",
      target: 10,
      details: { minScore: 80 },
    },
  },

  // ============================================================================
  // SPECIALIZATION ACHIEVEMENTS (Deep Expertise)
  // ============================================================================
  {
    id: "concurrency-specialist",
    name: "Concurrency Specialist",
    description: "Achieve deep mastery in concurrency (3+ levels)",
    category: "specialization",
    icon: "⚙️",
    rarity: "rare",
    unlockCondition: {
      type: "specialization",
      target: 3,
      details: { concept: "concurrency" },
    },
  },
  {
    id: "security-sentinel",
    name: "Security Sentinel",
    description: "Achieve deep mastery in security and vulnerability fixes",
    category: "specialization",
    icon: "🔐",
    rarity: "rare",
    unlockCondition: {
      type: "specialization",
      target: 3,
      details: { concepts: ["security", "error-handling", "validation"] },
    },
  },
  {
    id: "performance-optimizer",
    name: "Performance Optimizer",
    description: "Achieve deep mastery in optimization and performance",
    category: "specialization",
    icon: "⚡",
    rarity: "rare",
    unlockCondition: {
      type: "specialization",
      target: 3,
      details: { concept: "optimization" },
    },
  },

  // ============================================================================
  // MILESTONE ACHIEVEMENTS (Major Accomplishments)
  // ============================================================================
  {
    id: "bug-slayer-10",
    name: "Bug Slayer",
    description: "Solve 10 bugs",
    category: "milestone",
    icon: "🎯",
    rarity: "uncommon",
    unlockCondition: {
      type: "bugs-solved",
      target: 10,
    },
  },
  {
    id: "bug-slayer-25",
    name: "Elite Bug Slayer",
    description: "Solve 25 bugs",
    category: "milestone",
    icon: "🏆",
    rarity: "rare",
    unlockCondition: {
      type: "bugs-solved",
      target: 25,
    },
  },
  {
    id: "bug-slayer-50",
    name: "Legendary Bug Slayer",
    description: "Solve 50 bugs",
    category: "milestone",
    icon: "👑",
    rarity: "legendary",
    unlockCondition: {
      type: "bugs-solved",
      target: 50,
    },
  },
];

/**
 * Get achievement by ID
 */
export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * Check if an achievement is unlocked based on player profile
 */
export function isAchievementUnlocked(
  achievement: Achievement,
  profile: PlayerProfile
): boolean {
  const condition = achievement.unlockCondition;

  switch (condition.type) {
    case "concept-count": {
      const targetConcepts = condition.details?.concepts || [];
      const masteredCount = profile.conceptsMastered.filter(c =>
        targetConcepts.includes(c)
      ).length;
      return masteredCount >= condition.target;
    }

    case "bugs-solved": {
      if (condition.details?.requireMultipleLanguages) {
        // TODO: This would require tracking bug languages in profile
        // For now, estimate based on bug count and pattern
        return profile.totalBugsSolved >= condition.target;
      }
      if (condition.details?.requireMultipleDomains) {
        // TODO: This would require tracking domains in profile
        return profile.totalBugsSolved >= condition.target;
      }
      return profile.totalBugsSolved >= condition.target;
    }

    case "quiz-score": {
      return profile.totalQuizzesPassed >= condition.target;
    }

    case "streak": {
      return profile.currentStreak >= condition.target;
    }

    case "specialization": {
      const concept = condition.details?.concept;
      if (concept) {
        const level = profile.specializations[concept] || 0;
        return level >= condition.target;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Get all unlocked achievements for a player
 */
export function getUnlockedAchievements(profile: PlayerProfile): Achievement[] {
  return ACHIEVEMENTS.filter(a => isAchievementUnlocked(a, profile));
}

/**
 * Calculate achievement progress (for nearly-unlocked achievements)
 */
export function getAchievementProgress(
  achievement: Achievement,
  profile: PlayerProfile
): { current: number; target: number; percentage: number } {
  const condition = achievement.unlockCondition;

  switch (condition.type) {
    case "concept-count": {
      const targetConcepts = condition.details?.concepts || [];
      const masteredCount = profile.conceptsMastered.filter(c =>
        targetConcepts.includes(c)
      ).length;
      return {
        current: masteredCount,
        target: condition.target,
        percentage: (masteredCount / condition.target) * 100,
      };
    }

    case "bugs-solved": {
      return {
        current: profile.totalBugsSolved,
        target: condition.target,
        percentage: (profile.totalBugsSolved / condition.target) * 100,
      };
    }

    case "quiz-score": {
      return {
        current: profile.totalQuizzesPassed,
        target: condition.target,
        percentage: (profile.totalQuizzesPassed / condition.target) * 100,
      };
    }

    case "streak": {
      return {
        current: profile.currentStreak,
        target: condition.target,
        percentage: (profile.currentStreak / condition.target) * 100,
      };
    }

    case "specialization": {
      const concept = condition.details?.concept;
      const level = profile.specializations[concept || ""] || 0;
      return {
        current: level,
        target: condition.target,
        percentage: (level / condition.target) * 100,
      };
    }

    default:
      return { current: 0, target: 0, percentage: 0 };
  }
}

/**
 * Get achievements close to being unlocked (>50% progress)
 */
export function getNearlyUnlockedAchievements(
  profile: PlayerProfile,
  threshold: number = 50
): Array<{ achievement: Achievement; progress: ReturnType<typeof getAchievementProgress> }> {
  return ACHIEVEMENTS
    .filter(a => !isAchievementUnlocked(a, profile))
    .map(a => ({
      achievement: a,
      progress: getAchievementProgress(a, profile),
    }))
    .filter(({ progress }) => progress.percentage >= threshold)
    .sort((a, b) => b.progress.percentage - a.progress.percentage);
}

/**
 * Get achievement statistics
 */
export function getAchievementStats(profile: PlayerProfile): {
  totalUnlocked: number;
  totalAvailable: number;
  percentComplete: number;
  byCategory: Record<AchievementCategory, number>;
} {
  const unlockedCount = getUnlockedAchievements(profile).length;
  const byCategory: Record<AchievementCategory, number> = {
    "concept-mastery": 0,
    breadth: 0,
    consistency: 0,
    specialization: 0,
    milestone: 0,
  };

  getUnlockedAchievements(profile).forEach(a => {
    byCategory[a.category]++;
  });

  return {
    totalUnlocked: unlockedCount,
    totalAvailable: ACHIEVEMENTS.length,
    percentComplete: (unlockedCount / ACHIEVEMENTS.length) * 100,
    byCategory,
  };
}

/**
 * Create a default player profile
 */
export function createDefaultProfile(): PlayerProfile {
  return {
    totalBugsSolved: 0,
    totalQuizzesPassed: 0,
    conceptsMastered: [],
    specializations: {},
    currentStreak: 0,
    longestStreak: 0,
    achievements: [],
  };
}
