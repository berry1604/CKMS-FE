import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Search,
  Package,
  ChevronRight,
  Layers,
  Clock,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import type {
  StoreStockItemResponse,
  StoreStockBatchResponse,
} from "../../types/storeInventory";
import { storeInventoryApi } from "../../services/storeInventory.api";
import { toast } from "react-hot-toast";
import {
  UNIT_LABELS,
  STOCK_STATUS_LABELS,
} from "../../utils/statusTranslations";
import { cn } from "../../utils/classNames";

interface StoreInventoryProps {
  storeId?: number;
}

export const StoreInventory: React.FC<StoreInventoryProps> = ({ storeId }) => {
  const [inventory, setInventory] = useState<StoreStockItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Batch detail drawer
  const [selectedProduct, setSelectedProduct] =
    useState<StoreStockItemResponse | null>(null);
  const [batches, setBatches] = useState<StoreStockBatchResponse[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await storeInventoryApi.getStoreInventory({
        name: searchQuery || undefined,
        page: currentPage,
        size: pageSize,
        storeId: storeId,
      });
      const pageData = response.data || {};
      setInventory(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách tồn kho");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, storeId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const handleViewBatches = async (item: StoreStockItemResponse) => {
    setSelectedProduct(item);
    setIsBatchLoading(true);
    try {
      const response = await storeInventoryApi.getProductBatches(
        item.productId,
        storeId,
      );
      setBatches(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết lô hàng");
    } finally {
      setIsBatchLoading(false);
    }
  };

  const closeBatchDrawer = () => {
    setSelectedProduct(null);
    setBatches([]);
  };

  const isExpiringSoon = (dateStr: string) => {
    const expiryDate = new Date(dateStr);
    const now = new Date();
    const diffDays =
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays >= 0;
  };

  const isExpired = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const translateUnit = (unit: string) => {
    return UNIT_LABELS[unit] || unit;
  };

  const translateStatus = (status: string) => {
    return STOCK_STATUS_LABELS[status] || status;
  };

  const columns: Column<StoreStockItemResponse>[] = [
    {
      header: "Sản phẩm",
      cell: (row) => (
        <div className="flex items-center gap-4 group/item transition-all duration-300">
          <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 border border-amber-500/20 group-hover/item:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Package size={20} />
          </div>
          <div>
            <p className="font-bold text-zinc-100 group-hover/item:text-white transition-colors uppercase tracking-tight">
              {row.productName}
            </p>
            <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">
              Mã SP: {row.productId}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "",
      cell: (row) => (
        <button
          onClick={() => handleViewBatches(row)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-zinc-400 hover:bg-amber-500/10 hover:text-amber-500 border border-transparent hover:border-amber-500/20 transition-all font-bold text-[11px] uppercase tracking-widest"
        >
          Chi tiết lô{" "}
          <ChevronRight
            size={14}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      ),
    },
  ];

  // Calculate statistics
  const totalItems = totalElements;
  const lowStockItems = inventory.filter(
    (item) => item.totalQuantity <= 10,
  ).length;
  const expiringSoonItems = inventory.filter((item) => {
    if (!item.nearestExpiryDate) return false;
    return isExpiringSoon(item.nearestExpiryDate);
  }).length;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Cinematic Header Section */}
      <div className="relative h-[250px] -mx-4 -mt-8 mb-12 overflow-hidden group/header">
        <div className="absolute inset-0 bg-zinc-950">
          <img
            src="/src/assets/luxury_steakhouse_bg.png"
            alt="Inventory Header"
            className="w-full h-full object-cover opacity-40 scale-105 group-hover/header:scale-110 transition-transform duration-[3s] ease-out shadow-inner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950"></div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-10 pb-12 max-w-[1600px] mx-auto w-full">
          <div className="space-y-4 animate-in slide-in-from-left-8 duration-1000 delay-100">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                  Hệ thống Quản lý Kho
                </span>
              </div>
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">
              Tồn kho{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
                Cửa hàng
              </span>
            </h1>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest max-w-xl leading-relaxed opacity-80">
              Giám sát sản phẩm, số lượng và hạn sử dụng thời gian thực tại điểm
              kinh doanh.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-20 relative z-20 px-2">
        {[
          {
            label: "Tổng sản phẩm",
            value: totalItems,
            icon: Package,
            color: "blue",
            desc: "Các loại sản phẩm hiện có",
          },
          {
            label: "Tồn kho thấp",
            value: lowStockItems,
            icon: AlertTriangle,
            color: "red",
            desc: "Mặt hàng dưới 10 đơn vị",
            highlight: lowStockItems > 0,
          },
          {
            label: "Hàng sắp hết hạn",
            value: expiringSoonItems,
            icon: Clock,
            color: "amber",
            desc: "Hết hạn trong 7 ngày tới",
            highlight: expiringSoonItems > 0,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={cn(
              "p-8 rounded-[32px] border transition-all duration-500 group/card relative overflow-hidden",
              "bg-zinc-900/60 backdrop-blur-xl border-zinc-800/50 hover:border-zinc-700/80 shadow-2xl",
              stat.highlight && `ring-1 ring-${stat.color}-500/30`,
            )}
          >
            <div
              className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full opacity-10 group-hover/card:opacity-20 transition-opacity",
                stat.color === "blue"
                  ? "bg-blue-500"
                  : stat.color === "red"
                    ? "bg-red-500"
                    : "bg-amber-500",
              )}
            ></div>

            <div className="space-y-4 relative z-10">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform duration-500 group-hover/card:scale-110",
                  stat.color === "blue"
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                    : stat.color === "red"
                      ? "bg-red-500/10 border-red-500/20 text-red-500"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-500",
                )}
              >
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-black text-white tracking-tighter">
                  {isLoading ? "---" : (stat.value || 0).toLocaleString()}
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium italic opacity-60">
                {stat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Table Section */}
      <div className="space-y-6 pt-4 animate-in fade-in duration-1000 delay-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
            <h4 className="text-[12px] font-black text-zinc-400 uppercase tracking-[0.3em]">
              Chi tiết danh mục tồn kho
            </h4>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-12 bg-zinc-900/40 border-zinc-800 focus:border-amber-500/50 h-12 rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={loadInventory}
              disabled={isLoading}
              className="flex items-center justify-center w-12 h-12 bg-white/5 hover:bg-amber-500/10 text-amber-500 rounded-2xl transition-all border border-white/5 hover:border-amber-500/20"
            >
              <RefreshCw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-[40px] overflow-hidden shadow-2xl relative group/table sm:mx-0 -mx-4">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
          <div className="p-4">
            <DataTable
              data={inventory}
              columns={columns}
              isLoading={isLoading}
              keyExtractor={(item) => String(item.productId)}
              className="border-0"
            />
          </div>

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="px-8 py-6 border-t border-zinc-800/50 flex items-center justify-between bg-zinc-950/20">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                Hiển thị{" "}
                <span className="text-zinc-300 mx-1">
                  {startItem} — {endItem}
                </span>{" "}
                trong số{" "}
                <span className="text-zinc-300 mx-1">{totalElements}</span> sản
                phẩm
              </span>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border-zinc-800 bg-transparent text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6"
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="rounded-xl border-zinc-800 bg-transparent text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch Detail Drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-500"
            onClick={closeBatchDrawer}
          />

          {/* Drawer panel */}
          <div className="relative w-full max-w-xl bg-zinc-950 border-l border-zinc-800 flex flex-col animate-in slide-in-from-right duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="p-10 border-b border-zinc-800/50">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">
                      Chi tiết kho hàng
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                    {selectedProduct.productName}
                  </h3>
                </div>
                <button
                  onClick={closeBatchDrawer}
                  className="p-3 bg-white/5 text-zinc-500 hover:text-white hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Summary Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: "Tổng tồn",
                    value: selectedProduct.totalQuantity,
                    sub: translateUnit(selectedProduct.unit),
                  },
                  {
                    label: "Số lô hàng",
                    value: selectedProduct.batchCount,
                    sub: "Đã nhận",
                    color: "text-amber-500",
                  },
                  {
                    label: "Đơn vị",
                    value: translateUnit(selectedProduct.unit),
                    sub: "Chuẩn",
                    isText: true,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900/50 rounded-[24px] p-4 border border-zinc-800/50"
                  >
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                      {s.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-2xl font-black tracking-tighter",
                          s.color || "text-zinc-100",
                        )}
                      >
                        {s.value}
                      </span>
                      {!s.isText && (
                        <span className="text-[10px] font-bold text-zinc-600 uppercase">
                          {s.sub}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch List */}
            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Layers size={18} className="text-zinc-500" />
                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                  Danh sách các lô hàng có sẵn
                </span>
              </div>

              {isBatchLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                  <p className="mt-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
                    Đang truy xuất dữ liệu lô hàng...
                  </p>
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/20 rounded-[32px] border border-dashed border-zinc-800">
                  <Package
                    size={40}
                    className="mx-auto text-zinc-700 mb-4 opacity-20"
                  />
                  <p className="text-zinc-500 font-bold text-sm uppercase">
                    Trống
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => {
                    const expired = isExpired(batch.expiryDate);
                    const expiringSoon = isExpiringSoon(batch.expiryDate);
                    return (
                      <div
                        key={batch.batchId}
                        className={cn(
                          "group relative rounded-[32px] border p-6 transition-all duration-300",
                          expired
                            ? "border-red-500/30 bg-red-500/5"
                            : expiringSoon
                              ? "border-amber-500/30 bg-amber-500/5"
                              : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900",
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                              <span className="font-mono text-xs font-black text-zinc-100 uppercase tracking-tighter">
                                {batch.batchCode}
                              </span>
                            </div>
                            {expired ? (
                              <div className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                                Hết hạn
                              </div>
                            ) : expiringSoon ? (
                              <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                                Sắp hết hạn
                              </div>
                            ) : null}
                          </div>
                          <Badge className="bg-white/5 border-white/10 text-zinc-400 group-hover:bg-amber-500/10 group-hover:text-amber-500 transition-colors">
                            {translateStatus(batch.status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">
                              Số lượng
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-zinc-100 tracking-tighter">
                                {(batch.quantity || 0).toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold text-zinc-500">
                                {translateUnit(selectedProduct.unit)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">
                              Ngày SX
                            </p>
                            <p className="font-bold text-zinc-300 text-sm">
                              {new Date(
                                batch.manufacturingDate,
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">
                              Hạn SD
                            </p>
                            <p
                              className={cn(
                                "font-bold text-sm",
                                expired
                                  ? "text-red-500"
                                  : expiringSoon
                                    ? "text-amber-500"
                                    : "text-zinc-100",
                              )}
                            >
                              {new Date(batch.expiryDate).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
