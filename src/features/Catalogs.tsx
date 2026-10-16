import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
} from "lucide-react";
import { DeleteConfirm } from "../components/data/DetailPrimitives";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Panel,
  Select,
  Textarea,
} from "../components/ui";
import { billBalance } from "../lib/payables";
import { belongsToVendor } from "../lib/vendor-links";
import {
  items as itemFixtures,
  money,
  today,
  useApp,
  vendors as vendorFixtures,
  type AppRecord,
} from "../lib/store";

type CatalogKind = "items" | "vendors";
function safeTransactionReturnTo(value: string | null): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\\\u0000-\u001f]/.test(value)
  )
    return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (
      !/^\/(?:purchase-orders|purchase-receives|bills|recurring-bills|payments|vendor-credits)\/(?:new|[^/?#]+\/edit)$/.test(
        url.pathname,
      )
    )
      return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
type Address = {
  id: string;
  attention: string;
  country: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string;
};
type Contact = {
  id: string;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  workPhone: string;
  mobile: string;
  skype: string;
  designation: string;
  department: string;
};
type MaskedBank = {
  id: string;
  holder: string;
  bank: string;
  masked: string;
  identifier: string;
};
type CustomField = { id: string; label: string; value: string };
type ItemForm = {
  name: string;
  sku: string;
  type: string;
  unit: string;
  rate: string;
  salesRate: string;
  account: string;
  description: string;
  preferredVendor: string;
  tags: string[];
};
type VendorForm = {
  displayName: string;
  company: string;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  language: string;
  companyId: string;
  currency: string;
  paymentTerms: string;
  taxRate: string;
  billing: Address | null;
  shipping: Address | null;
  contacts: Contact[];
  banks: MaskedBank[];
  customFields: CustomField[];
  tags: string[];
  remarks: string;
  documents: string[];
};

function parse<T>(value: string | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
const blankAddress = (): Address => ({
  id: crypto.randomUUID(),
  attention: "",
  country: "Zambia",
  street: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  fax: "",
});
const blankContact = (): Contact => ({
  id: crypto.randomUUID(),
  salutation: "",
  firstName: "",
  lastName: "",
  email: "",
  workPhone: "",
  mobile: "",
  skype: "",
  designation: "",
  department: "",
});
const itemSeeds: AppRecord[] = itemFixtures.map((item, index) => ({
  id: `ITEM-00${index + 1}`,
  kind: "items",
  title: item.name,
  party: "Catalog",
  date: today(),
  amount: item.rate,
  status: "Active",
  meta: {
    sku: `SKU-${String(index + 1).padStart(3, "0")}`,
    unit: item.unit,
    type: "Goods",
    account: "Cost of Goods Sold",
    description: `${item.name} for day-to-day operations`,
    preferredVendor: vendorFixtures[index % vendorFixtures.length],
  },
}));
const vendorSeeds: AppRecord[] = vendorFixtures.map((name, index) => ({
  id: `VEND-00${index + 1}`,
  kind: "vendors",
  title: name,
  party: name,
  date: today(),
  amount: 0,
  status: "Active",
  meta: {
    company: name,
    displayName: name,
    email: [
      "orders@northstar.example",
      "billing@copperline.example",
      "accounts@atlas.example",
    ][index],
    phone: ["+260 211 555 010", "+260 211 555 011", "+260 211 555 012"][index],
    language: "English",
    currency: "ZMW - Zambian Kwacha",
    paymentTerms: "Due on Receipt",
    portalStatus: "Not invited",
    taxRate: "",
    remarks: "",
    reportingTags: "[]",
    contactPersons: "[]",
    bankAccounts: "[]",
  },
}));
function readBanks(value: string | undefined): MaskedBank[] {
  return parse<unknown[]>(value, []).flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const bank = raw as Partial<MaskedBank>;
    return typeof bank.bank === "string" && typeof bank.masked === "string"
      ? [
          {
            id: bank.id || crypto.randomUUID(),
            holder: bank.holder || "Demo holder",
            bank: bank.bank,
            masked: bank.masked,
            identifier: bank.identifier || "",
          },
        ]
      : [];
  });
}
function csv(filename: string, rows: string[][]) {
  const content = rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CatalogList({ kind }: { kind: CatalogKind }) {
  const { records, updateRecord, deleteRecord, notify } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<AppRecord | null>(null);
  const seeds = kind === "items" ? itemSeeds : vendorSeeds;
  useEffect(() => {
    for (const seed of seeds) {
      const existing = records.find((record) => record.id === seed.id);
      if (!existing) continue;
      const merged = { ...seed.meta, ...existing.meta };
      if (kind === "vendors") {
        delete merged.accountNumber;
        delete merged.accountName;
        delete merged.bankName;
      }
      if (
        Object.keys(seed.meta ?? {}).some(
          (key) => existing.meta?.[key] === undefined,
        ) ||
        (kind === "vendors" && existing.meta?.accountNumber !== undefined)
      )
        updateRecord(existing.id, { meta: merged });
    }
  }, [kind, records, updateRecord]);
  const catalog = records.filter((record) => record.kind === kind);
  const filtered = useMemo(
    () =>
      catalog.filter((record) => {
        const text =
          `${record.title} ${record.party} ${Object.values(record.meta ?? {}).join(" ")}`.toLowerCase();
        return (
          text.includes(query.toLowerCase()) &&
          (status === "all" ||
            record.status.toLowerCase() === status.toLowerCase())
        );
      }),
    [catalog, query, status],
  );
  const label = kind === "items" ? "Items" : "Vendors";
  const Icon = kind === "items" ? Package : Store;
  const statuses = [...new Set(catalog.map((record) => record.status))];
  const payable = (vendor: AppRecord) =>
    records
      .filter((item) => item.kind === "bills" && belongsToVendor(item, vendor))
      .reduce((sum, bill) => sum + billBalance(records, bill), 0);
  const exportRows =
    kind === "items"
      ? [
          ["Name", "SKU", "Purchase rate", "Unit", "Status"],
          ...catalog.map((record) => [
            record.title,
            record.meta?.sku ?? "",
            String(record.amount),
            record.meta?.unit ?? "",
            record.status,
          ]),
        ]
      : [
          ["Display name", "Company", "Email", "Work phone", "Status"],
          ...catalog.map((record) => [
            record.title,
            record.meta?.company ?? record.party,
            record.meta?.email ?? "",
            record.meta?.phone ?? "",
            record.status,
          ]),
        ];
  const remove = () => {
    if (!deleteTarget) return;
    deleteRecord(deleteTarget.id);
    notify(
      `${deleteTarget.title} removed from the local catalog. Related demo records were left unchanged.`,
    );
    setDeleteTarget(null);
  };
  return (
    <div>
      <PageHeader
        title={label}
        subtitle={`${catalog.length} ${label.toLowerCase()} in your local catalog`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => csv(`${kind}.csv`, exportRows)}
            >
              <Download size={15} /> Export CSV
            </Button>
            <Link to={`/${kind}/new`}>
              <Button>
                <Plus size={16} /> New {kind === "items" ? "item" : "vendor"}
              </Button>
            </Link>
          </>
        }
      />
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder={`Search ${label.toLowerCase()}...`}
              aria-label={`Search ${label.toLowerCase()}`}
            />
          </div>
          <Select
            aria-label="Filter catalog by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full sm:w-44"
          >
            <option value="all">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value.toLowerCase()}>
                {value}
              </option>
            ))}
          </Select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title={`No ${label.toLowerCase()} found`}
            description="Try a different search or add a new catalog record."
            action={
              <Link to={`/${kind}/new`}>
                <Button>
                  <Plus size={15} /> Add {kind === "items" ? "item" : "vendor"}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="table-cell w-10 text-left"></th>
                  {kind === "items" ? (
                    <>
                      <th className="table-cell text-left">Name</th>
                      <th className="table-cell text-left">SKU</th>
                      <th className="table-cell text-left">
                        Purchase description
                      </th>
                      <th className="table-cell text-right">Purchase rate</th>
                      <th className="table-cell text-left">Usage unit</th>
                      <th className="table-cell text-left">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="table-cell text-left">Display name</th>
                      <th className="table-cell text-left">Company name</th>
                      <th className="table-cell text-left">Email</th>
                      <th className="table-cell text-left">Work phone</th>
                      <th className="table-cell text-right">Payables (ZMW)</th>
                      <th className="table-cell text-left">Status</th>
                    </>
                  )}
                  <th className="table-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id} className="group hover:bg-blue-50/30">
                    <td className="table-cell">
                      <Icon size={16} className="text-slate-400" />
                    </td>
                    <td className="table-cell">
                      <Link
                        className="font-medium text-blue-600 hover:text-blue-700"
                        to={`/${kind}/${record.id}`}
                      >
                        {record.title}
                      </Link>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {record.id}
                      </div>
                    </td>
                    {kind === "items" ? (
                      <>
                        <td className="table-cell text-slate-600">
                          {record.meta?.sku ?? "—"}
                        </td>
                        <td className="table-cell max-w-xs truncate text-slate-600">
                          {record.meta?.description ?? "—"}
                        </td>
                        <td className="table-cell text-right font-medium">
                          {money(record.amount)}
                        </td>
                        <td className="table-cell text-slate-600">
                          {record.meta?.unit ?? "—"}
                        </td>
                        <td className="table-cell">
                          <Badge>{record.status}</Badge>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-cell text-slate-600">
                          {record.meta?.company ?? record.party}
                        </td>
                        <td className="table-cell text-slate-600">
                          {record.meta?.email ?? "—"}
                        </td>
                        <td className="table-cell text-slate-600">
                          {record.meta?.phone ?? "—"}
                        </td>
                        <td className="table-cell text-right">
                          {money(payable(record))}
                        </td>
                        <td className="table-cell">
                          <Badge>{record.status}</Badge>
                        </td>
                      </>
                    )}
                    <td className="table-cell">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/${kind}/${record.id}`}
                          aria-label={`View ${record.title}`}
                          title="View"
                          className="rounded p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          to={`/${kind}/${record.id}/edit`}
                          aria-label={`Edit ${record.title}`}
                          title="Edit"
                          className="rounded p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(record)}
                          aria-label={`Delete ${record.title}`}
                          title="Delete"
                          className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          {filtered.length} records · Fictional data · View, Edit, Delete affect
          only this browser
        </div>
      </Panel>
      <DeleteConfirm
        open={Boolean(deleteTarget)}
        title={`Delete ${kind === "items" ? "item" : "vendor"}?`}
        description={`Delete ${deleteTarget?.title ?? "this record"} from the local catalog? Related demo records remain unchanged.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </div>
  );
}

