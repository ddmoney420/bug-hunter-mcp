/**
 * Player Profile Management
 *
 * Handles loading, saving, and updating player profiles.
 * Profiles are stored as JSON files in a local directory.
 */

import * as fs from "fs";
import * as path from "path";
import { PlayerProfile, createDefaultProfile, getAchievementStats } from "./achievements.js";

/**
 * Get the profiles directory
 */
function getProfilesDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "~";
  const profilesDir = path.join(home, ".bug-hunter", "profiles");

  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  return profilesDir;
}

/**
 * Get profile file path for a developer
 */
function getProfilePath(developerId: string): string {
  return path.join(getProfilesDir(), `${developerId}.json`);
}

/**
 * Load player profile from disk
 */
export function loadProfile(developerId: string): PlayerProfile {
  const profilePath = getProfilePath(developerId);

  if (fs.existsSync(profilePath)) {
    try {
      const data = fs.readFileSync(profilePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to load profile for ${developerId}:`, error);
      return createDefaultProfile();
    }
  }

  return createDefaultProfile();
}

/**
 * Save player profile to disk
 */
export function saveProfile(developerId: string, profile: PlayerProfile): void {
  const profilePath = getProfilePath(developerId);

  try {
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), "utf-8");
  } catch (error) {
    console.error(`Failed to save profile for ${developerId}:`, error);
  }
}

/**
 * Update player stats after solving a bug
 */
export function recordBugSolved(
  developerId: string,
  bugData: {
    language: string;
    domain: string;
    concepts: string[];
  }
): PlayerProfile {
  const profile = loadProfile(developerId);

  // Increment bugs solved
  profile.totalBugsSolved++;

  // Add concepts to mastered list if not already there
  bugData.concepts.forEach(concept => {
    if (!profile.conceptsMastered.includes(concept)) {
      profile.conceptsMastered.push(concept);
    }
    // Increment specialization level
    profile.specializations[concept] = (profile.specializations[concept] || 0) + 1;
  });

  // Update last activity
  profile.lastActivityDate = new Date().toISOString();

  saveProfile(developerId, profile);
  return profile;
}

/**
 * Record quiz completion
 */
export function recordQuizPassed(
  developerId: string,
  quizData: {
    concept: string;
    score: number;
  }
): PlayerProfile {
  const profile = loadProfile(developerId);

  profile.totalQuizzesPassed++;

  // Boost specialization for the concept if quiz passed with high score
  if (quizData.score >= 80) {
    profile.specializations[quizData.concept] =
      (profile.specializations[quizData.concept] || 0) + 0.5;
  }

  profile.lastActivityDate = new Date().toISOString();

  saveProfile(developerId, profile);
  return profile;
}

/**
 * Update streak after activity
 */
export function updateStreak(developerId: string, isActive: boolean = true): PlayerProfile {
  const profile = loadProfile(developerId);

  if (isActive) {
    profile.currentStreak++;
    if (profile.currentStreak > profile.longestStreak) {
      profile.longestStreak = profile.currentStreak;
    }
  } else {
    profile.currentStreak = 0;
  }

  profile.lastActivityDate = new Date().toISOString();

  saveProfile(developerId, profile);
  return profile;
}

/**
 * Get public profile summary (for showcase)
 */
export function getPublicProfileSummary(developerId: string): {
  developer: string;
  stats: {
    totalBugsSolved: number;
    totalQuizzesPassed: number;
    conceptsMastered: number;
    longestStreak: number;
  };
  achievements: {
    unlocked: number;
    total: number;
    percentage: number;
  };
  specializations: Array<[string, number]>;
} {
  const profile = loadProfile(developerId);
  const stats = getAchievementStats(profile);

  const topSpecializations = Object.entries(profile.specializations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return {
    developer: developerId,
    stats: {
      totalBugsSolved: profile.totalBugsSolved,
      totalQuizzesPassed: profile.totalQuizzesPassed,
      conceptsMastered: profile.conceptsMastered.length,
      longestStreak: profile.longestStreak,
    },
    achievements: {
      unlocked: stats.totalUnlocked,
      total: stats.totalAvailable,
      percentage: stats.percentComplete,
    },
    specializations: topSpecializations,
  };
}

/**
 * List all developer profiles
 */
export function listProfiles(): string[] {
  const profilesDir = getProfilesDir();

  if (!fs.existsSync(profilesDir)) {
    return [];
  }

  return fs
    .readdirSync(profilesDir)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""));
}

/**
 * Delete a profile
 */
export function deleteProfile(developerId: string): void {
  const profilePath = getProfilePath(developerId);

  if (fs.existsSync(profilePath)) {
    fs.unlinkSync(profilePath);
  }
}

/**
 * Export profile as JSON
 */
export function exportProfileJSON(developerId: string): string {
  const profile = loadProfile(developerId);
  return JSON.stringify(profile, null, 2);
}

/**
 * Export profile as Markdown
 */
export function exportProfileMarkdown(developerId: string): string {
  const profile = loadProfile(developerId);
  const stats = getAchievementStats(profile);

  let markdown = `# 🏆 ${developerId}'s Bug Hunter Profile\n\n`;

  markdown += `## Stats\n\n`;
  markdown += `| Stat | Value |\n`;
  markdown += `|------|-------|\n`;
  markdown += `| Bugs Solved | ${profile.totalBugsSolved} |\n`;
  markdown += `| Quizzes Passed | ${profile.totalQuizzesPassed} |\n`;
  markdown += `| Concepts Mastered | ${profile.conceptsMastered.length} |\n`;
  markdown += `| Current Streak | ${profile.currentStreak} days |\n`;
  markdown += `| Longest Streak | ${profile.longestStreak} days |\n\n`;

  markdown += `## Achievements\n\n`;
  markdown += `Unlocked: **${stats.totalUnlocked}/${stats.totalAvailable}** (${stats.percentComplete.toFixed(1)}%)\n\n`;

  markdown += `### By Category\n\n`;
  markdown += `- Concept Mastery: ${stats.byCategory["concept-mastery"]}\n`;
  markdown += `- Breadth: ${stats.byCategory.breadth}\n`;
  markdown += `- Consistency: ${stats.byCategory.consistency}\n`;
  markdown += `- Specialization: ${stats.byCategory.specialization}\n`;
  markdown += `- Milestone: ${stats.byCategory.milestone}\n\n`;

  if (Object.keys(profile.specializations).length > 0) {
    markdown += `## Top Specializations\n\n`;
    const topSpecializations = Object.entries(profile.specializations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    topSpecializations.forEach(([concept, level]) => {
      markdown += `- **${concept}**: Level ${level.toFixed(1)}\n`;
    });
    markdown += "\n";
  }

  if (profile.lastActivityDate) {
    markdown += `## Last Activity\n\n`;
    markdown += `${new Date(profile.lastActivityDate).toLocaleDateString()}\n`;
  }

  return markdown;
}
