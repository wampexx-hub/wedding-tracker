import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

const InstallmentCard = ({ expense }) => {
    // Calculate progress
    const startDate = new Date(expense.date);
    const today = new Date();
    const monthDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());

    // Logic:
    // monthDiff = 0 -> 1st month. We assume the 1st installment is paid/active.
    // So Paid/Current = monthDiff + 1.

    const rawCurrentStep = monthDiff + 1;
    const totalSteps = expense.installmentCount;

    // If rawCurrentStep >= totalSteps, it means we are in the last month or past it.
    // The user expects "12/12" to be "Completed".
    // So we treat currentStep as "Paid/Processed" count.

    const currentStep = Math.min(Math.max(rawCurrentStep, 1), totalSteps);
    const isCompleted = currentStep >= totalSteps;

    const progressPercent = (currentStep / totalSteps) * 100;

    // Remaining debt
    // If currentStep is 12 and total is 12, remaining should be 0 to match "Completed" status.
    const remainingSteps = totalSteps - currentStep;
    const remainingDebt = remainingSteps * expense.monthlyPayment;

    const day = new Date(expense.date).getDate();

    return (
        <div className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center ${isCompleted ? 'border-green-100' : 'border-transparent hover:border-champagne/30'}`}>

            {/* Left: Date Box */}
            <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border ${isCompleted ? 'bg-green-50 border-green-100 text-green-600' : 'bg-champagne/10 border-champagne/20 text-champagne'}`}>
                    <span className="text-xs font-bold uppercase">Gün</span>
                    <span className="text-2xl font-bold font-serif">{day}</span>
                </div>
            </div>

            {/* Middle: Info & Progress */}
            <div className="flex-1 w-full">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-bold text-gray-900 text-lg">{expense.title}</h4>
                        <p className="text-sm text-gray-500">{expense.vendor}</p>
                    </div>
                    <div className="text-right md:hidden">
                        <span className="text-xs font-medium text-gray-400">Kalan Borç</span>
                        <p className="text-sm font-semibold text-gray-700">
                            {remainingDebt.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${isCompleted ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'}`}>
                            {currentStep} / {totalSteps} Taksit
                        </div>
                        <div className="hidden md:block text-xs font-medium text-gray-400">
                            Kalan Borç: <span className="text-gray-700 font-semibold">{remainingDebt.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                        <div
                            style={{ width: `${progressPercent}%` }}
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-yellow-400'}`}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Right: Amount & Action */}
            <div className="flex-shrink-0 w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Aylık Tutar</p>
                    <p className="font-bold text-xl text-gray-900 font-serif">
                        {Number(expense.monthlyPayment).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </p>
                </div>

                <div className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 ${isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                    }`}>
                    {isCompleted ? (
                        <>
                            <Check size={16} /> Tamamlandı
                        </>
                    ) : (
                        <>
                            <AlertCircle size={16} /> Ödeniyor
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstallmentCard;