function itemInitial(record?: AppRecord): ItemForm {
  return {
    name: record?.title ?? "",
    sku: record?.meta?.sku ?? "",
    type: record?.meta?.type ?? "Goods",
    unit: record?.meta?.unit ?? "pcs",
    rate: record ? String(record.amount) : "",
    salesRate: record?.meta?.salesRate ?? "",
    account: record?.meta?.account ?? "Cost of Goods Sold",
    description: record?.meta?.description ?? "",
    preferredVendor: record?.meta?.preferredVendor ?? "",
    tags: parse(record?.meta?.reportingTags, [] as string[]),
  };
}
function vendorInitial(record?: AppRecord): VendorForm {
  const rawBanks = readBanks(record?.meta?.bankAccounts);
  return {
    displayName: record?.meta?.displayName ?? record?.title ?? "",
    company: record?.meta?.company ?? record?.party ?? "",
    salutation: record?.meta?.salutation ?? "",
    firstName: record?.meta?.firstName ?? "",
    lastName: record?.meta?.lastName ?? "",
    email: record?.meta?.email ?? "",
    phone: record?.meta?.phone ?? "",
    mobile: record?.meta?.mobile ?? "",
    language: record?.meta?.language ?? "English",
    companyId: record?.meta?.companyId ?? "",
    currency: record?.meta?.currency ?? "ZMW - Zambian Kwacha",
    paymentTerms: record?.meta?.paymentTerms ?? "Due on Receipt",
    taxRate: record?.meta?.taxRate ?? "",
    billing: parse(record?.meta?.billingAddress, null as Address | null),
    shipping: parse(record?.meta?.shippingAddress, null as Address | null),
    contacts: parse(record?.meta?.contactPersons, [] as Contact[]),
    banks: rawBanks,
    customFields: parse(record?.meta?.customFields, [] as CustomField[]),
    tags: parse(record?.meta?.reportingTags, [] as string[]),
    remarks: record?.meta?.remarks ?? "",
    documents: parse(record?.meta?.documents, [] as string[]),
  };
}
function AddressFields({
  address,
  onChange,
}: {
  address: Address;
  onChange: (address: Address) => void;
}) {
  const field = (key: keyof Address, label: string, wide = false) => (
    <Field key={key} label={label} className={wide ? "sm:col-span-2" : ""}>
      <Input
        value={address[key]}
        onChange={(event) =>
          onChange({ ...address, [key]: event.target.value })
        }
      />
    </Field>
  );
  return (
    <div className="grid gap-4 p-5 sm:grid-cols-2">
      {field("attention", "Attention")}
      {field("country", "Country/Region")}
      {
        <Field label="Address" className="sm:col-span-2">
          <Textarea
            value={address.street}
            onChange={(event) =>
              onChange({ ...address, street: event.target.value })
            }
            placeholder="Street 1"
          />
        </Field>
      }
      {field("city", "City")}
      {field("state", "State")}
      {field("zip", "ZIP Code")}
      {field("phone", "Phone")}
      {field("fax", "Fax Number")}
    </div>
  );
}

