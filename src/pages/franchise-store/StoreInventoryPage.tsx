import { StoreInventory } from '../franchise-store/StoreInventory';

export const StoreInventoryPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-200 tracking-tight">Store Inventory</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Quản lý tồn kho cửa hàng — xem sản phẩm, số lượng, hạn sử dụng và chi tiết lô hàng.
                </p>
            </div>
            <StoreInventory />
        </div>
    );
};
