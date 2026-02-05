import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadProfile,
  saveProfile,
  recordBugSolved,
  recordQuizPassed,
  updateStreak,
  getPublicProfileSummary,
  listProfiles,
  deleteProfile,
  exportProfileJSON,
  exportProfileMarkdown,
} from './profile';
import { createDefaultProfile } from './achievements';

// Mock home directory for testing
const testProfilesDir = path.join(os.tmpdir(), `test-profiles-${Date.now()}`);

describe('Profile Management', () => {
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testProfilesDir)) {
      fs.mkdirSync(testProfilesDir, { recursive: true });
    }

    // Override HOME to test directory
    process.env.HOME = testProfilesDir;
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testProfilesDir)) {
      fs.rmSync(testProfilesDir, { recursive: true });
    }
  });

  describe('loadProfile / saveProfile', () => {
    it('loads default profile when file does not exist', () => {
      const profile = loadProfile('testuser');

      expect(profile.totalBugsSolved).toBe(0);
      expect(profile.totalQuizzesPassed).toBe(0);
      expect(profile.conceptsMastered).toEqual([]);
      expect(profile.achievements).toEqual([]);
    });

    it('saves and loads profile', () => {
      const profile = createDefaultProfile();
      profile.totalBugsSolved = 5;
      profile.totalQuizzesPassed = 3;
      profile.conceptsMastered = ['race-conditions', 'concurrency'];

      saveProfile('testuser', profile);

      const loaded = loadProfile('testuser');
      expect(loaded.totalBugsSolved).toBe(5);
      expect(loaded.totalQuizzesPassed).toBe(3);
      expect(loaded.conceptsMastered).toEqual(['race-conditions', 'concurrency']);
    });

    it('overwrites existing profile when saving', () => {
      const profile1 = createDefaultProfile();
      profile1.totalBugsSolved = 5;
      saveProfile('testuser', profile1);

      const profile2 = createDefaultProfile();
      profile2.totalBugsSolved = 10;
      saveProfile('testuser', profile2);

      const loaded = loadProfile('testuser');
      expect(loaded.totalBugsSolved).toBe(10);
    });
  });

  describe('recordBugSolved', () => {
    it('increments bugs solved count', () => {
      const profile = recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      expect(profile.totalBugsSolved).toBe(1);
    });

    it('adds concepts to mastered list', () => {
      const profile = recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions', 'concurrency'],
      });

      expect(profile.conceptsMastered).toContain('race-conditions');
      expect(profile.conceptsMastered).toContain('concurrency');
    });

    it('increments specialization levels', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['concurrency'],
      });

      const profile = recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['concurrency', 'race-conditions'],
      });

      expect(profile.specializations['concurrency']).toBe(2);
      expect(profile.specializations['race-conditions']).toBe(1);
    });

    it('does not duplicate concepts in mastered list', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const profile = recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const count = profile.conceptsMastered.filter(c => c === 'race-conditions').length;
      expect(count).toBe(1);
    });

    it('updates lastActivityDate', () => {
      const before = new Date().toISOString();
      const profile = recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });
      const after = new Date().toISOString();

      expect(profile.lastActivityDate).toBeDefined();
      expect(profile.lastActivityDate! >= before).toBe(true);
      expect(profile.lastActivityDate! <= after).toBe(true);
    });

    it('persists data to disk', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const loaded = loadProfile('testuser');
      expect(loaded.totalBugsSolved).toBe(1);
      expect(loaded.conceptsMastered).toContain('race-conditions');
    });
  });

  describe('recordQuizPassed', () => {
    it('increments quizzes passed count', () => {
      const profile = recordQuizPassed('testuser', {
        concept: 'race-conditions',
        score: 85,
      });

      expect(profile.totalQuizzesPassed).toBe(1);
    });

    it('boosts specialization for high scores', () => {
      const profile1 = recordQuizPassed('testuser', {
        concept: 'race-conditions',
        score: 80,
      });

      expect(profile1.specializations['race-conditions']).toBe(0.5);
    });

    it('does not boost specialization for low scores', () => {
      const profile1 = recordQuizPassed('testuser', {
        concept: 'race-conditions',
        score: 70,
      });

      expect(profile1.specializations['race-conditions']).toBeUndefined();
    });

    it('updates lastActivityDate', () => {
      const before = new Date().toISOString();
      const profile = recordQuizPassed('testuser', {
        concept: 'race-conditions',
        score: 85,
      });
      const after = new Date().toISOString();

      expect(profile.lastActivityDate).toBeDefined();
      expect(profile.lastActivityDate! >= before).toBe(true);
      expect(profile.lastActivityDate! <= after).toBe(true);
    });
  });

  describe('updateStreak', () => {
    it('increments current streak when active', () => {
      let profile = updateStreak('testuser', true);
      expect(profile.currentStreak).toBe(1);

      profile = updateStreak('testuser', true);
      expect(profile.currentStreak).toBe(2);
    });

    it('resets streak when inactive', () => {
      updateStreak('testuser', true);
      updateStreak('testuser', true);

      const profile = updateStreak('testuser', false);
      expect(profile.currentStreak).toBe(0);
    });

    it('updates longest streak', () => {
      updateStreak('testuser', true);
      updateStreak('testuser', true);
      updateStreak('testuser', true);

      const profile = updateStreak('testuser', true);
      expect(profile.longestStreak).toBe(4);
    });

    it('maintains longest streak when resetting', () => {
      updateStreak('testuser', true);
      updateStreak('testuser', true);
      updateStreak('testuser', false);

      const profile = updateStreak('testuser', true);
      expect(profile.currentStreak).toBe(1);
      expect(profile.longestStreak).toBe(2);
    });
  });

  describe('getPublicProfileSummary', () => {
    it('returns summary with stats', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions', 'concurrency'],
      });

      const summary = getPublicProfileSummary('testuser');

      expect(summary.developer).toBe('testuser');
      expect(summary.stats.totalBugsSolved).toBe(1);
      expect(summary.stats.conceptsMastered).toBe(2);
    });

    it('includes achievement counts', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const summary = getPublicProfileSummary('testuser');

      expect(summary.achievements.unlocked).toBeDefined();
      expect(summary.achievements.total).toBeDefined();
      expect(summary.achievements.percentage).toBeDefined();
    });

    it('includes top specializations', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions', 'concurrency'],
      });

      const summary = getPublicProfileSummary('testuser');

      expect(summary.specializations.length).toBeGreaterThan(0);
      expect(summary.specializations[0][0]).toBe('race-conditions');
    });
  });

  describe('listProfiles', () => {
    it('returns empty list when no profiles exist', () => {
      const profiles = listProfiles();
      expect(profiles).toEqual([]);
    });

    it('lists all existing profiles', () => {
      saveProfile('user1', createDefaultProfile());
      saveProfile('user2', createDefaultProfile());
      saveProfile('user3', createDefaultProfile());

      const profiles = listProfiles();
      expect(profiles).toContain('user1');
      expect(profiles).toContain('user2');
      expect(profiles).toContain('user3');
      expect(profiles.length).toBe(3);
    });

    it('ignores non-json files', () => {
      const profilesDir = path.join(testProfilesDir, '.bug-hunter', 'profiles');
      fs.mkdirSync(profilesDir, { recursive: true });
      fs.writeFileSync(path.join(profilesDir, 'readme.txt'), 'This is not a profile');
      saveProfile('user1', createDefaultProfile());

      const profiles = listProfiles();
      expect(profiles).toEqual(['user1']);
    });
  });

  describe('deleteProfile', () => {
    it('deletes profile file', () => {
      saveProfile('testuser', createDefaultProfile());
      expect(fs.existsSync(path.join(testProfilesDir, '.bug-hunter', 'profiles', 'testuser.json'))).toBe(true);

      deleteProfile('testuser');
      expect(fs.existsSync(path.join(testProfilesDir, '.bug-hunter', 'profiles', 'testuser.json'))).toBe(false);
    });

    it('handles deletion of non-existent profile gracefully', () => {
      expect(() => deleteProfile('nonexistent')).not.toThrow();
    });
  });

  describe('exportProfileJSON', () => {
    it('exports profile as valid JSON', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const json = exportProfileJSON('testuser');
      const parsed = JSON.parse(json);

      expect(parsed.totalBugsSolved).toBe(1);
      expect(parsed.conceptsMastered).toContain('race-conditions');
    });

    it('exports with proper formatting', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const json = exportProfileJSON('testuser');
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('exportProfileMarkdown', () => {
    it('exports profile as markdown', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const markdown = exportProfileMarkdown('testuser');

      expect(markdown).toContain('# 🏆 testuser\'s Bug Hunter Profile');
      expect(markdown).toContain('## Stats');
      expect(markdown).toContain('Bugs Solved');
    });

    it('includes achievement section', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const markdown = exportProfileMarkdown('testuser');

      expect(markdown).toContain('## Achievements');
      expect(markdown).toContain('Unlocked:');
    });

    it('includes category breakdown', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const markdown = exportProfileMarkdown('testuser');

      expect(markdown).toContain('### By Category');
      expect(markdown).toContain('Concept Mastery:');
      expect(markdown).toContain('Breadth:');
      expect(markdown).toContain('Consistency:');
    });

    it('includes specializations when available', () => {
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });
      recordBugSolved('testuser', {
        language: 'rust',
        domain: 'backend',
        concepts: ['race-conditions'],
      });

      const markdown = exportProfileMarkdown('testuser');

      expect(markdown).toContain('## Top Specializations');
      expect(markdown).toContain('race-conditions');
    });
  });
});
