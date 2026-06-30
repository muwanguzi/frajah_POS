import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'franjah_pos',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function dateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

async function seed() {
  await dataSource.initialize();
  const q = dataSource.createQueryRunner();
  await q.connect();

  // ── 1. Branches ──────────────────────────────────────────────────────────
  const branches = await dataSource.query(`SELECT id, code FROM branches`);
  let mainBranchId: string = branches.find((b: any) => b.code === 'MAIN')?.id;
  if (!mainBranchId) {
    const [b] = await dataSource.query(
      `INSERT INTO branches(name,code,address,phone,is_main,is_active) VALUES('Main Branch','MAIN','Kampala Road, Kampala','+256700000000',true,true) RETURNING id`
    );
    mainBranchId = b.id;
  }

  // Second branch
  const branch2Exists = await dataSource.query(`SELECT id FROM branches WHERE code='KWL'`);
  let branch2Id: string;
  if (branch2Exists.length === 0) {
    const [b] = await dataSource.query(
      `INSERT INTO branches(name,code,address,phone,is_main,is_active) VALUES('Kawempe Branch','KWL','Kawempe, Kampala','+256701111111',false,true) RETURNING id`
    );
    branch2Id = b.id;
    console.log('Branch 2 created');
  } else {
    branch2Id = branch2Exists[0].id;
  }

  // ── 2. Users ──────────────────────────────────────────────────────────────
  const userRepo = dataSource.getRepository('users');
  const ph = await bcrypt.hash('Admin@123', 10);

  const staffToCreate = [
    { email: 'manager@franjah.com', firstName: 'Sarah', lastName: 'Namukasa', role: 'manager', branchId: mainBranchId },
    { email: 'cashier@franjah.com', firstName: 'Peter', lastName: 'Ochieng', role: 'cashier', branchId: mainBranchId },
    { email: 'cashier2@franjah.com', firstName: 'Grace', lastName: 'Akello', role: 'cashier', branchId: branch2Id },
    { email: 'storekeeper@franjah.com', firstName: 'Moses', lastName: 'Waiswa', role: 'store_keeper', branchId: mainBranchId },
    { email: 'accountant@franjah.com', firstName: 'Rebecca', lastName: 'Tendo', role: 'accountant', branchId: mainBranchId },
    { email: 'auditor@franjah.com', firstName: 'David', lastName: 'Ssebulime', role: 'auditor', branchId: mainBranchId },
  ];
  for (const u of staffToCreate) {
    const exists = await userRepo.findOne({ where: { email: u.email } });
    if (!exists) await userRepo.save({ ...u, passwordHash: ph });
  }
  console.log('Users seeded');

  // ── 3. Categories ─────────────────────────────────────────────────────────
  const catRepo = dataSource.getRepository('categories');
  const catDefs = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing & Apparel', slug: 'clothing-apparel' },
    { name: 'Food & Beverages', slug: 'food-beverages' },
    { name: 'Household', slug: 'household' },
    { name: 'Health & Beauty', slug: 'health-beauty' },
    { name: 'Stationery & Office', slug: 'stationery-office' },
    { name: 'Toys & Games', slug: 'toys-games' },
    { name: 'Sports & Fitness', slug: 'sports-fitness' },
  ];
  const catMap: Record<string, string> = {};
  for (const c of catDefs) {
    let cat = await catRepo.findOne({ where: { slug: c.slug } });
    if (!cat) cat = await catRepo.save(c);
    catMap[c.slug] = cat.id;
  }
  console.log('Categories seeded');

  // ── 4. Suppliers ──────────────────────────────────────────────────────────
  const supRepo = dataSource.getRepository('suppliers');
  const supplierDefs = [
    { name: 'Roofings Group Uganda', contactPerson: 'James Otieno', phone: '+256772100001', email: 'orders@roofings.co.ug', address: 'Jinja Road, Kampala', tinNumber: '1000112233', rating: 5, outstandingBalance: '0' },
    { name: 'Mukwano Industries', contactPerson: 'Aisha Nakato', phone: '+256772100002', email: 'supply@mukwano.com', address: 'Nalukolongo, Kampala', tinNumber: '1000223344', rating: 4, outstandingBalance: '1500000' },
    { name: 'Crown Beverages Ltd', contactPerson: 'Robert Ssali', phone: '+256772100003', email: 'sales@crownbev.co.ug', address: 'Port Bell Road, Kampala', tinNumber: '1000334455', rating: 5, outstandingBalance: '0' },
    { name: 'Uganda Breweries Ltd', contactPerson: 'Patricia Atim', phone: '+256772100004', email: 'trade@ubl.co.ug', address: 'Portbell, Kampala', tinNumber: '1000445566', rating: 4, outstandingBalance: '2800000' },
    { name: 'Uchumi Supermarket Suppliers', contactPerson: 'Kevin Lubega', phone: '+256772100005', email: 'supply@uchumi.ug', address: 'Nakawa, Kampala', tinNumber: '1000556677', rating: 3, outstandingBalance: '500000' },
    { name: 'Chandaria Industries', contactPerson: 'Priya Patel', phone: '+256772100006', email: 'info@chandaria.co.ug', address: 'Industrial Area, Kampala', tinNumber: '1000667788', rating: 4, outstandingBalance: '0' },
    { name: 'Graphic Systems Ltd', contactPerson: 'Emmanuel Mwaka', phone: '+256772100007', email: 'orders@graphicsys.ug', address: 'Ntinda, Kampala', tinNumber: '1000778899', rating: 3, outstandingBalance: '750000' },
  ];
  const supIds: string[] = [];
  for (const s of supplierDefs) {
    let sup = await supRepo.findOne({ where: { name: s.name } });
    if (!sup) sup = await supRepo.save(s);
    supIds.push(sup.id);
  }
  console.log('Suppliers seeded');

  // ── 5. Products ───────────────────────────────────────────────────────────
  const prodRepo = dataSource.getRepository('products');
  const productDefs = [
    // Electronics
    { name: 'Samsung 55" Smart TV', sku: 'ELC-001', barcode: '0001000100011', categoryId: catMap['electronics'], costPrice: '850000', sellingPrice: '1050000', vatRate: '18', currentStock: '25', reorderLevel: 5, unitOfMeasure: 'Unit' },
    { name: 'Hisense 32" LED TV', sku: 'ELC-002', barcode: '0001000100022', categoryId: catMap['electronics'], costPrice: '480000', sellingPrice: '590000', vatRate: '18', currentStock: '40', reorderLevel: 8, unitOfMeasure: 'Unit' },
    { name: 'iPhone 15 (128GB)', sku: 'ELC-003', barcode: '0001000100033', categoryId: catMap['electronics'], costPrice: '3200000', sellingPrice: '3800000', vatRate: '18', currentStock: '15', reorderLevel: 3, unitOfMeasure: 'Unit' },
    { name: 'Techno Camon 30', sku: 'ELC-004', barcode: '0001000100044', categoryId: catMap['electronics'], costPrice: '420000', sellingPrice: '520000', vatRate: '18', currentStock: '30', reorderLevel: 5, unitOfMeasure: 'Unit' },
    { name: 'Bluetooth Speaker JBL', sku: 'ELC-005', barcode: '0001000100055', categoryId: catMap['electronics'], costPrice: '95000', sellingPrice: '135000', vatRate: '18', currentStock: '60', reorderLevel: 10, unitOfMeasure: 'Unit' },
    // Food & Beverages
    { name: 'Riham Cola (500ml)', sku: 'FNB-001', barcode: '0002000100011', categoryId: catMap['food-beverages'], costPrice: '1200', sellingPrice: '2000', vatRate: '0', currentStock: '500', reorderLevel: 100, unitOfMeasure: 'Bottle' },
    { name: 'Nile Special Beer (500ml)', sku: 'FNB-002', barcode: '0002000100022', categoryId: catMap['food-beverages'], costPrice: '2500', sellingPrice: '4000', vatRate: '0', currentStock: '300', reorderLevel: 50, unitOfMeasure: 'Bottle' },
    { name: 'Blue Band Margarine 500g', sku: 'FNB-003', barcode: '0002000100033', categoryId: catMap['food-beverages'], costPrice: '4800', sellingPrice: '6500', vatRate: '0', currentStock: '150', reorderLevel: 30, unitOfMeasure: 'Pack' },
    { name: 'Mukwano Cooking Oil 5L', sku: 'FNB-004', barcode: '0002000100044', categoryId: catMap['food-beverages'], costPrice: '28000', sellingPrice: '35000', vatRate: '0', currentStock: '80', reorderLevel: 20, unitOfMeasure: 'Jerry Can' },
    { name: 'Freshpak Tea Bags 100pc', sku: 'FNB-005', barcode: '0002000100055', categoryId: catMap['food-beverages'], costPrice: '5500', sellingPrice: '8000', vatRate: '0', currentStock: '200', reorderLevel: 40, unitOfMeasure: 'Pack' },
    { name: 'Omo Washing Powder 1kg', sku: 'FNB-006', barcode: '0002000100066', categoryId: catMap['food-beverages'], costPrice: '6000', sellingPrice: '8500', vatRate: '18', currentStock: '120', reorderLevel: 30, unitOfMeasure: 'Pack' },
    // Health & Beauty
    { name: 'Nivea Body Lotion 400ml', sku: 'HNB-001', barcode: '0003000100011', categoryId: catMap['health-beauty'], costPrice: '12000', sellingPrice: '18000', vatRate: '18', currentStock: '90', reorderLevel: 20, unitOfMeasure: 'Bottle' },
    { name: 'Colgate Toothpaste 150ml', sku: 'HNB-002', barcode: '0003000100022', categoryId: catMap['health-beauty'], costPrice: '4500', sellingPrice: '7000', vatRate: '18', currentStock: '200', reorderLevel: 40, unitOfMeasure: 'Tube' },
    { name: 'Dettol Antiseptic 500ml', sku: 'HNB-003', barcode: '0003000100033', categoryId: catMap['health-beauty'], costPrice: '9000', sellingPrice: '14500', vatRate: '18', currentStock: '75', reorderLevel: 15, unitOfMeasure: 'Bottle' },
    { name: 'Always Maxi Pads 14pc', sku: 'HNB-004', barcode: '0003000100044', categoryId: catMap['health-beauty'], costPrice: '3800', sellingPrice: '6000', vatRate: '0', currentStock: '180', reorderLevel: 40, unitOfMeasure: 'Pack' },
    // Household
    { name: 'Royco Cubes (100 pack)', sku: 'HSH-001', barcode: '0004000100011', categoryId: catMap['household'], costPrice: '3500', sellingPrice: '5000', vatRate: '0', currentStock: '300', reorderLevel: 60, unitOfMeasure: 'Pack' },
    { name: 'Toilet Paper 12-Roll', sku: 'HSH-002', barcode: '0004000100022', categoryId: catMap['household'], costPrice: '8500', sellingPrice: '13000', vatRate: '18', currentStock: '100', reorderLevel: 20, unitOfMeasure: 'Pack' },
    { name: 'Sunlight Dishwashing Liquid 750ml', sku: 'HSH-003', barcode: '0004000100033', categoryId: catMap['household'], costPrice: '6500', sellingPrice: '9500', vatRate: '18', currentStock: '140', reorderLevel: 30, unitOfMeasure: 'Bottle' },
    // Stationery
    { name: 'A4 Paper Ream (500 sheets)', sku: 'STN-001', barcode: '0005000100011', categoryId: catMap['stationery-office'], costPrice: '16000', sellingPrice: '22000', vatRate: '18', currentStock: '50', reorderLevel: 10, unitOfMeasure: 'Ream' },
    { name: 'Bic Pen (12 pack)', sku: 'STN-002', barcode: '0005000100022', categoryId: catMap['stationery-office'], costPrice: '4200', sellingPrice: '7000', vatRate: '18', currentStock: '200', reorderLevel: 40, unitOfMeasure: 'Pack' },
    { name: 'Stapler Heavy Duty', sku: 'STN-003', barcode: '0005000100033', categoryId: catMap['stationery-office'], costPrice: '18000', sellingPrice: '28000', vatRate: '18', currentStock: '30', reorderLevel: 5, unitOfMeasure: 'Unit' },
    // Low stock items (for alerts)
    { name: 'USB Flash Drive 32GB', sku: 'ELC-010', barcode: '0001000100100', categoryId: catMap['electronics'], costPrice: '18000', sellingPrice: '28000', vatRate: '18', currentStock: '3', reorderLevel: 10, unitOfMeasure: 'Unit' },
    { name: 'AAA Batteries (4 pack)', sku: 'ELC-011', barcode: '0001000100101', categoryId: catMap['electronics'], costPrice: '3500', sellingPrice: '6000', vatRate: '18', currentStock: '0', reorderLevel: 20, unitOfMeasure: 'Pack' },
  ];
  const prodMap: Record<string, string> = {};
  for (const p of productDefs) {
    let prod = await prodRepo.findOne({ where: { sku: p.sku } });
    if (!prod) prod = await prodRepo.save({ ...p, isActive: true });
    prodMap[p.sku] = prod.id;
  }
  console.log('Products seeded');

  // ── 6. Product Batches + Stock Levels ─────────────────────────────────────
  const batchRepo = dataSource.getRepository('product_batches');
  const slRepo = dataSource.getRepository('stock_levels');
  let batchSeq = 0;

  for (const p of productDefs) {
    const prodId = prodMap[p.sku];
    const qty = parseInt(p.currentStock);
    if (qty <= 0) continue;

    const existing = await batchRepo.findOne({ where: { productId: prodId, branchId: mainBranchId } });
    if (!existing) {
      batchSeq++;
      const batchNumber = `BATCH-${dateStr(daysAgo(30)).replace(/-/g, '')}-${String(batchSeq).padStart(4, '0')}`;
      await batchRepo.save({
        batchNumber,
        productId: prodId,
        branchId: mainBranchId,
        quantityReceived: qty.toString(),
        quantityRemaining: qty.toString(),
        unitCost: p.costPrice,
        costingMethod: 'FIFO',
        receivedAt: daysAgo(30),
      });
    }
    const slExists = await slRepo.findOne({ where: { productId: prodId, branchId: mainBranchId } });
    if (!slExists) {
      await slRepo.save({
        productId: prodId,
        branchId: mainBranchId,
        quantityOnHand: qty.toString(),
        quantityReserved: '0',
      });
    }
  }
  console.log('Batches & stock levels seeded');

  // ── 7. Customers ──────────────────────────────────────────────────────────
  const custRepo = dataSource.getRepository('customers');
  const customerDefs = [
    { name: 'Kampala City Traders', phone: '+256772200001', email: 'orders@kct.co.ug', address: 'Nakasero, Kampala', creditLimit: '5000000', loyaltyPoints: 1200, membershipType: 'Gold' },
    { name: 'John Musinguzi', phone: '+256772200002', email: 'john.musinguzi@gmail.com', address: 'Ntinda, Kampala', creditLimit: '500000', loyaltyPoints: 340, membershipType: 'Silver' },
    { name: 'Nakato Enterprises', phone: '+256772200003', email: 'nakato.ent@yahoo.com', address: 'Wandegeya, Kampala', creditLimit: '2000000', loyaltyPoints: 870, membershipType: 'Gold' },
    { name: 'Robert Kizza', phone: '+256772200004', email: null, address: 'Mukono', creditLimit: '200000', loyaltyPoints: 50, membershipType: 'Regular' },
    { name: 'Pearl Investments Ltd', phone: '+256772200005', email: 'info@pearlinvest.ug', address: 'Kololo, Kampala', creditLimit: '10000000', loyaltyPoints: 3500, membershipType: 'Platinum' },
    { name: 'Agnes Nambi', phone: '+256772200006', email: 'agnes.nambi@gmail.com', address: 'Kireka, Kampala', creditLimit: '300000', loyaltyPoints: 120, membershipType: 'Regular' },
    { name: 'Nile Groceries', phone: '+256772200007', email: 'nile.groc@gmail.com', address: 'Jinja', creditLimit: '1500000', loyaltyPoints: 620, membershipType: 'Silver' },
    { name: 'Emmanuel Sserwanga', phone: '+256772200008', email: null, address: 'Entebbe', creditLimit: '150000', loyaltyPoints: 30, membershipType: 'Regular' },
    { name: 'Bugembe Holdings', phone: '+256772200009', email: 'info@bugembe.ug', address: 'Wakiso', creditLimit: '3000000', loyaltyPoints: 1800, membershipType: 'Gold' },
    { name: 'Fatuma Nakalanda', phone: '+256772200010', email: 'fatuma.nk@gmail.com', address: 'Bwaise, Kampala', creditLimit: '250000', loyaltyPoints: 90, membershipType: 'Regular' },
  ];
  const custIds: string[] = [];
  for (const c of customerDefs) {
    let cust = await custRepo.findOne({ where: { phone: c.phone } });
    if (!cust) cust = await custRepo.save(c);
    custIds.push(cust.id);
  }
  console.log('Customers seeded');

  // ── 8. POS Sessions + Transactions ────────────────────────────────────────
  const cashier = await dataSource.query(`SELECT id FROM users WHERE email='cashier@franjah.com'`);
  const cashierId = cashier[0]?.id;
  if (!cashierId) { console.log('Cashier not found, skipping POS data'); }
  else {
    // Create POS session for today
    const sessionExists = await dataSource.query(`SELECT id FROM pos_sessions WHERE cashier_id=$1 LIMIT 1`, [cashierId]);
    let sessionId: string;
    if (sessionExists.length === 0) {
      const [sess] = await dataSource.query(
        `INSERT INTO pos_sessions(branch_id,cashier_id,opening_cash,status,opened_at) VALUES($1,$2,'100000','OPEN',$3) RETURNING id`,
        [mainBranchId, cashierId, daysAgo(0)]
      );
      sessionId = sess.id;
    } else {
      sessionId = sessionExists[0].id;
    }

    // Create transactions for the last 30 days
    const txRepo = dataSource.getRepository('pos_transactions');
    const txItemRepo = dataSource.getRepository('pos_transaction_items');
    const payRepo = dataSource.getRepository('pos_payments');

    const salableProducts = productDefs
      .filter(p => parseInt(p.currentStock) > 0)
      .map(p => ({ id: prodMap[p.sku], price: p.sellingPrice, cost: p.costPrice, vatRate: p.vatRate }));

    let txCount = await txRepo.count();

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const txDate = daysAgo(dayOffset);
      const txsForDay = rnd(3, 12);

      for (let t = 0; t < txsForDay; t++) {
        txCount++;
        const receiptNumber = `FRJ-${txDate.toISOString().slice(0, 10).replace(/-/g, '')}-${String(txCount).padStart(4, '0')}`;

        const numItems = rnd(1, 4);
        const selectedProds = [...salableProducts].sort(() => Math.random() - 0.5).slice(0, numItems);

        let subtotal = 0;
        let taxAmount = 0;
        let cogs = 0;

        const itemLines = selectedProds.map(prod => {
          const qty = rnd(1, 5);
          const unitPrice = parseFloat(prod.price);
          const cost = parseFloat(prod.cost);
          const vatRate = parseFloat(prod.vatRate) / 100;
          const lineTotal = qty * unitPrice;
          const lineTax = vatRate > 0 ? lineTotal - lineTotal / (1 + vatRate) : 0;
          subtotal += lineTotal;
          taxAmount += lineTax;
          cogs += qty * cost;
          return { productId: prod.id, qty, unitPrice, lineTotal, cost };
        });

        const discount = Math.random() < 0.1 ? rnd(1000, 5000) : 0;
        const total = subtotal - discount;
        const payMethod = pick(['CASH', 'CASH', 'CASH', 'MOBILE_MONEY', 'MOBILE_MONEY', 'CARD']);
        const customerId = Math.random() < 0.4 ? pick(custIds) : null;

        const tx = await txRepo.save({
          receiptNumber,
          sessionId,
          branchId: mainBranchId,
          cashierId,
          customerId,
          subtotal: subtotal.toString(),
          discountAmount: discount.toString(),
          taxAmount: Math.round(taxAmount).toString(),
          total: total.toString(),
          costOfGoods: Math.round(cogs).toString(),
          status: 'COMPLETED',
          createdAt: txDate,
        });

        for (const line of itemLines) {
          await txItemRepo.save({
            transactionId: tx.id,
            productId: line.productId,
            quantity: line.qty.toString(),
            unitPrice: line.unitPrice.toString(),
            costPrice: line.cost.toString(),
            lineTotal: line.lineTotal.toString(),
          });
        }

        await payRepo.save({
          transactionId: tx.id,
          method: payMethod,
          amount: total.toString(),
        });
      }
    }
    console.log('POS transactions seeded');
  }

  // ── 9. Purchase Orders ────────────────────────────────────────────────────
  const poRepo = dataSource.getRepository('purchase_orders');
  const poItemRepo = dataSource.getRepository('purchase_order_items');
  const adminUser = await dataSource.query(`SELECT id FROM users WHERE email='admin@franjah.com'`);
  const adminId = adminUser[0]?.id;

  if (adminId) {
    const poStatuses = ['DRAFT', 'SENT', 'RECEIVED', 'RECEIVED', 'PARTIALLY_RECEIVED'];
    let poSeq = await poRepo.count();

    for (let i = 0; i < 12; i++) {
      poSeq++;
      const poDate = daysAgo(rnd(5, 60));
      const poNumber = `PO-${dateStr(poDate).replace(/-/g, '')}-${String(poSeq).padStart(4, '0')}`;
      const supplierId = pick(supIds);
      const status = pick(poStatuses);

      const numItems = rnd(2, 5);
      const poProds = [...productDefs].sort(() => Math.random() - 0.5).slice(0, numItems);

      let subtotal = 0;
      const po = await poRepo.save({
        poNumber,
        supplierId,
        branchId: mainBranchId,
        createdById: adminId,
        orderDate: dateStr(poDate),
        expectedDate: dateStr(new Date(poDate.getTime() + 7 * 86400000)),
        status,
        subtotal: '0',
        taxAmount: '0',
        total: '0',
      });

      for (const prod of poProds) {
        const qty = rnd(10, 50);
        const unitCost = Math.round(parseFloat(prod.costPrice) * 0.9);
        const lineTotal = qty * unitCost;
        subtotal += lineTotal;
        const qtyReceived = status === 'RECEIVED' ? qty : status === 'PARTIALLY_RECEIVED' ? Math.floor(qty / 2) : 0;

        await poItemRepo.save({
          purchaseOrderId: po.id,
          productId: prodMap[prod.sku],
          quantityOrdered: qty.toString(),
          quantityReceived: qtyReceived.toString(),
          unitCost: unitCost.toString(),
          lineTotal: lineTotal.toString(),
        });
      }

      await poRepo.update(po.id, {
        subtotal: subtotal.toString(),
        total: subtotal.toString(),
      });
    }
    console.log('Purchase orders seeded');
  }

  // ── 10. Expenses ──────────────────────────────────────────────────────────
  const expRepo = dataSource.getRepository('expenses');
  const expCats = await dataSource.query(`SELECT id, name FROM expense_categories`);
  const rentCat = expCats.find((c: any) => c.name === 'Rent');
  const salCat = expCats.find((c: any) => c.name === 'Salaries');
  const elecCat = expCats.find((c: any) => c.name === 'Electricity');
  const fuelCat = expCats.find((c: any) => c.name === 'Fuel');
  const miscCat = expCats.find((c: any) => c.name === 'Miscellaneous');

  let expSeq = 0;
  const mkExpNum = () => { expSeq++; return `EXP-${dateStr(new Date()).replace(/-/g, '')}-${String(expSeq).padStart(4, '0')}`; };

  const expenseDefs = [
    // Recurring monthly - 3 months back
    ...[-2, -1, 0].map(mo => {
      const d = new Date(); d.setMonth(d.getMonth() + mo, 5);
      return { expenseNumber: mkExpNum(), categoryId: rentCat?.id, amount: '2500000', description: `Monthly rent - ${d.toLocaleString('en', { month: 'long', year: 'numeric' })}`, expenseDate: dateStr(d), status: 'PAID', branchId: mainBranchId, submittedById: adminId };
    }),
    ...[-2, -1, 0].map(mo => {
      const d = new Date(); d.setMonth(d.getMonth() + mo, 28);
      return { expenseNumber: mkExpNum(), categoryId: salCat?.id, amount: '8500000', description: `Staff salaries - ${d.toLocaleString('en', { month: 'long', year: 'numeric' })}`, expenseDate: dateStr(d), status: 'PAID', branchId: mainBranchId, submittedById: adminId };
    }),
    // Utilities
    { expenseNumber: mkExpNum(), categoryId: elecCat?.id, amount: '450000', description: 'UMEME electricity bill June', expenseDate: dateStr(daysAgo(5)), status: 'PAID', branchId: mainBranchId, submittedById: adminId },
    { expenseNumber: mkExpNum(), categoryId: elecCat?.id, amount: '480000', description: 'UMEME electricity bill May', expenseDate: dateStr(daysAgo(35)), status: 'PAID', branchId: mainBranchId, submittedById: adminId },
    // Pending
    { expenseNumber: mkExpNum(), categoryId: fuelCat?.id, amount: '180000', description: 'Vehicle fuel - June', expenseDate: dateStr(daysAgo(3)), status: 'SUBMITTED', branchId: mainBranchId, submittedById: adminId },
    { expenseNumber: mkExpNum(), categoryId: miscCat?.id, amount: '95000', description: 'Office supplies purchase', expenseDate: dateStr(daysAgo(1)), status: 'SUBMITTED', branchId: mainBranchId, submittedById: adminId },
    { expenseNumber: mkExpNum(), categoryId: fuelCat?.id, amount: '220000', description: 'Delivery vehicle fuel', expenseDate: dateStr(daysAgo(2)), status: 'APPROVED', branchId: mainBranchId, submittedById: adminId },
    { expenseNumber: mkExpNum(), categoryId: miscCat?.id, amount: '75000', description: 'Shop cleaning materials', expenseDate: dateStr(daysAgo(7)), status: 'PAID', branchId: mainBranchId, submittedById: adminId },
  ];

  for (const exp of expenseDefs.filter(e => e.categoryId)) {
    const existingExp = await expRepo.findOne({ where: { description: exp.description } });
    if (!existingExp) await expRepo.save(exp);
  }
  console.log('Expenses seeded');

  // ── 11. Stock Adjustments ─────────────────────────────────────────────────
  const adjRepo = dataSource.getRepository('stock_adjustments');
  if (adminId) {
    let adjSeq = 0;
    const adjProds = [
      { sku: 'FNB-001', qty: '-5' },
      { sku: 'HNB-001', qty: '-3' },
      { sku: 'STN-001', qty: '-2' },
    ];
    for (const ap of adjProds) {
      const prodId = prodMap[ap.sku];
      if (!prodId) continue;
      const exists = await adjRepo.findOne({ where: { productId: prodId } });
      if (!exists) {
        adjSeq++;
        await adjRepo.save({
          adjustmentNumber: `ADJ-${dateStr(daysAgo(5)).replace(/-/g, '')}-${String(adjSeq).padStart(4, '0')}`,
          productId: prodId,
          branchId: mainBranchId,
          adjustedById: adminId,
          type: 'DAMAGE',
          quantity: ap.qty,
          reason: 'Damaged during delivery',
        });
      }
    }
  }
  console.log('Stock adjustments seeded');

  // ── 12. Invoices ──────────────────────────────────────────────────────────
  const invRepo = dataSource.getRepository('invoices');
  const invDefs = [
    { invoiceNumber: 'INV-20260601-0001', customerId: custIds[0], status: 'PAID', dueDate: dateStr(daysAgo(10)), total: '1750000', subtotal: '1483000', taxAmount: '267000' },
    { invoiceNumber: 'INV-20260610-0002', customerId: custIds[4], status: 'SENT', dueDate: dateStr(daysAgo(2)), total: '3200000', subtotal: '2711000', taxAmount: '489000' },
    { invoiceNumber: 'INV-20260615-0003', customerId: custIds[2], status: 'OVERDUE', dueDate: dateStr(daysAgo(15)), total: '850000', subtotal: '720000', taxAmount: '130000' },
    { invoiceNumber: 'INV-20260620-0004', customerId: custIds[6], status: 'DRAFT', dueDate: dateStr(new Date(Date.now() + 14 * 86400000)), total: '420000', subtotal: '356000', taxAmount: '64000' },
    { invoiceNumber: 'INV-20260625-0005', customerId: custIds[1], status: 'SENT', dueDate: dateStr(new Date(Date.now() + 7 * 86400000)), total: '980000', subtotal: '830000', taxAmount: '150000' },
  ];
  for (const inv of invDefs) {
    const exists = await invRepo.findOne({ where: { invoiceNumber: inv.invoiceNumber } });
    if (!exists) await invRepo.save({ ...inv, branchId: mainBranchId, createdAt: daysAgo(rnd(1, 30)) });
  }
  console.log('Invoices seeded');

  // ── 13. Quotes ────────────────────────────────────────────────────────────
  const quoteRepo = dataSource.getRepository('quotes');
  const quoteDefs = [
    { quoteNumber: 'QUO-20260620-0001', customerId: custIds[3], status: 'DRAFT', validUntil: dateStr(new Date(Date.now() + 14 * 86400000)), total: '650000' },
    { quoteNumber: 'QUO-20260622-0002', customerId: custIds[8], status: 'SENT', validUntil: dateStr(new Date(Date.now() + 7 * 86400000)), total: '2100000' },
    { quoteNumber: 'QUO-20260618-0003', customerId: custIds[0], status: 'ACCEPTED', validUntil: dateStr(daysAgo(3)), total: '890000' },
    { quoteNumber: 'QUO-20260610-0004', customerId: custIds[5], status: 'EXPIRED', validUntil: dateStr(daysAgo(10)), total: '340000' },
  ];
  for (const q of quoteDefs) {
    const exists = await quoteRepo.findOne({ where: { quoteNumber: q.quoteNumber } });
    if (!exists) await quoteRepo.save(q);
  }
  console.log('Quotes seeded');

  // ── 14. Credit Notes ──────────────────────────────────────────────────────
  const cnRepo = dataSource.getRepository('credit_notes');
  const cnDefs = [
    { cnNumber: 'CN-20260605-0001', customerId: custIds[0], amount: '150000', reason: 'Returned damaged goods', status: 'APPROVED' },
    { cnNumber: 'CN-20260618-0002', customerId: custIds[2], amount: '85000', reason: 'Overcharge correction', status: 'PENDING' },
  ];
  for (const cn of cnDefs) {
    const exists = await cnRepo.findOne({ where: { cnNumber: cn.cnNumber } });
    if (!exists) await cnRepo.save(cn);
  }
  console.log('Credit notes seeded');

  await dataSource.destroy();
  console.log('\n✅ Dummy data seeded successfully!');
}

seed().catch(err => {
  console.error('Dummy seed failed:', err.message);
  process.exit(1);
});
