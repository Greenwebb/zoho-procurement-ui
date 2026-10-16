import { describe, it, expect } from "vitest";
import { transactionTotals, validateLines } from "./calculations";
import { saveToRecords, fixtures, type Line } from "./store";
import { modules, canonicalRoutes } from "../data/modules";
import { settingsRoutes } from "../data/settings";

import { billBalance } from "./payables";

const lines: Line[] = [
  { id: "1", name: "Office chair", quantity: 2, rate: 1250, unit: "pcs" },
];
describe("shared transaction primitives", () => {
  it("applies discount before exclusive tax", () => {
    const result = transactionTotals(lines, 10, 16, false);
    expect(result).toEqual({
      subtotal: 2500,
      discountAmount: 250,
      tax: 360,
      total: 2610,
    });
  });
  it("does not add included tax a second time", () => {
    const result = transactionTotals(lines, 0, 16, true);
    expect(result.total).toBe(2500);
    expect(result.tax).toBeCloseTo(344.827586);
  });
  it("rejects missing items, zero quantities, and negative rates", () => {
    expect(validateLines([])).toBeTruthy();
    expect(validateLines([{ ...lines[0], name: "" }])).toBeTruthy();
    expect(validateLines([{ ...lines[0], quantity: 0 }])).toBeTruthy();
    expect(validateLines([{ ...lines[0], rate: -1 }])).toBeTruthy();
    expect(validateLines(lines)).toBe("");
  });
  it("clamps discounts without producing negative totals", () => {
    expect(transactionTotals(lines, 500, 0, false).total).toBe(0);
    expect(transactionTotals(lines, -10, 0, false).total).toBe(2500);
  });
});
describe("canonical screens and records", () => {
  it("has unique reachable declared routes and entity-specific editor mappings", () => {
    const routes = [...canonicalRoutes, ...settingsRoutes];
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
    expect(routes.every((route) => route.path.startsWith("/"))).toBe(true);
    for (const module of Object.values(modules))
      expect(routes.some((route) => route.path === `/${module.key}/new`)).toBe(
        true,
      );
    expect(
      routes.some(
        (route) => route.path === "/settings/modules/purchase-orders/fields",
      ),
    ).toBe(true);
  });
  it("replaces a shared record instead of duplicating it for a different workflow", () => {
    const old = fixtures.find((record) => record.kind === "requests")!;
    const records = saveToRecords(fixtures, { ...old, status: "Approved" });
    expect(records.length).toBe(fixtures.length);
    expect(records.filter((record) => record.id === old.id)).toHaveLength(1);
    expect(records.find((record) => record.id === old.id)?.status).toBe(
      "Approved",
    );
  });
  it("uses fictional and distinct catalog identifiers", () => {
    expect(fixtures.filter((record) => record.kind === "items")).toHaveLength(
      3,
    );
    expect(fixtures.filter((record) => record.kind === "vendors")).toHaveLength(
      3,
    );
    expect(new Set(fixtures.map((record) => record.id)).size).toBe(
      fixtures.length,
    );
  });
});

describe("payable lifecycle balance", () => {
  const bill = fixtures.find((record) => record.kind === "bills")!;
  const payment = {
    ...fixtures.find((record) => record.kind === "payments")!,
    meta: { billId: bill.id },
  };
  const credit = {
    ...fixtures.find((record) => record.kind === "vendor-credits")!,
    meta: { appliedBillId: bill.id },
  };
  it("deducts applied payment and credit once, not orders or batch values", () => {
    expect(billBalance([...fixtures, payment, credit], bill)).toBe(680);
  });
  it("draft allocations do not change a posted bill balance", () => {
    expect(
      billBalance(
        [
          ...fixtures,
          { ...payment, status: "Draft" },
          { ...credit, status: "Draft" },
        ],
        bill,
      ),
    ).toBe(1700);
    expect(billBalance(fixtures, { ...bill, status: "Draft" })).toBe(0);
  });
  it("supports editing an allocation without counting it twice and clamps to zero", () => {
    expect(billBalance([...fixtures, payment], bill, payment.id)).toBe(1700);
    expect(billBalance([...fixtures, { ...payment, amount: 9999 }], bill)).toBe(
      0,
    );
  });
});
