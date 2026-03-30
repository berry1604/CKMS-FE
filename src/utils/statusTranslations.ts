import type { OrderStatus } from "../types/storeOrder";
import type { ProductionPlanStatus } from "../types/productionPlan";
import type { ShipmentStatus } from "../types/shipment";
import type { BillingStatementStatus, InvoiceStatus } from "../types/billing";
import type { UserStatus } from "../types/user";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  SUBMITTED: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  SCHEDULED: "Đã lập lịch",
  LOCKED: "Đang chế biến",
  ALLOCATED: "Đã phân bổ",
  IN_TRANSIT: "Đang giao hàng",
  DELIVERED: "Đã giao hàng",
  CONFIRMED: "Đã hoàn tất",
  REJECTED: "Bị từ chối",
  DRAFT: "Bản nháp",
  CANCELLED: "Đã hủy",
  PREPARING: "Đang chuẩn bị",
  READY: "Sẵn sàng",
};

export const PRODUCTION_PLAN_STATUS_LABELS: Record<
  ProductionPlanStatus,
  string
> = {
  PLANNED: "Đang lập kế hoạch",
  READY_TO_PRODUCE: "Sẵn sàng sản xuất",
  PRODUCING: "Đang chế biến",
  IN_PRODUCTION: "Đang sản xuất",
  PRODUCED: "Đã sản xuất",
  COMPLETED: "Hoàn thành",
  FINISHED: "Hoàn tất",
  APPROVED: "Đã duyệt",
  CANCELLED: "Đã hủy",
  DRAFT: "Bản nháp",
  READY: "Sẵn sàng",
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: "Chờ xử lý",
  PREPARED: "Đã chuẩn bị hàng",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERED: "Đã đến nơi",
  CANCELLED: "Đã hủy",
  ARRIVED: "Đã đến điểm dừng",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: "Chờ thanh toán",
  FULFILLED: "Hoàn tất giao hàng",
  IN_STATEMENT: "Đã vào sao kê",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

export const BILLING_STATEMENT_STATUS_LABELS: Record<
  BillingStatementStatus,
  string
> = {
  DRAFT: "Bản nháp",
  ISSUED: "Đã phát hành",
  OVERDUE: "Quá hạn",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  PENDING_VERIFICATION: "Chờ xác minh",
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngưng hoạt động",
  BLOCKED: "Đã khóa",
  DELETED: "Đã xóa",
};

export const UNIT_LABELS: Record<string, string> = {
  PIECE: "Phần",
  BOX: "Hộp",
  KG: "Kg",
  GRAM: "Gram",
  PACK: "Gói",
  BOTTLE: "Chai",
  PORTION: "Phần",
  SET: "Bộ",
};

export const STOCK_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Sẵn có",
  LOCKED: "Đang khóa",
  EXPIRED: "Hết hạn",
  NEAR_EXPIRY: "Sắp hết hạn",
  PENDING: "Chờ xử lý",
};
