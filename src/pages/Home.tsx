import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Award, Headphones, TrendingUp, Car as CarIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CarWithImages, Car, CarImage } from '@/types';
import CarCard from '@/components/CarCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const [cars, setCars] = useState<CarWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: carData } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (!carData) {
        setLoading(false);
        return;
      }

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

  const featuredCars = cars.filter((c) => c.featured && c.availability === 'available').slice(0, 3);
  const recentCars = cars.filter((c) => c.availability === 'available').slice(0, 6);
  const displayCars = featuredCars.length >= 3 ? featuredCars : recentCars;

  const stats = [
    { value: cars.length, label: 'Cars Listed' },
    { value: cars.filter((c) => c.availability === 'available').length, label: 'Available Now' },
    { value: new Set(cars.map((c) => c.brand)).size, label: 'Brands' },
  { value: '10+', label: 'Years Experience' },
  ];

  const features = [
    { icon: ShieldCheck, title: 'Verified Quality', desc: 'Every car undergoes a 150-point inspection' },
    { icon: Award, title: 'Certified Dealers', desc: 'Trusted and authorized dealership network' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer service anytime' },
    { icon: TrendingUp, title: 'Best Prices', desc: 'Competitive pricing with transparent deals' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/3802514/pexels-photo-3802514.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Luxury car showroom"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6 border border-blue-500/30">
              <CarIcon className="w-3.5 h-3.5" />
              Premium Car Dealership
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Find Your Perfect
              <span className="block text-blue-400">Dream Car Today</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              Explore our curated collection of premium vehicles. From everyday commuters to luxury performance cars, we have something for every driver.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/cars"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:shadow-xl hover:shadow-blue-500/30"
              >
                Browse Cars
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-all backdrop-blur-sm"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                {featuredCars.length >= 3 ? 'Featured Cars' : 'Latest Arrivals'}
              </h2>
              <p className="text-slate-500 mt-2">Handpicked vehicles just for you</p>
            </div>
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All Cars
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : displayCars.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <CarIcon className="w-12 h-12 mx-auto mb-3" />
              <p>No cars available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              Why Choose AutoVerse?
            </h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
              We make car buying simple, transparent, and trustworthy
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:bg-white transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Ready to Find Your Next Car?
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            Browse our full inventory and schedule a test drive today. Your dream car is just a click away.
          </p>
          <Link
            to="/cars"
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:shadow-xl hover:shadow-blue-500/30"
          >
            Explore Inventory
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
