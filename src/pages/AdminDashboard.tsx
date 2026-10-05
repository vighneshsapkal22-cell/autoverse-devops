import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Eye, Star, LogOut, Car as CarIcon, TrendingUp, CheckCircle, XCircle, Search, Mail, Inbox,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { CarWithImages, Car, CarImage, Enquiry, EnquiryStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import CarForm from '@/components/admin/CarForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

type View = 'list' | 'form' | 'preview' | 'enquiries';

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [cars, setCars] = useState<CarWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('list');
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [editingImages, setEditingImages] = useState<CarImage[]>([]);
  const [previewCar, setPreviewCar] = useState<CarWithImages | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteEnquiryId, setDeleteEnquiryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);

  const fetchCars = useCallback(async () => {
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
  }, []);

  const fetchEnquiries = useCallback(async () => {
    setEnquiriesLoading(true);
    const { data } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    setEnquiries((data ?? []) as Enquiry[]);
    setEnquiriesLoading(false);
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const stats = {
    total: cars.length,
    available: cars.filter((c) => c.availability === 'available').length,
    sold: cars.filter((c) => c.availability === 'sold').length,
    featured: cars.filter((c) => c.featured).length,
  };

  const filtered = cars.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${c.brand} ${c.model} ${c.variant}`.toLowerCase().includes(q);
  });

  const handleAdd = () => {
    setEditingCar(null);
    setEditingImages([]);
    setView('form');
  };

  const handleEdit = (car: CarWithImages) => {
    setEditingCar(car);
    setEditingImages(car.images);
    setView('form');
  };

  const handlePreview = (car: CarWithImages) => {
    setPreviewCar(car);
    setView('preview');
  };

  const handleSaved = () => {
    setView('list');
    setEditingCar(null);
    setEditingImages([]);
    fetchCars();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const car = cars.find((c) => c.id === deleteId);
    if (car) {
      for (const img of car.images) {
        await supabase.storage.from('car-images').remove([img.storage_path]);
      }
    }
    const { error } = await supabase.from('cars').delete().eq('id', deleteId);
    if (error) {
      show('Failed to delete car.', 'error');
    } else {
      show('Car deleted successfully.', 'success');
      fetchCars();
    }
    setDeleteId(null);
  };

  const toggleAvailability = async (car: CarWithImages) => {
    const newStatus = car.availability === 'available' ? 'sold' : 'available';
    const { error } = await supabase
      .from('cars')
      .update({ availability: newStatus })
      .eq('id', car.id);
    if (error) {
      show('Failed to update availability.', 'error');
    } else {
      show(`Marked as ${newStatus}.`, 'success');
      fetchCars();
    }
  };

  const updateEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
    const { error } = await supabase
      .from('enquiries')
      .update({ status })
      .eq('id', enquiryId);
    if (error) {
      show('Failed to update enquiry status.', 'error');
    } else {
      fetchEnquiries();
    }
  };

  const handleDeleteEnquiry = async () => {
    if (!deleteEnquiryId) return;
    const { error } = await supabase.from('enquiries').delete().eq('id', deleteEnquiryId);
    if (error) {
      show('Failed to delete enquiry.', 'error');
    } else {
      show('Enquiry deleted.', 'success');
      fetchEnquiries();
    }
    setDeleteEnquiryId(null);
  };

  const toggleFeatured = async (car: CarWithImages) => {
    const { error } = await supabase
      .from('cars')
      .update({ featured: !car.featured })
      .eq('id', car.id);
    if (error) {
      show('Failed to update featured status.', 'error');
    } else {
      show(!car.featured ? 'Added to featured.' : 'Removed from featured.', 'success');
      fetchCars();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const newEnquiriesCount = enquiries.filter((e) => e.status === 'new').length;

  const statCards = [
    { icon: CarIcon, label: 'Total Cars', value: stats.total, color: 'bg-blue-600' },
    { icon: CheckCircle, label: 'Available', value: stats.available, color: 'bg-emerald-600' },
    { icon: XCircle, label: 'Sold', value: stats.sold, color: 'bg-slate-600' },
    { icon: Mail, label: 'New Enquiries', value: newEnquiriesCount, color: 'bg-rose-500' },
  ];

  const formattedPrice = (p: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  // --- Form View ---
  if (view === 'form') {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 mb-2">
                ← Back to dashboard
              </button>
              <h1 className="text-2xl font-bold text-slate-900">
                {editingCar ? 'Edit Car' : 'Add New Car'}
              </h1>
            </div>
          </div>
          <CarForm
            car={editingCar}
            images={editingImages}
            onSaved={handleSaved}
            onCancel={() => setView('list')}
          />
        </div>
      </div>
    );
  }

  // --- Enquiries View ---
  if (view === 'enquiries') {
    const statusColors: Record<EnquiryStatus, string> = {
      new: 'bg-rose-100 text-rose-700',
      read: 'bg-blue-100 text-blue-700',
      responded: 'bg-emerald-100 text-emerald-700',
    };
    return (
      <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 mb-2">
                ← Back to dashboard
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Enquiries</h1>
              <p className="text-slate-500 text-sm mt-1">Messages from the contact form and car enquiries</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {enquiriesLoading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : enquiries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No enquiries yet.</p>
              <p className="text-sm text-slate-400 mt-1">Messages from the contact and enquiry forms will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enquiries.map((enq) => (
                <div key={enq.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${statusColors[enq.status]}`}>
                          {enq.status}
                        </span>
                        <p className="text-sm font-semibold text-slate-900">{enq.name}</p>
                        <span className="text-xs text-slate-400">
                          {new Date(enq.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      {enq.subject && <p className="text-sm font-medium text-slate-700 mb-1">{enq.subject}</p>}
                      <p className="text-sm text-slate-500 leading-relaxed">{enq.message}</p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                        <a href={`mailto:${enq.email}`} className="hover:text-blue-600 transition-colors">{enq.email}</a>
                        {enq.phone && <span>{enq.phone}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <select
                        value={enq.status}
                        onChange={(e) => updateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="responded">Responded</option>
                      </select>
                      <button
                        onClick={() => setDeleteEnquiryId(enq.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors mx-auto"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ConfirmDialog
          open={!!deleteEnquiryId}
          title="Delete this enquiry?"
          message="This will permanently remove the enquiry message."
          confirmLabel="Delete"
          onConfirm={handleDeleteEnquiry}
          onCancel={() => setDeleteEnquiryId(null)}
        />
      </div>
    );
  }

  // --- Preview View ---
  if (view === 'preview' && previewCar) {
    const mainImage = previewCar.images.find((i) => i.is_main) ?? previewCar.images[0];
    return (
      <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-slate-800 mb-4">
            ← Back to dashboard
          </button>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="aspect-[4/3] bg-slate-100">
              {mainImage ? (
                <img src={mainImage.public_url} alt={previewCar.brand} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <CarIcon className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${previewCar.availability === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {previewCar.availability}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${previewCar.condition === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {previewCar.condition}
                </span>
                {previewCar.featured && <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-100 text-amber-700">Featured</span>}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{previewCar.brand} {previewCar.model}</h2>
              {previewCar.variant && <p className="text-slate-500">{previewCar.variant}</p>}
              <p className="text-2xl font-bold text-blue-600 mt-3">{formattedPrice(previewCar.price)}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm">
                <div><span className="text-slate-400">Year</span><p className="font-semibold">{previewCar.year}</p></div>
                <div><span className="text-slate-400">Mileage</span><p className="font-semibold">{new Intl.NumberFormat('en-IN').format(previewCar.mileage)} km</p></div>
                <div><span className="text-slate-400">Fuel</span><p className="font-semibold">{previewCar.fuel_type || '—'}</p></div>
                <div><span className="text-slate-400">Transmission</span><p className="font-semibold">{previewCar.transmission || '—'}</p></div>
              </div>
              {previewCar.description && <p className="text-sm text-slate-600 mt-4 leading-relaxed">{previewCar.description}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="min-h-screen bg-slate-50 pt-16 lg:pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your car inventory</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setView('enquiries'); fetchEnquiries(); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-all"
            >
              <Inbox className="w-4 h-4" />
              Enquiries
              {newEnquiriesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">{newEnquiriesCount}</span>
              )}
            </button>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Car
            </button>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search cars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <CarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">{search ? 'No cars match your search.' : 'No cars yet.'}</p>
            {!search && (
              <button onClick={handleAdd} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500">
                <Plus className="w-4 h-4" /> Add your first car
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider">Car</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider hidden md:table-cell">Price</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider hidden lg:table-cell">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((car) => {
                  const mainImg = car.images.find((i) => i.is_main) ?? car.images[0];
                  return (
                    <tr key={car.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            {mainImg ? (
                              <img src={mainImg.public_url} alt={car.brand} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><CarIcon className="w-6 h-6" /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{car.brand} {car.model}</p>
                            <p className="text-xs text-slate-500">{car.year} · {car.images.length} images</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell font-medium text-slate-700">{formattedPrice(car.price)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${car.availability === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {car.availability}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${car.condition === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {car.condition}
                          </span>
                          {car.featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handlePreview(car)} className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-colors" title="Preview">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(car)} className="w-8 h-8 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => toggleAvailability(car)} className="w-8 h-8 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 flex items-center justify-center transition-colors" title="Toggle availability">
                            {car.availability === 'available' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => toggleFeatured(car)} className="w-8 h-8 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 flex items-center justify-center transition-colors" title="Toggle featured">
                            <Star className={`w-4 h-4 ${car.featured ? 'text-amber-500 fill-amber-500' : ''}`} />
                          </button>
                          <button onClick={() => setDeleteId(car.id)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 flex items-center justify-center transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete this car?"
        message="This will permanently delete the car and all its images. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
