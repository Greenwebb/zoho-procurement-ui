# Zoho Procurement UI (frontend prototype)

A React, TypeScript, Vite, and Tailwind frontend based on the captured Procurement product screens. This prototype models workflows with fictional data and browser-local state; it does not connect to Zoho or perform real approvals, orders, receipts, emails, or payments.

## Run locally

```sh
pnpm install
pnpm dev
```

Checks and production build:

```sh
pnpm check
pnpm test
pnpm build
```

For focused browser interaction regressions, start `pnpm dev` and run `python3 scripts/check-preview.py` in another terminal; the checks use an isolated Chromium context and fictional local data.

## Reference material

- [UI/UX workflow handoff](docs/UI_UX_AGENT_HANDOFF.md)
- [Capture index](docs/README.md)
- [Capture manifest](docs/capture_manifest.csv)
- [Sanitized vendor/item detail reference](docs/REFERENCE_VENDOR_DETAIL.md)
- 118 private screenshot references are in `docs/`; they are not placed in the website's `public/` assets.

The frontend declares 104 canonical routes, including reusable record-detail and edit paths. Vendor, item, transaction, RFQ, and batch interactions modify only fictional browser-local demo records.

See [plan.md](plan.md) for scope/architecture, [TODO.md](TODO.md) for progress, and [implementation coverage](docs/IMPLEMENTATION_COVERAGE.md) for reuse and demo limitations.
