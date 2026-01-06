import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Star, Phone, Instagram, ExternalLink, Store, Filter } from 'lucide-react';

const VENDOR_CATEGORIES = [
    "Düğün Mekanı", "Fotoğrafçı", "Gelinlik", "Damatlık", "Organizasyon",
    "Kuaför/Makyaj", "Davetiye", "Nikah Şekeri", "Çiçekçi", "Müzik", "Catering", "Araç Kiralama"
];

const TURKISH_CITIES = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

const VendorsPage = () => {
    const { user } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState(user?.city || 'İstanbul');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchVendors();
    }, [selectedCity, selectedCategory]);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCity && selectedCity !== 'all') params.append('city', selectedCity);
            if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);

            const response = await fetch(`/api/vendors?${params.toString()}`);
            const data = await response.json();
            setVendors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const featuredVendors = vendors.filter(v => v.is_featured);
    const otherVendors = vendors.filter(v => !v.is_featured || searchTerm); // Show all if searching

    // Filter by search term
    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayList = searchTerm ? filteredVendors : otherVendors;

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-white rounded-b-3xl shadow-sm border-b border-gray-100 p-6 -mt-4 pt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-serif text-2xl font-bold text-gray-900">Firmalar</h2>

                    {/* City Selector */}
                    <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-pink-50 text-pink-700 rounded-full text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-pink-200 cursor-pointer"
                        >
                            <option value="all">Tüm Şehirler</option>
                            {TURKISH_CITIES.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Firma veya kategori ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-100 focus:bg-white transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Featured Section (Only when not searching) */}
            {!searchTerm && featuredVendors.length > 0 && (
                <div className="pl-6">
                    <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                        <Star className="text-amber-400 fill-amber-400" size={18} />
                        Öne Çıkanlar
                    </h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 pr-6 snap-x snap-mandatory hide-scrollbar">
                        {featuredVendors.map(vendor => (
                            <div
                                key={vendor.id}
                                className="min-w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden snap-center relative group"
                            >
                                <div className="h-40 bg-gray-200 relative">
                                    {vendor.image_url ? (
                                        <img src={vendor.image_url} alt={vendor.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <Store size={40} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                        Özel
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-gray-900 truncate">{vendor.name}</h4>
                                    <p className="text-xs text-pink-600 font-medium mb-1">{vendor.category}</p>
                                    <div className="flex gap-2 mt-3">
                                        <a href={vendor.contact_info?.instagram ? `https://instagram.com/${vendor.contact_info.instagram.replace('@', '')}` : '#'} target="_blank" className="flex-1 bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-pink-600 py-2 rounded-lg text-center text-xs font-bold transition-colors">
                                            Instagram
                                        </a>
                                        <a href={vendor.contact_info?.phone ? `tel:${vendor.contact_info.phone}` : '#'} className="flex-1 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 py-2 rounded-lg text-center text-xs font-bold transition-colors">
                                            Ara
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="px-6">
                <div className="flex items-center overflow-x-auto gap-2 pb-2 hide-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
                        ${selectedCategory === 'all'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        Tümü
                    </button>
                    {VENDOR_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
                            ${selectedCategory === cat
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vendor List */}
            <div className="px-6 space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Yükleniyor...</div>
                ) : displayList.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Store size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Bu kriterlerde firma bulunamadı.</p>
                        <p className="text-xs text-gray-400 mt-1">Farklı bir kategori veya şehir deneyin.</p>
                    </div>
                ) : (
                    displayList.map(vendor => (
                        <div key={vendor.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-all">
                            <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                                {vendor.image_url ? (
                                    <img src={vendor.image_url} alt={vendor.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Store size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 truncate">{vendor.name}</h4>
                                        <p className="text-xs text-pink-600 font-medium">{vendor.category}</p>
                                    </div>
                                    {vendor.rank > 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded">#{vendor.rank}</span>}
                                </div>

                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <MapPin size={10} /> {vendor.city}
                                </p>

                                <div className="flex gap-2 mt-auto pt-2">
                                    {vendor.contact_info?.website && (
                                        <a href={vendor.contact_info.website} target="_blank" className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                            <ExternalLink size={16} />
                                        </a>
                                    )}
                                    {vendor.contact_info?.instagram && (
                                        <a href={`https://instagram.com/${vendor.contact_info.instagram.replace('@', '')}`} target="_blank" className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-pink-50 hover:text-pink-600 transition-colors">
                                            <Instagram size={16} />
                                        </a>
                                    )}
                                    {vendor.contact_info?.phone && (
                                        <a href={`tel:${vendor.contact_info.phone}`} className="ml-auto px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                                            <Phone size={14} /> Ara
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="h-4" /> {/* Bottom spacer */}
        </div>
    );
};

export default VendorsPage;
