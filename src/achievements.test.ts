import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACHIEVEMENTS,
  getAchievement,
  isAchievementUnlocked,
  getUnlockedAchievements,
  getAchievementProgress,
  getNearlyUnlockedAchievements,
  getAchievementStats,
  createDefaultProfile,
  type PlayerProfile,
} from './achievements';

describe('Achievement System', () => {
  let profile: PlayerProfile;

  beforeEach(() => {
    profile = createDefaultProfile();
  });

  describe('getAchievement', () => {
    it('returns achievement by ID', () => {
      const achievement = getAchievement('bug-slayer-10');
      expect(achievement).toBeDefined();
      expect(achievement?.name).toBe('Bug Slayer');
      expect(achievement?.unlockCondition.type).toBe('bugs-solved');
      expect(achievement?.unlockCondition.target).toBe(10);
    });

    it('returns undefined for unknown achievement', () => {
      const achievement = getAchievement('nonexistent-achievement');
      expect(achievement).toBeUndefined();
    });
  });

  describe('isAchievementUnlocked', () => {
    it('unlocks bug-slayer-10 when 10+ bugs solved', () => {
      const achievement = getAchievement('bug-slayer-10')!;

      expect(isAchievementUnlocked(achievement, profile)).toBe(false);

      profile.totalBugsSolved = 10;
      expect(isAchievementUnlocked(achievement, profile)).toBe(true);
    });

    it('unlocks bug-slayer-25 when 25+ bugs solved', () => {
      const achievement = getAchievement('bug-slayer-25')!;
      profile.totalBugsSolved = 25;

      expect(isAchievementUnlocked(achievement, profile)).toBe(true);
    });

    it('unlocks race-condition-slayer with 5 race condition concepts', () => {
      const achievement = getAchievement('race-condition-slayer')!;

      expect(isAchievementUnlocked(achievement, profile)).toBe(false);

      // Add required concepts
      profile.conceptsMastered = ['race-conditions', 'concurrency', 'locks', 'atomics'];
      expect(isAchievementUnlocked(achievement, profile)).toBe(false);

      // Add 5th concept
      profile.conceptsMastered.push('memory-ordering');
      expect(isAchievementUnlocked(achievement, profile)).toBe(true);
    });

    it('unlocks quiz-master with 10+ quizzes passed', () => {
      const achievement = getAchievement('quiz-master')!;

      profile.totalQuizzesPassed = 9;
      expect(isAchievementUnlocked(achievement, profile)).toBe(false);

      profile.totalQuizzesPassed = 10;
      expect(isAchievementUnlocked(achievement, profile)).toBe(true);
    });

    it('unlocks streak achievements', () => {
      const steadyGrind = getAchievement('steady-grind')!;
      const relentlessLearner = getAchievement('relentless-learner')!;

      profile.currentStreak = 4;
      expect(isAchievementUnlocked(steadyGrind, profile)).toBe(false);
      expect(isAchievementUnlocked(relentlessLearner, profile)).toBe(false);

      profile.currentStreak = 5;
      expect(isAchievementUnlocked(steadyGrind, profile)).toBe(true);
      expect(isAchievementUnlocked(relentlessLearner, profile)).toBe(false);

      profile.currentStreak = 10;
      expect(isAchievementUnlocked(steadyGrind, profile)).toBe(true);
      expect(isAchievementUnlocked(relentlessLearner, profile)).toBe(true);
    });

    it('unlocks specialization achievements', () => {
      const concurrencySpecialist = getAchievement('concurrency-specialist')!;

      profile.specializations['concurrency'] = 2;
      expect(isAchievementUnlocked(concurrencySpecialist, profile)).toBe(false);

      profile.specializations['concurrency'] = 3;
      expect(isAchievementUnlocked(concurrencySpecialist, profile)).toBe(true);
    });
  });

  describe('getUnlockedAchievements', () => {
    it('returns empty list for new profile', () => {
      const unlocked = getUnlockedAchievements(profile);
      expect(unlocked).toHaveLength(0);
    });

    it('returns unlocked achievements', () => {
      profile.totalBugsSolved = 10;
      profile.currentStreak = 5;

      const unlocked = getUnlockedAchievements(profile);
      expect(unlocked.length).toBeGreaterThan(0);
      expect(unlocked.some(a => a.id === 'bug-slayer-10')).toBe(true);
      expect(unlocked.some(a => a.id === 'steady-grind')).toBe(true);
    });

    it('all returned achievements are actually unlocked', () => {
      profile.totalBugsSolved = 50;
      profile.totalQuizzesPassed = 10;
      profile.currentStreak = 10;
      profile.conceptsMastered = ['race-conditions', 'concurrency', 'locks', 'atomics', 'memory-ordering'];

      const unlocked = getUnlockedAchievements(profile);

      unlocked.forEach(achievement => {
        expect(isAchievementUnlocked(achievement, profile)).toBe(true);
      });
    });
  });

  describe('getAchievementProgress', () => {
    it('returns progress for bugs-solved achievement', () => {
      const achievement = getAchievement('bug-slayer-10')!;
      profile.totalBugsSolved = 5;

      const progress = getAchievementProgress(achievement, profile);
      expect(progress.current).toBe(5);
      expect(progress.target).toBe(10);
      expect(progress.percentage).toBe(50);
    });

    it('returns progress for concept-count achievement', () => {
      const achievement = getAchievement('race-condition-slayer')!;
      profile.conceptsMastered = ['race-conditions', 'concurrency'];

      const progress = getAchievementProgress(achievement, profile);
      expect(progress.current).toBe(2);
      expect(progress.target).toBe(5);
      expect(progress.percentage).toBe(40);
    });

    it('returns progress for quiz-score achievement', () => {
      const achievement = getAchievement('quiz-master')!;
      profile.totalQuizzesPassed = 7;

      const progress = getAchievementProgress(achievement, profile);
      expect(progress.current).toBe(7);
      expect(progress.target).toBe(10);
      expect(progress.percentage).toBe(70);
    });

    it('returns progress for streak achievement', () => {
      const achievement = getAchievement('relentless-learner')!;
      profile.currentStreak = 7;

      const progress = getAchievementProgress(achievement, profile);
      expect(progress.current).toBe(7);
      expect(progress.target).toBe(10);
      expect(progress.percentage).toBe(70);
    });
  });

  describe('getNearlyUnlockedAchievements', () => {
    it('returns empty list when no achievements are nearly unlocked', () => {
      profile.totalBugsSolved = 1;
      const nearly = getNearlyUnlockedAchievements(profile);
      expect(nearly).toHaveLength(0);
    });

    it('returns achievements with >50% progress', () => {
      profile.totalBugsSolved = 6; // 60% toward bug-slayer-10
      profile.currentStreak = 6;   // 60% toward relentless-learner

      const nearly = getNearlyUnlockedAchievements(profile, 50);
      expect(nearly.length).toBeGreaterThan(0);
      expect(nearly.some(a => a.achievement.id === 'bug-slayer-10')).toBe(true);
    });

    it('respects custom threshold', () => {
      profile.totalBugsSolved = 6; // 60% toward bug-slayer-10

      // With 70% threshold, should not include
      const nearly70 = getNearlyUnlockedAchievements(profile, 70);
      expect(nearly70.some(a => a.achievement.id === 'bug-slayer-10')).toBe(false);

      // With 50% threshold, should include
      const nearly50 = getNearlyUnlockedAchievements(profile, 50);
      expect(nearly50.some(a => a.achievement.id === 'bug-slayer-10')).toBe(true);
    });

    it('sorts by percentage descending', () => {
      profile.totalBugsSolved = 25;  // 100% for bug-slayer-25
      profile.currentStreak = 8;      // 80% for relentless-learner
      profile.totalQuizzesPassed = 6; // 60% for quiz-master

      const nearly = getNearlyUnlockedAchievements(profile, 50);

      for (let i = 0; i < nearly.length - 1; i++) {
        expect(nearly[i].progress.percentage).toBeGreaterThanOrEqual(nearly[i + 1].progress.percentage);
      }
    });
  });

  describe('getAchievementStats', () => {
    it('returns correct stats for new profile', () => {
      const stats = getAchievementStats(profile);

      expect(stats.totalUnlocked).toBe(0);
      expect(stats.totalAvailable).toBe(ACHIEVEMENTS.length);
      expect(stats.percentComplete).toBe(0);
      expect(stats.byCategory['concept-mastery']).toBe(0);
      expect(stats.byCategory.breadth).toBe(0);
      expect(stats.byCategory.consistency).toBe(0);
      expect(stats.byCategory.specialization).toBe(0);
      expect(stats.byCategory.milestone).toBe(0);
    });

    it('counts achievements by category', () => {
      profile.totalBugsSolved = 50;
      profile.currentStreak = 10;
      profile.totalQuizzesPassed = 10;
      profile.conceptsMastered = ['race-conditions', 'concurrency', 'locks', 'atomics', 'memory-ordering'];
      profile.specializations['concurrency'] = 3;

      const stats = getAchievementStats(profile);

      expect(stats.totalUnlocked).toBeGreaterThan(0);
      expect(stats.percentComplete).toBeGreaterThan(0);
      expect(stats.percentComplete).toBeLessThanOrEqual(100);

      const totalByCategory =
        stats.byCategory['concept-mastery'] +
        stats.byCategory.breadth +
        stats.byCategory.consistency +
        stats.byCategory.specialization +
        stats.byCategory.milestone;

      expect(totalByCategory).toBe(stats.totalUnlocked);
    });
  });

  describe('createDefaultProfile', () => {
    it('creates profile with default values', () => {
      const newProfile = createDefaultProfile();

      expect(newProfile.totalBugsSolved).toBe(0);
      expect(newProfile.totalQuizzesPassed).toBe(0);
      expect(newProfile.conceptsMastered).toEqual([]);
      expect(newProfile.specializations).toEqual({});
      expect(newProfile.currentStreak).toBe(0);
      expect(newProfile.longestStreak).toBe(0);
      expect(newProfile.achievements).toEqual([]);
    });
  });

  describe('Achievement Categories', () => {
    it('has achievements in all categories', () => {
      const categories = new Set(ACHIEVEMENTS.map(a => a.category));

      expect(categories.has('concept-mastery')).toBe(true);
      expect(categories.has('breadth')).toBe(true);
      expect(categories.has('consistency')).toBe(true);
      expect(categories.has('specialization')).toBe(true);
      expect(categories.has('milestone')).toBe(true);
    });

    it('has at least 10 achievements', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(10);
    });

    it('all achievements have unique IDs', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('all achievements have valid rarity levels', () => {
      const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

      ACHIEVEMENTS.forEach(achievement => {
        expect(validRarities).toContain(achievement.rarity);
      });
    });
  });
});
