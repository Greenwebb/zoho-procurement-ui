# Procurement frontend — first implementation

## Scope and status

The first React + TypeScript + Tailwind frontend is implemented and runs as a **preview**, not a published production application. It uses fictional fixtures and browser-local records. Backend, authentication, Zoho APIs, email, payment services, and automation execution are intentionally absent.

The 118 captured images are **reference states**, not 118 separate pages. There are 91 declared page routes, including dynamic edit routes and settings routes. Wizard steps, dialogs, dropdown states, and workflow origins do not each require an additional page implementation.

## Canonical implementation and screenshot reuse

| Area                            | Implementation                                               | Main screenshot references | Workflow reuse                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application shell and dashboard | `AppShell`, `Dashboard`                                      | 00                         | Shared shell and navigation for all business modules; dashboard links to canonical destinations.                                                                                                               |
| Requests and approval           | `RecordList`, `TransactionEditor`                            | 01, 02, 03, 08             | One request record model. Employee, Procurement, and approval views share primitives but expose different actions and retain originating queue when editing.                                                   |
| Catalogs                        | `CatalogList`, `CatalogEditor`, `VendorSelect`, `LineEditor` | 04–07                      | One item/vendor store and reusable selectors; saved local catalog edits are available in other workflows.                                                                                                      |
| RFQ                             | `RfqWizard`                                                  | 09, 10, 33–39              | One six-stage draft: Basic Details → Items → Terms → Documents → Bidding Preferences → Team. Add Item and Add User are nested dialogs, not independent pages. Stage and form state can resume after reload.    |
| Purchase orders                 | `RecordList`, `TransactionEditor` with order-specific fields | 11, 12                     | Same editor for direct creation and source-request context. Separate draft and simulated send actions.                                                                                                         |
| Receiving                       | `TransactionEditor` with receiving branch                    | 13, 14                     | Source order and received quantity fields; no duplicate order form, no real inventory update.                                                                                                                  |
| Payables intake and bills       | `PayablesInbox`, bill branch in `TransactionEditor`          | 15–17                      | Intake stays distinct from bill ledger/editor. Inbox ID, filename, and size metadata prefill a bill draft. File contents are not uploaded or read.                                                             |
| Recurring bills                 | Recurrence branch in `TransactionEditor`                     | 18, 19                     | Shared bill fields plus frequency/start/end dates. Saves local schedule metadata; no background generation of future bills.                                                                                    |
| Payments and batches            | Payment branch, `BatchPayments`, shared balance functions    | 20–22                      | Individual payment editor and separate batch workspace; batches record allocations for local review. Global search opens batch details rather than a nonexistent edit route.                                   |
| Vendor credits                  | Credit branch in `TransactionEditor`                         | 23, 24                     | Credit reason, optional same-vendor bill application, available balance, distinct statuses and credit total; omits bill due date and terms.                                                                    |
| Budgets and reports             | `Budgets`, `Analytics`                                       | 25, 26                     | Local budget register, inspection, report filters, and CSV export. Open bill balance uses posted bills less applied payments/credits, not PO + bill + payment sums.                                            |
| Settings                        | `Settings`, `SetupConfig`, `SettingsLists`, module registry  | 27–31, 42–108              | One settings shell, entity/tab configuration, PDF/email categories, organization/setup controls, module preferences and builder lists.                                                                         |
| Builders and automation         | Shared builders and automation panels within `Settings`      | 109–120                    | Custom fields, validation rules, buttons, related lists, workflow steps/options, email alerts, and schedules are local editor/selector previews. No script, email, permission change, or live rule is applied. |

Exact filename labels are in [capture_manifest.csv](capture_manifest.csv), and product workflow descriptions remain in [UI_UX_AGENT_HANDOFF.md](UI_UX_AGENT_HANDOFF.md).

## Reuse rules for further development

1. **A workflow is an entry path, not a page copy.** Extend the existing route/context handling before introducing a page.
2. **Keep entities semantically distinct.** Share fields, item tables, totals, and dialogs; receiving, billing, credit application, and payment allocation are different operations.
3. **Carry source and return context.** Current examples use `source`, `inbox`, `filename`, and `entry` query values. Procurement/approval request edits retain the queue origin.
4. **One RFQ wizard.** Screenshot 10 is Basic Details in the same draft as 33–39. Subflows update that draft.
5. **Settings are configured by module/tab.** Common builders receive entity context; a new module should add registry/schema entries, not fork the settings application.
6. **Add real permissions only with a backend scope.** Role-oriented frontend views are not authorization enforcement.

## First-version limitations (intentional)

- This is a reference-led prototype, not a pixel-perfect or feature-complete Zoho clone.
- Captured safe builder/selector states are represented; uncaptured destructive, publish/send, vendor-bidding/award, reconciliation, and record-specific overflow workflows are not claimed as complete.
- Settings **Save preview** stores a readable snapshot, not an applied configuration or a rehydrated per-route settings draft. Some directory/builder row actions show explicit preview feedback rather than complete CRUD.
- RFQs save locally as drafts; no vendor invitations, response comparison, award, or publish workflow is connected.
- Transactions, approvals, payments, and credit applications are simulated. Receiving does not enforce a production inventory ledger or full cumulative multi-receipt reconciliation.
- Attachments and intake store filename metadata only. No OCR, uploaded file storage, or invoice extraction is implemented.
- Budgets have independent fixture utilization values; they are not automatically allocated against transaction records. Analytics “Record value” sums matching records for browsing, not an accounting spend metric.
- Browser storage is device/origin-specific, not shared account persistence. Clearing it removes demo records.
- Desktop/mobile representative layouts were inspected; no claim of exhaustive device, accessibility, or every-button certification is made.

## Validation evidence

- TypeScript strict check passed.
- Production Vite build passed.
- 10 model tests passed, covering totals, line validation, route uniqueness, record replacement, fictional catalog IDs, and payment/credit balances excluding drafts.
- Focused Chromium regressions passed for unknown record/settings routes, Procurement return context, inbox-to-bill draft metadata, incomplete draft save, credit-specific fields/payment balance, batch/search details, RFQ stage resume, and modal typing stability; no page exceptions were reported in those checks.
- Local and managed Preview route manifests responded with HTTP 200 and 91 entries.
- Reference images remain in private project `docs/`, excluded from build output and blocked from development-server file requests.

## Continue the work

Use the saved project as the implementation base. Prioritize any additional screenshot-fidelity refinements or uncaptured workflows explicitly before expanding behavior. Production use would need a separate backend, authorization, tenant data model, durable files, integrations, and validated accounting/inventory rules.
