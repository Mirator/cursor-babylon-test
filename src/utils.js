import { Vector3 } from '@babylonjs/core';

/**
 * Calculate distance between two Vector3 points
 */
export function distance(a, b) {
    return Vector3.Distance(a, b);
}

/**
 * Normalize a vector
 */
export function normalize(vector) {
    return Vector3.Normalize(vector);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Check if two bounding boxes intersect
 */
export function boxIntersect(box1Pos, box1Size, box2Pos, box2Size) {
    return (
        box1Pos.x - box1Size.x < box2Pos.x + box2Size.x &&
        box1Pos.x + box1Size.x > box2Pos.x - box2Size.x &&
        box1Pos.y - box1Size.y < box2Pos.y + box2Size.y &&
        box1Pos.y + box1Size.y > box2Pos.y - box2Size.y &&
        box1Pos.z - box1Size.z < box2Pos.z + box2Size.z &&
        box1Pos.z + box1Size.z > box2Pos.z - box2Size.z
    );
}

/**
 * Check if a point is on the ground (simple check)
 */
export function isOnGround(position, groundY = 0, threshold = 0.5) {
    return Math.abs(position.y - groundY) < threshold;
}

