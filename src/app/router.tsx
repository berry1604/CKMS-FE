import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Login } from '../pages/auth/Login';
import { VerifyEmail } from '../pages/auth/VerifyEmail';
import { ResetPassword } from '../pages/auth/ResetPassword';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { UsersList } from '../pages/users/UsersList';
import { CreateUserPage } from '../pages/users/CreateUserPage';
import { RolesList } from '../pages/users/RolesList';
import { CreateRolePage } from '../pages/users/CreateRolePage';
import { StoreList } from '../pages/franchise-store/StoreList';
import CreateStorePage from '../pages/franchise-store/CreateStorePage';
import { StoreDetails } from '../pages/franchise-store/StoreDetails';
import { KitchensList } from '../pages/kitchens/KitchensList';
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
import { OrderApproval } from '../pages/orders/OrderApproval';
import { SplitOrder } from '../pages/orders/SplitOrder';
import { ProductListExample } from '../pages/product/ProductListExample';
import { ProductionSchedule } from '../pages/central-kitchen/ProductionSchedule';
import { CreateProductionPlan } from '../pages/central-kitchen/CreateProductionPlan';
import { KitchenInventory } from '../pages/central-kitchen/KitchenInventory';
import { KitchenImportPage } from '../pages/central-kitchen/KitchenImportPage';
import { ProductionBoard } from '../pages/central-kitchen/ProductionBoard';
import { DispatchDashboard } from '../pages/central-kitchen/DispatchDashboard';
import { OrderPool } from '../pages/central-kitchen/OrderPool';
import { ProductionPlanList } from '../pages/central-kitchen/ProductionPlanList';
import { WarehousePage } from '../pages/warehouse/WarehousePage';

import { ShipmentList } from '../pages/shipment/ShipmentList';
import { CreateShipment } from '../pages/shipment/CreateShipment';
import { BillingList } from '../pages/billing/BillingList';
import { ReportsDashboard } from '../pages/reports/ReportsDashboard';
import { UserProfile } from '../pages/profile/UserProfile';
import { Notifications } from '../pages/common/Notifications';
import { ComingSoon } from '../components/ComingSoon';
import { WarehouseFulfillment } from '../pages/warehouse/WarehouseFulfillment';
import { AllocationMatrix } from '../pages/warehouse/AllocationMatrix';
import { ReceiveShipment } from '../pages/shipment/ReceiveShipment';
import { ReceiveShipmentReportPage } from '../pages/shipment/ReceiveShipmentReportPage';
import { VNPayReturn } from '../pages/billing/VNPayReturn';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/user';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: UserRole[] }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const userRoleStr = typeof user?.role === 'string' ? user.role.replace('ROLE_', '') : '';
    if (allowedRoles && userRoleStr && !allowedRoles.includes(userRoleStr as any)) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h2>
                <p className="text-gray-500">Bạn không có quyền xem trang này.</p>
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
        path: '/reset-password',
        element: <ResetPassword />
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
                            { path: 'roles', element: <RolesList /> },
                            { path: 'roles/create', element: <CreateRolePage /> },
                            { path: 'roles/:id/edit', element: <CreateRolePage /> },
                            { path: 'roles/:id/view', element: <CreateRolePage /> }
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

                    // Kitchens Management Module (Admin, Manager)
                    {
                        path: 'kitchens',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']} />,
                        children: [
                            { index: true, element: <KitchensList /> }
                        ]
                    },

                    // Central Kitchen Module (Admin, Manager, Kitchen Staff, Coordinator)
                    {
                        path: 'kitchen',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'KITCHEN_STAFF', 'COORDINATOR']} />,
                        children: [
                            { index: true, element: <ProductionSchedule /> },
                            { path: 'dispatch', element: <DispatchDashboard /> },
                            { path: 'order-pool', element: <OrderPool /> },
                            { path: 'production-plans', element: <ProductionPlanList /> },
                            { path: 'create-plan', element: <CreateProductionPlan /> },
                            { path: 'inventory', element: <KitchenInventory /> },
                            { path: 'inventory/import', element: <KitchenImportPage /> },
                            { path: 'production', element: <ProductionBoard /> }
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
                            { path: 'materials/:id/edit', element: <CreateMaterialPage /> },
                            { path: 'beefsteak-materials', element: <BeefsteakMaterialsPage /> },
                            { path: 'categories', element: <CategoryList /> },
                            { path: 'categories/create', element: <CreateCategoryPage /> },
                            { path: 'categories/:id/edit', element: <CreateCategoryPage /> },
                            { path: 'recipes', element: <RecipeManager /> },
                            { path: 'example', element: <ProductListExample /> }
                        ]
                    },

                    // Orders Module (Admin, Manager, Store Staff, Coordinator)
                    {
                        path: 'orders',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STORE_STAFF', 'COORDINATOR']} />,
                        children: [
                            { index: true, element: <OrderList /> },
                            { path: 'create', element: <CreateOrder /> },
                            { path: 'approvals', element: <OrderApproval /> },
                            { path: ':id/split', element: <SplitOrder /> }
                        ]
                    },

                    // Warehouse Module
                    {
                        path: 'warehouse',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'COORDINATOR']} />,
                        children: [
                            { index: true, element: <WarehousePage /> },
                            { path: 'fulfillment', element: <WarehouseFulfillment /> },
                            { path: 'allocation', element: <AllocationMatrix /> }
                        ]
                    },

                    // Billing Module (Admin, Manager)
                    {
                        path: 'billing',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'STORE_STAFF']} />,
                        children: [
                            { index: true, element: <BillingList /> },
                            { path: 'invoices', element: <ComingSoon /> }
                        ]
                    },

                    // Shipment Module (Admin, Supply Coordinator, Coordinator)
                    {
                        path: 'shipment',
                        element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY_COORDINATOR', 'COORDINATOR', 'KITCHEN_STAFF', 'STORE_STAFF']} />,
                        children: [
                            { index: true, element: <ShipmentList /> },
                            {
                                element: <ProtectedRoute allowedRoles={['ADMIN', 'SUPPLY_COORDINATOR', 'COORDINATOR']} />,
                                children: [
                                    { path: 'create', element: <CreateShipment /> }
                                ]
                            },
                            { path: 'receive', element: <ReceiveShipment /> },
                            { path: 'receive/:id', element: <ReceiveShipmentReportPage /> }
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
    },
    // VNPay return — accessible without auth (VNPay redirect doesn't carry session cookie)
    {
        path: '/billing/vnpay-return',
        element: <VNPayReturn />
    }
]);
