import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronDown,
  Download,
  MoreHorizontal,
  ArrowRight,
  FileText,
  Eye,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { modules, type ModuleKey } from "../data/modules";
import { useApp, money, type AppRecord } from "../lib/store";
import { Badge, Button, EmptyState, Modal, PageHeader } from "../components/ui";
import { DeleteConfirm } from "../components/data/DetailPrimitives";

export function exportRecords(records: AppRecord[], name: string) {
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [
    "Number,Title,Party,Date,Amount,Status",
    ...records.map((record) =>
      [
        record.id,
        record.title,
        record.party,
        record.date,
        record.amount,
        record.status,
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
export function RecordList({
  kind,
  procurement = false,
  approval = false,
}: {
  kind: ModuleKey;
  procurement?: boolean;
  approval?: boolean;
}) {
  const config = modules[kind];
  const { records, updateRecord, deleteRecord, notify } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("All"),
    [sort, setSort] = useState("newest"),
    [selected, setSelected] = useState<string[]>([]),
    [detail, setDetail] = useState<AppRecord | null>(null),
    [pendingDelete, setPendingDelete] = useState<AppRecord | null>(null);
  const all = records.filter(
    (record) =>
      record.kind === kind &&
      (!approval || record.status === "Pending Approval"),
  );
  const filtered = all
    .filter(
      (record) =>
        `${record.id} ${record.title} ${record.party}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "All" ||
          (status === "Empty" && false) ||
          record.status === status),
    )
    .sort((a, b) =>
      sort === "amount"
        ? b.amount - a.amount
        : sort === "oldest"
          ? a.id.localeCompare(b.id)
          : b.id.localeCompare(a.id),
    );
  const title = approval
    ? "Approvals"
    : procurement
      ? "Purchase Requests"
      : config.title;
  const statuses = [...new Set(all.map((record) => record.status))];
  const returnContext = procurement
    ? "?entry=procurement"
    : approval
      ? "?entry=approvals"
      : "";
  const changeApproval = (record: AppRecord, next: string) => {
    updateRecord(record.id, { status: next });
    setDetail(null);
    notify(
      `${record.id} ${next.toLowerCase()} in this demo only. No Zoho record changed.`,
    );
  };
  const removeRecord = () => {
    if (!pendingDelete) return;
    deleteRecord(pendingDelete.id);
    notify(
      `${pendingDelete.id} removed from local demo data. Linked records remain unchanged.`,
    );
    setPendingDelete(null);
    setDetail(null);
  };
  const forward = (record: AppRecord) => {
    const destination: Record<string, string> = {
      requests: "/rfqs/new",
      "purchase-orders": "/purchase-receives/new",
      "purchase-receives": "/bills/new",
      bills: "/payments/new",
    };
    const entry =
      record.kind === "requests" && procurement
        ? "&entry=procurement"
        : record.kind === "requests" && approval
          ? "&entry=approvals"
          : "";
    navigate(
      `${destination[record.kind]}?source=${encodeURIComponent(record.id)}${entry}`,
    );
  };
  return (
    <div className="p-5 sm:p-8">
      <PageHeader
        title={title}
        subtitle={
          approval
            ? "Review requests awaiting your approval."
            : procurement
              ? "The Procurement team view of the same purchase-request records."
              : config.description
        }
        actions={
          <>
            <Button
              variant="secondary"
              aria-label="Export visible records"
              onClick={() => exportRecords(filtered, kind)}
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </Button>
            {!approval && (
              <Link
                to={`/${kind}/new${procurement ? "?entry=procurement" : ""}`}
              >
                <Button>
                  <Plus size={16} />
                  New {config.singular}
                </Button>
              </Link>
            )}
          </>
        }
      />
      {(procurement || approval) && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-md border border-blue-100 bg-blue-50/40 px-4 py-3 text-xs text-slate-500">
          <span>
            {approval
              ? "Approval decisions are simulated locally."
              : "Shared records · Role-specific workflow actions"}
          </span>
          <Link to="/requests" className="shrink-0 text-blue-500">
            Employee view →
          </Link>
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <select
                aria-label="Filter records by status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="bg-transparent pr-2 outline-none"
              >
                <option value="All">
                  All {approval ? "Pending Requests" : title}
                </option>
                {statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
                <option value="Empty">Empty state preview</option>
              </select>
              <ChevronDown size={14} className="text-slate-400" />
            </label>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
              {filtered.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                aria-label={`Search ${title}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records"
                className="w-36 rounded-md border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 sm:w-52"
              />
            </div>
            <select
              aria-label="Sort records"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="hidden bg-transparent text-xs text-slate-400 sm:block"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Highest amount</option>
            </select>
          </div>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50 px-5 py-3 text-xs text-blue-700">
            <span>{selected.length} selected</span>
            <Button
              variant="secondary"
              onClick={() =>
                exportRecords(
                  all.filter((record) => selected.includes(record.id)),
                  `${kind}-selected`,
                )
              }
            >
              Export selected
            </Button>
            <button className="ml-auto" onClick={() => setSelected([])}>
              Clear selection
            </button>
          </div>
        )}
        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="table-head">
                <tr>
                  <th className="table-cell !py-3">
                    <input
                      aria-label="Select all visible records"
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        filtered.every((record) => selected.includes(record.id))
                      }
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? filtered.map((record) => record.id)
                            : [],
                        )
                      }
                    />
                  </th>
                  {[
                    "Date",
                    "Number / Description",
                    kind === "requests" ? "Department" : "Vendor / Team",
                    "Status",
                    kind === "rfqs" ? "Type" : "Amount",
                    "",
                  ].map((label, index) => (
                    <th key={index} className="table-cell !py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-[#fafbfe]">
                    <td className="table-cell w-10">
                      <input
                        type="checkbox"
                        aria-label={`Select ${record.id}`}
                        checked={selected.includes(record.id)}
                        onChange={(event) =>
                          setSelected(
                            event.target.checked
                              ? [...selected, record.id]
                              : selected.filter((id) => id !== record.id),
                          )
                        }
                      />
                    </td>
                    <td className="table-cell text-slate-500">{record.date}</td>
                    <td className="table-cell">
                      <Link
                        className="text-left"
                        to={`/${kind}/${record.id}${returnContext}`}
                      >
                        <span className="font-medium text-blue-500">
                          {record.id}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          {record.title}
                        </span>
                      </Link>
                    </td>
                    <td className="table-cell text-slate-600">
                      {record.party}
                    </td>
                    <td className="table-cell">
                      <Badge>{record.status}</Badge>
                    </td>
                    <td className="table-cell font-medium text-slate-700">
                      {kind === "rfqs"
                        ? "Request for Quote"
                        : money(record.amount)}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => setDetail(record)}
                        aria-label={`Actions for ${record.id}`}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={
              status === "Empty"
                ? `No ${title.toLowerCase()} to display`
                : query
                  ? "No matching records"
                  : "Nothing to review yet"
            }
            description={
              query
                ? "Try another search term or clear your filters."
                : approval
                  ? "Approved and rejected requests no longer appear in this queue."
                  : `Create your first ${config.singular.toLowerCase()} to start this workflow.`
            }
            action={
              !approval && (
                <Link to={`/${kind}/new${returnContext}`}>
                  <Button>
                    <Plus size={15} />
                    New {config.singular}
                  </Button>
                </Link>
              )
            }
          />
        )}
        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          <span>{filtered.length} records · Fictional data</span>
          <span>25 per page</span>
        </footer>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400">
        <FileText size={12} />
        Canonical screen:{" "}
        {approval
          ? "approval.inbox"
          : procurement
            ? "purchase-request.list.procurement"
            : `${kind}.list`}{" "}
        · Reference{" "}
        {approval ? "03" : procurement ? "08" : config.reference.slice(0, 2)}
      </p>
      {detail && (
        <Modal
          title={`${detail.id} · ${config.singular}`}
          onClose={() => setDetail(null)}
          wide
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-medium">{detail.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{detail.party}</p>
            </div>
            <Badge>{detail.status}</Badge>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Link to={`/${kind}/${detail.id}${returnContext}`}>
              <Button variant="secondary">
                <Eye size={14} /> View full details
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setPendingDelete(detail)}>
              Delete locally
            </Button>
          </div>
          <div className="my-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-400">Date</p>
              <p className="mt-1 text-sm">{detail.date}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Amount</p>
              <p className="mt-1 font-semibold">{money(detail.amount)}</p>
            </div>
          </div>
          {detail.lines?.length ? (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="table-head">
                  <tr>
                    {["Item", "Quantity", "Rate", "Amount"].map((label) => (
                      <th key={label} className="table-cell !py-2">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="table-cell">{line.name}</td>
                      <td className="table-cell">
                        {line.quantity} {line.unit}
                      </td>
                      <td className="table-cell">{money(line.rate)}</td>
                      <td className="table-cell">
                        {money(line.quantity * line.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {detail.kind === "requests" &&
            detail.status === "Pending Approval" &&
            (approval || procurement) ? (
              <>
                <Button onClick={() => changeApproval(detail, "Approved")}>
                  <Check size={15} />
                  Approve (demo)
                </Button>
                <Button
                  variant="danger"
                  onClick={() => changeApproval(detail, "Rejected")}
                >
                  <X size={15} />
                  Reject (demo)
                </Button>
              </>
            ) : null}
            <Link
              to={`/${kind}/${detail.id}/edit${detail.kind === "requests" ? returnContext : ""}`}
            >
              <Button variant="secondary">
                <Pencil size={14} />
                Edit record
              </Button>
            </Link>
            {((detail.kind === "requests" && detail.status === "Approved") ||
              ["purchase-orders", "purchase-receives", "bills"].includes(
                detail.kind,
              )) && (
              <Button onClick={() => forward(detail)}>
                {detail.kind === "requests"
                  ? "Create RFQ"
                  : detail.kind === "purchase-orders"
                    ? "Record receive"
                    : detail.kind === "purchase-receives"
                      ? "Create bill"
                      : "Record payment"}
                <ArrowRight size={14} />
              </Button>
            )}
            {detail.kind === "requests" && detail.status === "Approved" && (
              <Link to={`/purchase-orders/new?source=${detail.id}`}>
                <Button variant="secondary">Create purchase order</Button>
              </Link>
            )}
          </div>
          <p className="mt-5 text-xs text-slate-400">
            This preview and all workflow actions use local demo state. There is
            no live approval, order, receipt, or payment.
          </p>
        </Modal>
      )}
      <DeleteConfirm
        open={Boolean(pendingDelete)}
        title="Delete record?"
        description={`Delete ${pendingDelete?.id ?? "this record"} from local demo data? Linked records remain unchanged and nothing is deleted from Zoho.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={removeRecord}
      />
    </div>
  );
}
