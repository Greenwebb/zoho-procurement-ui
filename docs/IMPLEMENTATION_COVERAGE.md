# Zoho Procurement frontend — implementation coverage

## Scope and status

The React + TypeScript + Tailwind application is a **frontend-only prototype** running in Preview. It uses fictional fixture data and browser-local state. It has no Zoho API connection, backend/server, managed database, authentication, live email, payment execution, or production accounting/inventory engine.

The private reference set contains **118 screenshots** in `docs/` and `capture_manifest.csv`. They are reference states, not 118 separate application pages. The app declares **104 canonical routes**, including dynamic record detail/edit paths and settings screens. Sanitized live-record structure notes for Vendors and Items are in [REFERENCE_VENDOR_DETAIL.md](REFERENCE_VENDOR_DETAIL.md); the example tenant's names, contact details, account numbers, and financial values are not used as demo data.

## Canonical implementation and workflow reuse

| Area                          | Implementation                                                      | Main screenshot references                                       | Canonical reuse                                                                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App shell and dashboard       | `AppShell`, `Dashboard`                                             | 00                                                               | Shared shell and navigation; global search opens record detail first, with a separate Edit action.                                                                                                                       |
| Requests and approvals        | `RecordList`, `RecordDetail`, `TransactionEditor`                   | 01–03, 08                                                        | One request record model; employee, Procurement, and approvals views retain distinct actions and queue context while sharing full detail and edit routes.                                                                |
| Catalog lists and editors     | `CatalogList`, `CatalogEditor`                                      | 04–07                                                            | Item/Vendor table rows expose View, Edit, and Delete; editors save only to browser-local demo state.                                                                                                                     |
| Vendor detail                 | `CatalogDetail`, `DetailPrimitives`                                 | Supplemental sanitized structure in `REFERENCE_VENDOR_DETAIL.md` | One master/detail profile with Overview, Comments, Transactions, Mails, and Statement tabs. Addresses, contacts, masked bank labels, comments, mails, and tags use local-only subflows.                                  |
| Item detail                   | `CatalogDetail`, `DetailPrimitives`                                 | Supplemental sanitized structure in `REFERENCE_VENDOR_DETAIL.md` | One master/detail page with Overview, Transactions, and History. Related transaction rows use stable item IDs and a working status filter.                                                                               |
| Transaction details and CRUD  | `RecordDetail`, `TransactionEditor`                                 | 02, 09–24                                                        | One full detail structure configured by entity; separate edit routes retain lines, metadata, lifecycle status, source, and return context. Delete uses confirmation and removes only the selected local record.          |
| RFQ                           | `RfqWizard`, `RecordDetail`                                         | 09–10, 33–41                                                     | One resumable six-stage wizard; Basic Details is reused as step one. Add Item and Add User remain nested dialogs. Detail/Edit/Delete lead to the shared RFQ record and the same wizard, not duplicate pages.             |
| Purchase Orders and receiving | `RecordList`, `RecordDetail`, `TransactionEditor`                   | 11–14                                                            | Distinct order and receive semantics; source-order context is retained. No real inventory or supplier order is issued.                                                                                                   |
| Payables and intake           | `PayablesInbox`, `RecordList`, `RecordDetail`, `TransactionEditor`  | 15–19                                                            | Inbox filename metadata can prefill a local bill draft. Bills and recurring bills have separate detail/edit behavior. No file contents are uploaded or read.                                                             |
| Payments and batches          | `RecordList`, `RecordDetail`, `BatchPayments`, `BatchPaymentEditor` | 20–22                                                            | Individual payments and prepared batches remain distinct. Search, list, detail, and edit use canonical batch routes; the batch list exposes explicit View/Edit/Delete with local confirmation. No bank transfer is sent. |
| Credits                       | `RecordList`, `RecordDetail`, `TransactionEditor`                   | 23–24                                                            | Vendor-credit fields and applications are distinct from bills/payments. Shared balance calculations ignore drafts and avoid double counting.                                                                             |
| Budgets and reports           | `Budgets`, `Analytics`                                              | 25–26                                                            | Local summaries, filters, and CSV export; not a production accounting measure.                                                                                                                                           |
| Settings and builders         | `Settings`, `SetupConfig`, `SettingsLists`                          | 27–120                                                           | One settings shell and entity/tab configuration. Builder and selector controls are local previews only; no configuration, email, or automation is applied to Zoho.                                                       |

## Detail and CRUD behavior

