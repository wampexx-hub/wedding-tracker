import React from 'react';

const DashboardSkeleton = () => {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 h-[180px]">
                <div className="space-y-4 w-full md:w-1/2">
                    <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                </div>
                <div className="w-full md:w-auto">
                    <div className="h-12 w-48 bg-gray-200 rounded-xl"></div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 h-[160px] flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                            <div className="w-16 h-6 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Area Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Donut Chart Skeleton */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[400px] flex flex-col items-center justify-center">
                    <div className="w-full flex justify-between items-center mb-8">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-64 h-64 rounded-full border-8 border-gray-200"></div>
                    <div className="flex gap-4 mt-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 w-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>

                {/* Line Chart Skeleton */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-[300px] bg-gray-100 rounded-xl w-full"></div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
