import { Link } from 'react-router-dom';
import { Gauge, Fuel, Settings, MapPin, Calendar } from 'lucide-react';
import type { CarWithImages } from '@/types';

export default function CarCard({ car }: { car: CarWithImages }) {
  const mainImage = car.images.find((img) => img.is_main) ?? car.images[0];
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(car.price);

  const formattedMileage = new Intl.NumberFormat('en-IN').format(car.mileage) + ' km';

  return (
    <Link
      to={`/cars/${car.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-2xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {mainImage ? (
          <img
            src={mainImage.public_url}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Gauge className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
              car.condition === 'new' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
            }`}
          >
            {car.condition}
          </span>
          {car.featured && (
            <span className="px-2.5 py-1 rounded-md bg-amber-400 text-amber-900 text-xs font-bold uppercase tracking-wide">
              Featured
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
              car.availability === 'available'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-white'
            }`}
          >
            {car.availability}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {car.brand} {car.model}
            </h3>
            {car.variant && (
              <p className="text-sm text-slate-500 mt-0.5">{car.variant}</p>
            )}
          </div>
          <span className="text-lg font-bold text-blue-600 whitespace-nowrap">{formattedPrice}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{car.year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span className="truncate">{formattedMileage}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-slate-400" />
            <span>{car.fuel_type || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>{car.transmission || '—'}</span>
          </div>
        </div>

        {car.location && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
            <MapPin className="w-4 h-4" />
            <span>{car.location}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
