import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Login } from '../pages/auth/Login';
import { VerifyEmail } from '../pages/auth/VerifyEmail';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { UsersList } from '../pages/users/UsersList';
import { CreateUserPage } from '../pages/users/CreateUserPage';
import { RolesList } from '../pages/users/RolesList';
import { StoreList } from '../pages/franchise-store/StoreList';
import { CreateStorePage } from '../pages/franchise-store/CreateStorePage';
import { StoreDetails } from '../pages/franchise-store/StoreDetails';
import { StoreInventoryPage } from '../pages/franchise-store/StoreInventoryPage';
import { ProductCatalog } from '../pages/product/ProductCatalog';
import { CreateProductPage } from '../pages/product/CreateProductPage';
import { MaterialList } from '../pages/product/MaterialList';
import { CreateMaterialPage } from '../pages/product/CreateMaterialPage';
import { BeefsteakMaterialsPage } from '../pages/product/BeefsteakMaterialsPage';
import { CategoryList } from '../pages/product/CategoryList';
import { CreateCategoryPage } from '../pages/product/CreateCategoryPage';
import { RecipeManager } from '../pages/product/RecipeManager';
import { OrderList } from '../pages/orders/OrderList';
import { CreateOrder } from '../pages/orders/CreateOrder';
import { ProductListExample } from '../pages/product/ProductListExample';
import { ProductionSchedule } from '../pages/central-kitchen/ProductionSchedule';
import { CreateTaskPage } from '../pages/central-kitchen/CreateTaskPage';
import { KitchenInventory } from '../pages/central-kitchen/KitchenInventory';
import { ShipmentList } from '../pages/shipment/ShipmentList';
import { BillingList } from '../pages/billing/BillingList';
import { ReportsDashboard } from '../pages/reports/ReportsDashboard';
import { UserProfile } from '../pages/profile/UserProfile';
import { Notifications } from '../pages/common/Notifications';
import { ComingSoon } from '../components/ComingSoon';
import { WarehouseFulfillment } from '../pages/warehouse/WarehouseFulfillment';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/user';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const userRoleStr = typeof user?.role === 'string' ? user.role.replace('ROLE_', '') : '';
    if (allowedRoles && userRoleStr && !allowedRoles.includes(userRoleStr as any)) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Unauthorized Access</h2>
                <p className="text-gray-500">You do not have permission to view this page.</p>
            </div>
        );
    }

    return <Outlet />;
};

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <AuthLayout />,
        children: [
            { path: '', element: <Login /> }
        ]
    },
    {
        path: '/verify-email',
        element: <VerifyEmail />
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                element: <ProtectedRoute />,
                children: [
                    { index: true, element: <Dashboard /> },
                    { path: 'profile', element: <UserProfile /> },
                    { path: 'notifications', element: <Notifications /> },

                    // Users Module (Admin Only)
                    {
                        path: 'users',
                        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
                        children: [
                            { index: true, element: <UsersList /> },
                            { path: 'create', element: <CreateUserPage /> },
                            { path: 'roles', element: <RolesList /> }
                        ]
                    },

                    // Franchise Store Module (Admin, Manager)
                    {
                        path: 'stores',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STORE_STAFF']} />,
                        children: [
                            { index: true, element: <StoreList /> },
                            { path: 'create', element: <CreateStorePage /> },
                            { path: ':id', element: <StoreDetails /> },
                            { path: 'inventory', element: <StoreInventoryPage /> },
                            { path: 'orders', element: <ComingSoon /> }
                        ]
                    },

                    // Central Kitchen Module (Admin, Manager, Kitchen Staff)
                    {
                        path: 'kitchen',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'KITCHEN_STAFF']} />,
                        children: [
                            { index: true, element: <ProductionSchedule /> },
                            { path: 'create-task', element: <CreateTaskPage /> },
                            { path: 'inventory', element: <KitchenInventory /> },
                            { path: 'production', element: <ComingSoon /> }
                        ]
                    },

                    // Products Module (Admin, Manager, Kitchen Staff)
                    {
                        path: 'products',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'KITCHEN_STAFF']} />,
                        children: [
                            { index: true, element: <ProductCatalog /> },
                            { path: 'create', element: <CreateProductPage /> },
                            { path: 'materials', element: <MaterialList /> },
                            { path: 'materials/create', element: <CreateMaterialPage /> },
                            { path: 'beefsteak-materials', element: <BeefsteakMaterialsPage /> },
                            { path: 'categories', element: <CategoryList /> },
                            { path: 'categories/create', element: <CreateCategoryPage /> },
                            { path: 'categories/:id/edit', element: <CreateCategoryPage /> },
                            { path: 'recipes', element: <RecipeManager /> },
                            { path: 'example', element: <ProductListExample /> }
                        ]
                    },

                    // Orders Module (Admin, Manager, Store Staff)
                    {
                        path: 'orders',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STORE_STAFF']} />,
                        children: [
                            { index: true, element: <OrderList /> },
                            { path: 'create', element: <CreateOrder /> }
                        ]
                    },

                    // Warehouse Module
                    {
                        path: 'warehouse',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />,
                        children: [
                            { path: 'fulfillment', element: <WarehouseFulfillment /> }
                        ]
                    },

                    // Billing Module (Admin, Manager)
                    {
                        path: 'billing',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />,
                        children: [
                            { index: true, element: <BillingList /> },
                            { path: 'invoices', element: <ComingSoon /> }
                        ]
                    },

                    // Shipment Module (Admin, Supply Coordinator)
                    {
                        path: 'shipment',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY_COORDINATOR']} />,
                        children: [
                            { index: true, element: <ShipmentList /> }
                        ]
                    },

                    // Reports Module (Admin, Manager)
                    {
                        path: 'reports',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />,
                        children: [
                            { index: true, element: <ReportsDashboard /> }
                        ]
                    }
                ]
            }
        ]
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]);
