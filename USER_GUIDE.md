# Franjah POS — User Guide

A point-of-sale and business management system for retail businesses in Uganda. Tracks sales, inventory (with batch-level costing), purchasing, expenses, and financial reports across one or more branches. All amounts are in Ugandan Shillings (UGX).

---

## 1. Getting Started

### 1.1 Logging In

1. Open the app in your browser (the web address is provided by your administrator).
2. Enter your email and password, then click **Sign In**.
3. If your account has two-factor authentication enabled, you'll be asked for a one-time code from your authenticator app before you reach the dashboard.

### 1.2 Demo Accounts

If you're exploring a freshly seeded copy of the system, the following accounts are available (all share the password **`Admin@123`**):

| Email | Role |
|---|---|
| admin@franjah.com | Administrator |
| manager@franjah.com | Manager |
| cashier@franjah.com | Cashier (Main Branch) |
| cashier2@franjah.com | Cashier (second branch) |
| storekeeper@franjah.com | Store Keeper |
| accountant@franjah.com | Accountant |
| auditor@franjah.com | Auditor |

Change these passwords before using the system with real data.

### 1.3 Roles

The system has six roles, each seeing a different slice of the menu:

| Role | What they typically do |
|---|---|
| **Admin** | Full access, including Users, Branches, Audit Logs, and Settings |
| **Manager** | Runs day-to-day operations: POS, purchasing, inventory, sales, expenses, reports |
| **Cashier** | POS Terminal and Sales Overview only |
| **Store Keeper** | Products, inventory, purchasing/receiving, batches |
| **Accountant** | Accounting, expenses, reports |
| **Auditor** | Read-only access to reports and audit logs |

The sidebar automatically hides sections you don't have access to. The **Admin** section (Users, Branches, Audit Logs, Settings) is only visible to Administrators.

---

## 2. Finding Your Way Around

The left sidebar is organized into five groups:

- **Main** — Dashboard, POS Terminal, Sales Overview
- **Inventory** — Products, Categories, Stock & Inventory, Purchasing, Batch Tracking
- **People** — Customers, Suppliers
- **Finance** — Accounting, Expenses, Reports
- **Admin** *(admins only)* — Users, Branches, Audit Logs, Settings

Click the collapse arrow at the bottom of the sidebar to shrink it to icons-only if you need more screen space.

---

## 3. Dashboard

Your landing page after login. Shows, for the selected period:

- Sales today / this week / this month / this year
- Gross profit and net profit
- Inventory value, total products, low-stock and out-of-stock counts
- Pending purchase orders
- A revenue-vs-cost chart (last 12 months)
- Alerts for low stock, out-of-stock items, and purchase orders awaiting action

Use the refresh button to pull the latest numbers without reloading the page.

---

## 4. Point of Sale (POS Terminal)

This is the cashier's main screen — it opens full-screen without the sidebar.

### 4.1 Opening a Session

