import { StoreInventory } from '../franchise-store/StoreInventory';
import { useAuth } from '../../hooks/useAuth';

export const StoreInventoryPage = () => {
    const { user } = useAuth();
    
    // If user is STORE_STAFF, we force their storeId
    const role = user?.role?.toUpperCase().replace("ROLE_", "");
    const storeId = role === "STORE_STAFF" ? user?.storeId : undefined;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-200 tracking-tight italic uppercase">
                    Quản lý <span className="text-amber-500">Kho Cửa hàng</span>
                </h1>
                <p className="text-[11px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">
                    {role === "STORE_STAFF" 
                        ? `Đang xem kho của: ${user?.storeName || 'Cửa hàng hiện tại'}`
                        : "Quản lý tồn kho hệ thống — xem sản phẩm, số lượng, hạn sử dụng và chi tiết lô hàng."}
                </p>
            </div>
            <StoreInventory storeId={storeId} />
        </div>
    );
};
