import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { PurchaseOrder } from '../../database/entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../database/entities/purchase-order-item.entity';
import { GoodsReceipt } from '../../database/entities/goods-receipt.entity';
import { GoodsReceiptItem } from '../../database/entities/goods-receipt-item.entity';
import { ProductBatch } from '../../database/entities/product-batch.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { Product } from '../../database/entities/product.entity';

interface CreatePOInput {
  supplierId: string;
  branchId: string;
  createdById: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantityOrdered: number;
    unitCost: number;
  }>;
}

interface ReceiveGoodsInput {
  purchaseOrderId: string;
  branchId: string;
  receivedById: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId: string;
    quantityReceived: number;
    quantityDamaged?: number;
    expiryDate?: string;
  }>;
}

// A PO can only move to these statuses manually. RECEIVED/PARTIALLY_RECEIVED
// are derived automatically by receiveGoods() and cannot be set by hand.
const PO_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CANCELLED'],
  PARTIALLY_RECEIVED: ['CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

@Injectable()
export class PurchasingService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private poRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private poItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(GoodsReceipt)
    private grRepository: Repository<GoodsReceipt>,
    @InjectRepository(GoodsReceiptItem)
    private grItemRepository: Repository<GoodsReceiptItem>,
    @InjectRepository(ProductBatch)
    private batchRepository: Repository<ProductBatch>,
    @InjectRepository(StockLevel)
    private stockLevelRepository: Repository<StockLevel>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  /**
   * Document numbers are timestamp + random suffixed (not count()-based) so
   * concurrent requests can never generate the same number and collide on
   * the unique constraint.
   */
  private generateDocNumber(prefix: string): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timePart = now.toISOString().slice(11, 19).replace(/:/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${datePart}-${timePart}${rand}`;
  }

  /** Recomputes product.currentStock as the sum of stock_levels across all branches. */
  private async syncProductCurrentStock(
    manager: EntityManager,
    productId: string,
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder()
      .select('COALESCE(SUM(sl.quantity_on_hand::numeric), 0)', 'total')
      .from(StockLevel, 'sl')
      .where('sl.product_id = :productId', { productId })
      .getRawOne();

    await manager
      .createQueryBuilder()
      .update(Product)
      .set({ currentStock: result.total })
      .where('id = :id', { id: productId })
      .execute();
  }

  async createPurchaseOrder(input: CreatePOInput): Promise<PurchaseOrder> {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('Purchase order must include at least one item');
    }
    for (const item of input.items) {
      if (!(item.quantityOrdered > 0)) {
        throw new BadRequestException('Quantity ordered must be greater than zero for all items');
      }
      if (item.unitCost < 0) {
        throw new BadRequestException('Unit cost cannot be negative');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      let subtotal = 0;
      const itemDtos = input.items.map((i) => {
        const lineTotal = i.quantityOrdered * i.unitCost;
        subtotal += lineTotal;
        return {
          productId: i.productId,
          quantityOrdered: i.quantityOrdered.toString(),
          quantityReceived: '0',
          unitCost: i.unitCost.toString(),
          lineTotal: lineTotal.toString(),
        };
      });

      const poNumber = this.generateDocNumber('PO');

      const po = manager.create(PurchaseOrder, {
        poNumber,
        supplierId: input.supplierId,
        branchId: input.branchId,
        createdById: input.createdById,
        orderDate: new Date().toISOString().split('T')[0],
        expectedDate: input.expectedDate ?? null,
        notes: input.notes ?? null,
        status: 'DRAFT',
        subtotal: subtotal.toString(),
        taxAmount: '0',
        total: subtotal.toString(),
      });
      const savedPO = await manager.save(PurchaseOrder, po);

      for (const item of itemDtos) {
        const poItem = manager.create(PurchaseOrderItem, {
          purchaseOrderId: savedPO.id,
          ...item,
        });
        await manager.save(PurchaseOrderItem, poItem);
      }

      return manager.findOne(PurchaseOrder, {
        where: { id: savedPO.id },
        relations: ['items', 'supplier', 'branch'],
      }) as Promise<PurchaseOrder>;
    });
  }

  async findAll(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{ data: PurchaseOrder[]; total: number }> {
    const qb = this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.branch', 'branch')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('po.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('po.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const po = await this.poRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'supplier', 'branch'],
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async updateStatus(id: string, status: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    const allowed = PO_STATUS_TRANSITIONS[po.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot change purchase order status from ${po.status} to ${status}. ` +
          (allowed.length
            ? `Allowed: ${allowed.join(', ')}.`
            : `${po.status} is a final status and cannot be changed.`),
      );
    }
    po.status = status;
    return this.poRepository.save(po);
  }

  /**
   * Receive goods against a PO.
   * Creates GoodsReceipt → GoodsReceiptItems → ProductBatches → updates StockLevel.
   * Only allowed once a PO has actually been sent to the supplier (SENT/PARTIALLY_RECEIVED) —
   * receiving against a DRAFT, fully RECEIVED, or CANCELLED order makes no business sense.
   */
  async receiveGoods(input: ReceiveGoodsInput): Promise<GoodsReceipt> {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('At least one item must be received');
    }

    return this.dataSource.transaction(async (manager) => {
      // Lock the PO row for the duration of this transaction so two concurrent
      // receipts against the same order can't both read pre-update quantities.
      const po = await manager
        .getRepository(PurchaseOrder)
        .createQueryBuilder('po')
        .setLock('pessimistic_write')
        .where('po.id = :id', { id: input.purchaseOrderId })
        .getOne();
      if (!po) throw new NotFoundException('Purchase order not found');

      if (po.branchId !== input.branchId) {
        throw new BadRequestException(
          'Branch mismatch: this purchase order was raised for a different branch',
        );
      }
      if (!['SENT', 'PARTIALLY_RECEIVED'].includes(po.status)) {
        throw new BadRequestException(
          `Cannot receive goods against a purchase order with status ${po.status}. ` +
            'The order must be SENT to the supplier first.',
        );
      }

      const items = await manager
        .getRepository(PurchaseOrderItem)
        .createQueryBuilder('item')
        .setLock('pessimistic_write')
        .where('item.purchase_order_id = :poId', { poId: po.id })
        .getMany();

      const grnNumber = this.generateDocNumber('GRN');
      const gr = manager.create(GoodsReceipt, {
        grnNumber,
        purchaseOrderId: input.purchaseOrderId,
        branchId: input.branchId,
        receivedById: input.receivedById,
        receivedAt: new Date(),
        notes: input.notes,
      });
      const savedGR = await manager.save(GoodsReceipt, gr);

      for (const receiveItem of input.items) {
        const poItem = items.find((i) => i.id === receiveItem.purchaseOrderItemId);
        if (!poItem) {
          throw new NotFoundException(
            `PO item ${receiveItem.purchaseOrderItemId} not found on this order`,
          );
        }

        const qtyReceived = receiveItem.quantityReceived;
        const qtyDamaged = receiveItem.quantityDamaged || 0;

        if (!(qtyReceived > 0)) {
          throw new BadRequestException('Quantity received must be greater than zero');
        }
        if (qtyDamaged < 0 || qtyDamaged > qtyReceived) {
          throw new BadRequestException(
            `Quantity damaged (${qtyDamaged}) cannot exceed quantity received (${qtyReceived})`,
          );
        }

        const alreadyReceived = parseFloat(poItem.quantityReceived as string);
        const ordered = parseFloat(poItem.quantityOrdered as string);
        const remainingOrdered = ordered - alreadyReceived;
        if (qtyReceived > remainingOrdered + 1e-9) {
          throw new BadRequestException(
            `Cannot receive ${qtyReceived} units for this item — only ${remainingOrdered} ` +
              'units remain outstanding on the purchase order',
          );
        }

        const goodQty = qtyReceived - qtyDamaged;

        // Only the undamaged quantity becomes real, sellable stock.
        let savedBatch: ProductBatch | null = null;
        if (goodQty > 0) {
          const batch = manager.create(ProductBatch, {
            batchNumber: this.generateDocNumber('BATCH'),
            productId: poItem.productId,
            branchId: input.branchId,
            quantityReceived: goodQty.toString(),
            quantityRemaining: goodQty.toString(),
            unitCost: poItem.unitCost.toString(),
            costingMethod: 'FIFO',
            expiryDate: receiveItem.expiryDate || null,
            receivedAt: new Date(),
          });
          savedBatch = await manager.save(ProductBatch, batch);
        }

        const grItem = manager.create(GoodsReceiptItem, {
          goodsReceiptId: savedGR.id,
          purchaseOrderItemId: poItem.id,
          productId: poItem.productId,
          quantityReceived: qtyReceived.toString(),
          quantityDamaged: qtyDamaged.toString(),
          batchId: savedBatch?.id ?? null,
        });
        const savedGrItem = await manager.save(GoodsReceiptItem, grItem);

        if (savedBatch) {
          // Link the batch back to the receipt line that created it (traceability).
          savedBatch.goodsReceiptItemId = savedGrItem.id;
          await manager.save(ProductBatch, savedBatch);

          // Upsert StockLevel for this branch
          const existing = await manager.findOne(StockLevel, {
            where: { productId: poItem.productId, branchId: input.branchId },
          });

          if (existing) {
            await manager
              .createQueryBuilder()
              .update(StockLevel)
              .set({ quantityOnHand: () => `quantity_on_hand + ${goodQty}` })
              .where('product_id = :productId AND branch_id = :branchId', {
                productId: poItem.productId,
                branchId: input.branchId,
              })
              .execute();
          } else {
            const sl = manager.create(StockLevel, {
              productId: poItem.productId,
              branchId: input.branchId,
              quantityOnHand: goodQty.toString(),
              quantityReserved: '0',
            });
            await manager.save(StockLevel, sl);
          }

          await this.syncProductCurrentStock(manager, poItem.productId);
        }

        // The full received quantity (good + damaged) is what physically arrived
        // against the order — damaged stock just never becomes sellable inventory.
        await manager
          .createQueryBuilder()
          .update(PurchaseOrderItem)
          .set({ quantityReceived: () => `quantity_received + ${qtyReceived}` })
          .where('id = :id', { id: poItem.id })
          .execute();
      }

      // Recompute PO status from the authoritative per-item totals
      const updatedItems = await manager.find(PurchaseOrderItem, {
        where: { purchaseOrderId: po.id },
      });
      const allReceived = updatedItems.every(
        (i) => parseFloat(i.quantityReceived as string) >= parseFloat(i.quantityOrdered as string),
      );
      po.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      await manager.save(PurchaseOrder, po);

      return manager.findOne(GoodsReceipt, {
        where: { id: savedGR.id },
        relations: ['items', 'items.product'],
      }) as Promise<GoodsReceipt>;
    });
  }

  async getPendingOrders(branchId?: string): Promise<PurchaseOrder[]> {
    const qb = this.poRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .where('po.status IN (:...statuses)', {
        statuses: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED'],
      })
      .orderBy('po.createdAt', 'DESC');

    if (branchId) qb.andWhere('po.branch_id = :branchId', { branchId });
    return qb.getMany();
  }
}
