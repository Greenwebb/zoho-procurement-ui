import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { CheckCircle2, X } from "lucide-react";

export type Line = {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  unit: string;
  account?: string;
};
export type AppRecord = {
  id: string;
  kind: string;
  title: string;
  party: string;
  date: string;
  amount: number;
  status: string;
  lines?: Line[];
  meta?: Record<string, string>;
};
export function useStoredState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((previous: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`procureui.${key}`);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(`procureui.${key}`, JSON.stringify(state));
    } catch {
      /* Browser storage may be unavailable. */
    }
  }, [key, state]);
  return [state, setState];
}
export const today = () => new Date().toISOString().slice(0, 10);
export const money = (value: number) =>
  new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    maximumFractionDigits: 2,
  }).format(value);
export const vendors = [
  "Northstar Office Supply",
  "Copperline Technology",
  "Atlas Industrial Supplies",
];
export const items = [
  { name: "Office chair", rate: 1250, unit: "pcs" },
  { name: "Business laptop", rate: 8400, unit: "pcs" },
  { name: "Printer paper", rate: 85, unit: "box" },
];
export const fixtures: AppRecord[] = [
  ...items.map((item, index) => ({
    id: `ITEM-${String(index + 1).padStart(3, "0")}`,
    kind: "items",
    title: item.name,
    party: "Inventory",
    date: today(),
    amount: item.rate,
    status: "Active",
    meta: {
      unit: item.unit,
      sku: `SKU-${index + 1}`,
      account: "Office Supplies",
    },
  })),
  ...vendors.map((name, index) => ({
    id: `VEND-${String(index + 1).padStart(3, "0")}`,
    kind: "vendors",
    title: name,
    party: "Zambia",
    date: today(),
    amount: 0,
    status: "Active",
    meta: { email: `supplier${index + 1}@example.test`, currency: "ZMW" },
  })),
  {
    id: "PR-00001",
    kind: "requests",
    title: "Office equipment for new team",
    party: "Operations",
    date: today(),
    amount: 15900,
    status: "Pending Approval",
    lines: [
      { id: "1", name: "Office chair", quantity: 6, rate: 1250, unit: "pcs" },
      {
        id: "2",
        name: "Business laptop",
        quantity: 1,
        rate: 8400,
        unit: "pcs",
      },
    ],
  },
  {
    id: "PR-00002",
    kind: "requests",
    title: "Quarterly stationery",
    party: "Finance",
    date: today(),
    amount: 1700,
    status: "Approved",
  },
  {
    id: "RFQ-00001",
    kind: "rfqs",
    title: "Office equipment sourcing",
    party: "Procurement team",
    date: today(),
    amount: 0,
    status: "Draft",
  },
  {
    id: "PO-00001",
    kind: "purchase-orders",
    title: "Office equipment",
    party: vendors[0],
    date: today(),
    amount: 7500,
    status: "Draft",
  },
  {
    id: "RCV-00001",
    kind: "purchase-receives",
    title: "Stationery delivery",
    party: vendors[0],
    date: today(),
    amount: 1700,
    status: "Received",
  },
  {
    id: "BILL-00001",
    kind: "bills",
    title: "Office supplies",
    party: vendors[0],
    date: today(),
    amount: 1700,
    status: "Open",
  },
  {
    id: "RB-00001",
    kind: "recurring-bills",
    title: "Monthly equipment service",
    party: vendors[2],
    date: today(),
    amount: 2400,
    status: "Active",
  },
  {
    id: "PAY-00001",
    kind: "payments",
    title: "Stationery payment",
    party: vendors[0],
    date: today(),
    amount: 850,
    status: "Paid",
  },
  {
    id: "VC-00001",
    kind: "vendor-credits",
    title: "Returned supplies",
    party: vendors[0],
    date: today(),
    amount: 170,
    status: "Open",
  },
];
export function saveToRecords(records: AppRecord[], record: AppRecord) {
  return [record, ...records.filter((existing) => existing.id !== record.id)];
}
type Store = {
  records: AppRecord[];
  saveRecord: (record: AppRecord) => void;
  updateRecord: (id: string, updates: Partial<AppRecord>) => void;
  notify: (message: string) => void;
};
const Context = createContext<Store | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useStoredState("records.v1", fixtures);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);
  const saveRecord = (record: AppRecord) => {
    setRecords((previous) => saveToRecords(previous, record));
  };
  const updateRecord = (id: string, updates: Partial<AppRecord>) =>
    setRecords((previous) =>
      previous.map((record) =>
        record.id === id ? { ...record, ...updates } : record,
      ),
    );
  return (
    <Context.Provider
      value={{ records, saveRecord, updateRecord, notify: setToast }}
    >
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-4 right-4 z-[60] flex items-center gap-3 rounded-lg bg-slate-900 px-5 py-4 text-sm text-white shadow-xl sm:left-auto sm:max-w-lg"
        >
          <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
            className="ml-auto p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const store = useContext(Context);
  if (!store) throw new Error("AppProvider is required");
  return store;
}
