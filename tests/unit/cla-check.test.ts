import { describe, it, expect } from "vitest";
import { extractPushAuthors } from "@/lib/cla-check";

describe("extractPushAuthors", () => {
  it("extracts unique authors from commits", () => {
    const commits = [
      { author: { username: "alice", email: "alice@example.com" } },
      { author: { username: "bob", email: "bob@example.com" } },
    ];
    const result = extractPushAuthors(commits);
    expect(result).toEqual([
      { githubId: null, login: "alice", email: "alice@example.com" },
      { githubId: null, login: "bob", email: "bob@example.com" },
    ]);
  });

  it("skips non-distinct commits", () => {
    const commits = [
      { distinct: true, author: { username: "alice", email: "alice@example.com" } },
      { distinct: false, author: { username: "bob", email: "bob@example.com" } },
    ];
    const result = extractPushAuthors(commits);
    expect(result).toHaveLength(1);
    expect(result[0].login).toBe("alice");
  });

  it("deduplicates by login", () => {
    const commits = [
      { author: { username: "alice", email: "alice@example.com" } },
      { author: { username: "alice", email: "alice-other@example.com" } },
    ];
    const result = extractPushAuthors(commits);
    expect(result).toHaveLength(1);
  });

  it("deduplicates by email when login is null", () => {
    const commits = [
      { author: { username: null, email: "shared@example.com" } },
      { author: { username: null, email: "shared@example.com" } },
    ];
    const result = extractPushAuthors(commits);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      githubId: null,
      login: null,
      email: "shared@example.com",
    });
  });

  it("handles null username and null email by skipping", () => {
    const commits = [
      { author: { username: null, email: null } },
      { author: { username: "alice", email: "alice@example.com" } },
    ];
    const result = extractPushAuthors(commits);
    expect(result).toHaveLength(1);
    expect(result[0].login).toBe("alice");
  });

  it("handles undefined username and email", () => {
    const commits = [{ author: {} }];
    const result = extractPushAuthors(commits);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    const result = extractPushAuthors([]);
    expect(result).toEqual([]);
  });

  it("always sets githubId to null", () => {
    const commits = [
      { author: { username: "alice", email: "alice@example.com" } },
    ];
    const result = extractPushAuthors(commits);
    expect(result[0].githubId).toBeNull();
  });

  it("treats commits without distinct field as distinct", () => {
    const commits = [
      { author: { username: "alice", email: "alice@example.com" } },
    ];
    const result = extractPushAuthors(commits);
    expect(result).toHaveLength(1);
  });
});
