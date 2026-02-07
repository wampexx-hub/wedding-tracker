import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import WeddingService from '../services/WeddingService';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import {
    useDashboardData, useAssets, useExchangeRates,
    useAddExpense, useUpdateBudget, useAddAsset,
    useDeleteAsset, useUpdateAsset, useDeleteExpense,
    useUpdateExpense, useBatchExpenses, useClearAllExpenses,
    useToggleBudgetInclude
} from '../hooks/useExpensesQuery';

const ExpenseContext = createContext();

export const useExpenses = () => useContext(ExpenseContext);

// Default Web Implementation
const defaultWebConfirm = (message, onConfirm) => {
    if (window.confirm(message)) onConfirm();
};

export const ExpenseProvider = ({
    children,
    socketUrl = typeof window !== 'undefined' ? window.location.origin : '',
    confirmDialog = defaultWebConfirm
}) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [socket, setSocket] = useState(null);

    // --- SOCKET.IO INTEGRATION ---
    useEffect(() => {
        if (!user || !socketUrl) return;

        console.log('Connecting to socket at:', socketUrl);

        const newSocket = io(socketUrl, {
            query: { username: user.username },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('data:updated', () => {
            console.log('Data updated event received, refreshing...');
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.refetchQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            queryClient.invalidateQueries({ queryKey: ['rates'] });
        });

        setSocket(newSocket);

        return () => {
            console.log('Disconnecting socket...');
            newSocket.disconnect();
        };
    }, [user, queryClient]);

    // --- QUERIES ---
    const { data: dashboardData, refetch: refetchDashboard } = useDashboardData(user?.username);
    const { data: rates } = useExchangeRates();
    // We can use dashboardData.assets, but if we have a separate assets query, we can use that too.
    // The original code used /api/assets for assets management and /api/data for dashboard.
    // Dashboard data includes expenses, budget, AND assets.
    // Let's stick to dashboardData for the main source of truth to avoid sync issues.

    // Derived State
    const expenses = dashboardData?.expenses || [];
    const budget = dashboardData?.budget || 0;
    const assets = dashboardData?.assets || [];
    const portfolio = dashboardData?.portfolio || []; // Portfolio list from backend
    // Note: older code fetched /api/portfolio separately in fetchPortfolioValue.
    // WeddingService.getDashboardData calls BOTH /api/data and /api/portfolio and merges them.
    // So 'dashboardData.portfolio' is available.

    // --- CALCULATE PORTFOLIO VALUE ---
    // (Effective for Budget - Respects Toggle)
    const calculateEffectivePortfolioValue = () => {
        if (!portfolio || portfolio.length === 0) return 0;

        // Use live rates if available, else defaults inside Service (but we fetched them via hook)
        const currentRates = rates || {};

        return portfolio.reduce((sum, asset) => {
            if (asset.type === 'TRY_CASH') {
                return sum + asset.amount;
            } else if (dashboardData?.budgetIncluded) {
                // Market assets only if toggle is ON
                const rate = currentRates[asset.type] || 0;
                return sum + (asset.amount * rate);
            }
            return sum;
        }, 0);
    };

    // (Total for Display - All Assets)
    const calculateTotalPortfolioValue = () => {
        if (!portfolio || portfolio.length === 0) return 0;
        const currentRates = rates || {};

        return portfolio.reduce((sum, asset) => {
            if (asset.type === 'TRY_CASH') {
                return sum + asset.amount;
            } else {
                const rate = currentRates[asset.type] || 0;
                return sum + (asset.amount * rate);
            }
        }, 0);
    };

    const portfolioValue = calculateEffectivePortfolioValue();
    const totalPortfolioValue = calculateTotalPortfolioValue();

    // --- MUTATIONS ---
    const addExpenseMutation = useAddExpense();
    const updateBudgetMutation = useUpdateBudget();
    const addAssetMutation = useAddAsset();
    const deleteAssetMutation = useDeleteAsset();
    const updateAssetMutation = useUpdateAsset();
    const deleteExpenseMutation = useDeleteExpense();
    const updateExpenseMutation = useUpdateExpense();
    const batchExpensesMutation = useBatchExpenses();
    const clearAllExpensesMutation = useClearAllExpenses();
    const toggleBudgetMutation = useToggleBudgetInclude();

    // --- ACTIONS WRAPPERS ---
    const addExpense = (data) => addExpenseMutation.mutate({ username: user.username, expenseData: data });
    const updateBudget = (val) => updateBudgetMutation.mutate({ username: user.username, budget: val });
    const addAsset = (data) => addAssetMutation.mutate({ username: user.username, asset: data });
    const deleteAsset = (id) => deleteAssetMutation.mutate({ username: user.username, assetId: id });
    const updateAsset = (id, data) => updateAssetMutation.mutate({ username: user.username, assetId: id, asset: data });
    const deleteExpense = (id) => deleteExpenseMutation.mutate({ id, username: user.username });
    const updateExpense = (id, data) => updateExpenseMutation.mutate({ id, username: user.username, expenseData: data });
    const addBatchExpenses = (list) => batchExpensesMutation.mutate({ username: user.username, expenses: list });
    const clearAllExpenses = () => {
        confirmDialog('TÜM harcamalarınızı silmek istediğinize emin misiniz?', () => {
            clearAllExpensesMutation.mutate({ username: user.username });
        });
    };
    const toggleBudgetInclude = (included) => toggleBudgetMutation.mutate({ username: user.username, included });

    const refreshAssets = () => {
        refetchDashboard();
    };

    const triggerRefresh = () => {
        refetchDashboard();
    };

    const getSummary = () => {
        const totalSpent = expenses
            .filter(e => e.status === 'purchased')
            .reduce((acc, curr) => acc + Number(curr.price), 0);

        // Budget logic same as before (Uses Effective Portfolio Value)
        const effectiveBudget = budget + portfolioValue;
        const remainingBudget = effectiveBudget - totalSpent;

        return {
            totalSpent,
            budget: effectiveBudget,
            remainingBudget,
            count: expenses.length,
            portfolioValue: portfolioValue, // Effective
            totalPortfolioValue: totalPortfolioValue, // Total (Display Only)
            baseBudget: budget
        };
    };

    return (
        <ExpenseContext.Provider value={{
            expenses,
            budget,
            portfolioValue,
            totalPortfolioValue,
            assets,
            portfolio, // Add portfolio export
            rates,
            addExpense,
            addBatchExpenses,
            deleteExpense,
            updateExpense,
            updateBudget,
            getSummary,
            refreshAssets, // Now just refetches dashboard
            clearAllExpenses,
            addAsset,
            deleteAsset,
            updateAsset,
            triggerRefresh, // Now just refetches dashboard
            toggleBudgetInclude,
            budgetIncluded: dashboardData?.budgetIncluded,
            weddingDate: dashboardData?.weddingDate,
            usersMap: dashboardData?.usersMap || {},
            refreshTrigger: 0, // Mocked for compatibility
            socket
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};
