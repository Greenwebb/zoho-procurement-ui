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
    page.get_by_role('link', name=re.compile('PR-00001.*Office equipment')).click()
    page.get_by_role('link', name='Edit', exact=True).click()
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
    expect(page.get_by_label('Select a vendor', exact=True)).to_have_value('VEND-001')
    print('PASS credit-specific fields and remaining payment balance', flush=True)

    open_route('/batch-payments')
    page.get_by_label('Select BILL-00001', exact=True).check()
    page.get_by_role('button', name='Review batch (1)', exact=True).click()
    page.get_by_role('button', name='Prepare batch', exact=True).click()
    page.wait_for_url('**/batch-payments/BATCH-*')
    batch = next(r for r in records() if r['kind'] == 'batch-payments')
    assert batch['amount'] == 450
    expect(page.get_by_role('heading', name=batch['title'], exact=True)).to_be_visible()
    open_route('/batch-payments')
    page.get_by_label('Search demo records', exact=True).fill(batch['id'])
    page.get_by_role('link', name=re.compile('^' + re.escape(batch['id']) + r'\s')).click()
    expect(page.get_by_role('heading', name=batch['title'], exact=True)).to_be_visible()
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

    bill_before_edit = next(r for r in records() if r['id'] == 'BILL-00001')
    open_route('/bills/BILL-00001')
    expect(page.get_by_role('heading', name='Office supplies', exact=True)).to_be_visible()
    page.get_by_role('link', name='Edit', exact=True).click()
    expect(page.get_by_label('Transaction Title', exact=True)).to_have_value('Office supplies')
    page.get_by_role('button', name='Save as Draft', exact=True).click()
    page.wait_for_url('**/bills')
    edited_bill = next(r for r in records() if r['id'] == 'BILL-00001')
    assert edited_bill['amount'] == 1700 and edited_bill['status'] == bill_before_edit['status']
    print('PASS bill detail→edit preserves posted amount and status', flush=True)

    open_route('/vendors/VEND-001')
    for tab in ['Overview', 'Comments', 'Transactions', 'Mails', 'Statement']:
        expect(page.get_by_role('tab', name=re.compile(tab))).to_be_visible()
    page.get_by_role('tab', name='Comments').click()
    page.get_by_role('button', name='Underline', exact=True).click()
    page.get_by_placeholder('Write a comment for this local demo vendor…').fill('Formatting stays local')
    page.get_by_role('button', name='Add Comment', exact=True).click()
    vendor = next(r for r in records() if r['id'] == 'VEND-001')
    assert json.loads(vendor['meta']['comments'])[-1]['format'] == 'underline'
    page.get_by_role('tab', name='Transactions').click()
    po_vendor_row = page.get_by_role('link', name='PO-00001', exact=True)
    expect(po_vendor_row).to_be_visible()
    po_vendor_row.click()
    assert 'fromVendor=VEND-001' in page.url and 'vendorTab=transactions' in page.url
    expect(page.get_by_role('link', name='Purchase Order', exact=True)).to_have_attribute('href', '/vendors/VEND-001/transactions')
    page.get_by_role('link', name='Edit', exact=True).click()
    assert 'fromVendor=VEND-001' in page.url and 'vendorTab=transactions' in page.url
    page.get_by_role('button', name='Close editor', exact=True).click()
    page.wait_for_url('**/vendors/VEND-001/transactions')
    page.get_by_role('tab', name='Statement').click()
    page.get_by_label('Statement filter by', exact=True).select_option('bills')
    expect(page.get_by_text('BILL-00001', exact=True)).to_be_visible()
    print('PASS vendor full detail tabs, linked transactions, local comments, and statement filters', flush=True)

    open_route('/purchase-orders/PO-00001/edit')
    vendor_select = page.get_by_label('Select a vendor', exact=True)
    expect(vendor_select).to_have_value('VEND-001')
    vendor_select.select_option('VEND-002')
    page.get_by_role('button', name='Save as Draft', exact=True).click()
    page.wait_for_url('**/purchase-orders')
    changed_order = next(r for r in records() if r['id'] == 'PO-00001')
    assert changed_order['party'] == 'Copperline Technology'
    assert changed_order['meta']['vendorId'] == 'VEND-002'
    open_route('/vendors/VEND-001/transactions')
    expect(page.get_by_role('link', name='PO-00001', exact=True)).to_have_count(0)
    open_route('/vendors/VEND-002/transactions')
    expect(page.get_by_role('link', name='PO-00001', exact=True)).to_be_visible()
    page.get_by_role('link', name='PO-00001', exact=True).click()
    assert 'fromVendor=VEND-002' in page.url
    page.get_by_role('link', name='Edit', exact=True).click()
    assert 'fromVendor=VEND-002' in page.url
    page.get_by_role('button', name='Close editor', exact=True).click()
    page.wait_for_url('**/vendors/VEND-002/transactions')
    open_route('/purchase-orders/new?vendor=VEND-001')
    expect(page.get_by_label('Select a vendor', exact=True)).to_have_value('VEND-001')
    page.get_by_label('Select a vendor', exact=True).select_option('VEND-003')
    page.get_by_label('Transaction Title', exact=True).fill('Prefilled vendor switch')
    page.get_by_role('button', name='Save as Draft', exact=True).click()
    page.wait_for_url('**/vendors/VEND-001/transactions')
    switched_order = next(r for r in records() if r['title'] == 'Prefilled vendor switch')
    assert switched_order['party'] == 'Atlas Industrial Supplies'
    assert switched_order['meta']['vendorId'] == 'VEND-003'
    print('PASS stable vendor IDs and vendor-tab return context across view/edit', flush=True)

    page.evaluate("""() => {
      const key = 'procureui.records.v1';
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      data.push({ id: 'PAY-ROW-TEST', kind: 'payments', title: 'Test vendor payment',
        party: 'Copperline Technology', date: '2026-10-16', amount: 321,
        status: 'Draft', meta: { vendorId: 'VEND-002', reference: 'PAYREF-42',
          paymentMode: 'Cash', unusedAmount: '25' } });
      localStorage.setItem(key, JSON.stringify(data));
    }""")
    open_route('/vendors/VEND-002/transactions')
    page.get_by_label('Go to transactions', exact=True).select_option('payments')
    payment_row = page.get_by_role('row').filter(has=page.get_by_role('link', name='PAY-ROW-TEST', exact=True))
    expect(payment_row.get_by_role('cell').nth(2)).to_have_text('PAYREF-42')
    expect(payment_row.get_by_role('cell').nth(3)).to_have_text('Cash')
    expect(payment_row.get_by_role('cell').nth(4)).to_contain_text('321')
    expect(payment_row.get_by_role('cell').nth(5)).to_contain_text('25')
    print('PASS vendor payment detail columns map reference, mode, paid, and unused amount', flush=True)

    open_route('/bills/new?vendor=VEND-001')
    expect(page.get_by_label('Select a vendor', exact=True)).to_have_value('VEND-001')
    page.get_by_role('link', name=re.compile('Add a vendor')).click()
    assert '/vendors/new?returnTo=' in page.url
    page.get_by_label('Display Name *', exact=True).fill('Caller Return Vendor')
    page.get_by_role('button', name='Save vendor', exact=True).click()
    page.wait_for_url('**/bills/new?vendor=VEND-001')
    assert any(r['title'] == 'Caller Return Vendor' and r['kind'] == 'vendors' for r in records())
    page.get_by_role('link', name=re.compile('Add a vendor')).click()
    page.get_by_role('link', name='Cancel', exact=True).click()
    page.wait_for_url('**/bills/new?vendor=VEND-001')
    page.get_by_role('button', name='Close editor', exact=True).click()
    page.wait_for_url('**/vendors/VEND-001/transactions')
    print('PASS add-vendor save/cancel returns to the originating transaction draft', flush=True)

    open_route('/vendors/VEND-001')
    page.get_by_role('tab', name='Overview').click()
    page.get_by_role('button', name='Add Bank Account', exact=True).click()
    page.get_by_label('Account Holder Name', exact=True).fill('Demo Holder')
    page.get_by_label('Bank Name', exact=True).fill('Preview Bank')
    page.get_by_label('Account Number', exact=True).fill('12345678')
    page.get_by_label('Re-enter Account Number', exact=True).fill('12345678')
    page.get_by_role('button', name='Save masked label only', exact=True).click()
    vendor = next(r for r in records() if r['id'] == 'VEND-001')
    banks = json.loads(vendor['meta']['bankAccounts'])
    assert '12345678' not in json.dumps(banks) and banks[0]['masked'].endswith('5678')
    page.get_by_role('button', name='Edit bank Preview Bank', exact=True).click()
    page.get_by_label('Bank Name', exact=True).fill('Updated Preview Bank')
    page.get_by_role('button', name='Update masked label only', exact=True).click()
    page.get_by_role('button', name='Remove bank Updated Preview Bank', exact=True).click()
    page.get_by_role('button', name='Delete local record', exact=True).click()
    vendor = next(r for r in records() if r['id'] == 'VEND-001')
    assert json.loads(vendor['meta']['bankAccounts']) == []
    print('PASS nested bank add/edit/delete stores masked labels only', flush=True)

    page.get_by_role('button', name='More', exact=True).click()
    page.get_by_role('menuitem', name='Clone Vendor', exact=True).click()
    clone_id = page.url.split('/vendors/')[1].split('/')[0].split('?')[0]
    assert clone_id != 'VEND-001'
    page.get_by_role('button', name='More', exact=True).click()
    page.get_by_role('menuitem', name='Delete Vendor', exact=True).click()
    page.get_by_role('button', name='Delete local record', exact=True).click()
    page.wait_for_url('**/vendors')
    assert all(r['id'] != clone_id for r in records())
    print('PASS vendor clone and confirmed local delete', flush=True)

    open_route('/vendors/VEND-001/edit')
    for tab in ['Other Details', 'Address', 'Contact Persons', 'Bank Details', 'Custom Fields', 'Reporting Tags', 'Remarks']:
        expect(page.get_by_role('tab', name=tab, exact=True)).to_be_visible()
    page.get_by_role('tab', name='Address', exact=True).click()
    expect(page.get_by_role('heading', name='Billing Address', exact=True)).to_be_visible()
    expect(page.get_by_role('heading', name='Shipping Address', exact=True)).to_be_visible()
    page.get_by_role('tab', name='Contact Persons', exact=True).click()
    page.get_by_role('button', name='Add Contact Person', exact=True).click()
    page.get_by_label('firstName for contact person', exact=True).fill('Local Contact')
    page.get_by_role('button', name='Remove contact person', exact=True).click()
    page.get_by_role('tab', name='Bank Details', exact=True).click()
    expect(page.get_by_text('Bank account details are added from the Vendor Overview page', exact=False)).to_be_visible()
    page.get_by_role('tab', name='Custom Fields', exact=True).click()
    page.get_by_role('button', name='Add Field', exact=True).click()
    page.get_by_label('Field Name', exact=True).fill('Demo ID')
    page.get_by_label('Value', exact=True).fill('Local only')
    page.get_by_role('button', name='Remove custom field', exact=True).click()
    page.get_by_role('tab', name='Reporting Tags', exact=True).click()
    page.get_by_label('Add Reporting Tag', exact=True).fill('Demo Region')
    page.get_by_role('button', name='Add tag', exact=True).click()
    page.get_by_role('button', name='Remove tag Demo Region', exact=True).click()
    page.get_by_role('tab', name='Remarks', exact=True).click()
    expect(page.get_by_label('Remarks (For Internal Use)', exact=True)).to_be_visible()
    print('PASS vendor edit tabs and nested local form controls', flush=True)

    open_route('/items/ITEM-001')
    for tab in ['Overview', 'Transactions', 'History']:
        expect(page.get_by_role('tab', name=tab, exact=True)).to_be_visible()
    page.get_by_role('tab', name='Transactions', exact=True).click()
    page.get_by_label('Item transaction status', exact=True).select_option('Draft')
    expect(page.get_by_role('link', name='PO-00001', exact=True)).to_be_visible()
    print('PASS item detail tabs, stable related-item IDs, and status filter', flush=True)

    open_route(f"/batch-payments/{batch['id']}")
    page.get_by_role('link', name='Edit', exact=True).click()
    expect(page.get_by_role('heading', name='Edit prepared batch', exact=True)).to_be_visible()
    page.get_by_role('button', name='Save changes locally', exact=True).click()
    page.wait_for_url(f"**/batch-payments/{batch['id']}")
    updated_batch = next(r for r in records() if r['id'] == batch['id'])
    assert updated_batch['amount'] == 450
    print('PASS prepared batch full detail→edit route', flush=True)
    open_route('/batch-payments')
    expect(page.get_by_role('link', name=f'View batch {batch["id"]}', exact=True)).to_be_visible()
    expect(page.get_by_role('link', name=f'Edit batch {batch["id"]}', exact=True)).to_be_visible()
    page.get_by_role('button', name=f'Delete batch {batch["id"]}', exact=True).click()
    expect(page.get_by_role('dialog', name='Delete prepared batch?')).to_be_visible()
    page.get_by_role('button', name='Cancel', exact=True).click()
    page.get_by_role('button', name=f'Delete batch {batch["id"]}', exact=True).click()
    page.get_by_role('button', name='Delete local record', exact=True).click()
    assert all(r['id'] != batch['id'] for r in records())
    assert any(r['id'] == 'BILL-00001' for r in records())
    print('PASS prepared batch list exposes View/Edit/Delete with non-cascading local confirmation', flush=True)

    assert not errors, errors
    print('PASS no page exceptions during focused regressions', flush=True)
    browser.close()
