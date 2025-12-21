// Simple test to verify basic Recharts setup works
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, ResponsiveContainer } from 'recharts';

const TestChart = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 150);
        return () => clearTimeout(timer);
    }, []);

    const data = [{ name: 'Test', value: 100 }];

    return (
        <div style={{ width: 256, height: 256 }}>
            {mounted && (
                <ResponsiveContainer width={256} height={256}>
                    <PieChart>
                        <Pie data={data} dataKey="value" cx="50%" cy="50%" />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default TestChart;
