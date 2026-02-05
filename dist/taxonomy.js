/**
 * Issue Taxonomy with Problem-Solving Strategy Patterns
 *
 * Categorizes issues by problem type and pairs each with proven debugging strategies.
 * This teaches metacognitive skills: "how to approach different problem types."
 */
/**
 * Complete issue taxonomy with 8+ categories
 */
export const ISSUE_TAXONOMY = {
    "race-condition": {
        id: "race-condition",
        name: "Race Condition",
        description: "Multiple threads/tasks accessing shared state without proper synchronization, leading to unpredictable behavior",
        keywords: ["concurrent", "threading", "race", "mutex", "lock", "sync"],
        strategies: [
            {
                name: "Add Logging with Timestamps",
                description: "Instrument code with detailed timestamps to track order of execution across threads",
                steps: [
                    "Identify shared resource access points",
                    "Add high-precision logging (nanosecond timestamps) before/after critical sections",
                    "Run test multiple times to observe execution order variations",
                    "Look for interleaving patterns that cause inconsistent results",
                ],
                tools: ["console.log", "println!", "print!", "strace", "ltrace"],
            },
            {
                name: "Use Thread Sanitizer (TSan)",
                description: "Compile with thread sanitizer to detect data races at runtime",
                steps: [
                    "Recompile with ThreadSanitizer enabled (-fsanitize=thread)",
                    "Run the problematic code under TSan",
                    "Review TSan reports for data races",
                    "Check if TSan identifies the exact access patterns causing issues",
                ],
                tools: [
                    "ThreadSanitizer (TSan)",
                    "cargo-tsan",
                    "clang -fsanitize=thread",
                    "gcc -fsanitize=thread",
                ],
            },
            {
                name: "Review Lock Ordering and Synchronization",
                description: "Analyze lock acquisition order and synchronization mechanisms",
                steps: [
                    "Map all shared resources and their protective locks",
                    "Trace lock acquisition order in different code paths",
                    "Look for circular wait (deadlock patterns)",
                    "Verify atomic operations vs mutex-protected sections",
                    "Check for missing barriers or volatile declarations",
                ],
                tools: [
                    "code review",
                    "Helgrind (valgrind tool)",
                    "Intel Inspector",
                    "clang thread-safety annotations",
                ],
            },
        ],
        successTips: [
            "Most race conditions are revealed by running tests repeatedly (10-100 times)",
            "Timing-dependent bugs often surface under heavy system load",
            "Use mutex/lock visualizers to understand contention",
            "Memory barriers and acquire/release semantics matter in lock-free code",
        ],
    },
    "memory-leak": {
        id: "memory-leak",
        name: "Memory Leak",
        description: "Allocated memory that is no longer referenced but never freed, gradually exhausting available memory",
        keywords: ["memory", "leak", "malloc", "new", "allocate", "gc"],
        strategies: [
            {
                name: "Profile with Memory Debugger",
                description: "Use specialized memory profiling tools to track allocations and deallocations",
                steps: [
                    "Build with debug symbols (-g flag)",
                    "Run under memory profiler (Valgrind memcheck or similar)",
                    "Trigger the suspected memory leak code path",
                    "Review profiler report for non-freed allocations",
                    "Check source file and line number of allocation",
                ],
                tools: [
                    "Valgrind (memcheck)",
                    "AddressSanitizer (ASan)",
                    "LeakCanary",
                    "Dr.Memory",
                    "Instruments (macOS)",
                ],
            },
            {
                name: "Trace Object Lifecycle",
                description: "Follow object creation and destruction through the codebase",
                steps: [
                    "Add constructor/destructor logging",
                    "Count allocations vs deallocations",
                    "Look for error paths that skip cleanup",
                    "Check for circular references preventing garbage collection",
                    "Review exception handling - ensure cleanup on thrown exceptions",
                ],
                tools: [
                    "debugger breakpoints",
                    "gdb",
                    "lldb",
                    "Print statements",
                    "custom allocator hooks",
                ],
            },
            {
                name: "Check Resource Management Patterns",
                description: "Verify RAII (C++), defer statements, or proper use of scope guards",
                steps: [
                    "Identify all resource acquisition points (malloc, new, open, etc.)",
                    "Verify matching release calls (free, delete, close, etc.)",
                    "Check if resources are acquired in try/catch/finally blocks",
                    "Use static analysis to find unmatched alloc/dealloc pairs",
                    "Ensure cleanup happens even on error paths",
                ],
                tools: [
                    "cppcheck",
                    "clang static analyzer",
                    "Rust (ownership checker)",
                    "code review",
                ],
            },
        ],
        successTips: [
            "Memory leaks often grow over time - stress test with many iterations",
            "Not all unfreed memory is a leak (some may be intentional caches)",
            "Cycle detection helps find reference count bugs",
            "Most memory debuggers have minimal overhead",
        ],
    },
    "incorrect-logic": {
        id: "incorrect-logic",
        name: "Incorrect Logic",
        description: "Algorithm or control flow produces wrong results; business logic errors or off-by-one mistakes",
        keywords: [
            "logic",
            "algorithm",
            "calculation",
            "condition",
            "off-by-one",
            "wrong result",
        ],
        strategies: [
            {
                name: "Unit Test and Property-Based Testing",
                description: "Write targeted tests to isolate and verify logic behavior",
                steps: [
                    "Identify the suspect function/module",
                    "Write simple unit test with known input/output",
                    "Add boundary case tests (edge cases, empty input, etc.)",
                    "Use property-based testing to generate random inputs",
                    "Verify expectations match actual output",
                ],
                tools: [
                    "pytest",
                    "Jest",
                    "vitest",
                    "QuickCheck",
                    "Hypothesis",
                    "property-based testing frameworks",
                ],
            },
            {
                name: "Step Through with Debugger",
                description: "Use a debugger to trace execution and watch variable values",
                steps: [
                    "Set breakpoint at function entry",
                    "Step through line by line",
                    "Watch variable values at each step",
                    "Compare actual values against expected values",
                    "Look for where actual diverges from expected",
                ],
                tools: ["gdb", "lldb", "VS Code debugger", "IDE debugger", "pdb"],
            },
            {
                name: "Add Strategic Assertions and Logging",
                description: "Insert assertions to verify invariants and log intermediate values",
                steps: [
                    "Identify invariants that must be true",
                    "Add assertion statements at key points",
                    "Log intermediate calculations with context",
                    "Run with assertions enabled",
                    "Look for assertion failures or suspicious log values",
                ],
                tools: [
                    "assert",
                    "console.log",
                    "println!",
                    "printf",
                    "debug logs",
                ],
            },
        ],
        successTips: [
            "Off-by-one errors are common in loops - check boundary conditions",
            "Logic errors often hide in complex conditional expressions",
            "Test with zero, one, and many items",
            "Consider floating-point precision issues in numeric logic",
        ],
    },
    "api-incompatibility": {
        id: "api-incompatibility",
        name: "API Incompatibility",
        description: "Code uses API in a way that conflicts with its contract or expected behavior; version mismatches",
        keywords: [
            "api",
            "compatibility",
            "version",
            "deprecation",
            "interface",
            "contract",
        ],
        strategies: [
            {
                name: "Review API Documentation and Change Logs",
                description: "Study official docs to understand breaking changes",
                steps: [
                    "Check API documentation for the version you're using",
                    "Review changelog for version upgrades",
                    "Look for deprecation warnings in your code editor",
                    "Search for examples of correct API usage",
                    "Compare your usage to documented examples",
                ],
                tools: [
                    "official docs",
                    "GitHub releases/changelog",
                    "type hints/JSDoc",
                    "IDE quick info",
                ],
            },
            {
                name: "Check Dependency Versions and Pins",
                description: "Verify correct versions and resolve version conflicts",
                steps: [
                    "Check package.json/Cargo.toml for pinned versions",
                    "Run package manager to show installed versions",
                    "Look for version conflicts (multiple versions of same package)",
                    "Try upgrading to latest compatible version",
                    "Check if issue resolves after upgrade",
                ],
                tools: [
                    "npm list",
                    "cargo tree",
                    "go mod graph",
                    "pip list",
                    "composer show",
                ],
            },
            {
                name: "Compile with Strict Mode and Warnings",
                description: "Enable compiler warnings to catch API misuse early",
                steps: [
                    "Enable strict compiler flags (-Wall, --strict, etc.)",
                    "Look for deprecation warnings",
                    "Check for type mismatch errors",
                    "Review compiler output for compatibility warnings",
                    "Address warnings before running code",
                ],
                tools: [
                    "tsc --strict",
                    "cargo clippy",
                    "gcc -Wall",
                    "mypy --strict",
                    "pylint",
                ],
            },
        ],
        successTips: [
            "API breaking changes usually documented in release notes",
            "Type checkers catch many API incompatibilities automatically",
            "Version lock files prevent unexpected API changes",
            "Deprecation warnings often indicate future breaking changes",
        ],
    },
    "type-mismatch": {
        id: "type-mismatch",
        name: "Type Mismatch",
        description: "Data of the wrong type passed to function or assigned to variable; casting errors",
        keywords: [
            "type",
            "mismatch",
            "cast",
            "conversion",
            "string",
            "number",
            "bool",
        ],
        strategies: [
            {
                name: "Enable Strict Type Checking",
                description: "Activate type checker to catch type errors early",
                steps: [
                    "Enable TypeScript strict mode or equivalent",
                    "Run type checker before runtime",
                    "Review type errors reported by checker",
                    "Add type annotations where inferred types are wrong",
                    "Use discriminated unions for complex types",
                ],
                tools: [
                    "TypeScript",
                    "mypy",
                    "Pyright",
                    "go vet",
                    "rustc (inherently strict)",
                ],
            },
            {
                name: "Add Type Assertions and Casts",
                description: "Explicitly declare expected types and verify at runtime if needed",
                steps: [
                    "Add explicit type annotations to variables",
                    "Use type assertions where type checker can't infer",
                    "Add runtime checks for values from external sources",
                    "Use type guards (typeof, instanceof checks)",
                    "Consider custom type predicates for complex types",
                ],
                tools: [
                    "type annotations",
                    "type guards",
                    "instanceof",
                    "typeof",
                    "as operator",
                ],
            },
            {
                name: "Trace Data Flow and Transformations",
                description: "Follow data through transformations to identify where types diverge",
                steps: [
                    "Identify source of mistyped value",
                    "Trace through all transformations",
                    "Check return types of intermediate functions",
                    "Verify JSON parsing and serialization",
                    "Look for implicit type coercion",
                ],
                tools: [
                    "debugger",
                    "type checker",
                    "console.log with typeof",
                    "debugger variable inspector",
                ],
            },
        ],
        successTips: [
            "Use TypeScript/mypy to catch many type errors without running code",
            "Type annotations are documentation AND verification",
            "Be careful with implicit type coercion (especially in dynamic languages)",
            "Nullable types need explicit null checks",
        ],
    },
    "null-reference": {
        id: "null-reference",
        name: "Null/Undefined Reference",
        description: "Accessing property or method on null/undefined value; NullPointerException or TypeError",
        keywords: [
            "null",
            "undefined",
            "nil",
            "none",
            "nullpointer",
            "cannot read property",
        ],
        strategies: [
            {
                name: "Add Null Checks and Safe Navigation",
                description: "Insert defensive checks before accessing potentially null values",
                steps: [
                    "Identify line causing null access error",
                    "Trace back to where null value came from",
                    "Add null check before accessing property",
                    "Use safe navigation operator (?. in TS/JS)",
                    "Consider default values or error handling",
                ],
                tools: [
                    "if checks",
                    "?.  operator",
                    "Optional types",
                    "try-catch",
                ],
            },
            {
                name: "Use Strict Null Checking",
                description: "Enable strict null checks in language/type checker to prevent nulls",
                steps: [
                    "Enable strictNullChecks in TypeScript config",
                    "Review all type checker errors",
                    "Add explicit null checks where needed",
                    "Use nullable types (Optional<T>, ?T, etc.)",
                    "Consider using non-null assertion only as last resort",
                ],
                tools: [
                    "TypeScript strictNullChecks",
                    "Rust Option<T>",
                    "Kotlin nullability",
                    "Dart null safety",
                ],
            },
            {
                name: "Trace Object Initialization and Assignment",
                description: "Verify objects are properly initialized before use throughout their lifecycle",
                steps: [
                    "Check where object is created/initialized",
                    "Look for error paths that might return null",
                    "Verify all code paths set required properties",
                    "Add logging to track when null is introduced",
                    "Use debugger to inspect object state",
                ],
                tools: [
                    "debugger",
                    "logging",
                    "constructor validation",
                    "invariant checks",
                ],
            },
        ],
        successTips: [
            "TypeScript strict null checking prevents most null errors at compile time",
            "Null errors are often at integration points (API responses, database queries)",
            "Use nullable types to explicitly mark values that might be null",
            "Optional chaining (?.) makes code more concise and safe",
        ],
    },
    "performance-bottleneck": {
        id: "performance-bottleneck",
        name: "Performance Bottleneck",
        description: "Code runs too slowly; excessive memory, CPU, or I/O causing poor user experience",
        keywords: [
            "slow",
            "performance",
            "bottleneck",
            "latency",
            "timeout",
            "memory",
        ],
        strategies: [
            {
                name: "Profile CPU and Memory Usage",
                description: "Use profilers to identify hot spots consuming most time/memory",
                steps: [
                    "Build with debug symbols",
                    "Run code under CPU profiler",
                    "Identify functions consuming most time (flame graph)",
                    "Run under memory profiler to check allocations",
                    "Focus optimization efforts on hottest paths",
                ],
                tools: [
                    "perf",
                    "Instruments (macOS)",
                    "py-spy",
                    "nodejs inspector",
                    "flamegraph",
                ],
            },
            {
                name: "Analyze Algorithm Complexity",
                description: "Review algorithmic approach and data structures",
                steps: [
                    "Identify the suspect function/loop",
                    "Analyze time complexity (O(n), O(n²), etc.)",
                    "Check for nested loops or exponential recursion",
                    "Look for redundant computations in loops",
                    "Consider more efficient algorithms or data structures",
                ],
                tools: [
                    "Big-O analysis",
                    "algorithm reference",
                    "code review",
                    "benchmarking",
                ],
            },
            {
                name: "Benchmark and Profile I/O",
                description: "Measure and optimize disk/network I/O operations",
                steps: [
                    "Identify I/O operations (file, network, database)",
                    "Measure latency of each operation",
                    "Look for synchronous I/O in loops",
                    "Consider batching requests",
                    "Use async/await to parallelize I/O",
                ],
                tools: [
                    "timing measurements",
                    "strace",
                    "network monitoring",
                    "database query analyzer",
                ],
            },
        ],
        successTips: [
            "80/20 rule: 80% of time spent in 20% of code",
            "Profile before optimizing - intuition often wrong",
            "Algorithm changes often beat micro-optimizations",
            "Caching frequently-computed values yields big wins",
        ],
    },
    "encoding-error": {
        id: "encoding-error",
        name: "Encoding Error",
        description: "Character encoding mismatch (UTF-8, ASCII, etc.); garbled text or deserialization failures",
        keywords: [
            "encoding",
            "charset",
            "unicode",
            "utf",
            "ascii",
            "garbled",
            "codec",
        ],
        strategies: [
            {
                name: "Verify Encoding at All Boundaries",
                description: "Check that data encoding is consistent across file, network, and memory",
                steps: [
                    "Identify where data enters system (file, API, database)",
                    "Check declared encoding at each boundary",
                    "Verify source encoding matches expected encoding",
                    "Add encoding annotation to source files",
                    "Check HTTP headers, file BOM, database charset",
                ],
                tools: [
                    "file -i",
                    "iconv",
                    "chardet",
                    "curl -v (see headers)",
                    "xxd (hex dump)",
                ],
            },
            {
                name: "Add Encoding Declaration and Conversion",
                description: "Explicitly declare and convert between encodings as needed",
                steps: [
                    "Add UTF-8 declaration at top of source files",
                    "Use explicit encoding when reading/writing files",
                    "Convert between encodings at system boundaries",
                    "Use encoding-aware string functions",
                    "Test with non-ASCII characters",
                ],
                tools: [
                    "# -*- coding: utf-8 -*-",
                    "encoding declaration",
                    "encode/decode functions",
                    "iconv",
                ],
            },
            {
                name: "Test with Non-ASCII Characters",
                description: "Exercise code with emoji, accents, and non-Latin scripts",
                steps: [
                    "Add test cases with special characters",
                    "Include emoji (requires UTF-8 support)",
                    "Test with accented characters (é, ñ, etc.)",
                    "Test with non-Latin scripts (Chinese, Arabic, etc.)",
                    "Verify round-trip: encode → decode → equals original",
                ],
                tools: [
                    "test fixtures",
                    "unit tests",
                    "integration tests",
                    "fuzzing with non-ASCII",
                ],
            },
        ],
        successTips: [
            "UTF-8 is the standard encoding for text - use it everywhere",
            "Character 'mojibake' (garbled text) indicates encoding mismatch",
            "JSON must be UTF-8 encoded per spec",
            "Be careful with CSV/Excel files which default to system encoding",
        ],
    },
    "deadlock": {
        id: "deadlock",
        name: "Deadlock",
        description: "Two or more threads/processes waiting on each other, causing permanent hang; circular wait condition",
        keywords: ["deadlock", "hang", "blocked", "circular", "wait", "timeout"],
        strategies: [
            {
                name: "Visualize Lock Dependencies",
                description: "Map lock acquisition order and identify circular dependencies",
                steps: [
                    "List all locks in the system",
                    "Document order locks are acquired in each code path",
                    "Look for circular patterns (A→B→A)",
                    "Check for unbounded waits (missing timeouts)",
                    "Verify lock release happens in all code paths",
                ],
                tools: [
                    "code analysis",
                    "thread dump",
                    "lock visualizers",
                    "graph analysis tools",
                ],
            },
            {
                name: "Add Timeouts and Deadlock Detection",
                description: "Implement mechanisms to detect and recover from deadlocks",
                steps: [
                    "Add timeout to all lock acquisitions",
                    "Log acquisition timeouts as warnings",
                    "Implement deadlock detector that monitors thread progress",
                    "Use watchdog timers for long-running operations",
                    "Gracefully handle timeout with recovery",
                ],
                tools: [
                    "timeout primitives",
                    "watchdog timers",
                    "deadlock detector libraries",
                    "logging",
                ],
            },
            {
                name: "Enforce Consistent Lock Ordering",
                description: "Ensure all code paths acquire locks in the same order",
                steps: [
                    "Document the canonical lock order",
                    "Review all lock acquisitions",
                    "Refactor to enforce ordering throughout codebase",
                    "Use lock guards to prevent violations",
                    "Add assertions to catch lock order violations",
                ],
                tools: [
                    "code review",
                    "static analysis",
                    "lock guards",
                    "assertions",
                ],
            },
        ],
        successTips: [
            "Deadlocks hang indefinitely - add timeouts to break hangs",
            "Hold locks for minimal time to reduce deadlock probability",
            "Lock-free data structures eliminate many deadlock risks",
            "Process thread dumps to identify waiting conditions",
        ],
    },
    "assertion-error": {
        id: "assertion-error",
        name: "Assertion Error",
        description: "Assertion or assumption violated; invariant broken or precondition not met",
        keywords: ["assert", "assertion", "invariant", "precondition", "assumption"],
        strategies: [
            {
                name: "Trace Assertion Context",
                description: "Understand what condition failed and why",
                steps: [
                    "Identify the failed assertion",
                    "Understand what invariant it's checking",
                    "Add logging around assertion to see state",
                    "Check preconditions - what should be true before this point",
                    "Verify assumption about input/state",
                ],
                tools: [
                    "assertion message/stack trace",
                    "logging",
                    "debugger",
                    "test runner output",
                ],
            },
            {
                name: "Add Precondition Checks",
                description: "Add defensive checks to validate function inputs match assumptions",
                steps: [
                    "Identify what assumptions the code makes",
                    "Add checks at function entry for each assumption",
                    "Raise clear error if precondition violated",
                    "Document preconditions in function comments",
                    "Consider design by contract approach",
                ],
                tools: [
                    "if statements",
                    "throw Error",
                    "assert library",
                    "Guard clauses",
                ],
            },
            {
                name: "Verify State and Data Consistency",
                description: "Check that objects and state remain consistent throughout operations",
                steps: [
                    "Identify what represents consistent state",
                    "Add assertions to key points checking invariants",
                    "Run with assertions enabled",
                    "Look for where invariant is violated",
                    "Fix the code violating invariant",
                ],
                tools: [
                    "assertions",
                    "unit tests",
                    "invariant checking",
                    "property-based testing",
                ],
            },
        ],
        successTips: [
            "Failed assertions reveal assumption violations, not the root cause",
            "Add more specific assertions to pinpoint where state diverges",
            "Assertions in tests catch regressions early",
            "Fail fast principle: catch errors near where they occur",
        ],
    },
};
/**
 * Get strategy for a category
 */
