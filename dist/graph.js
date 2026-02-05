/**
 * Conceptual Dependency Graph for Learning Progression
 *
 * Maps CS concepts and their prerequisites, enabling:
 * - Visualization of concept relationships
 * - Learning path recommendations
 * - Mastery tracking per concept
 * - Gap detection in understanding
 */
/**
 * Comprehensive dependency graph with 15+ core CS concepts
 */
export const CONCEPT_GRAPH = {
    // Fundamentals
    "basic-types": {
        id: "basic-types",
        name: "Basic Types",
        description: "Understanding integers, floats, strings, booleans, and type representation in memory",
        difficulty: "beginner",
        prerequisites: [],
        relatedConcepts: ["type-systems", "memory-management"],
    },
    "control-flow": {
        id: "control-flow",
        name: "Control Flow",
        description: "If statements, loops, conditional execution, and control structures",
        difficulty: "beginner",
        prerequisites: ["basic-types"],
        relatedConcepts: ["algorithms", "recursion"],
    },
    // Core Concepts
    "functions-and-scope": {
        id: "functions-and-scope",
        name: "Functions and Scope",
        description: "Function definitions, scope, closures, and variable lifetime",
        difficulty: "beginner",
        prerequisites: ["control-flow"],
        relatedConcepts: ["recursion", "higher-order-functions"],
    },
    "recursion": {
        id: "recursion",
        name: "Recursion",
        description: "Recursive functions, call stacks, base cases, and recursive problem solving",
        difficulty: "intermediate",
        prerequisites: ["functions-and-scope"],
        relatedConcepts: ["algorithms", "data-structures"],
    },
    "memory-management": {
        id: "memory-management",
        name: "Memory Management",
        description: "Stack vs heap, allocation/deallocation, ownership, and memory safety",
        difficulty: "intermediate",
        prerequisites: ["basic-types"],
        relatedConcepts: ["pointers-references", "garbage-collection"],
    },
    "pointers-references": {
        id: "pointers-references",
        name: "Pointers and References",
        description: "Pointer arithmetic, dereferencing, reference semantics, and aliasing",
        difficulty: "intermediate",
        prerequisites: ["memory-management"],
        relatedConcepts: ["memory-leak", "null-reference"],
    },
    // Data Structures
    "data-structures": {
        id: "data-structures",
        name: "Data Structures",
        description: "Arrays, linked lists, trees, graphs, hash tables, and collections",
        difficulty: "intermediate",
        prerequisites: ["recursion"],
        relatedConcepts: ["algorithms", "optimization"],
    },
    "algorithms": {
        id: "algorithms",
        name: "Algorithms",
        description: "Sorting, searching, traversal, and algorithm analysis (Big-O notation)",
        difficulty: "intermediate",
        prerequisites: ["data-structures"],
        relatedConcepts: ["optimization", "performance-bottleneck"],
    },
    // Type Systems & Logic
    "type-systems": {
        id: "type-systems",
        name: "Type Systems",
        description: "Static vs dynamic typing, type inference, generics, and type safety",
        difficulty: "intermediate",
        prerequisites: ["basic-types"],
        relatedConcepts: ["type-mismatch", "null-reference"],
    },
    "pattern-matching": {
        id: "pattern-matching",
        name: "Pattern Matching",
        description: "Destructuring, exhaustiveness checking, and match expressions",
        difficulty: "intermediate",
        prerequisites: ["type-systems"],
        relatedConcepts: ["error-handling", "null-reference"],
    },
    // Concurrency & Async
    "async-await": {
        id: "async-await",
        name: "Async/Await",
        description: "Asynchronous programming, promises, futures, and non-blocking I/O",
        difficulty: "intermediate",
        prerequisites: ["functions-and-scope"],
        relatedConcepts: ["concurrency", "error-handling"],
    },
    "concurrency": {
        id: "concurrency",
        name: "Concurrency",
        description: "Threads, processes, race conditions, deadlocks, and synchronization primitives",
        difficulty: "advanced",
        prerequisites: ["memory-management", "async-await"],
        relatedConcepts: ["atomics", "locks", "race-conditions"],
    },
    "atomics": {
        id: "atomics",
        name: "Atomic Operations",
        description: "Atomic reads/writes, compare-and-swap, memory ordering, and lock-free programming",
        difficulty: "advanced",
        prerequisites: ["concurrency"],
        relatedConcepts: ["locks", "race-conditions"],
    },
    "locks": {
        id: "locks",
        name: "Locks and Synchronization",
        description: "Mutexes, semaphores, readers-writer locks, and synchronization strategies",
        difficulty: "advanced",
        prerequisites: ["atomics"],
        relatedConcepts: ["race-conditions", "deadlock"],
    },
    // Error Handling & Testing
    "error-handling": {
        id: "error-handling",
        name: "Error Handling",
        description: "Exceptions, error codes, error propagation, and recovery",
        difficulty: "intermediate",
        prerequisites: ["control-flow"],
        relatedConcepts: ["pattern-matching", "testing"],
    },
    "testing": {
        id: "testing",
        name: "Testing",
        description: "Unit tests, integration tests, mocks, test-driven development, and coverage",
        difficulty: "intermediate",
        prerequisites: ["functions-and-scope"],
        relatedConcepts: ["error-handling", "debugging"],
    },
    "debugging": {
        id: "debugging",
        name: "Debugging",
        description: "Debugging techniques, logging, profiling, and problem diagnosis",
        difficulty: "intermediate",
        prerequisites: ["testing"],
        relatedConcepts: ["all"],
    },
    // Advanced Topics
    "optimization": {
        id: "optimization",
        name: "Optimization",
        description: "Performance optimization, caching, memoization, and profiling",
        difficulty: "advanced",
        prerequisites: ["algorithms", "testing"],
        relatedConcepts: ["performance-bottleneck", "memory-management"],
    },
    "api-design": {
        id: "api-design",
        name: "API Design",
        description: "Interface design, contracts, versioning, and API compatibility",
        difficulty: "intermediate",
        prerequisites: ["type-systems"],
        relatedConcepts: ["error-handling", "testing"],
    },
    "garbage-collection": {
        id: "garbage-collection",
        name: "Garbage Collection",
        description: "GC algorithms, mark-and-sweep, reference counting, and memory pressure",
        difficulty: "advanced",
        prerequisites: ["memory-management"],
        relatedConcepts: ["optimization", "performance-bottleneck"],
    },
    // Problem Categories (from taxonomy)
    "race-conditions": {
        id: "race-conditions",
        name: "Race Conditions",
        description: "Detecting, debugging, and fixing race conditions in concurrent code",
        difficulty: "advanced",
        prerequisites: ["locks", "atomics"],
        relatedConcepts: ["concurrency", "testing"],
    },
    "deadlock": {
        id: "deadlock",
        name: "Deadlock",
        description: "Understanding, detecting, and resolving deadlock scenarios",
        difficulty: "advanced",
        prerequisites: ["locks"],
        relatedConcepts: ["race-conditions", "concurrency"],
    },
    "null-reference": {
        id: "null-reference",
        name: "Null Reference",
        description: "Understanding null/undefined, null safety, optional types, and defensive coding",
        difficulty: "intermediate",
        prerequisites: ["type-systems"],
        relatedConcepts: ["error-handling", "pattern-matching"],
    },
    "type-mismatch": {
        id: "type-mismatch",
        name: "Type Mismatch",
        description: "Type checking, casting, coercion, and handling type incompatibilities",
        difficulty: "intermediate",
        prerequisites: ["type-systems"],
        relatedConcepts: ["api-design", "null-reference"],
    },
    "memory-leak": {
        id: "memory-leak",
        name: "Memory Leak",
        description: "Detecting, preventing, and fixing memory leaks and resource leaks",
        difficulty: "intermediate",
        prerequisites: ["memory-management", "pointers-references"],
        relatedConcepts: ["garbage-collection", "testing"],
    },
    "performance-bottleneck": {
        id: "performance-bottleneck",
        name: "Performance Bottleneck",
        description: "Profiling, identifying, and optimizing performance issues",
        difficulty: "advanced",
        prerequisites: ["algorithms", "optimization"],
        relatedConcepts: ["testing", "debugging"],
    },
};
/**
 * Get all prerequisites for a concept (including transitive prerequisites)
 */
