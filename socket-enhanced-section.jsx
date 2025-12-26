import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
    useDashboardData,
    useExchangeRates,
    useAddExpense,
    useUpdateBudget,
    useAddAsset,
    useDeleteAsset,
    useUpdateAsset,
    useDeleteExpense,
    useUpdateExpense,
    useBatchExpenses,
    useClearAllExpenses,
    useToggleBudgetInclude
} from '../hooks/useExpensesQuery';
import io from 'socket.io-client';

const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- SOCKET.IO INTEGRATION (ENHANCED DEBUGGING) ---
    useEffect(() => {
        if (!user) return;

        console.log('🔌 [SOCKET] Initializing connection...');
        console.log('🔌 [SOCKET] Server:', window.location.origin);
        console.log('🔌 [SOCKET] Username:', user.username);

        const socket = io(window.location.origin, {
            query: { username: user.username },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('✅ [SOCKET] Connected successfully!');
            console.log('✅ [SOCKET] Socket ID:', socket.id);
            console.log('✅ [SOCKET] Transport:', socket.io.engine.transport.name);
            console.log('✅ [SOCKET] User room:', user.username);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ [SOCKET] Connection error:', error);
            console.error('❌ [SOCKET] Error details:', error.message);
        });

        socket.on('data:updated', () => {
            const timestamp = new Date().toISOString();
            console.log('🔔 [SOCKET] DATA UPDATED EVENT RECEIVED!');
            console.log('🔔 [SOCKET] Timestamp:', timestamp);
            console.log('🔔 [SOCKET] User:', user.username);

            // Visual notification
            const toast = document.createElement('div');
            toast.textContent = `🔔 Veri güncellendi! ${new Date().toLocaleTimeString('tr-TR')}`;
            toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;z-index:9999;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideIn 0.3s ease-out;';
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, 2700);

            // Invalidate queries
            console.log('🔔 [SOCKET] Invalidating queries...');
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            console.log('🔔 [SOCKET] Queries invalidated successfully');
        });

        socket.on('disconnect', (reason) => {
            console.log('⚠️ [SOCKET] Disconnected');
            console.log('⚠️ [SOCKET] Reason:', reason);
            if (reason === 'io server disconnect') {
                console.log('⚠️ [SOCKET] Server forced disconnect, reconnecting...');
                socket.connect();
            }
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 [SOCKET] Reconnected after', attemptNumber, 'attempts');
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 [SOCKET] Reconnection attempt', attemptNumber);
        });

        socket.on('reconnect_error', (error) => {
            console.error('❌ [SOCKET] Reconnection error:', error);
        });

        return () => {
            console.log('🔌 [SOCKET] Cleaning up connection...');
            socket.disconnect();
        };
    }, [user, queryClient]);

// REST OF THE FILE REMAINS THE SAME...
// (This is just the Socket.io section replacement)
