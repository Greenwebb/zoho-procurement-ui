# Procurement UI — React and Tailwind implementation plan

## Goal and reference

Build the Zoho Procurement frontend from the existing 118-screenshot collection and `UI_UX_AGENT_HANDOFF.md`. Workflows reference canonical screens rather than duplicating pages. The managed project is initialized at `/home/ubuntu/procureui`; it has an empty flexible workspace, runtime port 3000, no server/database enabled, and automatic publication disabled.

## Product scope

- App shell: global search, main navigation, notifications/account affordances, desktop sidebar, and mobile navigation.
- Dashboard, employee requests, Procurement request queue, approvals, Items, and Vendors.
- The employee-facing My Requests screen exposes Pending Requests and All Requests tabs plus a scope switch between My Requests and All Requesters. Pending is a status view; All includes every status within the selected owner scope. Use fictional requester labels only.
- RFQs: list and six-stage wizard, including the captured Add Item and Add User dialogs.
- Purchase Orders, Purchase Receives, Payables Inbox, Bills, Recurring Bills, Batch Payments, Payments Made, and Vendor Credits.
- Budgets and Analytics.
- Organization/configuration settings, module preferences and tabs, PDF/email template categories, automation lists, and the captured field/rule/button/related-list/email-alert/schedule builders.
- Represent empty, populated, selected, validation, unsaved, draft, and post-list/detail states where the references support them. Keep View, Edit, and Delete as explicit CRUD affordances instead of making a listed record title edit directly.
- Add canonical record-detail screens for business records. Vendors use a tabbed profile (Overview, Comments, Transactions, Mails, Statement); Items and transaction entities use reusable detail layouts configured with entity-specific fields, lines, lifecycle context, and associated records.
- Add the missing list-tool states the user identified: saved/status views, advanced filters, sort fields, column selection/clip behavior, Import, and Export. Reuse one configurable list-tools layer across catalog and transaction tables, with module-specific fields/actions.
- Vendors list controls must include the observed Sort by fields (Name, Company Name, Payables (BCY), Unused Credits (BCY), Created Time, Last Modified Time), Import Vendors, Export Vendors, Export Current View, Preferences, Refresh List, Reset Column Width, Customize Columns, Clip Text, and Advanced Search. Advanced Search includes Display Name, Company Name, First Name, Last Name, Email, Phone, Address, Notes, and Status.
- The Vendor import UI follows Configure → Map Fields → Preview, starts with Vendors vs Vendor's Contact Persons, shows CSV/TSV/XLS and the 25 MB limit, sample templates, duplicate handling choices, UTF-8, and Cancel/Next controls. Because this is frontend-only, file parsing and import state stay local to the browser and only synthetic/local data can be added; the implementation parses CSV/TSV and clearly marks XLS as shown for reference but not parsed. Never upload or import live tenant records.
- Export exposes Export Vendors and Export Current View, operates only on local demo data, and reuses the same list context. Preferences reuses the existing vendor module settings route rather than duplicating a settings page.
- The 118 images are visual references, not 118 separate React pages. Dropdowns, role variants, wizard stages, detail tabs, and repeat captures reuse canonical page/component definitions.

## Implementation approach

Use React, TypeScript, Vite, Tailwind CSS, React Router, and an outline-icon library. Configure host-managed TypeScript diagnostics before application code; pin pnpm and lifecycle-script permissions before dependencies are installed.

This is a frontend prototype, not a Zoho integration: use fictional fixtures and browser-local state for records, draft forms, wizard progress, search/filter choices, and settings previews. Label simulated actions clearly. No authentication, actual payments, email delivery, Zoho API access, production record changes, database, or server are part of this frontend scope. Never import the real tenant's users, email addresses, drafts, or procurement records into the preview.

- Central route registry with stable screen IDs and reference IDs.
- Shared list framework and `ListTools` configured by module, with distinct columns/statuses/actions, advanced filter schemas, sort fields, column visibility, and local import/export behavior.
- Shared transaction primitives composed into entity-specific forms; receiving, billing, payment, credit, and recurrence remain semantically distinct.
- One request model with employee/Procurement role views.
- One RFQ draft with six stage components and dialog subflows; basic details is not implemented twice.
- Shared catalog pickers and editors; caller context/prefill/return location changes, not the page implementation.
- One settings shell and configurable tab model; shared builders with entity-specific schema.
- Shared detail header, information sections, activity, and action menu configured by entity. Vendor profile details include contact/address, contact-person, masked bank-account, payables, comments, transaction, mail, statement, and activity sections.
- Add local-only edit/delete controls and a deletion confirmation. Delete affects only the browser-local demo store; linked records are not cascaded. Never copy live vendor personal/banking data into fixtures or persist a raw account number.
- Form controls with associated labels, keyboard access, sensible error feedback, and local draft persistence. Buttons either perform an implemented local interaction, navigate, or explicitly explain that a live service is not connected.

## Reference-led design

Reuse the captured desktop design: dark navy top bar, light sidebar, blue active states and primary actions, white/light-gray content panels, fine borders, compact enterprise typography, restrained outline icons, tables, and anchored form actions. Inspect the screenshot for each implemented surface and refine its desktop layout against the reference. Use no decorative stock imagery.

Mobile first: adapt the sidebar into a navigation drawer/bottom entry points, stack dashboard panels, keep actions reachable, let wide tables scroll inside their containers, and turn wizard navigation into a compact step indicator. Preserve desktop reference fidelity without shrinking the desktop screenshot into a phone layout. Sanitize branding/account data and omit live subscription/trial notices from the prototype.

## Project structure

- `src/app/`: routing, providers, layout selection, screen registry.
- `src/components/ui/`: buttons, fields, select controls, tabs, dialogs, badges, notices.
- `src/components/layout/`: app shell, top bar, sidebar/mobile navigation, settings shell.
- `src/components/data/`: table/filter/list-tools framework, import/export dialogs, catalog pickers, line editor, totals, attachment controls, record detail sections.
- `src/features/`: dashboard, requests/approvals, catalogs, canonical record details, RFQ, transactions, budgets/reports, settings/automation.
- `src/data/`: fictional fixtures and reference-to-screen mappings.
- `src/lib/`: browser-local persistence, formatting, validation, workflow context.
- `public/`: favicon and synchronized `manus-routes.json`; do not expose tenant screenshots publicly.
- `docs/`: workflow handoff, screenshot inventory, implementation coverage.
- `TODO.md`: agreed outcome criteria and progress.

## Build and handoff workflow

1. Confirm this plan, then create outcome-based TODO items.
2. Configure diagnostics, toolchain, and dependencies. Implement the shell, shared primitives, routes, and fictional/local-state model.
3. Implement business workflows and settings using the reference mappings. Preserve page reuse and module-specific behavior.
4. Inspect representative live record-detail references read-only, never edit/delete tenant records. Run type checks, production build, route-manifest checks, and focused local interaction checks; compare rendered desktop/mobile detail surfaces against the references and fix confirmed issues.
5. Run the dev service on `0.0.0.0:3000`, verify the preview, configure the static build, and save a managed checkpoint. Deliver the preview with an honest coverage summary. Do not publish broadly, modify either selected GitHub repository, or connect to Zoho without a separate request.
