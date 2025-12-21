import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import WeddingService from '../services/WeddingService';

const ExpenseContext = createContext();

export const useExpenses = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [budget, setBudget] = useState(0);
    const [assets, setAssets] = useState([]);
    const [rates, setRates] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [portfolioValue, setPortfolioValue] = useState(0);

    // Load data when user changes
    useEffect(() => {
        if (user) {
            fetch(`/api/data?user=${user.username}`)
                .then(res => res.json())
                .then(data => {
                    setExpenses(data.expenses || []);
                    setBudget(data.budget || 0);
                    setAssets(data.assets || []);
                })
                .catch(err => console.error('Failed to load data', err));

            // Fetch rates for calculations (Live)
            WeddingService.getExchangeRates()
                .then(data => setRates(data))
                .catch(err => console.error('Failed to load rates', err));

            // Fetch portfolio value
            fetchPortfolioValue();
        } else {
            setExpenses([]);
            setBudget(0);
            setAssets([]);
            setRates(null);
            setPortfolioValue(0);
        }
    }, [user]);

    const fetchPortfolioValue = async () => {
        if (!user) return;

        try {
            const res = await fetch(`/api/portfolio/${user.username}`);
            const data = await res.json();

            if (data.portfolio && data.portfolio.length > 0) {
                const ratesCache = localStorage.getItem('live_rates_cache');
                const rates = ratesCache ? JSON.parse(ratesCache).data : {};

                // Calculate portfolio value:
                // - TRY_CASH: Always included (rate = 1)
                // - Market assets (gold/FX): Only if budgetIncluded is true
                const value = data.portfolio.reduce((sum, asset) => {
                    if (asset.type === 'TRY_CASH') {
                        // TRY_CASH always included in budget
                        return sum + asset.amount;
                    } else if (data.budgetIncluded) {
                        // Market assets only if toggle is ON
                        const rate = rates?.[asset.type] || 0;
                        return sum + (asset.amount * rate);
                    }
                    return sum;
                }, 0);

                setPortfolioValue(value);
            } else {
                setPortfolioValue(0);
            }
        } catch (err) {
            console.error('Failed to fetch portfolio value:', err);
            setPortfolioValue(0);
        }
    };

    // Refetch portfolio when refreshTrigger changes
    useEffect(() => {
        if (user) {
            fetchPortfolioValue();
        }
    }, [refreshTrigger, user]);

    const refreshAssets = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/assets?username=${user.username}`);
            const data = await res.json();
            setAssets(data || []);
        } catch (err) {
            console.error('Failed to refresh assets', err);
        }
    };

    const addAsset = async (assetData) => {
        if (!user) return;
        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, asset: assetData })
            });
            const data = await res.json();
            setAssets(prev => [...prev, data.asset]);
            if (data.budget !== undefined) {
                setBudget(data.budget);
            }
        } catch (err) {
            console.error('Failed to add asset', err);
        }
    };

    const deleteAsset = async (id) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/assets/${id}?username=${user.username}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setAssets(prev => prev.filter(a => a.id !== id));
                if (data.budget !== undefined) {
                    setBudget(data.budget);
                }
            }
        } catch (err) {
            console.error('Failed to delete asset', err);
        }
    };

    const updateAsset = async (id, assetData) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/assets/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, asset: assetData })
            });
            const data = await res.json();
            if (data.success) {
                setAssets(prev => prev.map(a => a.id === id ? data.asset : a));
                if (data.budget !== undefined) {
                    setBudget(data.budget);
                }
            }
        } catch (err) {
            console.error('Failed to update asset', err);
        }
    };

    const addExpense = async (expenseData) => {
        let body;
        let headers = {};

        if (!user) {
            console.error('User not found in addExpense');
            return;
        }

        if (expenseData instanceof FormData) {
            // Append username and other fields if not present in FormData (but we did it in Form)
            // Actually, we need to make sure username is there.
            // In ExpenseForm we appended 'data' as JSON string.
            // We need to inject username into that JSON string or append it separately.
            // Let's modify the JSON string inside FormData.
            const dataStr = expenseData.get('data');
            const dataObj = JSON.parse(dataStr);
            dataObj.id = Date.now().toString();
            dataObj.createdAt = new Date().toISOString();
            dataObj.status = dataObj.status || 'planned';
            dataObj.username = user.username;
            expenseData.set('data', JSON.stringify(dataObj));

            body = expenseData;
            // No Content-Type header for FormData, browser sets it with boundary
        } else {
            const newExpense = {
                ...expenseData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                status: expenseData.status || 'planned',
                username: user.username
            };
            body = JSON.stringify(newExpense);
            headers['Content-Type'] = 'application/json';
        }

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers,
                body
            });
            const savedExpense = await res.json();
            setExpenses(prev => [...prev, savedExpense]);
        } catch (err) {
            console.error('Failed to add expense', err);
        }
    };

    const addBatchExpenses = async (expensesList) => {
        if (!user) return;
        try {
            const res = await fetch('/api/expenses/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, expenses: expensesList })
            });
            const data = await res.json();
            if (data.success) {
                setExpenses(prev => [...prev, ...data.expenses]);
            }
        } catch (err) {
            console.error('Failed to add batch expenses', err);
        }
    };

    const deleteExpense = async (id) => {
        try {
            await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            setExpenses(prev => prev.filter(exp => exp.id !== id));
        } catch (err) {
            console.error('Failed to delete expense', err);
        }
    };

    const clearAllExpenses = async () => {
        if (!user) return;
        if (window.confirm('TÜM harcamalarınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
            try {
                await fetch(`/api/expenses?username=${user.username}`, { method: 'DELETE' });
                setExpenses([]);
            } catch (err) {
                console.error('Failed to clear expenses', err);
            }
        }
    };

    const updateExpense = async (id, expenseData) => {
        let body;
        let headers = {};

        if (expenseData instanceof FormData) {
            // Ensure username is preserved or added if needed, though update usually doesn't change username
            // But we might need to ensure the structure is correct.
            // The backend expects 'data' field.
            body = expenseData;
        } else {
            body = JSON.stringify(expenseData);
            headers['Content-Type'] = 'application/json';
        }

        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers,
                body
            });
            const savedExpense = await res.json();
            setExpenses(prev => prev.map(exp => exp.id === id ? savedExpense : exp));
        } catch (err) {
            console.error('Failed to update expense', err);
        }
    };

    const updateBudget = async (newBudget) => {
        try {
            await fetch('/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, budget: newBudget })
            });
            setBudget(Number(newBudget));
        } catch (err) {
            console.error('Failed to update budget', err);
        };
    };

    const getSummary = () => {
        const totalSpent = expenses
            .filter(e => e.status === 'purchased')
            .reduce((acc, curr) => acc + Number(curr.price), 0);

        // Budget already includes cash assets from backend
        // portfolioValue is 0 when toggle is off (handled by fetchPortfolioValue)
        // portfolioValue is calculated when toggle is on
        const effectiveBudget = budget + portfolioValue;
        const remainingBudget = effectiveBudget - totalSpent;

        return {
            totalSpent,
            budget: effectiveBudget,
            remainingBudget,
            count: expenses.length,
            portfolioValue,
            baseBudget: budget  // Original budget without portfolio
        };
    };

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <ExpenseContext.Provider value={{
            expenses,
            budget,
            portfolioValue,
            assets,
            rates,
            addExpense,
            addBatchExpenses,
            deleteExpense,
            updateExpense,
            updateBudget,
            getSummary,
            refreshAssets,
            clearAllExpenses,
            addAsset,
            deleteAsset,
            updateAsset,
            triggerRefresh,
            refreshTrigger
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};
