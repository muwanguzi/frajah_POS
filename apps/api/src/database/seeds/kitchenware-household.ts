import 'reflect-metadata';
import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'franjah_pos',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  const catRepo  = dataSource.getRepository('categories');
  const prodRepo = dataSource.getRepository('products');
  const batchRepo = dataSource.getRepository('product_batches');
  const slRepo   = dataSource.getRepository('stock_levels');

  // ── Get / create categories ────────────────────────────────────────────────
  const categories = [
    { name: 'Kitchenware',     slug: 'kitchenware' },
    { name: 'Household',       slug: 'household'   },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    let cat = await catRepo.findOne({ where: { slug: c.slug } });
    if (!cat) cat = await catRepo.save(c);
    catMap[c.slug] = cat.id;
  }

  // ── Get main branch ────────────────────────────────────────────────────────
  const [{ id: mainBranchId }] = await dataSource.query(
    `SELECT id FROM branches WHERE name = 'Main Branch' LIMIT 1`,
  );

  console.log('Branch:', mainBranchId);

  // ── Product definitions ────────────────────────────────────────────────────
  const products = [
    // ── Kitchenware ──────────────────────────────────────────────────────────
    { sku: 'KWR-001', barcode: '0006000100011', name: 'Non-Stick Frying Pan 24cm',         category: 'kitchenware', cost: '35000',  price: '55000',  stock: 60, reorder: 10, uom: 'Unit'  },
    { sku: 'KWR-002', barcode: '0006000100022', name: 'Pressure Cooker 5L',                category: 'kitchenware', cost: '55000',  price: '85000',  stock: 30, reorder: 5,  uom: 'Unit'  },
    { sku: 'KWR-003', barcode: '0006000100033', name: 'Electric Kettle 1.8L',              category: 'kitchenware', cost: '28000',  price: '45000',  stock: 45, reorder: 8,  uom: 'Unit'  },
    { sku: 'KWR-004', barcode: '0006000100044', name: 'Wooden Cooking Spoon Set (3pc)',    category: 'kitchenware', cost: '8000',   price: '14000',  stock: 120,reorder: 20, uom: 'Set'   },
    { sku: 'KWR-005', barcode: '0006000100055', name: 'Stainless Steel Saucepan Set (3pc)',category: 'kitchenware', cost: '65000',  price: '98000',  stock: 25, reorder: 5,  uom: 'Set'   },
    { sku: 'KWR-006', barcode: '0006000100066', name: 'Casserole Dish with Lid 3L',       category: 'kitchenware', cost: '22000',  price: '35000',  stock: 40, reorder: 8,  uom: 'Unit'  },
    { sku: 'KWR-007', barcode: '0006000100077', name: 'Electric Blender 1.5L',            category: 'kitchenware', cost: '45000',  price: '72000',  stock: 35, reorder: 6,  uom: 'Unit'  },
    { sku: 'KWR-008', barcode: '0006000100088', name: 'Chopping Board (Large Plastic)',   category: 'kitchenware', cost: '12000',  price: '20000',  stock: 80, reorder: 15, uom: 'Unit'  },
    { sku: 'KWR-009', barcode: '0006000100099', name: 'Kitchen Knife Set (5pc)',          category: 'kitchenware', cost: '25000',  price: '42000',  stock: 50, reorder: 10, uom: 'Set'   },
    { sku: 'KWR-010', barcode: '0006000100110', name: 'Stainless Steel Colander',        category: 'kitchenware', cost: '15000',  price: '25000',  stock: 55, reorder: 10, uom: 'Unit'  },
    { sku: 'KWR-011', barcode: '0006000100111', name: 'Mixing Bowls Set (3pc)',           category: 'kitchenware', cost: '18000',  price: '28000',  stock: 60, reorder: 12, uom: 'Set'   },
    { sku: 'KWR-012', barcode: '0006000100122', name: 'Thermos Flask 1L',                category: 'kitchenware', cost: '20000',  price: '35000',  stock: 70, reorder: 15, uom: 'Unit'  },
    { sku: 'KWR-013', barcode: '0006000100133', name: 'Electric Rice Cooker 1.8L',       category: 'kitchenware', cost: '55000',  price: '85000',  stock: 25, reorder: 5,  uom: 'Unit'  },
    { sku: 'KWR-014', barcode: '0006000100144', name: 'Water Dispenser Bottle 20L',      category: 'kitchenware', cost: '18000',  price: '28000',  stock: 40, reorder: 8,  uom: 'Unit'  },
    { sku: 'KWR-015', barcode: '0006000100155', name: 'Serving Tray (Aluminium)',        category: 'kitchenware', cost: '12000',  price: '20000',  stock: 50, reorder: 10, uom: 'Unit'  },
    { sku: 'KWR-016', barcode: '0006000100166', name: 'Plate Set Melamine (6pc)',        category: 'kitchenware', cost: '22000',  price: '35000',  stock: 40, reorder: 8,  uom: 'Set'   },
    { sku: 'KWR-017', barcode: '0006000100177', name: 'Drinking Glass Set (6pc)',        category: 'kitchenware', cost: '18000',  price: '28000',  stock: 55, reorder: 10, uom: 'Set'   },
    { sku: 'KWR-018', barcode: '0006000100188', name: 'Sauce Pot 2L with Lid',           category: 'kitchenware', cost: '25000',  price: '40000',  stock: 35, reorder: 6,  uom: 'Unit'  },
    { sku: 'KWR-019', barcode: '0006000100199', name: 'Oven Mitts (Pair)',               category: 'kitchenware', cost: '8000',   price: '14000',  stock: 90, reorder: 20, uom: 'Pair'  },
    { sku: 'KWR-020', barcode: '0006000100200', name: 'Can Opener Steel',               category: 'kitchenware', cost: '6000',   price: '11000',  stock: 100,reorder: 20, uom: 'Unit'  },

    // ── Household ─────────────────────────────────────────────────────────────
    { sku: 'HSH-010', barcode: '0004000100100', name: 'Mop & Bucket Set',               category: 'household', cost: '22000',  price: '35000',  stock: 40, reorder: 8,  uom: 'Set'   },
    { sku: 'HSH-011', barcode: '0004000100111', name: 'Laundry Basket (Large)',         category: 'household', cost: '18000',  price: '28000',  stock: 50, reorder: 10, uom: 'Unit'  },
    { sku: 'HSH-012', barcode: '0004000100122', name: 'Broom & Dustpan Set',           category: 'household', cost: '12000',  price: '20000',  stock: 60, reorder: 12, uom: 'Set'   },
    { sku: 'HSH-013', barcode: '0004000100133', name: 'Plastic Storage Containers (3pc)', category: 'household', cost: '15000', price: '24000', stock: 70, reorder: 15, uom: 'Set'   },
    { sku: 'HSH-014', barcode: '0004000100144', name: 'Anti-Slip Floor Mat 60x90cm',   category: 'household', cost: '18000',  price: '28000',  stock: 45, reorder: 8,  uom: 'Unit'  },
    { sku: 'HSH-015', barcode: '0004000100155', name: 'Curtain Set (2 Panels 1.5x2.5m)',category: 'household', cost: '35000', price: '55000',  stock: 30, reorder: 5,  uom: 'Set'   },
    { sku: 'HSH-016', barcode: '0004000100166', name: 'Bed Sheet Set King Size',       category: 'household', cost: '45000',  price: '70000',  stock: 35, reorder: 6,  uom: 'Set'   },
    { sku: 'HSH-017', barcode: '0004000100177', name: 'Pillow Case Set (2pc)',         category: 'household', cost: '15000',  price: '24000',  stock: 60, reorder: 12, uom: 'Set'   },
    { sku: 'HSH-018', barcode: '0004000100188', name: 'Mosquito Net (Double Bed)',     category: 'household', cost: '25000',  price: '40000',  stock: 50, reorder: 10, uom: 'Unit'  },
    { sku: 'HSH-019', barcode: '0004000100199', name: 'Clothes Hanger Set (10pc)',    category: 'household', cost: '8000',   price: '14000',  stock: 100,reorder: 20, uom: 'Pack'  },
    { sku: 'HSH-020', barcode: '0004000100200', name: 'Dust Bin 20L with Lid',        category: 'household', cost: '12000',  price: '20000',  stock: 55, reorder: 10, uom: 'Unit'  },
    { sku: 'HSH-021', barcode: '0004000100211', name: 'Jerry Can 20L (Yellow)',       category: 'household', cost: '15000',  price: '25000',  stock: 80, reorder: 15, uom: 'Unit'  },
    { sku: 'HSH-022', barcode: '0004000100222', name: 'Washing Basin (Large 25L)',    category: 'household', cost: '10000',  price: '18000',  stock: 70, reorder: 15, uom: 'Unit'  },
    { sku: 'HSH-023', barcode: '0004000100233', name: 'Wax Candles Pack (12pc)',      category: 'household', cost: '5000',   price: '9000',   stock: 200,reorder: 40, uom: 'Pack'  },
    { sku: 'HSH-024', barcode: '0004000100244', name: 'Extension Socket 4-Way 2m',   category: 'household', cost: '18000',  price: '28000',  stock: 65, reorder: 12, uom: 'Unit'  },
    { sku: 'HSH-025', barcode: '0004000100255', name: 'Clothesline Rope 10m',        category: 'household', cost: '4000',   price: '7500',   stock: 120,reorder: 25, uom: 'Roll'  },
    { sku: 'HSH-026', barcode: '0004000100266', name: 'Iron Box (Dry)',               category: 'household', cost: '28000',  price: '45000',  stock: 40, reorder: 8,  uom: 'Unit'  },
    { sku: 'HSH-027', barcode: '0004000100277', name: 'Bathroom Toilet Brush Set',   category: 'household', cost: '8000',   price: '14000',  stock: 80, reorder: 15, uom: 'Set'   },
    { sku: 'HSH-028', barcode: '0004000100288', name: 'Padlock (Medium)',             category: 'household', cost: '12000',  price: '20000',  stock: 60, reorder: 12, uom: 'Unit'  },
    { sku: 'HSH-029', barcode: '0004000100299', name: 'Wall Clock (Round 30cm)',     category: 'household', cost: '22000',  price: '35000',  stock: 30, reorder: 5,  uom: 'Unit'  },
    { sku: 'HSH-030', barcode: '0004000100300', name: 'Plastic Chairs (Stackable)',  category: 'household', cost: '18000',  price: '28000',  stock: 50, reorder: 10, uom: 'Unit'  },
  ];

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    let prod = await prodRepo.findOne({ where: { sku: p.sku } });
    const isNew = !prod;

    if (!prod) {
      prod = await prodRepo.save({
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        categoryId: catMap[p.category],
        costPrice: p.cost,
        sellingPrice: p.price,
        vatRate: '18',
        currentStock: String(p.stock),
        reorderLevel: p.reorder,
        unitOfMeasure: p.uom,
        isActive: true,
        costingMethod: 'FIFO',
      });
    }

    // Create a batch if none exists yet for this product
    const batchExists = await batchRepo.findOne({ where: { productId: prod.id } });
    if (!batchExists) {
      const receivedAt = new Date();
      receivedAt.setDate(receivedAt.getDate() - Math.floor(Math.random() * 30));

      await batchRepo.save({
        batchNumber: `BATCH-${p.sku}-01`,
        productId: prod.id,
        branchId: mainBranchId,
        quantityReceived: String(p.stock),
        quantityRemaining: String(p.stock),
        unitCost: p.cost,
        costingMethod: 'FIFO',
        receivedAt,
      });
    }

    // Create stock level if missing
    const slExists = await slRepo.findOne({
      where: { productId: prod.id, branchId: mainBranchId },
    });
    if (!slExists) {
      await slRepo.save({
        productId: prod.id,
        branchId: mainBranchId,
        quantityOnHand: String(p.stock),
        quantityReserved: '0',
      });
    }

    if (isNew) {
      created++;
      console.log(`✓ ${p.sku} — ${p.name}`);
    } else {
      skipped++;
    }
  }

  await dataSource.destroy();
  console.log(`\nDone! Created: ${created}, Skipped (already exist): ${skipped}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
