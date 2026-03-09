import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  AlertCircle,
  Filter,
  Eye,
  FileText,
  Layers,
  Trash2,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Badge } from "../../components/ui/Badge";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { BillingDetailDrawer } from "./InvoiceDetailDrawer";
import { billingApi } from "../../services/billing.api";
import { toast } from "react-hot-toast";
import type { BillingStatementSummaryResponse } from "../../types/billing";
import type { BatchBillingStatementResponse } from "../../types/billing";

type BillingStatus =
  | "all"
  | "DRAFT"
  | "ISSUED"
  | "OVERDUE"
  | "PAID"
  | "CANCELLED";

export const BillingList = () => {
  const [statements, setStatements] = useState<
    BillingStatementSummaryResponse[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(
    null,
  );

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<BillingStatus>("all");

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Statement form
  const [manualForm, setManualForm] = useState({
    storeId: "",
    periodStart: "",
    periodEnd: "",
  });

  // Batch Statement form
  const [batchForm, setBatchForm] = useState({
    cycleName: "",
    periodStart: "",
    periodEnd: "",
  });

  // Store ID filter
  const [storeIdFilter, setStoreIdFilter] = useState("");

  // Batch result
  const [_batchResult, setBatchResult] =
    useState<BatchBillingStatementResponse | null>(null);

  const fetchStatements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: {
        storeId?: number;
        status?: string;
        page?: number;
        size?: number;
      } = {
        page,
        size: 10,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (storeIdFilter) {
        params.storeId = Number(storeIdFilter);
      }
      const res = await billingApi.getStatements(params);
      setStatements(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch billing statements:", error);
      toast.error("Failed to load billing statements");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, storeIdFilter]);

  useEffect(() => {
    fetchStatements();
  }, [fetchStatements]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, storeIdFilter]);

  const handleDelete = (id: number) => {
    setStatementToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!statementToDelete) return;
    setIsDeleting(true);
    try {
      await billingApi.deleteStatement(statementToDelete);
      toast.success("Billing statement deleted successfully");
      fetchStatements();
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      let msg = "Failed to delete billing statement";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        msg = axiosError.response?.data?.message || msg;
      }
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateManual = async () => {
    if (
      !manualForm.storeId ||
      !manualForm.periodStart ||
      !manualForm.periodEnd
    ) {
      toast.error("Please fill all fields");
      return;
    }
    setIsGenerating(true);
    try {
      await billingApi.generateManualStatement(
        Number(manualForm.storeId),
        manualForm.periodStart,
        manualForm.periodEnd,
      );
      toast.success("Billing statement generated successfully!");
      setShowManualModal(false);
      setManualForm({ storeId: "", periodStart: "", periodEnd: "" });
      fetchStatements();
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to generate billing statement";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBatch = async () => {
    if (
      !batchForm.cycleName ||
      !batchForm.periodStart ||
      !batchForm.periodEnd
    ) {
      toast.error("Please fill all fields");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await billingApi.generateBatchStatements(batchForm);
      setBatchResult(result);
      toast.success(
        `Batch completed: ${result.successCount} success, ${result.failureCount} failed`,
      );
      setShowBatchModal(false);
      setBatchForm({ cycleName: "", periodStart: "", periodEnd: "" });
      fetchStatements();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Failed to generate batch billing statements";
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusVariant = (
    status: string,
  ): "success" | "warning" | "danger" | "default" => {
    const s = status?.toUpperCase();
    if (s === "PAID") return "success";
    if (s === "ISSUED" || s === "DRAFT") return "warning";
    if (s === "OVERDUE") return "danger";
    return "default";
  };

  const columns: Column<BillingStatementSummaryResponse>[] = [
    {
      header: "ID",
      accessorKey: "statementId",
      className: "font-medium",
      cell: (s) => (
        <span className="font-mono text-xs text-gray-400 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
          #{s.statementId}
        </span>
      ),
    },
    {
      header: "Store",
      cell: (s) => (
        <span className="text-gray-200">
          {s.storeName || `Store #${s.storeId || "—"}`}
        </span>
      ),
    },
    {
      header: "Cycle Name",
      accessorKey: "cycleName",
      className: "font-medium text-gray-200",
      cell: (s) => <span className="text-gray-200">{s.cycleName || "—"}</span>,
    },
    {
      header: "Total Amount",
      accessorKey: "totalAmount",
      className: "font-bold",
      cell: (s) => (
        <span className="text-gray-200 font-semibold">
          {s.totalAmount?.toLocaleString("vi-VN")} VND
        </span>
      ),
    },
    {
      header: "Status",
      cell: (s) => (
        <Badge variant={getStatusVariant(s.status)}>
          {s.status?.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: "Issued At",
      accessorKey: "issuedAt",
      cell: (s) => (
        <span className="text-gray-400 text-sm">
          {s.issuedAt ? new Date(s.issuedAt).toLocaleDateString("vi-VN") : "—"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStatementId(s.statementId)}
            className="text-amber-600 hover:text-amber-500 hover:bg-amber-500/10"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(s.statementId)}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const statusOptions: { value: BillingStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "DRAFT", label: "Draft" },
    { value: "ISSUED", label: "Issued" },
    { value: "PAID", label: "Paid" },
    { value: "OVERDUE", label: "Overdue" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Count summary stats from current page (basic)
  const paidCount = statements.filter(
    (s) => s.status?.toUpperCase() === "PAID",
  ).length;
  const overdueCount = statements.filter(
    (s) => s.status?.toUpperCase() === "OVERDUE",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-200 tracking-tight">
          Billing & Statements
        </h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowManualModal(true)}>
            <FileText size={16} className="mr-2" /> Generate Manual
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => setShowBatchModal(true)}
          >
            <Layers size={16} className="mr-2" /> Generate Batch
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900/50 border-0 shadow-sm ring-1 ring-zinc-800">
          <div className="flex items-start justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Total Statements
              </p>
              <p className="text-2xl font-bold text-gray-200 mt-1">
                {totalElements}
              </p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-0 shadow-sm ring-1 ring-zinc-800">
          <div className="flex items-start justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Paid (this page)
              </p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {paidCount}
              </p>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-0 shadow-sm ring-1 ring-zinc-800">
          <div className="flex items-start justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Overdue (this page)
              </p>
              <p className="text-2xl font-bold text-red-500 mt-1">
                {overdueCount}
              </p>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <AlertCircle size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm ring-1 ring-zinc-700">
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Filter size={16} className="text-gray-400 mr-1" />
            <span className="text-sm text-gray-400 mr-2">Status:</span>
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                                    ${statusFilter === opt.value
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    : "bg-zinc-900/50 border-zinc-700 text-gray-400 hover:bg-zinc-900/80"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Store ID:</span>
            <Input
              type="number"
              min="1"
              placeholder="All stores"
              className="w-32 h-8 text-sm"
              value={storeIdFilter}
              onChange={(e) => setStoreIdFilter(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={statements}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(s) => String(s.statementId)}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-800">
            <p className="text-sm text-gray-400">
              Page {page + 1} of {totalPages} ({totalElements} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Drawer */}
      <BillingDetailDrawer
        statementId={selectedStatementId}
        isOpen={!!selectedStatementId}
        onClose={() => setSelectedStatementId(null)}
        onPaid={fetchStatements}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Billing Statement"
        message="Are you sure you want to delete this billing statement? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Manual Statement Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-zinc-900 shadow-xl border border-zinc-700">
            <h2 className="text-lg font-bold text-gray-200 mb-4">
              Generate Manual Statement
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Store ID
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 1"
                  value={manualForm.storeId}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, storeId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Period Start
                </label>
                <Input
                  type="date"
                  value={manualForm.periodStart}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      periodStart: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Period End
                </label>
                <Input
                  type="date"
                  value={manualForm.periodEnd}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, periodEnd: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowManualModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleGenerateManual}
                isLoading={isGenerating}
              >
                Generate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Batch Statement Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-zinc-900 shadow-xl border border-zinc-700">
            <h2 className="text-lg font-bold text-gray-200 mb-4">
              Generate Batch Statements
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Cycle Name
                </label>
                <Input
                  placeholder="e.g. Q1-2026"
                  value={batchForm.cycleName}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, cycleName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Period Start
                </label>
                <Input
                  type="date"
                  value={batchForm.periodStart}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, periodStart: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Period End
                </label>
                <Input
                  type="date"
                  value={batchForm.periodEnd}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, periodEnd: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowBatchModal(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleGenerateBatch}
                isLoading={isGenerating}
              >
                Generate Batch
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
