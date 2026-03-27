import { StoreInventory } from '../franchise-store/StoreInventory';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';

export const StoreInventoryPage = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    
    // If user is STORE_STAFF, we force their storeId
    const role = user?.role?.toUpperCase().replace("ROLE_", "");
    const urlStoreId = searchParams.get('storeId') ? Number(searchParams.get('storeId')) : undefined;
    const storeId = role === "STORE_STAFF" ? user?.storeId : urlStoreId;

    return (
        <div className="space-y-6">
            <StoreInventory storeId={storeId} />
        </div>
    );
};