export function getPrerequisites(conceptId) {
    const visited = new Set();
    const prerequisites = new Set();
    function visit(id) {
        if (visited.has(id) || !CONCEPT_GRAPH[id])
            return;
        visited.add(id);
        const node = CONCEPT_GRAPH[id];
        for (const prereq of node.prerequisites) {
            prerequisites.add(prereq);
            visit(prereq);
        }
    }
    visit(conceptId);
    return prerequisites;
}
/**
 * Get concepts that depend on a given concept
 */
export function getDependents(conceptId) {
    const dependents = [];
    for (const [id, node] of Object.entries(CONCEPT_GRAPH)) {
        if (node.prerequisites.includes(conceptId)) {
            dependents.push(id);
        }
    }
    return dependents;
}
/**
 * Generate ASCII visualization of the dependency graph
 */
export function generateGraphVisualization() {
    let output = "";
    output += "\n╔════════════════════════════════════════════════════════════════╗\n";
    output += "║         CS CONCEPTS DEPENDENCY GRAPH - Learning Path           ║\n";
    output += "╚════════════════════════════════════════════════════════════════╝\n\n";
    // Group by difficulty
    const byDifficulty = {
        beginner: [],
        intermediate: [],
        advanced: [],
    };
    for (const node of Object.values(CONCEPT_GRAPH)) {
        byDifficulty[node.difficulty].push(node);
    }
    // Beginner
    output += "┌─ BEGINNER LEVEL ─────────────────────────────────────────────┐\n";
    byDifficulty.beginner.forEach((node, i) => {
        const prefix = i === byDifficulty.beginner.length - 1 ? "└" : "├";
        output += `${prefix}─ ${node.name}\n`;
        if (node.prerequisites.length === 0) {
            output += `   (no prerequisites)\n`;
        }
    });
    output += "\n";
    // Intermediate
    output +=
        "┌─ INTERMEDIATE LEVEL ──────────────────────────────────────────┐\n";
    byDifficulty.intermediate.forEach((node, i) => {
        const prefix = i === byDifficulty.intermediate.length - 1 ? "└" : "├";
        output += `${prefix}─ ${node.name}\n`;
        if (node.prerequisites.length > 0) {
            const prereqs = node.prerequisites
                .map((id) => CONCEPT_GRAPH[id]?.name || id)
                .join(", ");
            output += `   requires: ${prereqs}\n`;
        }
    });
    output += "\n";
    // Advanced
    output += "┌─ ADVANCED LEVEL ──────────────────────────────────────────────┐\n";
    byDifficulty.advanced.forEach((node, i) => {
        const prefix = i === byDifficulty.advanced.length - 1 ? "└" : "├";
        output += `${prefix}─ ${node.name}\n`;
        if (node.prerequisites.length > 0) {
            const prereqs = node.prerequisites
                .map((id) => CONCEPT_GRAPH[id]?.name || id)
                .join(", ");
            output += `   requires: ${prereqs}\n`;
        }
    });
    output += "\n";
    // Learning paths
    output +=
        "╔════════════════════════════════════════════════════════════════╗\n";
    output += "║ RECOMMENDED LEARNING PATHS                                       ║\n";
    output +=
        "╚════════════════════════════════════════════════════════════════╝\n\n";
    output += "PATH 1: Foundation → Fundamentals → Concurrency\n";
    output += "  1. Basic Types\n";
    output += "  2. Control Flow\n";
    output += "  3. Functions and Scope\n";
    output += "  4. Recursion\n";
    output += "  5. Memory Management\n";
    output += "  6. Async/Await\n";
    output += "  7. Concurrency\n";
    output += "  8. Locks and Synchronization\n";
    output += "  9. Race Conditions (advanced)\n\n";
    output += "PATH 2: Foundation → Data Structures → Algorithms → Optimization\n";
    output += "  1. Basic Types\n";
    output += "  2. Control Flow\n";
    output += "  3. Functions and Scope\n";
    output += "  4. Recursion\n";
    output += "  5. Data Structures\n";
    output += "  6. Algorithms\n";
    output += "  7. Optimization\n";
    output += "  8. Performance Bottleneck (advanced)\n\n";
    output += "PATH 3: Foundation → Type Systems → Error Handling → Testing\n";
    output += "  1. Basic Types\n";
    output += "  2. Type Systems\n";
    output += "  3. Pattern Matching\n";
    output += "  4. Error Handling\n";
    output += "  5. Testing\n";
    output += "  6. Debugging\n\n";
    return output;
}
/**
 * Analyze concept mastery and recommend next concept to learn
 */
