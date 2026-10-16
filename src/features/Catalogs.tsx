import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  Package,
} from "lucide-react";
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
import {
  items as itemFixtures,
  money,
  today,
  useApp,
  vendors as vendorFixtures,
  type AppRecord,
} from "../lib/store";

type CatalogKind = "items" | "vendors";

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
  tab: string;
  street: string;
  city: string;
  country: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  remarks: string;
};

const seedItems: AppRecord[] = itemFixtures.map((item, index) => ({
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
  },
}));
const seedVendors: AppRecord[] = vendorFixtures.map((name, index) => ({
  id: `VEND-00${index + 1}`,
  kind: "vendors",
  title: name,
  party: name,
  date: today(),
  amount: 0,
  status: "Active",
  meta: {
    company: name,
    email: [
      "orders@northstar.example",
      "billing@copperline.example",
      "accounts@atlas.example",
    ][index],
    phone: ["+260 211 555 010", "+260 211 555 011", "+260 211 555 012"][index],
    language: "English",
    currency: "ZMW - Zambian Kwacha",
  },
}));

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ensureCatalogSeeds(
  kind: CatalogKind,
  records: AppRecord[],
  saveRecord: (record: AppRecord) => void,
) {
  const seeds = kind === "items" ? seedItems : seedVendors;
  if (seeds.some((seed) => !records.some((record) => record.id === seed.id)))
    seeds
      .filter((seed) => !records.some((record) => record.id === seed.id))
      .forEach(saveRecord);
}

export function CatalogList({ kind }: { kind: CatalogKind }) {
  const { records, saveRecord } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  useEffect(
    () => ensureCatalogSeeds(kind, records, saveRecord),
    [kind, records, saveRecord],
  );
  const source = kind === "items" ? seedItems : seedVendors;
  const catalog = useMemo(() => {
    const fallback = source.filter(
      (seed) => !records.some((record) => record.id === seed.id),
    );
    return [...records.filter((record) => record.kind === kind), ...fallback];
  }, [kind, records, source]);
  const filtered = catalog.filter((record) => {
    const text =
      `${record.title} ${record.party} ${Object.values(record.meta ?? {}).join(" ")}`.toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (status === "all" || record.status === status)
    );
  });
  const statuses = [...new Set(catalog.map((record) => record.status))];
  const label = kind === "items" ? "Items" : "Vendors";
  const Icon = kind === "items" ? Package : Store;
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

  return (
    <div>
      <PageHeader
        title={label}
        subtitle={`${catalog.length} ${label.toLowerCase()} in your local catalog`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => downloadCsv(`${kind}.csv`, exportRows)}
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
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full sm:w-40"
          >
            <option value="all">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
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
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="table-cell w-10 text-left"> </th>
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
                        to={`/${kind}/${record.id}/edit`}
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
                          {money(record.amount)}
                        </td>
                        <td className="table-cell">
                          <Badge>{record.status}</Badge>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
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
  };
}
function vendorInitial(record?: AppRecord): VendorForm {
  return {
    displayName: record?.title ?? "",
    company: record?.meta?.company ?? record?.party ?? "",
    salutation: record?.meta?.salutation ?? "",
    firstName: record?.meta?.firstName ?? "",
    lastName: record?.meta?.lastName ?? "",
    email: record?.meta?.email ?? "",
    phone: record?.meta?.phone ?? "",
    mobile: record?.meta?.mobile ?? "",
    language: record?.meta?.language ?? "English",
    tab: "Other Details",
    street: record?.meta?.street ?? "",
    city: record?.meta?.city ?? "",
    country: record?.meta?.country ?? "Zambia",
    bankName: record?.meta?.bankName ?? "",
    accountName: record?.meta?.accountName ?? "",
    accountNumber: record?.meta?.accountNumber ?? "",
    remarks: record?.meta?.remarks ?? "",
  };
}

