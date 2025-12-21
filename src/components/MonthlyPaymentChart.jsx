import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';

const MonthlyPaymentChart = ({ expenses }) => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    React.useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper to get next 6 months
    const getNext6Months = () => {
        const months = [];
        const today = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            months.push(d);
        }
        return months;
    };

    const next6Months = getNext6Months();

    // Calculate installments for each month
    const data = next6Months.map(monthDate => {
        const monthName = monthDate.toLocaleString('tr-TR', { month: 'long' });

        const totalAmount = expenses
            .filter(e => e.status === 'purchased') // Only purchased expenses
            .reduce((acc, expense) => {
                if (!expense.isInstallment || !expense.installmentCount) return acc;

                const startDate = new Date(expense.date);
                const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                const current = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

                const diffMonths = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth());

                if (diffMonths >= 0 && diffMonths < expense.installmentCount) {
                    return acc + Number(expense.monthlyPayment);
                }
                return acc;
            }, 0);

        return {
            name: monthName,
            amount: totalAmount,
            fullDate: monthDate
        };
    });

    const peakMonth = data.reduce((max, curr) => curr.amount > max.amount ? curr : max, data[0]);
    const totalFuturePayment = data.reduce((acc, curr) => acc + curr.amount, 0);
    const installmentExpenseCount = expenses.filter(e => e.status === 'purchased' && e.isInstallment && e.installmentCount > 1).length;

    return (
        <div className="bg-white p-6 rounded-xl shadow-xl shadow-black/5 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-serif text-lg font-bold text-gray-900">Gelecek Ödemeler</h3>
                    <p className="text-xs text-gray-500 font-medium">{installmentExpenseCount} Taksitli Harcama</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                    <Calendar size={20} />
                </div>
            </div>

            {/* Mobile View: Wallet Style List */}
            <div className="block md:hidden space-y-0 divide-y divide-gray-100">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <span className="text-xs font-bold">{item.name.substring(0, 3)}</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-400">{item.fullDate.getFullYear()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                                {item.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                            </p>
                        </div>
                    </div>
                ))}
                {data.every(d => d.amount === 0) && (
                    <p className="text-center text-gray-400 text-sm py-4">Gelecek ödeme bulunmuyor.</p>
                )}
            </div>

            {/* Desktop View: Bar Chart */}
            {isDesktop && (
                <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            onMouseMove={(state) => {
                                if (state.isTooltipActive) {
                                    setActiveIndex(state.activeTooltipIndex);
                                } else {
                                    setActiveIndex(null);
                                }
                            }}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#f4d03f" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={(value) => `₺${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                            />
                            <Tooltip
                                cursor={{ fill: '#f9fafb' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-100 text-sm">
                                                <p className="font-medium text-gray-900">{payload[0].payload.name}</p>
                                                <p className="text-[#D4AF37] font-bold">
                                                    {payload[0].value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={activeIndex === null || activeIndex === index ? "url(#barGradient)" : "#e5e7eb"}
                                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {peakMonth.amount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                    <p className="text-sm text-gray-500">
                        En yoğun ödeme <span className="font-medium text-gray-900">{peakMonth.name}</span> ayında:
                        <span className="font-bold text-[#D4AF37] ml-1">
                            {peakMonth.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default MonthlyPaymentChart;
