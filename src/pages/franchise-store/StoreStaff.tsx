import React, { useEffect, useState } from 'react';
import { userService } from '../../services/user.service';
import type { UserResponse } from '../../types/user';
import { Mail, Shield, User as UserIcon, Loader2 } from 'lucide-react';

interface StoreStaffProps {
    storeId: number;
}

const StoreStaff: React.FC<StoreStaffProps> = ({ storeId }) => {
    const [staff, setStaff] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await userService.getUsers({ storeId, size: 100 });
                if (response.data?.content) {
                    setStaff(response.data.content);
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStaff();
    }, [storeId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm uppercase tracking-widest font-medium">Đang tải danh sách nhân viên...</p>
            </div>
        );
    }

    if (staff.length === 0) {
        return (
            <div className="text-center py-20 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5">
                <UserIcon className="w-12 h-12 text-stone-600 mx-auto mb-4" />
                <h3 className="text-stone-300 font-medium text-lg">Chưa có nhân viên nào</h3>
                <p className="text-stone-500 text-sm mt-1">Cần gán nhân viên vào cửa hàng này để hiển thị.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {staff.map((member) => (
                <div
                    key={member.userId}
                    className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform duration-300 font-bold text-xl uppercase italic">
                            {member.fullName.charAt(0)}
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                            {member.roleName === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                        </div>
                    </div>

                    <h3 className="text-white font-semibold text-lg tracking-wide mb-1 group-hover:text-amber-400 transition-colors">
                        {member.fullName}
                    </h3>
                    <p className="text-stone-500 text-xs tracking-wider uppercase mb-4">
                        @{member.username}
                    </p>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3 text-stone-400">
                            <Mail className="w-4 h-4 text-amber-500/60" />
                            <span className="text-sm truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-stone-400 font-mono italic">
                            <Shield className="w-4 h-4 text-amber-500/60" />
                            <span className="text-xs uppercase tracking-tighter">{member.roleName}</span>
                        </div>
                    </div>

                    <div className={`mt-4 pt-4 border-t border-white/5 flex items-center justify-between`}>
                        <span className={`text-[10px] font-black tracking-widest uppercase ${member.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {member.isActive ? '• Đang làm việc' : '• Nghỉ việc'}
                        </span>
                        <button className="text-[10px] font-bold text-stone-500 hover:text-white uppercase tracking-widest transition-colors">
                            Chi tiết
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StoreStaff;
