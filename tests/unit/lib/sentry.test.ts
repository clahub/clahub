import { describe, it, expect } from "vitest";
import { scrubSensitiveData } from "@/lib/sentry";

describe("scrubSensitiveData", () => {
  it("redacts keys matching sensitive patterns", () => {
    const input = {
      token: "abc123",
      secret: "s3cret",
      password: "hunter2",
      authorization: "Bearer xyz",
      apiKey: "key-123",
      cookie: "session=abc",
      privateData: "hidden",
      x_hub_signature: "sha256=...",
    };

    const result = scrubSensitiveData(input);

    expect(result.token).toBe("[REDACTED]");
    expect(result.secret).toBe("[REDACTED]");
    expect(result.password).toBe("[REDACTED]");
    expect(result.authorization).toBe("[REDACTED]");
    expect(result.apiKey).toBe("[REDACTED]");
    expect(result.cookie).toBe("[REDACTED]");
    expect(result.privateData).toBe("[REDACTED]");
    expect(result.x_hub_signature).toBe("[REDACTED]");
  });

  it("preserves non-sensitive keys", () => {
    const input = { route: "/api/test", method: "POST", status: 200 };
    const result = scrubSensitiveData(input);

    expect(result).toEqual(input);
  });

  it("handles nested objects recursively", () => {
    const input = {
      user: { name: "alice", token: "abc" },
      config: { nested: { secret: "deep" } },
    };

    const result = scrubSensitiveData(input);

    expect(result).toEqual({
      user: { name: "alice", token: "[REDACTED]" },
      config: { nested: { secret: "[REDACTED]" } },
    });
  });

  it("passes through null and undefined values", () => {
    const input = { name: null, age: undefined, token: "abc" };
    const result = scrubSensitiveData(input);

    expect(result.name).toBeNull();
    expect(result.age).toBeUndefined();
    expect(result.token).toBe("[REDACTED]");
  });

  it("preserves arrays without recursing into them", () => {
    const input = { tags: ["a", "b"], secret: "hidden" };
    const result = scrubSensitiveData(input);

    expect(result.tags).toEqual(["a", "b"]);
    expect(result.secret).toBe("[REDACTED]");
  });

  it("returns empty object for empty input", () => {
    expect(scrubSensitiveData({})).toEqual({});
  });
});