export function getStrategy(categoryId) {
    return ISSUE_TAXONOMY[categoryId] || null;
}
/**
 * List all category IDs
 */
export function listCategories() {
    return Object.keys(ISSUE_TAXONOMY);
}
/**
 * Search categories by keyword
 */
export function searchCategories(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return Object.values(ISSUE_TAXONOMY).filter((category) => {
        return (category.name.toLowerCase().includes(lowerKeyword) ||
            category.description.toLowerCase().includes(lowerKeyword) ||
            category.keywords.some((k) => k.includes(lowerKeyword)));
    });
}
/**
 * Suggest category based on issue keywords
 */
export function suggestCategory(issueTitle, issueBody) {
    const lowerTitle = issueTitle.toLowerCase();
    const lowerBody = issueBody.toLowerCase();
    const combinedText = `${lowerTitle} ${lowerBody}`;
    let bestMatch = {
        category: "",
        score: 0,
    };
    for (const [categoryId, category] of Object.entries(ISSUE_TAXONOMY)) {
        let score = 0;
        // Check keywords
        for (const keyword of category.keywords) {
            const keywordCount = (combinedText.match(new RegExp(keyword, "g")) || [])
                .length;
            score += keywordCount * 2; // Weight keywords more heavily
        }
        // Check category name
        if (combinedText.includes(category.name.toLowerCase())) {
            score += 5;
        }
        if (score > bestMatch.score) {
            bestMatch = { category: categoryId, score };
        }
    }
    return bestMatch.score > 0 ? bestMatch.category : null;
}
