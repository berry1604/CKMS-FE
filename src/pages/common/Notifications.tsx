import { useEffect, useState } from 'react';
import { Bell, Check, Info, AlertTriangle, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
export interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'info' | 'warning' | 'error' | 'success';
    category: 'system' | 'order' | 'inventory' | 'shipment' | 'account';
    isRead: boolean;
    timestamp: string;
    link?: string;
}
import { useNavigate } from 'react-router-dom';

export const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'order'>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadNotifications = async () => {
            setIsLoading(true);
            try {
                // Placeholder for API call
                setNotifications([]);
            } catch (error) {
                console.error("Failed to load notifications", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadNotifications();
    }, []);

    const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        // await markAsRead(id);
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        // await markAllAsRead();
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'system') return n.category === 'system';
        if (filter === 'order') return n.category === 'order';
        return true;
    });

    const getIcon = (type: string, category: string) => {
        if (category === 'order') return <Package size={20} />;
        if (category === 'shipment') return <Truck size={20} />;
        if (type === 'warning') return <AlertTriangle size={20} />;
        if (type === 'error') return <XCircle size={20} />;
        if (type === 'success') return <CheckCircle size={20} />;
        return <Info size={20} />;
    };

    const getColor = (type: string) => {
        if (type === 'warning') return 'text-orange-600 bg-orange-100';
        if (type === 'error') return 'text-red-600 bg-red-100';
        if (type === 'success') return 'text-green-600 bg-green-100';
        return 'text-blue-600 bg-blue-100';
    };

    if (isLoading) return <div className="p-12 text-center text-gray-500">Loading notifications...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">Manage system alerts and updates.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                        <Check size={16} className="mr-2" /> Mark all as read
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex border-b border-gray-200 space-x-6">
                {['all', 'unread', 'system', 'order'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${filter === f
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                        <p className="text-gray-500">You're all caught up!</p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`cursor-pointer group`}
                        >
                            <Card
                                className={`p-4 transition-all hover:shadow-md ${!notification.isRead ? 'bg-blue-50/30 border-blue-100 ring-1 ring-blue-50' : 'bg-white group-hover:bg-gray-50'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getColor(notification.type)}`}>
                                        {getIcon(notification.type, notification.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-sm font-semibold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notification.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.description}</p>

                                        {!notification.isRead && (
                                            <div className="mt-2 flex justify-end md:justify-start">
                                                <button
                                                    onClick={(e) => handleMarkRead(notification.id, e)}
                                                    className="text-xs font-medium text-blue-600 hover:underline z-10 relative"
                                                >
                                                    Mark as read
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
