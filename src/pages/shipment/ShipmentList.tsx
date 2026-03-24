import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Truck,
  Filter,
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
      CANCELLED: { variant: "danger", label: "Đã hủy", icon: Filter },
    };
    const item = config[status] || {
      variant: "default",
      label: status,
      icon: Clock,
    };
    const Icon = item.icon;

    return (
      <Badge
        variant={item.variant}
        className="px-3 py-1 font-black text-[10px] tracking-widest uppercase border-0 flex items-center gap-1.5 h-6"
      >
        <Icon size={10} strokeWidth={3} />
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
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
            Ref: {s.productionPlanId}
          </span>
        </div>
      ),
    },
    {
      header: "Điểm đến",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
            <MapPin size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-zinc-200 tracking-tight uppercase">
              {s.storeName}
            </span>
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
              Chi nhánh #{s.storeId}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Vận tải",
      cell: (s) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <User size={12} className="text-zinc-500" />
            <span className="text-[13px] font-bold text-zinc-300">
              {s.driverName || "Chưa định danh"}
            </span>
          </div>
          {s.vehicleInfo && (
            <div className="flex items-center gap-2 mt-1 opacity-60">
              <Truck size={10} className="text-zinc-500" />
              <span className="text-[10px] font-medium text-zinc-400 font-mono tracking-tighter">
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
            <Calendar size={12} className="text-zinc-500" />
            <span className="text-[11px] font-bold text-zinc-400 tracking-tight">
              {new Date(s.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1 italic">
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
              className="h-8 px-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg border border-amber-500/20 transition-all flex items-center gap-1.5"
              title="Mở link theo dõi AhaMove"
            >
              <ExternalLink size={12} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-tight">
                Chi tiết
              </span>
            </Button>
          ) : (
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic ml-2">
              Chưa có link
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Trạng thái",
      cell: (s) => getStatusBadge(s.status),
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
            className="h-10 w-10 p-0 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/5 transition-all group"
          >
            <Eye
              size={18}
              className="group-hover:scale-110 transition-transform"
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
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="orange"
              className="text-[10px] font-black tracking-widest px-2 py-0 border-0 h-4 uppercase"
            >
              VẬN CHUYỂN
            </Badge>
            <h1 className="text-3xl font-black text-zinc-100 uppercase tracking-tighter">
              Luồng vận chuyển
            </h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium tracking-wide">
            Theo dõi thời gian thực quá trình giao hàng từ{" "}
            <span className="text-amber-500/80">Kho bếp</span> tới các điểm tiêu
            thụ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasAuthority("CREATE_SHIPMENT") && (
            <Button
              onClick={() => navigate("/shipment/create")}
              className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase text-xs tracking-widest px-8 h-12 shadow-xl shadow-amber-900/20 border-0 flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={3} /> Tạo đơn mới
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-zinc-900/40 p-1.5 rounded-[28px] border border-zinc-800/50 flex flex-col xl:flex-row gap-4 items-center">
        <div className="flex items-center gap-1.5 flex-1 w-full overflow-x-auto p-1 custom-scrollbar">
          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "px-5 py-3 rounded-[22px] flex items-center gap-2.5 transition-all text-[11px] font-black uppercase tracking-widest shrink-0 whitespace-nowrap",
                  isActive
                    ? "bg-amber-500 text-black shadow-lg shadow-amber-900/20"
                    : "bg-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50",
                )}
              >
                <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="h-10 w-[1px] bg-zinc-800 hidden xl:block"></div>

        <div className="relative w-full xl:w-96 p-1">
          <Search
            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600"
            size={18}
          />
          <Input
            placeholder="TÌM KIẾM THEO MÃ VẬN ĐƠN..."
            className="pl-14 pr-6 h-12 bg-zinc-950/50 border-zinc-800/50 rounded-[22px] font-black text-[10px] tracking-[0.2em] placeholder:text-zinc-700 focus:border-amber-500/30 transition-all uppercase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-900/40 rounded-[40px] border border-zinc-800/50 overflow-hidden shadow-2xl">
        <DataTable
          data={shipments}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(s) => String(s.shipmentId)}
          onRowClick={(s) => setSelectedShipment(s)}
          emptyMessage={
            <div className="py-24 flex flex-col items-center gap-6 opacity-30">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                <Truck size={40} className="text-zinc-600" />
              </div>
              <span className="text-sm font-black text-zinc-600 uppercase tracking-[0.2em]">
                Không có dữ liệu vận chuyển
              </span>
            </div>
          }
        />

        {/* Pagination Sidebar-style at bottom */}
        <div className="p-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase"
                >
                  {i}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">
              Trang {page + 1} của {totalPages || 1}
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl px-6 h-12 uppercase text-[10px] font-black tracking-widest flex items-center gap-2 hover:bg-zinc-900"
            >
              <ChevronLeft size={16} /> Trang trước
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl px-6 h-12 uppercase text-[10px] font-black tracking-widest flex items-center gap-2 hover:bg-zinc-900"
            >
              Trang tiếp <ChevronRight size={16} />
            </Button>
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
