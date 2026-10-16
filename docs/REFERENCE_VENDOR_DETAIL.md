# Vendor record-detail reference (sanitized)

**Source inspected read-only:** `https://procurement.zoho.com/app/941677606#/vendors/1486745000000095247?filter_by=Status.Active&per_page=25&sort_column=created_time&sort_order=D` (16 Oct 2026). The page belongs to the active Procurement tenant. Names, email addresses, phone numbers, account identifiers, timeline copy, and financial values are intentionally omitted from this project note and must not be used as prototype fixture data.

## Detail-screen anatomy

- **Master/detail context:** left-side active-vendor list remains visible while a selected vendor's profile is shown in the main area.
- **Header:** active-vendor breadcrumb/list return, selected display name, active status, summary payable amount, and primary actions `Edit`, `New Transaction`, and `More`.
- **Record tabs:** `Overview`, `Comments`, `Transactions`, `Mails`, and `Statement`.
- **Contact summary:** avatar/initial, company/organization, primary contact, email and phone channels; actions include `Invite to Portal` and `Send Email`.
- **Overview sections:** collapsible `Address` (separate Billing and Shipping addresses, each with `New Address` action); `Other Details` (default currency, portal status, vendor language); `Contact Persons`; `Bank Account Details`; `Record Info` (payment-due period); `Payables` summary table (currency, outstanding payables, unused credits); activity timeline.
- **Other actions:** secondary header control and contact-card settings/menu control are present; do not infer unavailable functions from the screenshot alone.

## Implementation implications

- A vendor table row must have a **View** path distinct from `Edit`; use one reusable vendor detail route/page for every vendor record.
- The detail page should preserve list context, display structured data from the same local vendor record, and keep the five tabs in one canonical page.
- Edit remains a separate route and exposes all seven vendor editor sections: `Other Details`, `Address`, `Contact Persons`, `Bank Details`, `Custom Fields`, `Reporting Tags`, and `Remarks`. Contact rows have local add/edit/remove controls; address and tag fields are editable, while bank details remain a masked preview managed from the overview.
- Provide local-only Edit and Delete affordances. Delete must use a confirmation dialog and modify only the browser-local demo store; no Zoho record is changed.
- Comments, mails, statements, contact invitation, and vendor transactions must be presented as read-only or clearly simulated/disabled unless a local demo interaction is implemented; do not send communications or create external transactions.

## Additional observed tab and action states

| Tab/state    | UI structure observed                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comments     | Rich-text comment composer with formatting controls and Add Comment action; a separate All Comments empty state. The prototype may add fictional comments locally but must never submit to Zoho.                                                                                                                                                                                                                                    |
| Transactions | A transaction-type selector (`Go to transactions`) and accordion/list panels for Bills, Bill Payments, Recurring Bills, Purchase Orders, Purchase Receives, and Vendor Credits. Populated tables expose type-specific columns (for example bill date/number/order/vendor/amount/balance/status and payment date/payment number/reference/mode/amount paid/unused amount/status); empty lists have per-type Add New/New affordances. |
| Mails        | System Mails panel with an empty state when there is no sent email. The overview exposes Send Email, but the prototype must not send.                                                                                                                                                                                                                                                                                               |
| Statement    | Date-range selector, `Filter By` selector, print/PDF/download-style toolbar controls, statement title and period, and a statement-document preview with account summary. Sending the statement is an external communication and remains disabled in a local prototype.                                                                                                                                                              |
| More menu    | Associate Templates, Configure Vendor Portal, Email Vendor, Add Bank Account, Clone, Merge Vendors, Mark as Inactive, and Delete. No item was selected. A frontend clone should make the safe local options explicit and require a confirm modal for delete/merge; email, invitation, and portal changes must be non-operational.                                                                                                   |

The vendor More menu is distinct from the visible `Edit` and `New Transaction` header actions. Preserve these as contextual actions in the reusable detail view, but label all local behavior clearly and do not invoke any live account operation.

## Edit-vendor form states

The actual edit route retains the primary contact/company/display name/email/work-phone/mobile/vendor-language block and a fixed Save/Cancel action bar. Tabs observed:

| Tab             | Fields and states                                                                                                                                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Other Details   | Tax Rate selector and tax-group guidance; Company ID; Currency; Payment Terms; Documents upload (limit shown as 10 files, 10 MB each); an `Add more details` control.                                                                                                           |
| Address         | Two parallel cards, Billing Address and Shipping Address; each contains Attention, Country/Region, Address, City, State, ZIP Code, Phone with country code, and Fax Number. Shipping has a Copy billing address control. Additional addresses are managed from the detail page. |
| Contact Persons | Wide, horizontally scrollable editable table with Salutation, First Name, Last Name, Email Address, Work Phone, Mobile, Skype Name/Number, Designation, Department and per-row delete; `Add Contact Person`; Save/Cancel.                                                       |
| Bank Details    | Edit form says bank details are added/edited from the Contact Overview page, not this tab.                                                                                                                                                                                      |
| Custom Fields   | Empty-state guidance directs the user to Settings → Preferences → Vendors; address formatting is also linked to that settings area.                                                                                                                                             |
| Reporting Tags  | Empty-state guidance when no reporting tags are configured; directs the user to More Settings → Reporting Tags.                                                                                                                                                                 |
| Remarks         | `Remarks (For Internal Use)` textarea.                                                                                                                                                                                                                                          |

Inspection was read-only: no form input, save, comment, email, invitation, bank account, or destructive action was triggered.

## Related Items detail reference (sanitized)

Read-only inspection of one Items row revealed a master/detail layout that keeps the item list visible. The detail header contains the selected item, displayed purchase rate, edit affordance, and a `More` menu. The canonical item tabs are `Overview`, `Transactions`, and `History`. Overview shows Item Type, Unit, Created Source, Purchase Information (Cost Price, Purchase Account, Description, Preferred Vendor) and Reporting Tags. Transactions includes a `Filter By: Purchase Orders` selector and `Status` filter with an entity-specific empty state. History is a date/details audit table. The More menu exposes `Clone Item`, `Mark as Inactive`, and `Delete`; no action was selected. The local prototype implements these as distinct local actions with confirmation for deletion; no live item values or preferred-vendor contact data were imported.

## Inspection boundaries

The live Purchase Orders list showed its empty-state/onboarding screen and contained no existing record to inspect. No order, bill, address, bank account, email, comment, or other live record was created to produce a detail screen. The prototype will use its fictional local fixture for transaction-detail layouts and will label those actions as demo-only.

## Follow-up inspection note · 16 Oct 2026

- The supplied vendor profile again showed a persistent active-vendor directory beside a selected profile; the header exposes Edit, New Transaction, and More, while Overview presents contact and payables summaries before address, other-details, contact-person, bank, record-info, and activity sections. No live values were copied into fixtures.
- A read-only Bills-list visit showed the product's empty-state/onboarding surface rather than existing bill records, so there was no safe populated bill detail to inspect. No bill or other record was created to unlock it.
- These observations supplement the structural capture above; the frontend detail routes use fictional records and browser-local actions only.
