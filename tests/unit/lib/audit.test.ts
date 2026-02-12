import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import { logAudit, getClientIp } from "@/lib/audit";

const mockHeaders = vi.mocked(headers);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getClientIp", () => {
  it("returns first IP from x-forwarded-for", async () => {
    mockHeaders.mockResolvedValue(
      new Map([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]]) as any,
    );

    expect(await getClientIp()).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", async () => {
    mockHeaders.mockResolvedValue(
      new Map([["x-real-ip", "10.0.0.1"]]) as any,
    );

    expect(await getClientIp()).toBe("10.0.0.1");
  });

  it("returns null when no IP headers present", async () => {
    mockHeaders.mockResolvedValue(new Map() as any);

    expect(await getClientIp()).toBeNull();
  });

  it("trims whitespace from x-forwarded-for", async () => {
    mockHeaders.mockResolvedValue(
      new Map([["x-forwarded-for", "  9.8.7.6 , 1.1.1.1"]]) as any,
    );

    expect(await getClientIp()).toBe("9.8.7.6");
  });
});

describe("logAudit", () => {
  function makeTx() {
    return { auditLog: { create: vi.fn().mockResolvedValue({}) } } as any;
  }

  it("calls tx.auditLog.create with correct data", async () => {
    const tx = makeTx();

    await logAudit(tx, {
      userId: 1,
      action: "agreement.create",
      entityType: "Agreement",
      entityId: 42,
      after: { foo: "bar" },
      ipAddress: "1.2.3.4",
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        action: "agreement.create",
        entityType: "Agreement",
        entityId: 42,
        before: null,
        after: JSON.stringify({ foo: "bar" }),
        ipAddress: "1.2.3.4",
      },
    });
  });

  it("stringifies before and after objects", async () => {
    const tx = makeTx();

    await logAudit(tx, {
      userId: 1,
      action: "agreement.update",
      entityType: "Agreement",
      entityId: 42,
      before: { old: true },
      after: { new: true },
    });

    const call = tx.auditLog.create.mock.calls[0][0];
    expect(call.data.before).toBe(JSON.stringify({ old: true }));
    expect(call.data.after).toBe(JSON.stringify({ new: true }));
  });

  it("passes null for undefined before/after", async () => {
    const tx = makeTx();

    await logAudit(tx, {
      userId: 1,
      action: "exclusion.delete",
      entityType: "Exclusion",
      entityId: 5,
    });

    const call = tx.auditLog.create.mock.calls[0][0];
    expect(call.data.before).toBeNull();
    expect(call.data.after).toBeNull();
  });

  it("passes ipAddress through", async () => {
    const tx = makeTx();

    await logAudit(tx, {
      userId: 1,
      action: "signature.sign",
      entityType: "Signature",
      entityId: 10,
      ipAddress: "192.168.1.1",
    });

    expect(tx.auditLog.create.mock.calls[0][0].data.ipAddress).toBe(
      "192.168.1.1",
    );
  });

  it("defaults ipAddress to null when not provided", async () => {
    const tx = makeTx();

    await logAudit(tx, {
      userId: 1,
      action: "signature.sign",
      entityType: "Signature",
      entityId: 10,
    });

    expect(tx.auditLog.create.mock.calls[0][0].data.ipAddress).toBeNull();
  });
});