- Lists, global search, and workflow links open the canonical detail surface before Edit. Vendor/item tables expose explicit View, Edit, and Delete actions; transaction quick-view includes full detail, Edit, and local deletion.
- Vendor profile tabs cover Overview, Comments, Transactions, Mails, and Statement. The related transaction selector includes Bills, Bill Payments, Recurring Bills, Purchase Orders, Purchase Receives, and Vendor Credits.
- Vendor editing exposes Other Details, Address, Contact Persons, Bank Details, Custom Fields, Reporting Tags, and Remarks. Contact rows, addresses, tags, and custom fields are editable locally. Bank-account input is used only to make a masked label; the raw account number is discarded and not stored.
- Item details include Overview, related Transactions, and History, with status/type filters. Items, vendors, purchase requests, RFQs, orders, receives, bills, recurring bills, payments, credits, and prepared batches have canonical detail/edit routes. Delete confirmations state that only this browser's fictional demo record is removed and linked records are not cascaded.
- Vendor/item names and search destinations are stable across record edits; changing a transaction vendor updates both display name and stable ID. Vendor transaction rows map references, payment mode, paid amount, unused amount, balances, and related order/bill values by entity. View/Edit and next-step navigation preserve the originating vendor tab; creating a vendor from a transaction editor returns to that same browser-local draft. Approval and workflow-origin context is preserved when returning to the originating queue.

## Reuse rules

1. **A workflow is an entry path, not a page copy.** Reuse the canonical screen and carry source, role, prefill, permissions context, and return destination.
2. **Keep entities semantically distinct.** Reuse shared fields, line tables, totals, dialogs, detail primitives, and confirmation UI; keep receiving, bill, credit, payment, and recurring behavior separate.
3. **Use detail before edit.** Lists and global search open a complete record view; Edit is an explicit separate route, not a title-click side effect.
4. **One RFQ wizard.** New, Edit, and stage transitions reuse one saved draft and its nested dialogs.
5. **Frontend roles are not authorization.** Role-specific views do not enforce access control without a backend.

## Intentional limits

- This is a reference-led prototype, not a pixel-perfect or feature-complete Zoho clone; visual/interaction validation was representative, not an exhaustive audit of every viewport or every control.
- Vendor and item live detail structures were inspected read-only. The live Purchase Orders and Bills lists showed empty/onboarding states, so no tenant records were created to manufacture populated reference screens. Generic transaction detail fields use fictional records and the documented workflow model; the app is not claiming verified parity for every live transaction detail variant.
- Comments, email composition, approvals, RFQs, transactions, settings, and deletion are demo-only. Email, vendor invitations, portal settings, payment, awards, and automation execution are not connected to live services.
- Settings save a local preview snapshot; they do not apply real settings or rebuild all route-specific configuration state. Some unsupported settings actions are visibly unavailable or provide preview feedback.
- Attachments store filename metadata only. No OCR, invoice extraction, or durable file service is implemented.
- Local browser storage is origin/device-specific. Clearing it removes demo changes. No records are shared across users or devices.
- Budgets use fixture utilization values. They are not automatically allocated against posted records; accounting balances are not production-grade.

## Validation evidence

- `pnpm check`: strict TypeScript check passed.
- `pnpm test`: 14 model tests passed, including totals/validation, route uniqueness, shared-record updates, non-cascading deletion, stable vendor/item references, and payable lifecycle balances.
- `python3 scripts/check-preview.py`: 18 focused Chromium regression stages passed for route guards, Procurement return context, inbox-to-bill drafts, credits/payments/batch balances, RFQ resume, bill edit preservation, vendor detail tabs/comments/statement filters, stable vendor-ID changes and vendor-tab return context, type-specific payment columns, add-vendor save/cancel return to the transaction draft, masked bank add/edit/delete, vendor clone/delete, all vendor edit tabs and nested controls, item detail filters, prepared-batch detail/edit and list-level View/Edit/Delete, and no page exceptions.
- `pnpm build`: production build passed. Vite reports the single application bundle just over its 500 kB advisory threshold (about 138 kB gzipped); it is a performance optimization opportunity, not a build failure.
- `public/manus-routes.json` is generated from the route registries and declares 104 canonical paths.
- The project remains frontend-only; server/database are disabled and automatic/public publication remains off. The private screenshots and reference docs are kept in `docs/`, blocked from the website's public route surface.

Continue from this project and its [workflow handoff](UI_UX_AGENT_HANDOFF.md). A production implementation would require separate approval for backend, permissions, tenant data, integrations, durable files, and validated accounting/inventory rules.