export function CatalogEditor({ kind }: { kind: CatalogKind }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { records, saveRecord, notify } = useApp();
  const record =
    records.find((existing) => existing.id === id && existing.kind === kind) ??
    (kind === "items" ? seedItems : seedVendors).find(
      (existing) => existing.id === id,
    );
  const [item, setItem] = useState(() => itemInitial(record));
  const [vendor, setVendor] = useState(() => vendorInitial(record));
  const [error, setError] = useState("");
  const editing = Boolean(record);
  useEffect(() => {
    if (record) {
      setItem(itemInitial(record));
      setVendor(vendorInitial(record));
    }
  }, [record]);
  const setItemField = (key: keyof ItemForm, value: string) =>
    setItem((current) => ({ ...current, [key]: value }));
  const setVendorField = (key: keyof VendorForm, value: string) =>
    setVendor((current) => ({ ...current, [key]: value }));
  const save = (event: FormEvent) => {
    event.preventDefault();
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
        Number.isNaN(Number(item.rate)) ||
        Number(item.rate) < 0)
    ) {
      setError("Enter a valid purchase rate.");
      return;
    }
    const idValue =
      record?.id ??
      `${kind === "items" ? "ITEM" : "VEND"}-${String(Date.now()).slice(-6)}`;
    const meta: Record<string, string> =
      kind === "items"
        ? {
            sku: item.sku,
            type: item.type,
            unit: item.unit,
            account: item.account,
            salesRate: item.salesRate,
            description: item.description,
            preferredVendor: item.preferredVendor,
          }
        : {
            company: vendor.company,
            salutation: vendor.salutation,
            firstName: vendor.firstName,
            lastName: vendor.lastName,
            email: vendor.email,
            phone: vendor.phone,
            mobile: vendor.mobile,
            language: vendor.language,
            street: vendor.street,
            city: vendor.city,
            country: vendor.country,
            bankName: vendor.bankName,
            accountName: vendor.accountName,
            accountNumber: vendor.accountNumber,
            remarks: vendor.remarks,
            currency: "ZMW - Zambian Kwacha",
          };
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
      `${kind === "items" ? "Item" : "Vendor"} ${editing ? "updated" : "created"} locally.`,
    );
    navigate(`/${kind}`);
  };
  const title = editing
    ? `Edit ${kind === "items" ? "Item" : "Vendor"}`
    : `New ${kind === "items" ? "Item" : "Vendor"}`;
  if (id && !record)
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold">
          {kind === "items" ? "Item" : "Vendor"} not found
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          That ID does not exist in this local catalog.
        </p>
        <Link
          to={`/${kind}`}
          className="mt-5 inline-flex text-sm text-blue-600"
        >
          Return to {kind} →
        </Link>
      </div>
    );
  return (
    <div>
      <div className="mb-5 flex items-center gap-3 text-sm text-slate-500">
        <Link
          to={`/${kind}`}
          className="inline-flex items-center gap-1.5 hover:text-blue-600"
        >
          <ArrowLeft size={15} /> {kind === "items" ? "Items" : "Vendors"}
        </Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      <PageHeader
        title={title}
        subtitle="Changes are stored in this browser only."
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
                    onChange={(event) =>
                      setItemField("name", event.target.value)
                    }
                    placeholder="e.g. Office chair"
                  />
                </Field>
                <Field label="Item type">
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={item.type === "Goods"}
                        onChange={() => setItemField("type", "Goods")}
                      />{" "}
                      Goods
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={item.type === "Service"}
                        onChange={() => setItemField("type", "Service")}
                      />{" "}
                      Service
                    </label>
                  </div>
                </Field>
                <Field label="SKU">
                  <Input
                    value={item.sku}
                    onChange={(event) =>
                      setItemField("sku", event.target.value)
                    }
                    placeholder="SKU-004"
                  />
                </Field>
                <Field label="Usage unit">
                  <Select
                    value={item.unit}
                    onChange={(event) =>
                      setItemField("unit", event.target.value)
                    }
                  >
                    <option>pcs</option>
                    <option>box</option>
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
                    onChange={(event) =>
                      setItemField("rate", event.target.value)
                    }
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
                      setItemField("salesRate", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </Field>
                <Field label="Preferred vendor">
                  <Select
                    value={item.preferredVendor}
                    onChange={(event) =>
                      setItemField("preferredVendor", event.target.value)
                    }
                  >
                    <option value="">Select a vendor</option>
                    {records
                      .filter((record) => record.kind === "vendors")
                      .map((record) => (
                        <option key={record.id}>{record.title}</option>
                      ))}
                  </Select>
                </Field>
                <Field label="Account">
                  <Select
                    value={item.account}
                    onChange={(event) =>
                      setItemField("account", event.target.value)
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
                  label="Description"
                  className="sm:col-span-2 lg:col-span-3"
                >
                  <Textarea
                    value={item.description}
                    onChange={(event) =>
                      setItemField("description", event.target.value)
                    }
                    placeholder="Add a purchase description for buyers"
                  />
                </Field>
              </div>
            </Panel>
            {error && item.name.trim() && item.rate.trim() && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <Panel title="Primary contact">
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Salutation">
                  <Select
                    value={vendor.salutation}
                    onChange={(event) =>
                      setVendorField("salutation", event.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option>Mr.</option>
                    <option>Ms.</option>
                    <option>Dr.</option>
                  </Select>
                </Field>
                <Field label="First name">
                  <Input
                    value={vendor.firstName}
                    onChange={(event) =>
                      setVendorField("firstName", event.target.value)
                    }
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={vendor.lastName}
                    onChange={(event) =>
                      setVendorField("lastName", event.target.value)
                    }
                  />
                </Field>
                <Field label="Company name">
                  <Input
                    value={vendor.company}
                    onChange={(event) =>
                      setVendorField("company", event.target.value)
                    }
                    placeholder="Northstar Office Supply"
                  />
                </Field>
                <Field label="Display name *" error={error}>
                  <Input
                    autoFocus
                    value={vendor.displayName}
                    onChange={(event) =>
                      setVendorField("displayName", event.target.value)
                    }
                    placeholder="Name shown on bills and orders"
                  />
                </Field>
                <Field label="Email address">
                  <Input
                    type="email"
                    value={vendor.email}
                    onChange={(event) =>
                      setVendorField("email", event.target.value)
                    }
                    placeholder="accounts@vendor.example"
                  />
                </Field>
                <Field label="Work phone">
                  <Input
                    value={vendor.phone}
                    onChange={(event) =>
                      setVendorField("phone", event.target.value)
                    }
                    placeholder="+260 211 555 010"
                  />
                </Field>
                <Field label="Mobile">
                  <Input
                    value={vendor.mobile}
                    onChange={(event) =>
                      setVendorField("mobile", event.target.value)
                    }
                  />
                </Field>
                <Field label="Vendor language">
                  <Select
                    value={vendor.language}
                    onChange={(event) =>
                      setVendorField("language", event.target.value)
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
              <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-2">
                {[
                  "Other Details",
                  "Address",
                  "Contact Persons",
                  "Bank Details",
                  "Remarks",
                ].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setVendorField("tab", tab)}
                    className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${vendor.tab === tab ? "border-blue-500 font-semibold text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                {vendor.tab === "Other Details" && (
                  <>
                    <Field label="Company ID">
                      <Input
                        value={record?.meta?.companyId ?? ""}
                        readOnly
                        placeholder="Optional"
                      />
                    </Field>
                    <Field label="Currency">
                      <Select defaultValue="ZMW - Zambian Kwacha">
                        <option>ZMW - Zambian Kwacha</option>
                        <option disabled>
                          USD - currency conversion not connected
                        </option>
                      </Select>
                    </Field>
                    <p className="text-xs text-slate-400 sm:col-span-2">
                      Tax and reporting details can be captured here for this
                      local prototype.
                    </p>
                  </>
                )}
                {vendor.tab === "Address" && (
                  <>
                    <Field label="Street">
                      <Input
                        value={vendor.street}
                        onChange={(event) =>
                          setVendorField("street", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="City">
                      <Input
                        value={vendor.city}
                        onChange={(event) =>
                          setVendorField("city", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Country">
                      <Input
                        value={vendor.country}
                        onChange={(event) =>
                          setVendorField("country", event.target.value)
                        }
                      />
                    </Field>
                  </>
                )}
                {vendor.tab === "Contact Persons" && (
                  <p className="text-sm text-slate-500 sm:col-span-2">
                    The primary contact above is used for this prototype. Add a
                    contact person by entering their details in the main
                    section.
                  </p>
                )}
                {vendor.tab === "Bank Details" && (
                  <>
                    <Field label="Bank name">
                      <Input
                        value={vendor.bankName}
                        onChange={(event) =>
                          setVendorField("bankName", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Account name">
                      <Input
                        value={vendor.accountName}
                        onChange={(event) =>
                          setVendorField("accountName", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Account number">
                      <Input
                        value={vendor.accountNumber}
                        onChange={(event) =>
                          setVendorField("accountNumber", event.target.value)
                        }
                      />
                    </Field>
                  </>
                )}
                {vendor.tab === "Remarks" && (
                  <Field label="Remarks" className="sm:col-span-2">
                    <Textarea
                      value={vendor.remarks}
                      onChange={(event) =>
                        setVendorField("remarks", event.target.value)
                      }
                    />
                  </Field>
                )}
              </div>
            </Panel>
          </>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
          <Button type="submit">
            <Pencil size={15} />{" "}
            {editing
              ? "Save changes"
              : "Save vendor".replace(
                  "vendor",
                  kind === "items" ? "item" : "vendor",
                )}
          </Button>
          <Link to={`/${kind}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          {editing && (
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                notify(
                  "Delete is disabled in the local prototype. Edit or archive this record instead.",
                )
              }
            >
              <Trash2 size={15} /> Delete
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
