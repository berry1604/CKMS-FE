import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Truck,
  Eye,
  Plus,
  Search,
  Calendar,
  MapPin,
  User,
  Package,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { shipmentApi } from "../../services/shipment.api";
import type { ShipmentResponse, ShipmentStatus } from "../../types/shipment";
import { ShipmentDetailDrawer } from "./ShipmentDetailDrawer";
import { toast } from "react-hot-toast";
import { cn } from "../../utils/classNames";
import { useAuth } from "../../hooks/useAuth";

type FilterStatus = "all" | ShipmentStatus;

export const ShipmentList = () => {
  const { hasAuthority } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as unknown as { state?: { autoCreate?: boolean } }; 
  const [shipments, setShipments] = useState<ShipmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] =
    useState<ShipmentResponse | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchShipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, size: 10, sort: "shipmentId,desc" };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const res = await shipmentApi.getShipments(params);
      setShipments(res.content || []);
      setTotalPages(res.totalPages || 0);
      setIsLoading(false);
    } catch (error) {
      toast.error("Không thể tải danh sách vận chuyển");
      console.error(error);
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Handle auto-create from Allocation Matrix
  useEffect(() => {
    if (location.state?.autoCreate) {
      navigate("/shipment/create", {
        state: location.state,
        replace: true, // Replace current entry so back button works correctly
      });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const handleStatusAction = async (
    id: number,
    action: "prepare" | "transit" | "confirm" | "cancel",
    data?: unknown,
  ) => {
    // Find current shipment to check status
    const currentShipment =
      shipments.find((s) => s.shipmentId === id) || selectedShipment;
    if (!currentShipment) return;

    console.log(
      `[Shipment Action] Attempting ${action} for Shipment #${id}. Current Status: ${currentShipment.status}`,
    );

    try {
      switch (action) {
        case "prepare":
          if (currentShipment.status !== "PENDING") {
            return toast.error(
              `Không thể chuẩn bị hàng khi trạng thái là ${currentShipment.status}`,
            );
          }
          await shipmentApi.prepareShipment(id);
          toast.success("Đã chuẩn bị xong hàng");
          break;
        case "transit":
          if (currentShipment.status !== "PREPARED") {
            return toast.error(
              `Không thể xuất kho khi trạng thái là ${currentShipment.status}`,
            );
          }
          await shipmentApi.startTransit(id);
          toast.success("Đơn hàng đang được vận chuyển");
          break;
        case "confirm":
          if (currentShipment.status !== "IN_TRANSIT") {
            return toast.error(
              `Không thể xác nhận nhận hàng khi trạng thái là ${currentShipment.status}`,
            );
          }
          await shipmentApi.confirmDelivery(id, data as any);
          toast.success("Đã xác nhận giao hàng");
          break;
        case "cancel": {
          if (["DELIVERED", "CANCELLED"].includes(currentShipment.status)) {
            return toast.error(
              `Không thể hủy đơn hàng khi trạng thái là ${currentShipment.status}`,
            );
          }
          const reason = prompt("Lý do hủy (tùy chọn):");
          await shipmentApi.cancelShipment(id, reason || undefined);
          toast.success("Đã hủy đơn vận chuyển");
          break;
        }
      }

      // Refetch this specific shipment to update the drawer
      try {
        const updatedShipment = await shipmentApi.getShipmentById(id);
        setSelectedShipment(updatedShipment);
      } catch (err) {
        console.error(err);
        // If single fetch fails, close drawer as fallback
        if (action === "cancel") setSelectedShipment(null);
      }

      // Refresh the entire list in background
      fetchShipments();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        `Không thể thực hiện thao tác ${action}`;
      toast.error(message);
      console.error(`[Shipment Action Error] ${message}`, error);

      // Still refresh to ensure UI is in sync
      fetchShipments();
      // Refetch selection if possible to fix local state
      shipmentApi
        .getShipmentById(id)
        .then(setSelectedShipment)
        .catch(() => {});
    }
  };

  const handleRefresh = async (id: number) => {
    try {
      const updatedShipment = await shipmentApi.getShipmentById(id);
      setSelectedShipment(updatedShipment);
      fetchShipments();
      toast.success("Đã làm mới dữ liệu");
    } catch (error) {
      toast.error("Không thể làm mới dữ liệu");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        variant:
          | "orange"
          | "info"
          | "primary"
          | "warning"
          | "success"
          | "danger"
          | "default";
        label: string;
        icon: any;
      }
    > = {
      PENDING: { variant: "orange", label: "Chờ chuẩn bị", icon: Plus },
      PREPARED: { variant: "info", label: "Đã chuẩn bị", icon: Package },
      IN_TRANSIT: { variant: "primary", label: "Đang giao", icon: Truck },
      ARRIVED: { variant: "warning", label: "Đã đến", icon: MapPin },
      DELIVERED: { variant: "success", label: "Hoàn tất", icon: CheckCircle2 },
      CANCELLED: { variant: "danger", label: "Đã hủy", icon: XCircle },
    };
    const item = config[status] || {
      variant: "default",
      label: status,
      icon: Clock,
    };
    const isCancelled = status === "CANCELLED";
    const Icon = item.icon;

    return (
      <Badge
        variant={item.variant}
        className={cn(
          "px-4 py-1.5 font-black text-[9px] tracking-[0.15em] uppercase border-0 flex items-center gap-2 h-7 rounded-lg shadow-sm",
          isCancelled && "animate-pulse shadow-lg shadow-red-900/20"
        )}
      >
        <Icon size={12} strokeWidth={3} />
        {item.label}
      </Badge>
    );
  };

  const columns: Column<ShipmentResponse>[] = [
    {
      header: "Mã vận đơn",
      cell: (s) => (
        <div className="flex flex-col">
          <span className="font-mono text-[13px] font-black text-amber-500 tracking-tighter">
            #{s.shipmentId}
          </span>
          <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mt-1">
            Ref: {s.planId || s.productionPlanId}
          </span>
        </div>
      ),
    },
    {
      header: "Điểm đến",
      cell: (s) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-root)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner group-hover/row:text-amber-500 transition-colors">
            <MapPin size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-[var(--text-primary)] tracking-tight uppercase group-hover/row:text-amber-500 transition-colors">
              {s.storeName}
            </span>
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-tighter">
              Chi nhánh #{s.storeId}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Vận tải",
      cell: (s) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--bg-card)] flex items-center justify-center">
                <User size={10} className="text-[var(--text-secondary)]" />
            </div>
            <span className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-tight">
              {s.driverName || "Chưa định danh"}
            </span>
          </div>
          {s.vehicleInfo && (
            <div className="flex items-center gap-2 pl-1 opacity-60">
              <Truck size={10} className="text-[var(--text-secondary)]" />
              <span className="text-[9px] font-black text-[var(--text-secondary)] font-mono tracking-tighter uppercase">
                {s.vehicleInfo}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Thời gian",
      cell: (s) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-[var(--text-secondary)]" />
            <span className="text-[11px] font-black text-[var(--text-secondary)] tracking-tight uppercase">
              {new Date(s.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mt-1.5 italic">
            {new Date(s.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Theo dõi",
      cell: (s) => (
        <div className="flex items-center gap-2">
          {s.trackingLink ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(s.trackingLink, "_blank");
              }}
              className="h-10 px-5 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-black rounded-xl border border-amber-500/20 transition-all flex items-center gap-2"
              title="Mở link theo dõi AhaMove"
            >
              <ExternalLink size={14} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Real-time
              </span>
            </Button>
          ) : (
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] italic ml-2 opacity-50">
              Chưa có link
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Trạng thái",
      cell: (s) => (
        <div className="flex flex-col gap-2">
          {getStatusBadge(s.status)}
          {s.status === "CANCELLED" && (s.remarks || s.note) && (
            <div className="flex items-center gap-1.5 text-[9px] text-red-500/70 font-black italic max-w-[150px] truncate uppercase tracking-tighter" title={s.remarks || s.note}>
              <AlertTriangle size={10} />
              {s.remarks || s.note}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Hành động",
      className: "text-right",
      cell: (s) => (
        <div className="flex justify-end pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedShipment(s)}
            className="h-12 w-12 p-0 rounded-2xl bg-[var(--bg-root)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5 transition-all group/btn shadow-lg"
          >
            <Eye
              size={20}
              className="group-hover/btn:scale-110 transition-transform"
            />
          </Button>
        </div>
      ),
    },
  ];

  const statusOptions: { value: FilterStatus; label: string; icon: any }[] = [
    { value: "all", label: "Tất cả", icon: Package },
    { value: "PENDING", label: "Chờ chuẩn bị", icon: Plus },
    { value: "PREPARED", label: "Đã chuẩn bị", icon: Package },
    { value: "IN_TRANSIT", label: "Đang giao", icon: Truck },
    { value: "DELIVERED", label: "Đã giao", icon: MapPin },
    { value: "CANCELLED", label: "Đã hủy", icon: Clock },
  ];

    return (
        <div className="min-h-screen bg-[var(--bg-root)] pb-20">
            {/* Cinematic Header */}
            <div className="relative h-[380px] w-full overflow-hidden group/header">
                <div className="absolute inset-0 bg-[var(--bg-root)]">
                    <img
                        src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?q=80&w=2070&auto=format&fit=crop"
                        className="w-full h-full object-cover opacity-40 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
                        alt="Logistics Fleet"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-root)] via-[var(--bg-root)]/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-root)] via-transparent to-[var(--bg-root)]"></div>
                </div>

                <div className="absolute inset-0 flex flex-col justify-end px-8 pb-12 max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge variant="orange" className="text-[10px] font-black tracking-[0.3em] px-3 py-1 border-0 uppercase bg-amber-500/10 text-amber-500">
                           FLEET MANAGEMENT
                        </Badge>
                        <div className="h-px w-12 bg-amber-500/30" />
                        <span className="text-amber-500/80 font-black tracking-[0.2em] text-[10px] uppercase italic">Real-time Logistics</span>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <h1 className="text-6xl font-black text-[var(--text-primary)] tracking-tighter mb-4 uppercase italic leading-[0.85]">
                                Shipment <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Pipeline</span>
                            </h1>
                            <p className="text-zinc-400 max-w-xl text-sm font-bold leading-relaxed uppercase tracking-wide opacity-80">
                                Theo dõi thời gian thực quá trình giao hàng từ <span className="text-amber-500">Kho bếp</span> tới các điểm tiêu thụ. Tối ưu hóa lộ trình vận tải.
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                             {hasAuthority("CREATE_SHIPMENT") && (
                                <Button
                                    onClick={() => navigate("/shipment/create")}
                                    className="h-16 px-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-[0_20px_50px_-10px_rgba(245,158,11,0.4)] border-0 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                                >
                                    <Plus size={20} strokeWidth={4} /> Tạo đơn mới
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 -mt-10 relative z-10 space-y-8">
                {/* Filters Bar */}
                <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
                    
                    <div className="flex flex-col xl:flex-row gap-6 items-center relative z-10">
                        <div className="flex items-center gap-2 flex-1 w-full overflow-x-auto p-1 custom-scrollbar">
                            {statusOptions.map((opt) => {
                                const Icon = opt.icon;
                                const isActive = statusFilter === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setStatusFilter(opt.value)}
                                        className={cn(
                                            "px-6 py-3 rounded-[20px] flex items-center gap-3 transition-all text-[10px] font-black uppercase tracking-widest shrink-0 whitespace-nowrap border",
                                            isActive
                                                ? "bg-amber-500 border-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.2)]"
                                                : "bg-transparent border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/50 hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="h-10 w-[1px] bg-[var(--border-primary)] hidden xl:block"></div>

                        <div className="relative w-full xl:w-96 p-1 group/search">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within/search:scale-110">
                                <Search className="text-[var(--text-secondary)] group-focus-within/search:text-amber-500 transition-colors" size={20} />
                            </div>
                            <Input
                                placeholder="TÌM KIẾM THEO MÃ VẬN ĐƠN..."
                                className="pl-14 pr-6 h-14 bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-[2rem] text-[var(--text-primary)] font-black text-[11px] tracking-widest uppercase placeholder:text-[var(--text-secondary)]/50 focus:border-amber-500/40 transition-all duration-300 hover:bg-[var(--bg-root)]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Table Container */}
                <div className="backdrop-blur-3xl bg-[var(--bg-card)]/40 border border-[var(--border-primary)] rounded-[3rem] overflow-hidden shadow-2xl">
        <DataTable
          data={shipments}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(s) => String(s.shipmentId)}
          onRowClick={(s) => setSelectedShipment(s)}
          emptyMessage={
            <div className="py-24 flex flex-col items-center gap-6 opacity-30">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center">
                <Truck size={40} className="text-[var(--text-secondary)]" />
              </div>
              <span className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                Không có dữ liệu vận chuyển
              </span>
            </div>
          }
        />

                    {/* Pagination */}
                    <div className="p-8 border-t border-[var(--border-primary)] bg-[var(--bg-card)]/60 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full border-2 border-[var(--bg-root)] bg-[var(--bg-card)] flex items-center justify-center text-[11px] font-black text-[var(--text-secondary)] uppercase shadow-lg"
                                    >
                                        {i.toString().padStart(2, '0')}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                                Trang <span className="text-amber-500">{(page + 1).toString().padStart(2, '0')}</span> của {(totalPages || 1).toString().padStart(2, '0')}
                            </span>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={page === 0 || isLoading}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                className="bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl px-8 h-12 uppercase text-[10px] font-black tracking-widest flex items-center gap-2 hover:bg-[var(--bg-card)] transition-all disabled:opacity-20 text-[var(--text-secondary)]"
                            >
                                <ChevronLeft size={16} /> Trang trước
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={page >= totalPages - 1 || isLoading}
                                onClick={() => setPage((p) => p + 1)}
                                className="bg-[var(--bg-root)]/50 border border-[var(--border-primary)] rounded-2xl px-8 h-12 uppercase text-[10px] font-black tracking-widest flex items-center gap-2 hover:bg-[var(--bg-card)] transition-all disabled:opacity-20 text-[var(--text-secondary)]"
                            >
                                Trang tiếp <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

      <ShipmentDetailDrawer
        shipment={selectedShipment}
        isOpen={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onStatusAction={handleStatusAction}
        onRefresh={handleRefresh}
      />
    </div>
  );
};
