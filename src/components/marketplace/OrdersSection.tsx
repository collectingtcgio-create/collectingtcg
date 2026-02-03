import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  User,
  Loader2,
  XCircle,
  MessageCircle,
  ChevronRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useOrders, type Order, type OrderStatus } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: { 
    label: 'Pending Payment', 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    icon: <Clock className="w-3 h-3" />
  },
  paid: { 
    label: 'Paid', 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    icon: <DollarSign className="w-3 h-3" />
  },
  shipped: { 
    label: 'Shipped', 
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    icon: <Truck className="w-3 h-3" />
  },
  delivered: { 
    label: 'Delivered', 
    color: 'bg-green-500/20 text-green-400 border-green-500/50',
    icon: <CheckCircle2 className="w-3 h-3" />
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-destructive/20 text-destructive border-destructive/50',
    icon: <XCircle className="w-3 h-3" />
  },
  refunded: { 
    label: 'Refunded', 
    color: 'bg-muted text-muted-foreground border-muted',
    icon: <DollarSign className="w-3 h-3" />
  },
};

export function OrdersSection() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { orders, isLoading, updateOrderStatus } = useOrders({
    role: activeTab === 'buying' ? 'buyer' : 'seller',
  });

  const handleUpdateStatus = (orderId: string, status: OrderStatus, trackingNumber?: string) => {
    updateOrderStatus.mutate({ orderId, status, trackingNumber });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 bg-background/50">
          <TabsTrigger value="buying">Buying</TabsTrigger>
          <TabsTrigger value="selling">Selling</TabsTrigger>
        </TabsList>

        <TabsContent value="buying" className="mt-4">
          <OrdersList 
            orders={orders}
            role="buyer"
            currentUserId={profile?.id}
            onViewDetails={(order) => {
              setSelectedOrder(order);
              setDetailModalOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="selling" className="mt-4">
          <OrdersList 
            orders={orders}
            role="seller"
            currentUserId={profile?.id}
            onViewDetails={(order) => {
              setSelectedOrder(order);
              setDetailModalOpen(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={updateOrderStatus.isPending}
          />
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        currentUserId={profile?.id}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updateOrderStatus.isPending}
      />
    </div>
  );
}

interface OrdersListProps {
  orders: Order[];
  role: 'buyer' | 'seller';
  currentUserId: string | undefined;
  onViewDetails: (order: Order) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus, trackingNumber?: string) => void;
  isUpdating?: boolean;
}

function OrdersList({ orders, role, currentUserId, onViewDetails, onUpdateStatus, isUpdating }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No orders yet</p>
        <p className="text-sm mt-1">
          {role === 'buyer' 
            ? 'Orders will appear here when your offers are accepted' 
            : 'Orders will appear here when you accept offers'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard 
          key={order.id} 
          order={order} 
          role={role}
          currentUserId={currentUserId}
          onViewDetails={() => onViewDetails(order)}
          onUpdateStatus={onUpdateStatus}
          isUpdating={isUpdating}
        />
      ))}
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  role: 'buyer' | 'seller';
  currentUserId: string | undefined;
  onViewDetails: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus, trackingNumber?: string) => void;
  isUpdating?: boolean;
}

function OrderCard({ order, role, currentUserId, onViewDetails, onUpdateStatus, isUpdating }: OrderCardProps) {
  const statusInfo = statusConfig[order.status as OrderStatus] || statusConfig.pending_payment;
  const otherParty = role === 'buyer' ? order.seller : order.buyer;

  return (
    <Card 
      className="bg-background/50 border-border hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onViewDetails}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Image */}
          {order.listing?.image_url ? (
            <img
              src={order.listing.image_url}
              alt={order.listing.card_name}
              className="w-14 h-18 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-18 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {order.listing?.card_name || 'Unknown Item'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={otherParty?.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="w-2 h-2" />
                    </AvatarFallback>
                  </Avatar>
                  <span>{role === 'buyer' ? 'Seller:' : 'Buyer:'} {otherParty?.username || 'Unknown'}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Badge className={cn("border", statusInfo.color)} variant="outline">
                  {statusInfo.icon}
                  <span className="ml-1">{statusInfo.label}</span>
                </Badge>
                <div className="flex items-center text-foreground font-bold">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {order.amount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string | undefined;
  onUpdateStatus: (orderId: string, status: OrderStatus, trackingNumber?: string) => void;
  isUpdating: boolean;
}

function OrderDetailModal({ order, open, onOpenChange, currentUserId, onUpdateStatus, isUpdating }: OrderDetailModalProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  
  if (!order) return null;

  const isBuyer = order.buyer_id === currentUserId;
  const isSeller = order.seller_id === currentUserId;
  const statusInfo = statusConfig[order.status as OrderStatus];
  const otherParty = isBuyer ? order.seller : order.buyer;

  const handleMarkShipped = () => {
    onUpdateStatus(order.id, 'shipped', trackingNumber || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Order Details
          </DialogTitle>
          <DialogDescription className="sr-only">
            View and manage order details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge className={cn("border", statusInfo.color)} variant="outline">
              {statusInfo.icon}
              <span className="ml-1">{statusInfo.label}</span>
            </Badge>
          </div>

          {/* Item */}
          <div className="bg-background/50 rounded-xl p-4">
            <div className="flex gap-3">
              {order.listing?.image_url ? (
                <img
                  src={order.listing.image_url}
                  alt={order.listing.card_name}
                  className="w-16 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-foreground">
                  {order.listing?.card_name || 'Unknown Item'}
                </h3>
                {order.listing?.tcg_game && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {order.listing.tcg_game.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <div className="flex items-center gap-1">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-xl font-bold text-foreground">
                {order.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Other Party */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{isBuyer ? 'Seller' : 'Buyer'}</span>
            <Link 
              to={`/profile/${otherParty?.id}`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={otherParty?.avatar_url || ''} />
                <AvatarFallback>
                  <User className="w-3 h-3" />
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground">{otherParty?.username || 'Unknown'}</span>
            </Link>
          </div>

          {/* Tracking Number */}
          {order.tracking_number && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tracking</span>
              <span className="text-foreground font-mono">{order.tracking_number}</span>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {order.paid_at && (
              <div className="flex justify-between">
                <span>Paid</span>
                <span>{format(new Date(order.paid_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            {order.shipped_at && (
              <div className="flex justify-between">
                <span>Shipped</span>
                <span>{format(new Date(order.shipped_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            {order.delivered_at && (
              <div className="flex justify-between">
                <span>Delivered</span>
                <span>{format(new Date(order.delivered_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
          </div>

          {/* Seller Actions */}
          {isSeller && order.status === 'pending_payment' && (
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => onUpdateStatus(order.id, 'paid')}
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                Mark as Paid
              </Button>
            </div>
          )}

          {isSeller && order.status === 'paid' && (
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Tracking Number (optional)</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="bg-background/50"
                />
              </div>
              <Button
                onClick={handleMarkShipped}
                disabled={isUpdating}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                Mark as Shipped
              </Button>
            </div>
          )}

          {/* Buyer Actions */}
          {isBuyer && order.status === 'shipped' && (
            <div className="pt-2">
              <Button
                onClick={() => onUpdateStatus(order.id, 'delivered')}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Confirm Delivered
              </Button>
            </div>
          )}

          {/* Message Button */}
          <Button variant="outline" className="w-full" asChild>
            <Link to="/messages">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message {isBuyer ? 'Seller' : 'Buyer'}
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
