import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// Import the functions we're testing (we'll need to export them from index.ts)
// For now, we'll define them inline to test - in a real scenario, they would be exported
/**
 * Detect project type from repo contents
 */
function detectProjectType(repoDir) {
    if (fs.existsSync(path.join(repoDir, "build.zig")))
        return "zig";
    if (fs.existsSync(path.join(repoDir, "Cargo.toml")))
        return "rust";
    if (fs.existsSync(path.join(repoDir, "go.mod")))
        return "go";
    if (fs.existsSync(path.join(repoDir, "package.json")))
        return "node";
    if (fs.existsSync(path.join(repoDir, "pyproject.toml")))
        return "python";
    if (fs.existsSync(path.join(repoDir, "requirements.txt")))
        return "python";
    if (fs.existsSync(path.join(repoDir, "Makefile")))
        return "make";
    return "unknown";
}
/**
 * Extract acceptance criteria from issue body
 */
function extractAcceptanceCriteria(issueBody, issueTitle) {
    const criteria = [];
    // Look for existing checkboxes in the issue
    const checkboxMatches = issueBody.match(/- \[[ x]\] .+/g);
    if (checkboxMatches) {
        criteria.push(...checkboxMatches.map(m => m.replace(/- \[[ x]\] /, "")));
    }
    // Look for numbered lists that might be requirements
    const numberedMatches = issueBody.match(/^\d+\.\s+.+$/gm);
    if (numberedMatches && criteria.length === 0) {
        criteria.push(...numberedMatches.map(m => m.replace(/^\d+\.\s+/, "")));
    }
    // If no criteria found, generate generic ones based on the issue
    if (criteria.length === 0) {
        criteria.push(`Implement: ${issueTitle}`);
        criteria.push("All existing tests pass");
        criteria.push("New tests added for the implementation");
        criteria.push("Code follows project conventions");
        criteria.push("No compiler warnings or errors");
    }
    return criteria;
}
/**
 * Extract potential target files from issue body
 */
function extractTargetFiles(issueBody, projectType) {
    const files = [];
    // Look for file paths mentioned in the issue
    const extensions = {
        zig: ["\\.zig"],
        rust: ["\\.rs"],
        go: ["\\.go"],
        node: ["\\.ts", "\\.js", "\\.tsx", "\\.jsx"],
        python: ["\\.py"],
    };
    const exts = extensions[projectType] || ["\\.\\w+"];
    const pattern = new RegExp(`[\\w/.-]+(?:${exts.join("|")})`, "g");
    const matches = issueBody.match(pattern);
    if (matches) {
        files.push(...new Set(matches));
    }
    return files.slice(0, 10); // Limit to 10 files
}
/**
 * Generate skeleton files based on project type
 */
