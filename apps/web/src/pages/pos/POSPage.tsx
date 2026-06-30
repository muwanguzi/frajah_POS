import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Search,
  Trash2,
  Plus,
  Minus,
  X,
  Printer,
  User,
  Barcode,
  LogOut,
  Clock,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePOSStore, usePOSComputations } from '@/stores/pos.store';
import { useAuthStore } from '@/stores/auth.store';
import { posService } from '@/services/pos.service';
import { productsService } from '@/services/products.service';
import { branchesService } from '@/services/branches.service';
import { formatUGX } from '@/lib/currency';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number | string;
  currentStock: number | string;
  category?: { id: string; name: string };
  unitOfMeasure: string;
}

interface ActiveSession {
  id: string;
  branchId: string;
  cashierId: string;
  openingCash: string;
  openedAt: string;
  status: string;
  branch?: { id: string; name: string };
}

const PAYMENT_METHODS = [
  { key: 'CASH',         label: 'Cash',         color: 'bg-green-600 hover:bg-green-700' },
  { key: 'MOBILE_MONEY', label: 'Mobile Money', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { key: 'CREDIT',       label: 'Credit / Bank', color: 'bg-blue-600 hover:bg-blue-700' },
];

function SessionClock({ openedAt }: { openedAt: string }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(openedAt).getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [openedAt]);
  return <span className="font-mono text-blue-200">{elapsed}</span>;
}

