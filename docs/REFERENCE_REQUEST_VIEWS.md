# My Requests view reference

## Source

User-supplied Zoho Procurement screenshot in the conversation, 16 October 2026. The image is 855 × 403 px and shows the My Requests navigation entry selected. No URL or tenant record values were included in the supplied crop.

## Visible structure

- The page is in the **My Requests** section.
- **Pending Requests** is the selected tab (blue label and underline).
- **All Requests** is a second tab with a down-caret, indicating an additional view/filter choice.
- The crop does not show table contents, owner names, or the dropdown choices.

## Implementation interpretation

The user explicitly asked whether an employee can switch between their own requests and see all requests. The frontend therefore exposes a requester-scope control for **My Requests** versus **All Requesters**, alongside the Pending Requests / All Requests status tabs. This scope is a fictional browser-local demo filter, not an authenticated permission boundary. No real requester names or records are copied from Zoho.
