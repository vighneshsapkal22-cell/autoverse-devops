import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Gauge, Fuel, Settings, Calendar, MapPin, Palette, Users, Wrench, Phone, Mail, CheckCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CarWithImages, Car, CarImage } from '@/types';
import ImageGallery from '@/components/ImageGallery';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/context/ToastContext';

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();
  const [car, setCar] = useState<CarWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiry, setEnquiry] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: carData } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!carData) {
        setLoading(false);
        return;
      }

      const { data: imgData } = await supabase
        .from('car_images')
        .select('*')
        .eq('car_id', id)
        .order('sort_order', { ascending: true });

      setCar({
        ...(carData as Car),
        images: (imgData ?? []) as CarImage[],
      });
      setLoading(false);
    })();
  }, [id]);

  const formattedPrice = car
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(car.price)
    : '';

  const specs = car
    ? [
        { icon: Calendar, label: 'Year', value: car.year },
        { icon: Gauge, label: 'Mileage', value: `${new Intl.NumberFormat('en-IN').format(car.mileage)} km` },
        { icon: Fuel, label: 'Fuel Type', value: car.fuel_type || '—' },
        { icon: Settings, label: 'Transmission', value: car.transmission || '—' },
        { icon: Wrench, label: 'Engine', value: car.engine || '—' },
        { icon: Palette, label: 'Color', value: car.color || '—' },
        { icon: Users, label: 'Seating', value: `${car.seating_capacity} seats` },
        { icon: MapPin, label: 'Location', value: car.location || '—' },
      ]
    : [];

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('enquiries').insert({
      car_id: car?.id ?? null,
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      subject: `Enquiry for ${car?.brand} ${car?.model}`,
      message: enquiry.message,
    });
    setSubmitting(false);
    if (error) {
      show('Failed to send enquiry. Please try again.', 'error');
      return;
    }
    setEnquiryOpen(false);
    setEnquiry({ name: '', email: '', phone: '', message: '' });
    show('Enquiry sent! Our team will contact you shortly.', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 pt-20 text-center px-4">
        <p className="text-2xl font-bold text-slate-700">Car not found</p>
        <p className="text-slate-500 mt-2">This listing may have been removed.</p>
        <Link to="/cars" className="mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors">
          Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-3">
            <ImageGallery images={car.images} carTitle={`${car.brand} ${car.model}`} />
          </div>

          {/* Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                  car.condition === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {car.condition}
              </span>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${
                  car.availability === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {car.availability}
              </span>
              {car.featured && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {car.brand} {car.model}
            </h1>
            {car.variant && <p className="text-lg text-slate-500 mt-1">{car.variant}</p>}

            <div className="mt-4">
              <p className="text-3xl font-bold text-blue-600">{formattedPrice}</p>
            </div>

            {car.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{car.description}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => setEnquiryOpen(true)}
                disabled={car.availability === 'sold'}
                className="w-full px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {car.availability === 'sold' ? 'Sold Out' : 'Enquire Now'}
              </button>
              <a
                href="tel:+919876543210"
                className="w-full px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Dealer
              </a>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Specifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {specs.map((s, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-slate-400">
                  <s.icon className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enquiry modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setEnquiryOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Enquire about this car</h3>
            <p className="text-sm text-slate-500 mt-1">{car.brand} {car.model} · {formattedPrice}</p>
            <form onSubmit={handleEnquiry} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  required
                  value={enquiry.name}
                  onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={enquiry.email}
                  onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
                <input
                  required
                  value={enquiry.phone}
                  onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Message</label>
                <textarea
                  rows={3}
                  value={enquiry.message}
                  onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="I'm interested in this car..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? 'Sending...' : 'Send Enquiry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