export function recommendNextConcept(masteredConcepts) {
    const candidates = [];
    for (const [conceptId, node] of Object.entries(CONCEPT_GRAPH)) {
        // Skip if already mastered
        if (masteredConcepts.has(conceptId))
            continue;
        // Check if all prerequisites are mastered
        const prerequisitesMet = node.prerequisites.every((prereq) => masteredConcepts.has(prereq));
        if (prerequisitesMet) {
            // Score based on how many dependents this concept has
            const dependents = getDependents(conceptId);
            const score = dependents.length;
            candidates.push({
                conceptId,
                score,
                reason: `Unlocks ${dependents.length} dependent concepts`,
            });
        }
    }
    if (candidates.length === 0)
        return null;
    // Return the candidate with highest score (most impactful)
    candidates.sort((a, b) => b.score - a.score);
    return {
        conceptId: candidates[0].conceptId,
        reason: candidates[0].reason,
    };
}
/**
 * Get detailed mastery report
 */
export function generateMasteryReport(mastery) {
    const masteredConcepts = new Set(mastery.filter((m) => m.mastered).map((m) => m.conceptId));
    let report = "";
    report += "═══════════════════════════════════════════════════════════════\n";
    report += "                    MASTERY REPORT\n";
    report += "═══════════════════════════════════════════════════════════════\n\n";
    const masteryCount = mastery.filter((m) => m.mastered).length;
    const totalCount = Object.keys(CONCEPT_GRAPH).length;
    const percentage = Math.round((masteryCount / totalCount) * 100);
    report += `Overall Progress: ${masteryCount}/${totalCount} concepts (${percentage}%)\n\n`;
    // Group by depth
    const byDepth = {
        surface: [],
        intermediate: [],
        deep: [],
    };
    for (const m of mastery.filter((m) => m.mastered)) {
        byDepth[m.depth].push(m);
    }
    report += "Deep Understanding:\n";
    byDepth.deep.forEach((m) => {
        const node = CONCEPT_GRAPH[m.conceptId];
        report += `  ✓ ${node.name} (${m.bugsCompleted} bugs)\n`;
    });
    report += "\nIntermediate Understanding:\n";
    byDepth.intermediate.forEach((m) => {
        const node = CONCEPT_GRAPH[m.conceptId];
        report += `  ◐ ${node.name} (${m.bugsCompleted} bugs)\n`;
    });
    report += "\nSurface Understanding:\n";
    byDepth.surface.forEach((m) => {
        const node = CONCEPT_GRAPH[m.conceptId];
        report += `  ○ ${node.name} (${m.bugsCompleted} bugs)\n`;
    });
    // Gaps analysis
    const gapsConcepts = [];
    for (const [conceptId, node] of Object.entries(CONCEPT_GRAPH)) {
        if (masteredConcepts.has(conceptId))
            continue;
        const prequisitesMet = node.prerequisites.every((p) => masteredConcepts.has(p));
        if (prequisitesMet) {
            gapsConcepts.push(node.name);
        }
    }
    if (gapsConcepts.length > 0) {
        report += "\nReady to Learn Next:\n";
        gapsConcepts.forEach((name) => {
            report += `  → ${name}\n`;
        });
    }
    report +=
        "\n═══════════════════════════════════════════════════════════════\n";
    return report;
}
/**
 * Get concept by ID
 */
export function getConceptNode(conceptId) {
    return CONCEPT_GRAPH[conceptId] || null;
}
/**
 * List all concepts
 */
export function listAllConcepts() {
    return Object.values(CONCEPT_GRAPH);
}
/**
 * Find concepts by keyword
 */
export function searchConcepts(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return Object.values(CONCEPT_GRAPH).filter((node) => {
        return (node.name.toLowerCase().includes(lowerKeyword) ||
            node.description.toLowerCase().includes(lowerKeyword));
    });
}
