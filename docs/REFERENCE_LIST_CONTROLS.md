# List toolbar and import/export reference notes

## Scope and safety

These are UI-structure notes from the supplied Vendors list screenshot and read-only inspection of Zoho Procurement. No real vendor or contact data has been copied into the frontend. The import wizard remains unsubmitted; a synthetic file was prepared only for local UI inspection, and no import file was uploaded or imported.

## Vendors list toolbar

The list is titled **Active Vendors**, with a **New** action. Its More Actions menu contains a **Sort by** submenu with Name, Company Name, Payables (BCY), Unused Credits (BCY), Created Time, and Last Modified Time. The **Import** submenu contains **Import Vendors**. The **Export** submenu contains **Export Vendors** and **Export Current View**. **Preferences** opens the existing Vendors module Preferences route (`/settings/preferences/contacts`), rather than a separate list-preferences page. The menu also includes **Refresh List** and **Reset Column Width**. The small table-header control menu exposes **Customize Columns** and **Clip Text**. Table headers are sortable and rows have selection checkboxes.

## Advanced Search

Advanced Search is a separate panel from quick text search. Its selectors are **Search: Vendors** and **Filter: All Vendors**. The available text fields are Display Name, Company Name, First Name, Last Name, Email, Phone, Address, and Notes; Status defaults to All. The actions are **Search**, **Cancel**, and close. The top-level screen also uses an **Active Vendors** saved-view selector.

## Import Vendors workflow

1. The entry dialog offers **Vendors** (default) and **Vendor's Contact Persons**, followed by **Continue** or **Cancel**.
2. The stepper is **1 Configure → 2 Map Fields → 3 Preview**.
3. Configure shows a drag/drop or **Choose File** area, a **25 MB** maximum, CSV/TSV/XLS format guidance, sample CSV/XLS downloads, three duplicate modes, **UTF-8 (Unicode)** character encoding, Page Tips, and **Next**/**Cancel**.
4. Duplicate options are **Skip Duplicates**, **Overwrite vendors**, and **Add duplicates as new vendors**. The Page Tips note sample templates, accepted file formats, and the ability to save import settings for later.
5. No file was selected, uploaded, mapped, previewed, or imported in the live account. Mapping/Preview are represented in the prototype with a local CSV/TSV preview; XLS format is shown for reference but is not parsed by the frontend-only prototype.

## Prototype implementation contract

Use shared list tools across catalog and transaction lists while retaining module-specific fields and actions. Vendor Advanced Search must apply the observed fields to fictional local records. Sorting, saved/status views, column visibility/widths, selection, Clip Text, Refresh, and Reset Column Width stay local. Import and export may affect/download only browser-local demo records; Export Current View must honor active filters, sort, and visible columns, while Export Selected uses stable selected IDs even when they are hidden by a filter. Vendor Contact Person duplicate modes must distinguish Skip, Overwrite, and Add-as-new; rows without email may match by name plus phone. CSV/TSV are parsed in-browser, invalid/negative item rates are rejected, and XLS is displayed for visual parity only. No source of live tenant data is used.
