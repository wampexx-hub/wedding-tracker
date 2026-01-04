import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WeddingService from '../services/WeddingService';

// --- QUERIES ---

export const useDashboardData = (username) => {
    return useQuery({
        queryKey: ['dashboard', username],
        queryFn: () => WeddingService.getDashboardData(username),
        enabled: !!username,
    });
};

export const useAssets = (username) => {
    return useQuery({
        queryKey: ['assets', username],
        queryFn: () => WeddingService.getAssets(username),
        enabled: !!username,
    });
};

export const useExchangeRates = () => {
    return useQuery({
        queryKey: ['rates'],
        queryFn: () => WeddingService.getExchangeRates(),
        staleTime: 1000 * 60 * 60 * 6, // 6 hours to match backend cache schedule
    });
};

// --- MUTATIONS ---

export const useAddExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, expenseData }) => {
            // Logic from ExpenseContext.addExpense to adapt
            // Note: WeddingService doesn't have addExpense yet (it was in Context), 
            // but WeddingService.addAsset exists. 
            // We should probably move Expense API calls to WeddingService first or define them here.
            // For now, let's keep fetch logic here or move to Service. 
            // BEST PRACTICE: Move to Service. But to match existing Context logic:

            let body;
            let headers = {};

            if (expenseData instanceof FormData) {
                // FormData logic... similar to Context
                const dataStr = expenseData.get('data');
                const dataObj = JSON.parse(dataStr);
                dataObj.id = Date.now().toString();
                dataObj.createdAt = new Date().toISOString();
                dataObj.status = dataObj.status || 'planned';
                dataObj.username = username;
                expenseData.set('data', JSON.stringify(dataObj));
                body = expenseData;
            } else {
                const newExpense = {
                    ...expenseData,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    status: expenseData.status || 'planned',
                    username: username
                };
                body = JSON.stringify(newExpense);
                headers['Content-Type'] = 'application/json';
            }

            return fetch('/api/expenses', { method: 'POST', headers, body }).then(res => res.json());
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
        },
    });
};

export const useUpdateBudget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, budget }) => {
            return fetch('/api/budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, budget })
            }).then(res => res.json());
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
        },
    });
};

export const useAddAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, asset }) => WeddingService.addAsset(username, asset),
        onSuccess: (_, variables) => {
            // Adding asset might affect budget if it's cash or if toggle is on? 
            // API returns updated budget sometimes.
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
            queryClient.invalidateQueries({ queryKey: ['assets', variables.username] });
        },
    });
};

export const useDeleteAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, assetId }) => WeddingService.deleteAsset(username, assetId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
            queryClient.invalidateQueries({ queryKey: ['assets', variables.username] });
        }
    });
};

export const useUpdateAsset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, assetId, asset }) => WeddingService.updateAsset(username, assetId, asset),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
            queryClient.invalidateQueries({ queryKey: ['assets', variables.username] });
        }
    });
};

// --- MISSING MUTATIONS ---

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => fetch(`/api/expenses/${id}`, { method: 'DELETE' }),
        onSuccess: (_, variables) => {
            // Invalidate dashboard to refresh expenses and budget
            // We don't have username in variables (it's just id), 
            // but we can invalidate all dashboard queries or modify mutation to accept username
            // Better: Allow passing username or invalidate all 'dashboard'
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, expenseData }) => {
            let body;
            let headers = {};

            if (expenseData instanceof FormData) {
                body = expenseData;
            } else {
                body = JSON.stringify(expenseData);
                headers['Content-Type'] = 'application/json';
            }

            return fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers,
                body
            }).then(res => res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
};

export const useBatchExpenses = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, expenses }) => {
            return fetch('/api/expenses/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, expenses })
            }).then(res => res.json());
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
        }
    });
};

export const useClearAllExpenses = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username }) => fetch(`/api/expenses?username=${username}`, { method: 'DELETE' }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
        }
    });
};

export const useToggleBudgetInclude = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ username, included }) => {
            return fetch(`/api/portfolio/${username}/budget-toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ included })
            }).then(res => res.json());
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', variables.username] });
        }
    });
};