export default function POSPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const {
    cart, customer, discountAmount,
    setCustomer, setDiscountAmount, updateCartItem, removeFromCart, clearCart, addToCart,
  } = usePOSStore();
  const { subtotal, taxAmount, grandTotal } = usePOSComputations();

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [closeSessionOpen, setCloseSessionOpen] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountTendered, setAmountTendered] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Record<string, unknown> | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-open or resume real POS session on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        // Try to get existing open session first
        let active = await posService.getActiveSession(user.id) as ActiveSession | null;
        if (!active) {
          // Resolve branchId — use user's own branchId or fall back to first branch
          let branchId = user.branchId;
          if (!branchId) {
            const branches = await branchesService.getBranches() as Array<{ id: string }>;
            branchId = branches[0]?.id;
          }
          if (!branchId) throw new Error('No branch found for this user');
          active = await posService.openSession({
            branchId,
            cashierId: user.id,
            openingCash: 0,
          }) as ActiveSession;
        }
        setSession(active);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not open POS session';
        toast.error(msg);
      } finally {
        setSessionLoading(false);
      }
    })();
  }, [user?.id, user?.branchId]);

  // Load all active products for the grid
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['pos-all-products'],
    queryFn: () => productsService.findAll({ limit: 1000 }) as Promise<Product[]>,
    staleTime: 60_000,
    retry: false,
  });

  // Barcode/SKU lookup (for exact barcode/SKU match)
  const { data: searchResults = [] } = useQuery<Product[]>({
    queryKey: ['pos-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await posService.lookupProduct(searchQuery) as unknown;
      // lookupProduct returns a single product object when found, or null/wrapper when not found
      // Detect a real product by checking for an 'id' field (UUID)
      const product = res && typeof res === 'object' && 'id' in (res as object)
        ? (res as Product)
        : null;
      return product ? [product] : [];
    },
    enabled: searchQuery.length >= 2,
    retry: false,
  });

  // Derive unique categories from loaded products
  const categories = useMemo(() => {
    const catMap = new Map<string, string>();
    allProducts.forEach((p) => {
      if (p.category) catMap.set(p.category.id, p.category.name);
    });
    return [
      { id: 'ALL', name: 'All' },
      ...Array.from(catMap.entries()).map(([id, name]) => ({ id, name })),
    ];
  }, [allProducts]);

  // Displayed products: search results > category filter > all
  const displayProducts = useMemo(() => {
    if (searchQuery.length >= 2) {
      if (searchResults.length > 0) return searchResults;
      // Client-side fallback
      const q = searchQuery.toLowerCase();
      return allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? '').toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'ALL') {
      return allProducts.filter((p) => p.category?.id === activeCategory);
    }
    return allProducts;
  }, [allProducts, searchResults, searchQuery, activeCategory]);

  const completeSaleMutation = useMutation({
    mutationFn: (data: Parameters<typeof posService.completeSale>[0]) =>
      posService.completeSale(data),
    onSuccess: (data) => {
      setLastSale(data as Record<string, unknown>);
      setReceiptOpen(true);
      setPaymentOpen(false);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['pos-all-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Sale completed!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete sale');
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: () =>
      posService.closeSession(session!.id, Number(closingCash) || 0),
    onSuccess: () => {
      toast.success('Session closed');
      setSession(null);
      setCloseSessionOpen(false);
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close session');
    },
  });

  const handleAddToCart = (product: Product) => {
    const stock = Number(product.currentStock);
    if (stock === 0) {
      toast.error('This product is out of stock');
      return;
    }
    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: Number(product.sellingPrice),
      discountPercent: 0,
      stock,
    });
  };

  const handleBarcodeScanned = useCallback((barcode: string) => {
    setSearchQuery(barcode);
    const found = allProducts.find(
      (p) => p.sku === barcode || p.barcode === barcode
    );
    if (found) {
      handleAddToCart(found);
      setSearchQuery('');
      toast.success(`Added: ${found.name}`);
    }
  }, [allProducts]);

  useBarcodeScanner(handleBarcodeScanned, true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && cart.length > 0) {
        if (window.confirm('Clear the current cart?')) clearCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, clearCart]);

  const handleCompleteSale = () => {
    if (!session) {
      toast.error('No active POS session');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!amountTendered || Number(amountTendered) < grandTotal) {
      toast.error('Insufficient payment amount');
      return;
    }
    completeSaleMutation.mutate({
      sessionId: session.id,
      customerId: customer?.id,
      branchId: session.branchId || user?.branchId || '',
      cashierId: user?.id || '',
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })),
      discountAmount,
      payments: [{ method: paymentMethod, amount: Number(amountTendered) }],
    });
  };

  const change = Number(amountTendered) - grandTotal;

  // Loading state while session is initialising
  if (sessionLoading) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Opening POS Session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-blue-900 text-white flex items-center px-4 shrink-0 gap-4">
        <div className="flex items-center gap-2 flex-1">
          <ShoppingCart className="h-5 w-5 text-blue-300" />
          <span className="font-bold text-lg">Franjah POS</span>
          <span className="text-blue-300 text-sm ml-1">
            — {session?.branch?.name ?? 'Head Office'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-blue-700 text-blue-100 border-blue-600 text-xs">
            NEW SALE
          </Badge>
          {session && (
            <div className="flex items-center gap-1.5 text-sm text-blue-200">
              <Clock className="h-3.5 w-3.5" />
              <SessionClock openedAt={session.openedAt} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {session && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-300 hover:bg-red-900 h-8"
              onClick={() => setCloseSessionOpen(true)}
            >
              Close Session
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-blue-700 text-blue-200 hover:bg-blue-800 h-8"
            onClick={() => navigate('/dashboard')}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Exit POS
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-r">
          {/* Search Bar */}
          <div className="h-14 border-b flex items-center px-4 gap-3 bg-gray-50">
            <Barcode className="h-5 w-5 text-gray-400 shrink-0" />
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or scan barcode…"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
              Press F2 to focus
            </span>
          </div>

          {/* Category Filter */}
          <div className="h-10 border-b flex items-center px-4 gap-2 overflow-x-auto scrollbar-hide bg-white shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 xl:grid-cols-4 gap-3 content-start">
            {productsLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-xl h-28 animate-pulse"
                />
              ))
            ) : displayProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                <Search className="h-10 w-10 mb-3 text-gray-300" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              displayProducts.map((product) => {
                const stock = Number(product.currentStock);
                const outOfStock = stock === 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => !outOfStock && handleAddToCart(product)}
                    disabled={outOfStock}
                    className={cn(
                      'relative bg-white rounded-xl border p-3 text-left transition-all',
                      outOfStock
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:border-blue-400 hover:shadow-md active:scale-95'
                    )}
                  >
                    <div className="mb-2">
                      <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                    </div>
                    <p className="text-base font-bold text-blue-600">
                      {formatUGX(Number(product.sellingPrice))}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          stock <= 5
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        )}
                      >
                        {outOfStock ? 'Out of stock' : `${stock} left`}
                      </span>
                    </div>
                    {outOfStock && (
                      <div className="absolute inset-0 bg-gray-100/70 rounded-xl flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Cart Panel */}
        <div className="w-96 bg-gray-50 flex flex-col shrink-0">
          {/* Customer Section */}
          <div className="p-3 border-b bg-white">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer or walk-in…"
                className="h-8 text-sm"
              />
              {customer && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => { setCustomer(null); setCustomerSearch(''); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {customer && (
              <div className="mt-2 px-2 py-1.5 bg-blue-50 rounded-md text-xs">
                <span className="font-medium text-blue-700">{customer.name}</span>
                {customer.phone && (
                  <span className="text-blue-500 ml-2">{customer.phone}</span>
                )}
                {customer.loyaltyPoints !== undefined && (
                  <span className="text-green-600 ml-2">
                    {customer.loyaltyPoints} pts
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cart Header */}
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-semibold text-gray-800">
              Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </span>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm('Clear cart?')) clearCart();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                <ShoppingCart className="h-10 w-10 mb-3 text-gray-300" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Click a product to add it</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map((item) => (
                  <div key={item.productId} className="p-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatUGX(item.unitPrice)} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-500 shrink-0"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateCartItem(item.productId, {
                                quantity: item.quantity - 1,
                              });
                            } else {
                              removeFromCart(item.productId);
                            }
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            if (item.quantity < item.stock) {
                              updateCartItem(item.productId, {
                                quantity: item.quantity + 1,
                              });
                            } else {
                              toast.error('Cannot exceed available stock');
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {formatUGX(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Discount (UGX):
              </span>
              <Input
                type="number"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                placeholder="0"
                className="h-8 text-sm"
                min="0"
                max={subtotal}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="p-3 border-t bg-white space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatUGX(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>- {formatUGX(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>VAT (18%)</span>
              <span>{formatUGX(taxAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-lg font-bold text-gray-900">TOTAL</span>
              <span className="text-lg font-bold text-blue-700">
                {formatUGX(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="p-3 grid grid-cols-3 gap-2 border-t">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.key}
                onClick={() => {
                  if (cart.length === 0) {
                    toast.error('Cart is empty');
                    return;
                  }
                  setPaymentMethod(method.key);
                  setAmountTendered(String(Math.ceil(grandTotal)));
                  setPaymentOpen(true);
                }}
                className={cn(
                  'py-3 rounded-xl text-white text-xs font-bold transition-all active:scale-95',
                  method.color
                )}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Amount Due</p>
              <p className="text-3xl font-bold text-blue-700">
                {formatUGX(grandTotal)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPaymentMethod(m.key)}
                    className={cn(
                      'py-2 rounded-lg text-xs font-semibold border-2 transition-all',
                      paymentMethod === m.key
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Amount Tendered (UGX)
              </label>
              <Input
                type="number"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                className="text-lg font-mono h-12"
                min={grandTotal}
              />
            </div>

            {Number(amountTendered) >= grandTotal && (
              <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-gray-600">Change</span>
                <span className="text-xl font-bold text-green-600">
                  {formatUGX(change)}
                </span>
              </div>
            )}

            <Button
              className="w-full h-12 text-base"
              onClick={handleCompleteSale}
              disabled={
                !amountTendered ||
                Number(amountTendered) < grandTotal ||
                completeSaleMutation.isPending
              }
            >
              {completeSaleMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {completeSaleMutation.isPending ? 'Processing…' : 'Confirm & Print Receipt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Receipt</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="font-mono text-sm space-y-3">
              <div className="text-center border-b pb-3">
                <p className="font-bold text-base">Franjah POS</p>
                <p className="text-gray-500 text-xs">
                  {format(new Date(), 'dd MMM yyyy HH:mm')}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Receipt #{(lastSale.receiptNumber as string) ?? '—'}
                </p>
              </div>

              <div className="space-y-1 border-b pb-3">
                {cart.length === 0 && lastSale.items
                  ? (lastSale.items as Array<{ name: string; quantity: number; lineTotal: string | number }>).map(
                      (item, i) => (
                        <div key={i} className="flex justify-between gap-2">
                          <span className="truncate flex-1">{item.name}</span>
                          <span className="whitespace-nowrap">
                            {formatUGX(Number(item.lineTotal))}
                          </span>
                        </div>
                      )
                    )
                  : null}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold">
                    {formatUGX(Number(lastSale.total ?? lastSale.grandTotal ?? 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span>
                    {formatUGX(Number(lastSale.amountTendered ?? amountTendered))}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-green-600">
                  <span>Change</span>
                  <span>
                    {formatUGX(
                      Number(lastSale.changeGiven ?? lastSale.change ?? change)
                    )}
                  </span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 pt-2 border-t">
                Thank you for your purchase!
              </div>
            </div>
          )}
          <Button
            className="w-full mt-2"
            onClick={() => {
              setReceiptOpen(false);
              setLastSale(null);
              setAmountTendered('');
            }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={closeSessionOpen} onOpenChange={setCloseSessionOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Close POS Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-600">
              Enter the closing cash amount in the till before closing this session.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Closing Cash (UGX)
              </label>
              <Input
                type="number"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0"
                className="font-mono"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCloseSessionOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => closeSessionMutation.mutate()}
                disabled={closeSessionMutation.isPending}
              >
                {closeSessionMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Close Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
