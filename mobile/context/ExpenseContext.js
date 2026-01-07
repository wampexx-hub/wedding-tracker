import React, { createContext, useContext } from 'react';

const ExpenseContext = createContext();

export const useExpenses = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
    // Minimal implementation for now - mobile doesn't use socket subscriptions
    // Data is fetched directly in screens

    const value = {
        expenses: [],
        // Add other methods as needed
    };

    return (
        <ExpenseContext.Provider value={value}>
            {children}
        </ExpenseContext.Provider>
    );
};
