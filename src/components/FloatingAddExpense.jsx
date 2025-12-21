import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExpenseForm from './ExpenseForm';

const FloatingAddExpense = ({ isOpen, onClose, onOpen, showButton = true }) => {
    const [internalOpen, setInternalOpen] = useState(false);

    // Use controlled or uncontrolled state
    const isModalOpen = isOpen !== undefined ? isOpen : internalOpen;
    const handleClose = onClose || (() => setInternalOpen(false));
    const handleOpen = () => {
        if (onOpen) {
            onOpen(); // Controlled mode: notify parent
        } else {
            setInternalOpen(true); // Uncontrolled mode: use internal state
        }
    };

    return (
        <>
            {/* FAB Button - Only show on desktop (hidden on mobile where bottom nav has it) */}
            {showButton && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hidden md:flex items-center justify-center hover:-translate-y-1 active:scale-95"
                >
                    <Plus size={28} className="text-white" />
                </button>
            )}

            {/* Mobile Modal with Framer Motion (Aceternity Style) */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        {/* Mobile: Bottom Sheet with Drag (md:hidden) */}
                        <div className="md:hidden">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                                onClick={handleClose}
                            />

                            {/* Bottom Sheet */}
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                drag="y"
                                dragConstraints={{ top: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    if (offset.y > 100) {
                                        handleClose();
                                    }
                                }}
                                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] overflow-hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
                            >
                                {/* Drag Handle */}
                                <div className="w-16 h-1.5 bg-gray-200/80 rounded-full mx-auto mt-4 mb-2 cursor-grab active:cursor-grabbing" />

                                {/* Content - Let ExpenseForm control its own height */}
                                <ExpenseForm
                                    isModal={true}
                                    onSuccess={handleClose}
                                    onCancel={handleClose}
                                />
                            </motion.div>
                        </div>

                        {/* Desktop: Centered Modal (hidden md:flex) */}
                        <div className="hidden md:block fixed inset-0 z-50">
                            <div className="flex items-center justify-center p-4 h-full lg:pl-[280px]">
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                                    onClick={handleClose}
                                />

                                {/* Modal Content */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10"
                                >
                                    {/* Close Button */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <button
                                            onClick={handleClose}
                                            className="p-2 bg-white/80 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
                                        >
                                            <X size={20} className="text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="overflow-y-auto flex-1 p-6">
                                        <ExpenseForm
                                            isModal={true}
                                            onSuccess={handleClose}
                                            onCancel={handleClose}
                                        />
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingAddExpense;
