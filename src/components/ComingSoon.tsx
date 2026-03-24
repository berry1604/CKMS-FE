import React from 'react';

export const ComingSoon: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-blue-50 p-6 rounded-full mb-4">
                <svg
                    className="w-12 h-12 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sắp ra mắt</h2>
            <p className="text-gray-500 max-w-md">
                Chức năng này đang được phát triển. Vui lòng quay lại sau để xem cập nhật mới.
            </p>
        </div>
    );
};
