# Zoho Procurement — Screenshot Index

**Capture date:** 16 Oct 2026
**Scope:** Zoho Procurement only (other Zoho products are not included yet).
**Contents:** 118 clean PNG screenshots plus this index and `capture_manifest.csv`.

The screenshots are clean local renders of pages inspected in the authenticated Zoho Procurement demo tenant. Most are 1536 × 768; long forms/editors use a taller 1536 px viewport. The original “My Requests” and Procurement-side “Purchase Requests” screens are distinct role-oriented views of the same request lifecycle.

## Workflow screenshots

| Workflow / screen                                       | Screenshot files                                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dashboard and spend overview                            | `00_dashboard.png`                                                                                                                                     |
| Purchase request: My Requests → new request → approvals | `01_my_requests.png`, `02_new_purchase_request.png`, `03_approvals.png`                                                                                |
| Shared reference data                                   | `04_items.png`, `05_new_item.png`, `06_vendors.png`, `07_new_vendor.png`                                                                               |
| Procurement-side request management                     | `08_procurement_purchase_requests.png`                                                                                                                 |
| Request for Quotes (RFQ)                                | `09_rfqs.png`, `10_new_rfq.png`                                                                                                                        |
| RFQ wizard — later stages                               | `33_rfq_wizard_items.png`, `35_rfq_wizard_terms.png`, `36_rfq_wizard_documents.png`, `37_rfq_wizard_bidding_preferences.png`, `38_rfq_wizard_team.png` |
| RFQ wizard — nested panels                              | `34_rfq_wizard_add_item_dialog.png`, `39_rfq_wizard_add_user_dialog.png`                                                                               |
| Purchase Orders                                         | `11_purchase_orders.png`, `12_new_purchase_order.png`                                                                                                  |
| Purchase Receives                                       | `13_purchase_receives.png`, `14_new_purchase_receive.png`                                                                                              |
| Payables intake and bills                               | `15_payables_inbox.png`, `16_bills.png`, `17_new_bill.png`                                                                                             |
| Recurring bills                                         | `18_recurring_bills.png`, `19_new_recurring_bill.png`                                                                                                  |
| Payments                                                | `20_batch_payments.png`, `21_payments_made.png`, `22_new_payment.png`                                                                                  |
| Vendor credits                                          | `23_vendor_credits.png`, `24_new_vendor_credit.png`                                                                                                    |
| Budgets and analytics                                   | `25_budgets.png`, `26_analytics.png`                                                                                                                   |

### Reuse notes

- `10_new_rfq.png` is the RFQ wizard’s **Basic Details** stage. It is reused as step 1 rather than duplicated; later stages and nested panels are captured in `33`–`39`.
- `04_items.png` and `06_vendors.png` are shared reference-data screens, captured once. The item/vendor selectors recur across procurement and payables forms.
- `01_my_requests.png` and `08_procurement_purchase_requests.png` are both included because the employee-facing request screen and the Procurement management screen are different views, not duplicates.
- List/form pairs are shown where the product has distinct list and creation pages. A blank form is a page-state capture only; it does not mean a transaction was completed.

## Supplemental record-detail reference

Read-only follow-up inspection of a Vendor profile and an Item detail revealed additional post-table screens and CRUD affordances. Their sanitized structure, tabs, fields, and capture boundaries are documented in [REFERENCE_VENDOR_DETAIL.md](REFERENCE_VENDOR_DETAIL.md). The live record's contact, bank, and financial values were not copied into the frontend fixtures.

## Settings and configuration screenshots

| Area                                                     | Screenshot files                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings landing and organization profile                | `27_settings_index.png`, `28_settings_general.png`, `29_settings_profile.png`, `30_settings_branding.png`, `31_settings_locations.png`                                                                                                                           |
| General setup                                            | `42_settings_currencies.png`–`46_settings_transaction_number_series.png` (Currencies, Payment Terms, Vendor Portal, Punchout Catalogs, transaction numbering)                                                                                                    |
| PDF templates                                            | `47_settings_pdf_purchase_orders.png`–`52_settings_pdf_vendor_statements.png`                                                                                                                                                                                    |
| Sender preferences and notification templates            | `53_settings_sender_email_preferences.png`, `54_email_item_notification.png`–`71_email_vendor_statement.png`                                                                                                                                                     |
| Purchase Orders preferences                              | `72_settings_purchase_orders_preferences.png`–`77_settings_purchase_orders_related_lists.png`                                                                                                                                                                    |
| Purchase Receives, Bills, Recurring Bills, Payments Made | `78_settings_purchase_receives_preferences.png`–`81_settings_payments_made_approvals.png`                                                                                                                                                                        |
| Vendors and Purchase Requests preferences                | `82_settings_vendors_preferences.png`–`91_settings_purchase_requests_validation.png`                                                                                                                                                                             |
| Projects, Items, Chart of Accounts, Customers            | `92_settings_projects.png`–`95_settings_customers.png`                                                                                                                                                                                                           |
| Automation and organization settings                     | `96_settings_workflow_rules.png`–`108_settings_web_tabs.png` (workflow rules/actions/logs, schedules, general, locations, users, roles, departments, taxes, TDS, reporting tags, Web Tabs)                                                                       |
| Unsaved settings builders and selectors                  | `109_settings_new_purchase_order_field.png`–`112_settings_new_purchase_order_related_list.png`, `113_workflow_rule_first_step.png`–`118_settings_email_alert_module_options.png`, `119_settings_new_schedule.png`, `120_settings_schedule_frequency_options.png` |

The email-template captures cover RFQ lifecycle notices (invitation, cancellation, reminders, bid period extension/closure, award/not-awarded), purchase/payables notices, vendor portal/credit/statement notices, projects, and payment remittance. Some modules show an empty template list in this tenant; those live states are still captured.

The added settings-editor screenshots show blank, unsaved screens for custom fields, validation rules, custom buttons, related lists, workflow rules, email alerts, and schedules. Dropdown captures show available module/action/frequency choices without committing a selection or creating automation.

## Capture boundaries and follow-up

- No RFQ was published, no vendor was invited, and no purchase, receipt, bill, credit, or payment was submitted. No approval action or settings change was made.
- **One temporary RFQ draft was saved** as `RFQ-00002 — DEMO SCREENSHOT - disposable RFQ` because Zoho required saving progress to unlock later RFQ wizard stages. It remains **Draft**, was not published or sent to vendors, and the tenant’s original RFQ was left unchanged. Tell me if you want that temporary draft removed.
- A workflow-rule wizard was temporarily filled with a clearly labeled demo name to reveal its next stage, then canceled without saving. All other configuration editors were left blank and unsaved.
- This is a broad screenshot set of navigable Procurement pages and safe wizard/editor states, **not a screenshot of every possible action menu on every individual record**. Buttons that publish, send, delete, pay, approve, execute code, or persist configuration were not activated.
- Screenshots may include company labels, user names, email addresses, existing demo data, or subscription/trial UI. Treat the archive as internal material and review/redact before external sharing.
- Files numbered `32`, `40`, and `41` are intentionally absent: RFQ step 1 is reused from `10_new_rfq.png`; the detail/list states did not add distinct reusable captures.

For a filename-by-filename listing, see `capture_manifest.csv`.

For workflow narratives, screenshot-to-step mapping, and the frontend screen-reuse blueprint, see [`UI_UX_AGENT_HANDOFF.md`](./UI_UX_AGENT_HANDOFF.md).
