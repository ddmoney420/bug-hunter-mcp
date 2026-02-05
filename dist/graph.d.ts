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
 * Represents a single concept node in the dependency graph
 */
export interface ConceptNode {
    id: string;
    name: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    prerequisites: string[];
    relatedConcepts: string[];
}
/**
 * Represents mastery status of a concept
 */
export interface MasteryStatus {
    conceptId: string;
    mastered: boolean;
    depth: "surface" | "intermediate" | "deep";
    bugsCompleted: number;
}
/**
 * Comprehensive dependency graph with 15+ core CS concepts
 */
export declare const CONCEPT_GRAPH: Record<string, ConceptNode>;
/**
 * Get all prerequisites for a concept (including transitive prerequisites)
 */
export declare function getPrerequisites(conceptId: string): Set<string>;
/**
 * Get concepts that depend on a given concept
 */
export declare function getDependents(conceptId: string): string[];
/**
 * Generate ASCII visualization of the dependency graph
 */
export declare function generateGraphVisualization(): string;
/**
 * Analyze concept mastery and recommend next concept to learn
 */
export declare function recommendNextConcept(masteredConcepts: Set<string>): {
    conceptId: string;
    reason: string;
} | null;
/**
 * Get detailed mastery report
 */
export declare function generateMasteryReport(mastery: MasteryStatus[]): string;
/**
 * Get concept by ID
 */
export declare function getConceptNode(conceptId: string): ConceptNode | null;
/**
 * List all concepts
 */
export declare function listAllConcepts(): ConceptNode[];
/**
 * Find concepts by keyword
 */
export declare function searchConcepts(keyword: string): ConceptNode[];