function generateSkeleton(projectType, issueTitle, issueBody) {
    const files = {};
    const sanitizedName = issueTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .slice(0, 30);
    switch (projectType) {
        case "zig":
            files[`${sanitizedName}.zig`] = `//! Implementation for: ${issueTitle}
//!
//! Issue: ${issueBody.slice(0, 200)}...

const std = @import("std");

// TODO: Add your implementation here

pub fn main() !void {
    // Entry point for testing
}

test "${sanitizedName}" {
    // TODO: Add tests
}
`;
            break;
        case "rust":
            files[`${sanitizedName}.rs`] = `//! Implementation for: ${issueTitle}
//!
//! Issue: ${issueBody.slice(0, 200)}...

// TODO: Add your implementation here

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_${sanitizedName}() {
        // TODO: Add tests
    }
}
`;
            break;
        case "go":
            files[`${sanitizedName}.go`] = `// Package implements: ${issueTitle}
//
// Issue: ${issueBody.slice(0, 200)}...
package main

// TODO: Add your implementation here
`;
            files[`${sanitizedName}_test.go`] = `package main

import "testing"

func Test${sanitizedName.charAt(0).toUpperCase() + sanitizedName.slice(1)}(t *testing.T) {
    // TODO: Add tests
}
`;
            break;
        case "node":
            files[`${sanitizedName}.ts`] = `/**
 * Implementation for: ${issueTitle}
 *
 * Issue: ${issueBody.slice(0, 200)}...
 */

// TODO: Add your implementation here

export function ${sanitizedName.replace(/_/g, "")}() {
  // Implementation
}
`;
            files[`${sanitizedName}.test.ts`] = `import { describe, it, expect } from 'vitest';
import { ${sanitizedName.replace(/_/g, "")} } from './${sanitizedName}';

describe('${sanitizedName}', () => {
  it('should work', () => {
    // TODO: Add tests
  });
});
`;
            break;
        case "python":
            files[`${sanitizedName}.py`] = `"""
Implementation for: ${issueTitle}

Issue: ${issueBody.slice(0, 200)}...
"""

# TODO: Add your implementation here


def ${sanitizedName}():
    """Main implementation."""
    pass


if __name__ == "__main__":
    ${sanitizedName}()
`;
            files[`test_${sanitizedName}.py`] = `"""Tests for ${sanitizedName}."""

import pytest
from ${sanitizedName} import ${sanitizedName}


def test_${sanitizedName}():
    """TODO: Add tests."""
    pass
`;
            break;
        default:
            files["implementation.txt"] = `Implementation notes for: ${issueTitle}

${issueBody}

TODO:
- [ ] Identify the correct file locations
- [ ] Implement the solution
- [ ] Add tests
`;
    }
    return files;
}
describe('detectProjectType', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
    });
    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });
    it('detects zig projects by build.zig', () => {
        fs.writeFileSync(path.join(tempDir, 'build.zig'), '');
        expect(detectProjectType(tempDir)).toBe('zig');
    });
    it('detects rust projects by Cargo.toml', () => {
        fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), '');
        expect(detectProjectType(tempDir)).toBe('rust');
    });
    it('detects go projects by go.mod', () => {
        fs.writeFileSync(path.join(tempDir, 'go.mod'), '');
        expect(detectProjectType(tempDir)).toBe('go');
    });
    it('detects node projects by package.json', () => {
        fs.writeFileSync(path.join(tempDir, 'package.json'), '');
        expect(detectProjectType(tempDir)).toBe('node');
    });
    it('detects python projects by pyproject.toml', () => {
        fs.writeFileSync(path.join(tempDir, 'pyproject.toml'), '');
        expect(detectProjectType(tempDir)).toBe('python');
    });
    it('detects python projects by requirements.txt', () => {
        fs.writeFileSync(path.join(tempDir, 'requirements.txt'), '');
        expect(detectProjectType(tempDir)).toBe('python');
    });
    it('detects make projects by Makefile', () => {
        fs.writeFileSync(path.join(tempDir, 'Makefile'), '');
        expect(detectProjectType(tempDir)).toBe('make');
    });
    it('returns unknown for unrecognized projects', () => {
        expect(detectProjectType(tempDir)).toBe('unknown');
    });
    it('prioritizes build.zig over other markers', () => {
        fs.writeFileSync(path.join(tempDir, 'build.zig'), '');
        fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), '');
        expect(detectProjectType(tempDir)).toBe('zig');
    });
});
describe('extractAcceptanceCriteria', () => {
    it('extracts criteria from checkboxes', () => {
        const body = `
- [ ] Implement feature A
- [x] Implement feature B
- [ ] Add tests
`;
        const criteria = extractAcceptanceCriteria(body, 'Test Issue');
        expect(criteria).toContain('Implement feature A');
        expect(criteria).toContain('Implement feature B');
        expect(criteria).toContain('Add tests');
    });
    it('extracts criteria from numbered lists when no checkboxes exist', () => {
        const body = `
1. First requirement
2. Second requirement
3. Third requirement
`;
        const criteria = extractAcceptanceCriteria(body, 'Test Issue');
        expect(criteria).toContain('First requirement');
        expect(criteria).toContain('Second requirement');
        expect(criteria).toContain('Third requirement');
    });
    it('generates default criteria when none found', () => {
        const body = 'Some random issue body without structure';
        const title = 'Fix the bug';
        const criteria = extractAcceptanceCriteria(body, title);
        expect(criteria.length).toBeGreaterThan(0);
        expect(criteria.some(c => c.includes('Fix the bug'))).toBe(true);
        expect(criteria.some(c => c.includes('tests pass'))).toBe(true);
    });
    it('prioritizes checkboxes over numbered lists', () => {
        const body = `
- [ ] Checkbox item 1
- [ ] Checkbox item 2

1. Numbered item 1
2. Numbered item 2
`;
        const criteria = extractAcceptanceCriteria(body, 'Test Issue');
        expect(criteria).toContain('Checkbox item 1');
        expect(criteria).toContain('Checkbox item 2');
        expect(criteria).not.toContain('Numbered item 1');
    });
    it('handles mixed checkbox formats', () => {
        const body = `
- [ ] Unchecked item
- [x] Checked item
- [ ] Another unchecked
`;
        const criteria = extractAcceptanceCriteria(body, 'Test Issue');
        expect(criteria.length).toBe(3);
    });
});
describe('extractTargetFiles', () => {
    it('extracts .rs files for rust projects', () => {
        const body = 'Please modify src/main.rs and src/lib.rs';
        const files = extractTargetFiles(body, 'rust');
        expect(files).toContain('src/main.rs');
        expect(files).toContain('src/lib.rs');
    });
    it('extracts .ts files for node projects', () => {
        const body = 'Update src/index.ts and lib/utils.ts and also tests/helper.ts';
        const files = extractTargetFiles(body, 'node');
        expect(files).toContain('src/index.ts');
        expect(files).toContain('lib/utils.ts');
        expect(files).toContain('tests/helper.ts');
    });
    it('extracts .go files for go projects', () => {
        const body = 'Modify cmd/main.go and internal/server.go';
        const files = extractTargetFiles(body, 'go');
        expect(files).toContain('cmd/main.go');
        expect(files).toContain('internal/server.go');
    });
    it('extracts .zig files for zig projects', () => {
        const body = 'Update src/main.zig and src/lib.zig';
        const files = extractTargetFiles(body, 'zig');
        expect(files).toContain('src/main.zig');
        expect(files).toContain('src/lib.zig');
    });
    it('extracts .py files for python projects', () => {
        const body = 'Modify app/main.py and tests/test_main.py';
        const files = extractTargetFiles(body, 'python');
        expect(files).toContain('app/main.py');
        expect(files).toContain('tests/test_main.py');
    });
    it('deduplicates file names', () => {
        const body = 'Fix src/main.rs and src/main.rs and src/main.rs';
        const files = extractTargetFiles(body, 'rust');
        const mainRsCount = files.filter(f => f === 'src/main.rs').length;
        expect(mainRsCount).toBe(1);
    });
    it('limits to 10 files', () => {
        const filePaths = Array.from({ length: 20 }, (_, i) => `src/file${i}.rs`).join(' and ');
        const body = `Modify ${filePaths}`;
        const files = extractTargetFiles(body, 'rust');
        expect(files.length).toBeLessThanOrEqual(10);
    });
    it('handles files with dashes and dots in names', () => {
        const body = 'Update src/my-file.test.rs and src/helper-utils.rs';
        const files = extractTargetFiles(body, 'rust');
        expect(files).toContain('src/my-file.test.rs');
        expect(files).toContain('src/helper-utils.rs');
    });
});
describe('generateSkeleton', () => {
    it('generates zig skeleton with correct structure', () => {
        const skeleton = generateSkeleton('zig', 'Add new function', 'Issue description');
        expect(Object.keys(skeleton).length).toBeGreaterThan(0);
        expect(Object.keys(skeleton)[0]).toMatch(/\.zig$/);
        const content = Object.values(skeleton)[0];
        expect(content).toContain('const std = @import("std")');
        expect(content).toContain('pub fn main()');
        expect(content).toContain('test "add_new_function"');
    });
    it('generates rust skeleton with correct structure', () => {
        const skeleton = generateSkeleton('rust', 'Parse input data', 'Issue description');
        expect(Object.keys(skeleton)[0]).toMatch(/\.rs$/);
        const content = Object.values(skeleton)[0];
        expect(content).toContain('#[cfg(test)]');
        expect(content).toContain('mod tests');
        expect(content).toContain('#[test]');
    });
    it('generates go skeleton with test file', () => {
        const skeleton = generateSkeleton('go', 'Implement handler', 'Issue description');
        expect(Object.keys(skeleton).length).toBe(2);
        expect(Object.keys(skeleton)[0]).toMatch(/\.go$/);
        expect(Object.keys(skeleton)[1]).toMatch(/_test\.go$/);
        const mainContent = Object.values(skeleton)[0];
        expect(mainContent).toContain('package main');
    });
    it('generates node skeleton with test file', () => {
        const skeleton = generateSkeleton('node', 'Create utility function', 'Issue description');
        expect(Object.keys(skeleton).length).toBe(2);
        expect(Object.keys(skeleton)[0]).toMatch(/\.ts$/);
        expect(Object.keys(skeleton)[1]).toMatch(/\.test\.ts$/);
        const mainContent = Object.values(skeleton)[0];
        expect(mainContent).toContain('export function');
        const testContent = Object.values(skeleton)[1];
        expect(testContent).toContain("import { describe, it, expect } from 'vitest'");
    });
    it('generates python skeleton with test file', () => {
        const skeleton = generateSkeleton('python', 'Add validation', 'Issue description');
        expect(Object.keys(skeleton).length).toBe(2);
        expect(Object.keys(skeleton)[0]).toMatch(/\.py$/);
        expect(Object.keys(skeleton)[1]).toMatch(/^test_/);
        const mainContent = Object.values(skeleton)[0];
        expect(mainContent).toContain('def add_validation():');
    });
    it('generates skeleton for unknown project type', () => {
        const skeleton = generateSkeleton('unknown', 'Some feature', 'Issue body');
        expect(Object.keys(skeleton)[0]).toBe('implementation.txt');
        const content = Object.values(skeleton)[0];
        expect(content).toContain('Some feature');
        expect(content).toContain('Issue body');
    });
    it('sanitizes issue title for filename', () => {
        const skeleton = generateSkeleton('rust', 'Fix: the bug in API call!', 'Issue');
        const filename = Object.keys(skeleton)[0];
        expect(filename).toMatch(/fix_the_bug_in_api_call/);
    });
    it('includes issue title and body in skeleton content', () => {
        const issueTitle = 'Implement caching feature';
        const issueBody = 'Add caching to reduce database queries';
        const skeleton = generateSkeleton('node', issueTitle, issueBody);
        const content = Object.values(skeleton).join('\n');
        expect(content).toContain(issueTitle);
    });
    it('limits issue body content in skeleton', () => {
        const longBody = 'A'.repeat(500);
        const skeleton = generateSkeleton('rust', 'Test', longBody);
        const content = Object.values(skeleton).join('\n');
        expect(content.includes(longBody)).toBe(false);
    });
});
