"""Focused integration regressions against the local frontend; no external records."""
import json
import re
import shutil
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:3000'
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))

    def open_route(path):
        page.goto(BASE + path)
        page.locator('h1').first.wait_for()

    def records():
        return page.evaluate("JSON.parse(localStorage.getItem('procureui.records.v1'))")

    for path, heading in [('/bills/unknown/edit', 'Bill not found'),
                          ('/items/unknown/edit', 'Item not found'),
                          ('/rfqs/unknown/edit', 'Request for Quote not found'),
                          ('/settings/modules/unknown/fields', 'Settings page not found')]:
        open_route(path)
        expect(page.get_by_role('heading', name=heading, exact=True)).to_be_visible()
    print('PASS unknown-ID and settings-route guards', flush=True)

    open_route('/procurement-requests')
    page.get_by_role('button', name=re.compile('PR-00001.*Office equipment')).click()
    page.get_by_role('link', name='Edit draft', exact=True).click()
    assert 'entry=procurement' in page.url
    page.get_by_role('button', name='Close editor', exact=True).click()
    page.wait_for_url('**/procurement-requests')
    print('PASS procurement editor return context', flush=True)

    open_route('/inbox')
    page.locator('input[type=file]').set_input_files({'name':'demo-invoice.pdf','mimeType':'application/pdf','buffer':b'demo metadata only'})
    page.get_by_role('link', name=re.compile('Create bill draft')).click()
    expect(page.get_by_text('filename metadata only; no file contents were imported.', exact=False)).to_be_visible()
    expect(page.get_by_label('Transaction Title', exact=True)).to_have_value('demo-invoice')
    expect(page.get_by_role('button', name='Remove demo-invoice.pdf', exact=True)).to_be_attached()
    page.get_by_role('button', name='Save as Draft', exact=True).click()
    page.wait_for_url('**/bills')
    bill_draft = next(r for r in records() if r.get('meta',{}).get('inboxFilename') == 'demo-invoice.pdf')
    assert bill_draft['status'] == 'Draft' and bill_draft['meta']['inboxId'].startswith('INBOX-')
    assert json.loads(bill_draft['meta']['draft'])['files'] == ['demo-invoice.pdf']
    print('PASS intake metadata and incomplete bill draft', flush=True)

    open_route('/vendor-credits/new')
    page.get_by_label('Select a vendor', exact=True).select_option(label='Northstar Office Supply')
    page.get_by_label('Item 1', exact=True).select_option(label='Office chair')
    page.get_by_label('Apply to Bill (optional)', exact=False).select_option('BILL-00001')
    assert page.get_by_label('Due Date', exact=True).count() == 0
    assert page.get_by_label('Terms and Conditions', exact=True).count() == 0
    page.get_by_role('button', name='Save Credit (demo)', exact=True).click()
    page.wait_for_url('**/vendor-credits')
    credit = next(r for r in records() if r['kind'] == 'vendor-credits' and r['status'] == 'Applied (demo)')
    assert credit['amount'] == 1250 and credit['meta']['appliedBillId'] == 'BILL-00001'
    open_route('/payments/new')
    page.get_by_label('Bill to Pay *', exact=False).select_option('BILL-00001')
    expect(page.get_by_label('Amount *', exact=True)).to_have_value('450')
    print('PASS credit-specific fields and remaining payment balance', flush=True)

    open_route('/batch-payments')
    page.get_by_label('Select BILL-00001', exact=True).check()
    page.get_by_role('button', name='Review batch (1)', exact=True).click()
    page.get_by_role('button', name='Prepare batch', exact=True).click()
    page.wait_for_url('**/batch-payments?record=*')
    batch = next(r for r in records() if r['kind'] == 'batch-payments')
    assert batch['amount'] == 450
    page.get_by_role('button', name='Close details', exact=True).click()
    page.get_by_label('Search demo records', exact=True).fill(batch['id'])
    page.get_by_role('link', name=re.compile(re.escape(batch['id']))).click()
    expect(page.get_by_role('dialog', name=f"{batch['id']} · Batch detail")).to_be_visible()
    print('PASS batch balances and global-search detail destination', flush=True)

    open_route('/rfqs/new')
    page.get_by_label('Title *', exact=True).fill('Local resume check')
    page.get_by_label('Description *', exact=True).fill('Fictional sourcing draft')
    page.get_by_role('button', name=re.compile('Save and Next')).click()
    expect(page.get_by_role('heading', name='Items', exact=True)).to_be_visible()
    page.reload()
    expect(page.get_by_role('heading', name='Items', exact=True)).to_be_visible()
    page.get_by_role('button', name='Add item', exact=True).click()
    expect(page.get_by_role('dialog', name='Add item', exact=True)).to_be_visible()
    page.get_by_label('Expected quantity *', exact=False).fill('123')
    expect(page.get_by_label('Expected quantity *', exact=False)).to_have_value('123')
    page.get_by_role('button', name='Cancel', exact=True).click()
    print('PASS RFQ stage resume and modal typing stability', flush=True)

    assert not errors, errors
    print('PASS no page exceptions during focused regressions', flush=True)
    browser.close()
