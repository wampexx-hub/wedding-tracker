import React, { useEffect, useState } from 'react';
import { Store, Star, MapPin, ExternalLink, Phone, Instagram } from 'lucide-react';

const VendorRecommendations = ({ city, category }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!category) {
            setVendors([]);
            return;
        }
        fetchVendors();
    }, [city, category]);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (city && city !== 'all') params.append('city', city);
            if (category) params.append('category', category);

            const response = await fetch(`/api/vendors?${params.toString()}`);
            const data = await response.json();
            setVendors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching vendor recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;
    if (vendors.length === 0) return null;

    return (
        <div className="mt-6 mb-2 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-3">
                <Store size={18} className="text-pink-600" />
                <h3 className="font-semibold text-gray-800 text-sm">
                    {category} için Önerilenler ({city || 'Tümü'})
                </h3>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
                {vendors.map((vendor) => (
                    <div
                        key={vendor.id}
                        className="min-w-[260px] max-w-[260px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-center group hover:shadow-md transition-all duration-300"
                    >
                        {/* Image Area */}
                        <div className="h-32 bg-gray-100 relative overflow-hidden">
                            {vendor.image_url ? (
                                <img
                                    src={vendor.image_url}
                                    alt={vendor.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                    <Store size={32} />
                                </div>
                            )}

                            {vendor.is_featured && (
                                <div className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                    <Star size={10} fill="currentColor" /> Öne Çıkan
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="p-3">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-gray-900 truncate pr-2">{vendor.name}</h4>
                                {vendor.rank > 0 && (
                                    <div className="flex items-center gap-0.5 text-xs font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                                        {vendor.rank} <span className="text-[9px] text-amber-400">PUAN</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                <MapPin size={12} />
                                {vendor.city}
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                <a
                                    href={vendor.contact_info?.website || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors border
                                    ${vendor.contact_info?.website
                                            ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                            : 'border-transparent text-gray-300 cursor-not-allowed'}`}
                                    onClick={(e) => !vendor.contact_info?.website && e.preventDefault()}
                                >
                                    Web <ExternalLink size={12} />
                                </a>

                                <div className="flex gap-1">
                                    <a
                                        href={vendor.contact_info?.instagram ? `https://instagram.com/${vendor.contact_info.instagram.replace('@', '')}` : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex-1 flex items-center justify-center rounded-lg text-white transition-colors
                                        ${vendor.contact_info?.instagram
                                                ? 'bg-gradient-to-tr from-purple-500 to-pink-500 hover:opacity-90'
                                                : 'bg-gray-200 cursor-not-allowed'}`}
                                        onClick={(e) => !vendor.contact_info?.instagram && e.preventDefault()}
                                    >
                                        <Instagram size={14} />
                                    </a>
                                    <a
                                        href={vendor.contact_info?.phone ? `tel:${vendor.contact_info.phone}` : '#'}
                                        className={`flex-1 flex items-center justify-center rounded-lg text-white transition-colors
                                        ${vendor.contact_info?.phone
                                                ? 'bg-green-500 hover:bg-green-600'
                                                : 'bg-gray-200 cursor-not-allowed'}`}
                                        onClick={(e) => !vendor.contact_info?.phone && e.preventDefault()}
                                    >
                                        <Phone size={14} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VendorRecommendations;
