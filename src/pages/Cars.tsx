import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Car as CarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CarWithImages, Car, CarImage } from '@/types';
import { FUEL_TYPES, TRANSMISSIONS } from '@/types';
import CarCard from '@/components/CarCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Cars() {
  const [cars, setCars] = useState<CarWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [availability, setAvailability] = useState('');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    (async () => {
      const { data: carData } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: imgData } = await supabase
        .from('car_images')
        .select('*')
        .order('sort_order', { ascending: true });

      const imagesByCar = (imgData ?? []).reduce<Record<string, CarImage[]>>((acc, img) => {
        (acc[img.car_id] ??= []).push(img);
        return acc;
      }, {});

      const carsWithImages: CarWithImages[] = (carData as Car[]).map((c) => ({
        ...c,
        images: imagesByCar[c.id] ?? [],
      }));

      setCars(carsWithImages);
      setLoading(false);
    })();
  }, []);

  const brands = useMemo(() => Array.from(new Set(cars.map((c) => c.brand))).sort(), [cars]);

  const filtered = useMemo(() => {
    return cars.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${c.brand} ${c.model} ${c.variant}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (brand && c.brand !== brand) return false;
      if (fuelType && c.fuel_type !== fuelType) return false;
      if (transmission && c.transmission !== transmission) return false;
      if (availability && c.availability !== availability) return false;
      if (condition && c.condition !== condition) return false;
      if (minPrice && c.price < parseFloat(minPrice)) return false;
      if (maxPrice && c.price > parseFloat(maxPrice)) return false;
      return true;
    });
  }, [cars, search, brand, fuelType, transmission, availability, condition, minPrice, maxPrice]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setBrand('');
    setFuelType('');
    setTransmission('');
    setAvailability('');
    setCondition('');
    setMinPrice('');
    setMaxPrice('');
  }, []);

  const hasFilters = brand || fuelType || transmission || availability || condition || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">Browse Cars</h1>
          <p className="text-slate-500 mt-2">
            {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'car' : 'cars'} found`}
          </p>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by brand, model, or variant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
              showFilters || hasFilters
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <X className="w-4 h-4" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Brand</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Types</option>
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All</option>
                  {TRANSMISSIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Availability</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Min Price (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Max Price (₹)</label>
                <input
                  type="number"
                  placeholder="No limit"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <CarIcon className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-500">No cars match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