The first time you open the POS Terminal in a day, the system automatically opens a session for you (or resumes one that's already open), recording your opening cash float. You must have an open session before you can ring up a sale.

### 4.2 Making a Sale

1. **Find products** — type into the search box (matches name or SKU) or scan a barcode. Click a product card or category tab to filter.
2. **Build the cart** — click a product to add it; adjust quantity and per-line discount directly in the cart panel.
3. **Apply an order-level discount** if needed.
4. Pick a **customer** (optional — defaults to walk-in).
5. Click **Charge** / **Confirm & Print Receipt**, choose a payment method (Cash, Mobile Money, or Credit/Bank), enter the amount tendered, and confirm. Change due is calculated automatically.

Behind the scenes, stock is deducted from the oldest (or otherwise configured) batch first, so your cost-of-goods figures stay accurate even when the same product was bought at different prices over time.

### 4.3 Closing a Session

Click **Close Session** in the header, enter your closing cash count, and confirm. This ends your shift; you'll need to start a new session next time you use the POS.

### 4.4 Voiding a Sale

A completed sale can be voided (by Admin/Manager) from the transaction record. Voiding restores the stock to the correct batches and branch, and marks the sale as **Voided** rather than deleting it — so it stays in your records for audit purposes, but is excluded from revenue figures in reports and the dashboard.

---

## 5. Products & Categories

### 5.1 Products

**Products** lists everything you sell, with stock, cost price, and selling price. From here you can:

- **Add a new product** — name, SKU, barcode, category, unit of measure, cost/selling price, VAT rate, reorder level.
- **Edit** an existing product, or view its detail page (stock, batches, sale history).
- **Search** by name or SKU (case-insensitive).

### 5.2 Categories

Organize products into categories (e.g. Beverages, Household, Stationery). Categories are used for filtering in the POS and in reports.

---

## 6. Purchasing

This is how new stock enters the system. The flow is intentionally sequential — each step has to happen in order:

```
Create PO (Draft) → Send to Supplier → Receive Goods → Stock & Batches Updated
```

### 6.1 Creating a Purchase Order

1. Go to **Purchasing → Purchase Orders → New Order**.
2. Pick a supplier, an expected delivery date, and add products with quantities and unit costs (search by name or SKU to add a line).
3. Save — the order is created in **Draft** status. Nothing is received yet.

### 6.2 Sending the Order

Open the order's detail page and click **Send to Supplier**. This moves it from Draft to **Sent** — only orders in this state (or already Partially Received) can have goods received against them.

### 6.3 Receiving Goods

1. Go to **Purchasing → Goods Receipt**. Only orders that have been sent appear in this list.
2. Click **Receive Goods** on the relevant order.
3. For each line, enter the quantity actually received and, if any arrived damaged, the damaged quantity. Damaged stock is recorded but doesn't get added to sellable inventory.
4. Confirm. This creates a stock batch at your branch (with the order's unit cost), updates stock levels, and recalculates the order's status:
   - **Partially Received** if some items are still outstanding
   - **Received** once every line is fully accounted for

You can't receive more than the remaining ordered quantity on any line, and you can't receive goods against an order that's still in Draft — it has to be sent first.

### 6.4 Cancelling an Order

From the order detail page, **Cancel Order** is available for Draft, Sent, or Partially Received orders.

### 6.5 Batch Tracking

**Purchasing → Batch Tracking** shows every stock batch — quantity received, quantity remaining, unit cost, and which goods receipt it came from. This is the basis for accurate cost-of-goods and margin reporting, since each batch keeps its own purchase cost even as prices change over time.

---

## 7. Inventory

**Stock & Inventory** shows current stock levels per branch, with low-stock indicators. From here:

- **Adjustments** — correct stock counts (e.g. after a stocktake finds a discrepancy, or to record breakage/loss) with a reason.
- **Transfers** — move stock from one branch to another.
- **Stock Count** — record a full or partial physical count and reconcile it against system records.

---

## 8. Customers & Suppliers

- **Customers** — contact details, credit limit, loyalty points, and purchase history. Add a customer here so they can be selected at the POS.
- **Suppliers** — contact details, payment terms, and order history. Required before you can raise a purchase order.

---

## 9. Sales

**Sales Overview** is your transaction history: every completed (and voided) sale, with cashier, payment method, totals, and date filters (today / this week / this month / custom range). Use it to look up a past receipt or check daily totals.

> Sales Orders, Quotes, Invoices, Delivery Notes, and Credit Notes also appear under Sales for viewing records created via the API/integrations. Creating new ones directly from these screens is not yet available in this version — use the POS Terminal for normal sales.

---

## 10. Expenses

1. Go to **Expenses → New Expense**, choose a category, enter the amount and a description, and submit.
2. A Manager or Admin reviews submitted expenses and **approves** or **rejects** them (a reason is recorded for rejections).
3. Only approved/paid expenses count toward your profit & loss and dashboard figures.

---

## 11. Accounting

- **Accounting** — overview hub linking to the sections below.
- **General Ledger** — your chart of accounts and balances (view-only).
- **Cashbook** — cash movement records.
- **VAT Report** — VAT collected on sales vs. VAT paid on purchases for a period.
- **Bank Reconciliation** — not yet available in this version (shown as "Coming Soon" in the app).

---

## 12. Reports

Found under **Reports**, each with a date-range filter:

- **Sales Report** — total sales, transaction count, average order value, gross profit, tax collected, discounts given, and top-selling products.
- **Inventory Report** — stock on hand, reserved, available, and total stock value per product.
- **Profit & Loss** — full income statement: revenue, discounts, tax, cost of goods sold, gross profit, operating expenses, net profit, with margin percentages.
- **Expenses Report** — expenses broken down by category.

Voided sales are automatically excluded from all revenue and profit figures.

---

## 13. Administration *(Admin only)*

- **Users** — create staff accounts and assign roles and branches.
- **Branches** — manage your business locations.
- **Audit Logs** — a record of who did what and when, for accountability.
- **Settings** — system-wide configuration (e.g. default costing method, currency, receipt numbering).

---

## 14. Troubleshooting

| Problem | What to check |
|---|---|
| Can't search for a product | Search matches name or SKU and is not case-sensitive — try a shorter term. |
| "At least one item must have a received quantity" when receiving goods | Make sure the purchase order has been **Sent** (not still Draft), and that the items list loaded — refresh the Goods Receipt page if it looks empty. |
| Can't receive goods against an order | The order must be in **Sent** or **Partially Received** status. Draft, fully Received, or Cancelled orders can't accept new receipts. |
| "Quantity damaged cannot exceed quantity received" | The damaged amount you entered is larger than the received amount on that line — fix the numbers and resubmit. |
| Sale total looks wrong after voiding | Voided sales are intentionally excluded from sales/profit reports but still show in Sales Overview marked **Voided**, for your audit trail. |

---

*This guide reflects the features currently implemented in Franjah POS. Some areas (Sales document creation in the UI, Bank Reconciliation) are flagged above as not yet available and will be added in future updates.*
