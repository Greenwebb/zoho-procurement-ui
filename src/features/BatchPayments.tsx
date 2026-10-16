import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, ChevronRight, Inbox, WalletCards } from "lucide-react";
import { billBalance } from "../lib/payables";
import {
  Badge,
  Button,
  EmptyState,
  Modal,
  PageHeader,
  Panel,
} from "../components/ui";
import { money, today, useApp, type AppRecord } from "../lib/store";

export function BatchPayments() {
  const { records, saveRecord, notify } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryRecord = searchParams.get("record");
  const bills = records.filter(
    (record) =>
      record.kind === "bills" &&
      !["Draft", "Pending Approval"].includes(record.status) &&
      billBalance(records, record) > 0,
  );
  const batches = records
    .filter((record) => record.kind === "batch-payments")
    .sort((a, b) => b.id.localeCompare(a.id));
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState(false);
  const batch = batches.find((record) => record.id === queryRecord);
  const selectedBills = bills.filter((bill) => selected.includes(bill.id));
  const total = selectedBills.reduce(
    (sum, bill) => sum + billBalance(records, bill),
    0,
  );
  const allSelected = bills.length > 0 && selected.length === bills.length;
  const toggle = (id: string) =>
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  const confirmBatch = () => {
    const record: AppRecord = {
      id: `BATCH-${String(Date.now()).slice(-6)}`,
      kind: "batch-payments",
      title: `Batch payment · ${selectedBills.length} bills`,
      party: "Local payment run",
      date: today(),
      amount: total,
      status: "Prepared (demo)",
      meta: {
        billIds: selectedBills.map((bill) => bill.id).join(","),
        allocations: JSON.stringify(
          selectedBills.map((bill) => ({
            id: bill.id,
            party: bill.party,
            amount: billBalance(records, bill),
          })),
        ),
      },
    };
    saveRecord(record);
    setReview(false);
    setSelected([]);
    notify("Batch payment prepared locally. No payment was sent.");
    navigate(`/batch-payments?record=${encodeURIComponent(record.id)}`);
  };
  const linkedBills = (batch?.meta?.billIds || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((id) => records.find((record) => record.id === id))
    .filter((record): record is AppRecord => Boolean(record));
  return (
    <div>
      <PageHeader
        title="Batch payments"
        subtitle="Select open vendor bills and review a simulated payment batch."
        actions={
          <Button disabled={!selected.length} onClick={() => setReview(true)}>
            <WalletCards size={15} />
            Review batch ({selected.length})
          </Button>
        }
      />
      <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Local-only preview:</strong> preparing a batch creates an
        internal record for review. Bank transfers and payment gateways are not
        connected.
      </div>
      <Panel
        title="Open vendor bills"
        action={
          <span className="text-xs text-slate-400">
            {bills.length} eligible
          </span>
        }
      >
        {bills.length === 0 ? (
          <EmptyState
            title="No open bills"
            description="Open bill records will appear here when they are ready for payment."
            action={
              <Link to="/inbox">
                <Button>
                  <Inbox size={15} />
                  Go to inbox
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="table-cell w-12 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected ? [] : bills.map((bill) => bill.id),
                        )
                      }
                      aria-label="Select all open bills"
                    />
                  </th>
                  <th className="table-cell text-left">Bill</th>
                  <th className="table-cell text-left">Vendor</th>
                  <th className="table-cell text-left">Due date</th>
                  <th className="table-cell text-right">Amount</th>
                  <th className="table-cell text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    className={`${selected.includes(bill.id) ? "bg-blue-50/60" : ""} hover:bg-blue-50/30`}
                  >
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selected.includes(bill.id)}
                        onChange={() => toggle(bill.id)}
                        aria-label={`Select ${bill.id}`}
                      />
                    </td>
                    <td className="table-cell font-medium text-slate-800">
                      {bill.id}
                      <div className="text-[11px] text-slate-400">
                        {bill.title}
                      </div>
                    </td>
                    <td className="table-cell">{bill.party}</td>
                    <td className="table-cell">
                      {bill.meta?.dueDate || bill.date}
                    </td>
                    <td className="table-cell text-right">
                      {money(billBalance(records, bill))}
                    </td>
                    <td className="table-cell">
                      <Badge>{bill.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <div className="mt-5 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-slate-500">
          Selected bills:{" "}
          <strong className="text-slate-800">{selected.length}</strong>
        </span>
        <span className="text-lg font-semibold text-slate-900">
          Total {money(total)}
        </span>
      </div>
      <Panel
        className="mt-5"
        title="Prepared batches"
        action={
          <span className="text-xs text-slate-400">Local demo records</span>
        }
      >
        {batches.length === 0 ? (
          <EmptyState
            title="No batches prepared"
            description="Reviewed batches will be recorded here without initiating bank transfers."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {batches.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  navigate(
                    `/batch-payments?record=${encodeURIComponent(item.id)}`,
                  )
                }
                className="flex w-full flex-col gap-2 px-5 py-4 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-medium text-blue-600">{item.id}</span>
                  <span className="ml-2 text-sm text-slate-700">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {item.date} ·{" "}
                    {item.meta?.billIds?.split(",").filter(Boolean).length || 0}{" "}
                    bills
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge>{item.status}</Badge>
                  <strong>{money(item.amount)}</strong>
                  <ChevronRight size={15} className="text-slate-400" />
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>
      {review && (
        <Modal title="Review batch payment" onClose={() => setReview(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              This creates a local review record for the selected bills.
            </p>
            <div className="divide-y divide-slate-100 rounded-md border border-slate-200">
              {selectedBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between px-3 py-2.5 text-sm"
                >
                  <span>
                    {bill.id}
                    <span className="ml-2 text-xs text-slate-400">
                      {bill.party}
                    </span>
                  </span>
                  <strong>{money(billBalance(records, bill))}</strong>
                </div>
              ))}
              <div className="flex items-center justify-between bg-slate-50 px-3 py-3 font-semibold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No money moves and no bank or payment service is contacted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReview(false)}>
                Cancel
              </Button>
              <Button onClick={confirmBatch}>
                <Check size={15} />
                Prepare batch
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {batch && (
        <Modal
          title={`${batch.id} · Batch detail`}
          onClose={() => navigate("/batch-payments", { replace: true })}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Status</span>
              <Badge>{batch.status}</Badge>
            </div>
            <div className="rounded-md border border-slate-200">
              {linkedBills.length ? (
                linkedBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between border-b border-slate-100 px-3 py-3 text-sm last:border-0"
                  >
                    <span>
                      {bill.id}
                      <span className="ml-2 text-xs text-slate-400">
                        {bill.party}
                      </span>
                    </span>
                    <strong>
                      {money(
                        (
                          JSON.parse(batch.meta?.allocations || "[]") as {
                            id: string;
                            amount: number;
                          }[]
                        ).find((item) => item.id === bill.id)?.amount ??
                          bill.amount,
                      )}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="p-3 text-sm text-slate-500">
                  This batch does not contain linked bill details.
                </p>
              )}
              <div className="flex items-center justify-between bg-slate-50 px-3 py-3 font-semibold">
                <span>Batch total</span>
                <span>{money(batch.amount)}</span>
              </div>
            </div>
            <p className="rounded bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Prepared locally on {batch.date}. This is not an actual payment
              instruction.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate("/batch-payments", { replace: true })}
            >
              Close details
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