export function CatalogEditor({ kind }: { kind: CatalogKind }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { records, saveRecord, deleteRecord, notify } = useApp();
  const returnTo =
    kind === "vendors"
      ? safeTransactionReturnTo(searchParams.get("returnTo"))
      : null;
  const record = records.find((item) => item.id === id && item.kind === kind);
  const editing = Boolean(record);
  const [item, setItem] = useState(() => itemInitial(record));
  const [vendor, setVendor] = useState(() => vendorInitial(record));
  const [tab, setTab] = useState("Other Details");
  const [error, setError] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  useEffect(() => {
    if (record) {
      setItem(itemInitial(record));
      setVendor(vendorInitial(record));
    }
  }, [record]);
  const itemField = (key: keyof ItemForm, value: string) => {
    const next =
      key === "tags"
        ? value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : value;
    setItem((current) => ({ ...current, [key]: next }) as ItemForm);
  };
  const vendorField = (key: keyof VendorForm, value: string) => {
    const structured = [
      "billing",
      "shipping",
      "contacts",
      "banks",
      "customFields",
      "tags",
      "documents",
    ].includes(key);
    const next = structured ? parse(value, value) : value;
    setVendor((current) => ({ ...current, [key]: next }) as VendorForm);
  };
  if (id && !record)
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold">
          {kind === "items" ? "Item" : "Vendor"} not found
        </h1>
        <Link
          to={`/${kind}`}
          className="mt-4 inline-flex text-sm text-blue-600"
        >
          Return to {kind} →
        </Link>
      </div>
    );
  const remove = () => {
    if (record) deleteRecord(record.id);
    notify(`${record?.title ?? "Record"} removed from the local demo catalog.`);
    navigate(`/${kind}`);
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const title =
      kind === "items" ? item.name.trim() : vendor.displayName.trim();
    if (!title) {
      setError(
        `${kind === "items" ? "Item name" : "Display name"} is required.`,
      );
      return;
    }
    if (
      kind === "items" &&
      (!item.rate.trim() ||
        !Number.isFinite(Number(item.rate)) ||
        Number(item.rate) < 0)
    ) {
      setError("Enter a valid purchase rate.");
      return;
    }
    if (
      kind === "vendors" &&
      vendor.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.email)
    ) {
      setError("Enter a valid email address.");
      return;
    }
    const idValue =
      record?.id ??
      `${kind === "items" ? "ITEM" : "VEND"}-${String(Date.now()).slice(-6)}`;
    let meta: Record<string, string>;
    if (kind === "items")
      meta = {
        ...record?.meta,
        sku: item.sku,
        type: item.type,
        unit: item.unit,
        account: item.account,
        salesRate: item.salesRate,
        description: item.description,
        preferredVendor: item.preferredVendor,
        reportingTags: JSON.stringify(item.tags),
      };
    else {
      const safe = { ...record?.meta };
      delete safe.accountNumber;
      delete safe.accountName;
      delete safe.bankName;
      meta = {
        ...safe,
        company: vendor.company,
        displayName: vendor.displayName,
        salutation: vendor.salutation,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email,
        phone: vendor.phone,
        mobile: vendor.mobile,
        language: vendor.language,
        companyId: vendor.companyId,
        currency: vendor.currency,
        paymentTerms: vendor.paymentTerms,
        taxRate: vendor.taxRate,
        billingAddress: JSON.stringify(vendor.billing),
        shippingAddress: JSON.stringify(vendor.shipping),
        contactPersons: JSON.stringify(vendor.contacts),
        bankAccounts: JSON.stringify(vendor.banks),
        customFields: JSON.stringify(vendor.customFields),
        reportingTags: JSON.stringify(vendor.tags),
        remarks: vendor.remarks,
        documents: JSON.stringify(vendor.documents),
      };
    }
    saveRecord({
      id: idValue,
      kind,
      title,
      party:
        kind === "items"
          ? item.preferredVendor || "Catalog"
          : vendor.company || title,
      date: record?.date ?? today(),
      amount: kind === "items" ? Number(item.rate) : 0,
      status: record?.status ?? "Active",
      meta,
    });
    notify(
      `${kind === "items" ? "Item" : "Vendor"} ${editing ? "updated" : "created"} in the local demo.`,
    );
    navigate(returnTo ?? `/${kind}/${idValue}`);
  };
  const title = `${editing ? "Edit" : "New"} ${kind === "items" ? "Item" : "Vendor"}`;
  const addTag = () => {
    const value = tagDraft.trim();
    if (value && !vendor.tags.includes(value))
      vendorField("tags", JSON.stringify([...vendor.tags, value]));
    setTagDraft("");
  };
  const addCustomField = () =>
    vendorField(
      "customFields",
      JSON.stringify([
        ...vendor.customFields,
        { id: crypto.randomUUID(), label: "", value: "" },
      ]),
    );
  const updateCustom = (id: string, key: "label" | "value", value: string) =>
    vendorField(
      "customFields",
      JSON.stringify(
        vendor.customFields.map((field) =>
          field.id === id ? { ...field, [key]: value } : field,
        ),
      ),
    );
  const removeCustom = (id: string) =>
    vendorField(
      "customFields",
      JSON.stringify(vendor.customFields.filter((field) => field.id !== id)),
    );
  const addDocument = (file?: File) => {
    if (file)
      vendorField(
        "documents",
        JSON.stringify([...vendor.documents, file.name]),
      );
  };
  return (
    <div>
      <div className="mb-5 flex items-center gap-3 text-sm text-slate-500">
        <Link
          to={`/${kind}`}
          className="inline-flex items-center gap-1.5 hover:text-blue-600"
        >
          <ArrowLeft size={15} />
          {kind === "items" ? "Items" : "Vendors"}
        </Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      <PageHeader
        title={title}
        subtitle="All changes are saved to this browser's fictional demo data only."
      />
      <form onSubmit={save} className="space-y-5">
        {kind === "items" ? (
          <>
            <Panel title="Item details">
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Name *"
                  error={error && !item.name.trim() ? error : undefined}
                  className="sm:col-span-2"
                >
                  <Input
                    autoFocus
                    value={item.name}
                    onChange={(event) => itemField("name", event.target.value)}
                    placeholder="e.g. Office chair"
                  />
                </Field>
                <Field label="Item type">
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={item.type === "Goods"}
                        onChange={() => itemField("type", "Goods")}
                      />{" "}
                      Goods
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={item.type === "Service"}
                        onChange={() => itemField("type", "Service")}
                      />{" "}
                      Service
                    </label>
                  </div>
                </Field>
                <Field label="SKU">
                  <Input
                    value={item.sku}
                    onChange={(event) => itemField("sku", event.target.value)}
                  />
                </Field>
                <Field label="Usage unit">
                  <Select
                    value={item.unit}
                    onChange={(event) => itemField("unit", event.target.value)}
                  >
                    <option>pcs</option>
                    <option>box</option>
                    <option>cm</option>
                    <option>hour</option>
                    <option>service</option>
                  </Select>
                </Field>
                <Field
                  label="Purchase rate *"
                  error={error && !item.rate.trim() ? error : undefined}
                >
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(event) => itemField("rate", event.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Sales rate">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.salesRate}
                    onChange={(event) =>
                      itemField("salesRate", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Preferred vendor">
                  <Select
                    value={item.preferredVendor}
                    onChange={(event) =>
                      itemField("preferredVendor", event.target.value)
                    }
                  >
                    <option value="">Select a vendor</option>
                    {records
                      .filter((existing) => existing.kind === "vendors")
                      .map((existing) => (
                        <option key={existing.id} value={existing.title}>
                          {existing.title}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Purchase account">
                  <Select
                    value={item.account}
                    onChange={(event) =>
                      itemField("account", event.target.value)
                    }
                  >
                    <option>Cost of Goods Sold</option>
                    <option>Office Supplies</option>
                    <option>Office expense</option>
                    <option>Inventory asset</option>
                    <option>Professional services</option>
                  </Select>
                </Field>
                <Field
                  label="Purchase description"
                  className="sm:col-span-2 lg:col-span-3"
                >
                  <Textarea
                    value={item.description}
                    onChange={(event) =>
                      itemField("description", event.target.value)
                    }
                    placeholder="Add a purchase description for buyers"
                  />
                </Field>
                <Field
                  label="Reporting tags"
                  className="sm:col-span-2 lg:col-span-3"
                >
                  <Input
                    value={item.tags.join(", ")}
                    onChange={(event) =>
                      itemField(
                        "tags",
                        event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean)
                          .join(","),
                      )
                    }
                    placeholder="Optional · comma-separated"
                  />
                </Field>
              </div>
            </Panel>
          </>
        ) : (
          <>
            <Panel title="Primary contact">
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Company Name">
                  <Input
                    value={vendor.company}
                    onChange={(event) =>
                      vendorField("company", event.target.value)
                    }
                  />
                </Field>
                <Field
                  label="Display Name *"
                  error={
                    error && !vendor.displayName.trim() ? error : undefined
                  }
                >
                  <Input
                    autoFocus
                    value={vendor.displayName}
                    onChange={(event) =>
                      vendorField("displayName", event.target.value)
                    }
                  />
                </Field>
                <Field label="Salutation">
                  <Select
                    value={vendor.salutation}
                    onChange={(event) =>
                      vendorField("salutation", event.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option>Mr.</option>
                    <option>Ms.</option>
                    <option>Mrs.</option>
                    <option>Dr.</option>
                  </Select>
                </Field>
                <Field label="First Name">
                  <Input
                    value={vendor.firstName}
                    onChange={(event) =>
                      vendorField("firstName", event.target.value)
                    }
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={vendor.lastName}
                    onChange={(event) =>
                      vendorField("lastName", event.target.value)
                    }
                  />
                </Field>
                <Field label="Email Address">
                  <Input
                    type="email"
                    value={vendor.email}
                    onChange={(event) =>
                      vendorField("email", event.target.value)
                    }
                    placeholder="accounts@vendor.example"
                  />
                </Field>
                <Field label="Phone · work">
                  <Input
                    value={vendor.phone}
                    onChange={(event) =>
                      vendorField("phone", event.target.value)
                    }
                    placeholder="+260 211 555 010"
                  />
                </Field>
                <Field label="Mobile">
                  <Input
                    value={vendor.mobile}
                    onChange={(event) =>
                      vendorField("mobile", event.target.value)
                    }
                  />
                </Field>
                <Field label="Vendor Language">
                  <Select
                    value={vendor.language}
                    onChange={(event) =>
                      vendorField("language", event.target.value)
                    }
                  >
                    <option>English</option>
                    <option>Bemba</option>
                    <option>Nyanja</option>
                  </Select>
                </Field>
              </div>
            </Panel>
            <Panel>
              <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-2">
                {[
                  "Other Details",
                  "Address",
                  "Contact Persons",
                  "Bank Details",
                  "Custom Fields",
                  "Reporting Tags",
                  "Remarks",
                ].map((value) => (
                  <button
                    type="button"
                    key={value}
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${tab === value ? "border-blue-500 font-semibold text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {tab === "Other Details" && (
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field label="Company ID">
                    <Input
                      value={vendor.companyId}
                      onChange={(event) =>
                        vendorField("companyId", event.target.value)
                      }
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Currency">
                    <Select
                      value={vendor.currency}
                      onChange={(event) =>
                        vendorField("currency", event.target.value)
                      }
                    >
                      <option>ZMW - Zambian Kwacha</option>
                      <option>USD - US Dollar</option>
                      <option>EUR - Euro</option>
                    </Select>
                  </Field>
                  <Field label="Tax Rate">
                    <Input
                      value={vendor.taxRate}
                      onChange={(event) =>
                        vendorField("taxRate", event.target.value)
                      }
                      placeholder="Select a tax rate"
                    />
                  </Field>
                  <Field label="Payment Terms">
                    <Select
                      value={vendor.paymentTerms}
                      onChange={(event) =>
                        vendorField("paymentTerms", event.target.value)
                      }
                    >
                      <option>Due on Receipt</option>
                      <option>Net 15</option>
                      <option>Net 30</option>
                      <option>Net 60</option>
                    </Select>
                  </Field>
                  <Field
                    label="Documents · names only"
                    className="sm:col-span-2"
                  >
                    <Input
                      type="file"
                      onChange={(event) => addDocument(event.target.files?.[0])}
                      aria-label="Choose a file name for the local demo"
                    />
                    <span className="mt-1 block text-xs text-slate-400">
                      This frontend keeps names only; it does not upload or
                      retain files.
                    </span>
                    {vendor.documents.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {vendor.documents.map((file, index) => (
                          <li
                            key={`${file}-${index}`}
                            className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-xs"
                          >
                            <span>{file}</span>
                            <button
                              type="button"
                              onClick={() =>
                                vendorField(
                                  "documents",
                                  JSON.stringify(
                                    vendor.documents.filter(
                                      (_, i) => i !== index,
                                    ),
                                  ),
                                )
                              }
                              className="text-red-600"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Field>
                  <p className="text-xs text-slate-400 sm:col-span-2">
                    Optional purchase terms and organization-specific values; no
                    settings or tax services are connected.
                  </p>
                </div>
              )}
              {tab === "Address" && (
                <div className="grid gap-4 p-5 xl:grid-cols-2">
                  <Panel
                    title="Billing Address"
                    action={
                      <button
                        type="button"
                        className="text-xs text-blue-600"
                        onClick={() =>
                          vendorField("billing", JSON.stringify(blankAddress()))
                        }
                      >
                        {vendor.billing ? "Clear fields" : "Add address"}
                      </button>
                    }
                  >
                    {vendor.billing ? (
                      <AddressFields
                        address={vendor.billing}
                        onChange={(value) =>
                          vendorField("billing", JSON.stringify(value))
                        }
                      />
                    ) : (
                      <div className="p-5 text-sm text-slate-400">
                        No billing address. Add a local demo address to view its
                        fields.
                      </div>
                    )}
                  </Panel>
                  <Panel
                    title="Shipping Address"
                    action={
                      <button
                        type="button"
                        className="text-xs text-blue-600"
                        onClick={() =>
                          vendorField(
                            "shipping",
                            JSON.stringify(blankAddress()),
                          )
                        }
                      >
                        {vendor.shipping ? "Clear fields" : "Add address"}
                      </button>
                    }
                  >
                    {vendor.shipping ? (
                      <>
                        <AddressFields
                          address={vendor.shipping}
                          onChange={(value) =>
                            vendorField("shipping", JSON.stringify(value))
                          }
                        />
                        <label className="flex items-center gap-2 px-5 pb-4 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            onChange={(event) =>
                              event.target.checked &&
                              vendor.billing &&
                              vendorField(
                                "shipping",
                                JSON.stringify({
                                  ...vendor.billing,
                                  id:
                                    vendor.shipping?.id ?? crypto.randomUUID(),
                                }),
                              )
                            }
                          />{" "}
                          Copy billing address
                        </label>
                      </>
                    ) : (
                      <div className="p-5 text-sm text-slate-400">
                        No shipping address. Add a local demo address to view
                        its fields.
                      </div>
                    )}
                  </Panel>
                </div>
              )}
              {tab === "Contact Persons" && (
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-700">
                        Contact Persons
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Contacts are fictional and stored only when the vendor
                        form is saved.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        vendorField(
                          "contacts",
                          JSON.stringify([...vendor.contacts, blankContact()]),
                        )
                      }
                    >
                      <Plus size={14} /> Add Contact Person
                    </Button>
                  </div>
                  {vendor.contacts.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1120px] text-left text-xs">
                        <thead className="table-head">
                          <tr>
                            {[
                              "Salutation",
                              "First Name",
                              "Last Name",
                              "Email Address",
                              "Work Phone",
                              "Mobile",
                              "Skype Name/Number",
                              "Designation",
                              "Department",
                              "",
                            ].map((label) => (
                              <th key={label} className="table-cell">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {vendor.contacts.map((person) => (
                            <tr
                              key={person.id}
                              className="border-b border-slate-100"
                            >
                              {(
                                [
                                  "salutation",
                                  "firstName",
                                  "lastName",
                                  "email",
                                  "workPhone",
                                  "mobile",
                                  "skype",
                                  "designation",
                                  "department",
                                ] as const
                              ).map((key) => (
                                <td key={key} className="table-cell">
                                  <Input
                                    aria-label={`${key} for contact person`}
                                    className="min-w-24 !px-2 !py-1.5 text-xs"
                                    value={person[key]}
                                    onChange={(event) =>
                                      vendorField(
                                        "contacts",
                                        JSON.stringify(
                                          vendor.contacts.map((row) =>
                                            row.id === person.id
                                              ? {
                                                  ...row,
                                                  [key]: event.target.value,
                                                }
                                              : row,
                                          ),
                                        ),
                                      )
                                    }
                                  />
                                </td>
                              ))}
                              <td className="table-cell">
                                <button
                                  type="button"
                                  aria-label="Remove contact person"
                                  onClick={() =>
                                    vendorField(
                                      "contacts",
                                      JSON.stringify(
                                        vendor.contacts.filter(
                                          (row) => row.id !== person.id,
                                        ),
                                      ),
                                    )
                                  }
                                  className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-400">
                      No contact persons. Use Add Contact Person to create a
                      local row.
                    </p>
                  )}
                </div>
              )}
              {tab === "Bank Details" && (
                <div className="space-y-3 p-5">
                  <p className="text-sm text-slate-600">
                    Bank account details are added from the Vendor Overview
                    page, not from this edit tab.
                  </p>
                  <p className="rounded bg-amber-50 p-3 text-xs text-amber-800">
                    The local demo never stores raw account numbers or sends
                    payment instructions.
                  </p>
                  {vendor.banks.length ? (
                    vendor.banks.map((bank) => (
                      <div
                        key={bank.id}
                        className="rounded border border-slate-100 p-3 text-sm"
                      >
                        <strong>{bank.bank}</strong>
                        <span className="ml-2 text-slate-500">
                          {bank.holder} · {bank.masked}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">
                      No masked bank-account labels are associated with this
                      vendor.
                    </p>
                  )}
                  <Link
                    to={editing ? `/vendors/${record?.id}` : "/vendors"}
                    className="inline-flex text-sm text-blue-600"
                  >
                    Open vendor overview →
                  </Link>
                </div>
              )}
              {tab === "Custom Fields" && (
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Custom Fields</h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Configure vendor custom fields in Settings → Preferences
                        → Vendors; these are local preview values.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addCustomField}
                    >
                      <Plus size={14} /> Add Field
                    </Button>
                  </div>
                  {vendor.customFields.length ? (
                    <div className="space-y-3">
                      {vendor.customFields.map((field) => (
                        <div
                          key={field.id}
                          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                        >
                          <Field label="Field Name">
                            <Input
                              value={field.label}
                              onChange={(event) =>
                                updateCustom(
                                  field.id,
                                  "label",
                                  event.target.value,
                                )
                              }
                            />
                          </Field>
                          <Field label="Value">
                            <Input
                              value={field.value}
                              onChange={(event) =>
                                updateCustom(
                                  field.id,
                                  "value",
                                  event.target.value,
                                )
                              }
                            />
                          </Field>
                          <button
                            type="button"
                            aria-label="Remove custom field"
                            onClick={() => removeCustom(field.id)}
                            className="self-end rounded p-2 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-400">
                      You've not created any custom fields. Add one for this
                      local demo vendor.
                    </p>
                  )}
                </div>
              )}
              {tab === "Reporting Tags" && (
                <div className="p-5">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Field label="Add Reporting Tag">
                      <Input
                        value={tagDraft}
                        onChange={(event) => setTagDraft(event.target.value)}
                        placeholder="e.g. Region · North"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            if (
                              tagDraft.trim() &&
                              !vendor.tags.includes(tagDraft.trim())
                            )
                              vendorField(
                                "tags",
                                JSON.stringify([
                                  ...vendor.tags,
                                  tagDraft.trim(),
                                ]),
                              );
                            setTagDraft("");
                          }
                        }}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      className="self-end"
                      onClick={() => {
                        if (
                          tagDraft.trim() &&
                          !vendor.tags.includes(tagDraft.trim())
                        )
                          vendorField(
                            "tags",
                            JSON.stringify([...vendor.tags, tagDraft.trim()]),
                          );
                        setTagDraft("");
                      }}
                    >
                      <Plus size={14} /> Add tag
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {vendor.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                      >
                        {tag}
                        <button
                          type="button"
                          aria-label={`Remove tag ${tag}`}
                          onClick={() =>
                            vendorField(
                              "tags",
                              JSON.stringify(
                                vendor.tags.filter((value) => value !== tag),
                              ),
                            )
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {!vendor.tags.length && (
                    <p className="mt-4 text-sm text-slate-400">
                      No reporting tags have been associated with this vendor.
                    </p>
                  )}
                </div>
              )}
              {tab === "Remarks" && (
                <div className="p-5">
                  <Field label="Remarks (For Internal Use)">
                    <Textarea
                      value={vendor.remarks}
                      onChange={(event) =>
                        vendorField("remarks", event.target.value)
                      }
                    />
                  </Field>
                </div>
              )}
            </Panel>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
          <Button type="submit">
            {editing
              ? "Save changes"
              : `Save ${kind === "items" ? "item" : "vendor"}`}
          </Button>
          <Link to={returnTo ?? `/${kind}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          {editing && (
            <Button
              type="button"
              variant="danger"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} /> Delete
            </Button>
          )}
        </div>
      </form>
      <DeleteConfirm
        open={deleteOpen}
        title={`Delete ${kind === "items" ? "item" : "vendor"}?`}
        description={`Delete ${record?.title ?? "this record"} from the local catalog? Related demo records will remain unchanged.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={remove}
      />
    </div>
  );
}
