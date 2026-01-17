import { describe, it, expect } from 'vitest';

describe("Smoke Test Explicit", () => {
    it("should pass math with imports", () => {
        expect(1 + 1).toBe(2);
    });
});
