import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">{payload[0].payload.fullDate}</p>
                <p className="font-sans text-lg font-bold text-gray-900">
                    {payload[0].value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                </p>
            </div>
        );
    }
    return null;
};

const ExpenseLineChart = ({ expenses }) => {


    const data = useMemo(() => {
        if (!expenses || expenses.length === 0) return [];

        // Get last 6 months range
        const end = new Date();
        const start = subMonths(end, 5);
        const months = eachMonthOfInterval({ start, end });

        return months.map(month => {
            const monthExpenses = expenses.filter(expense => {
                const expenseDate = parseISO(expense.date);
                return isSameMonth(expenseDate, month);
            });

            const total = monthExpenses.reduce((sum, expense) => sum + Number(expense.price), 0);

            return {
                name: format(month, 'MMM', { locale: tr }),
                fullDate: format(month, 'MMMM yyyy', { locale: tr }),
                amount: total
            };
        });
    }, [expenses]);

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
                Henüz veri yok
            </div>
        );
    }

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorGoldArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12, angle: -45, textAnchor: 'end' }}
                        dy={10}
                        height={60}
                        interval={0}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `₺${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#D4AF37"
                        strokeWidth={2}
                        fill="url(#colorGoldArea)"
                        dot={{ r: 4, fill: '#D4AF37', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: '#D4AF37', strokeWidth: 0 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ExpenseLineChart;
