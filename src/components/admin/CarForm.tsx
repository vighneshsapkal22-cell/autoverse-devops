import { useState, useRef } from 'react';
import { Upload, X, Star, Trash2, Loader2, ImagePlus } from 'lucide-react';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import type { Car, CarImage } from '@/types';
import { FUEL_TYPES, TRANSMISSIONS, IMAGE_LABELS } from '@/types';
import { useToast } from '@/context/ToastContext';

interface CarFormProps {
  car: Car | null;
  images: CarImage[];
  onSaved: () => void;
  onCancel: () => void;
}

interface UploadingImage {
  file: File;
  preview: string;
  label: string;
}

export default function CarForm({ car, images: existingImages, onSaved, onCancel }: CarFormProps) {
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    brand: car?.brand ?? '',
    model: car?.model ?? '',
    variant: car?.variant ?? '',
    year: car?.year ?? new Date().getFullYear(),
    price: car?.price ?? 0,
    mileage: car?.mileage ?? 0,
    fuel_type: car?.fuel_type ?? '',
    transmission: car?.transmission ?? '',
    engine: car?.engine ?? '',
    color: car?.color ?? '',
    seating_capacity: car?.seating_capacity ?? 5,
    location: car?.location ?? '',
    description: car?.description ?? '',
    availability: car?.availability ?? 'available',
    condition: car?.condition ?? 'used',
    featured: car?.featured ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImages, setNewImages] = useState<UploadingImage[]>([]);
  const [currentImages, setCurrentImages] = useState<CarImage[]>(existingImages);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const update = (key: string, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const valid = files.filter((f) => f.type.startsWith('image/'));
    if (valid.length < files.length) {
      show('Some files were not images and were skipped.', 'error');
    }

    const max5MB = valid.filter((f) => f.size <= 5 * 1024 * 1024);
    if (max5MB.length < valid.length) {
      show('Some images exceeded 5MB and were skipped.', 'error');
    }

    const newOnes: UploadingImage[] = max5MB.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      label: '',
    }));

    setNewImages((prev) => [...prev, ...newOnes]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeNewImage = (idx: number) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateNewLabel = (idx: number, label: string) => {
    setNewImages((prev) => prev.map((img, i) => (i === idx ? { ...img, label } : img)));
  };

  const deleteExistingImage = (imgId: string) => {
    setDeletedImageIds((prev) => [...prev, imgId]);
    setCurrentImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const setMainImage = (imgId: string) => {
    setCurrentImages((prev) => prev.map((img) => ({ ...img, is_main: img.id === imgId })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.brand.trim() || !form.model.trim()) {
      show('Brand and model are required.', 'error');
      return;
    }
    if (form.year < 1900 || form.year > new Date().getFullYear() + 1) {
      show('Please enter a valid year.', 'error');
      return;
    }
    if (form.price <= 0) {
      show('Price must be greater than zero.', 'error');
      return;
    }

    setSaving(true);

    try {
      let carId = car?.id;

      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        variant: form.variant.trim(),
        year: form.year,
        price: form.price,
        mileage: form.mileage,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        engine: form.engine.trim(),
        color: form.color.trim(),
        seating_capacity: form.seating_capacity,
        location: form.location.trim(),
        description: form.description.trim(),
        availability: form.availability,
        condition: form.condition,
        featured: form.featured,
      };

      if (carId) {
        const { error } = await supabase.from('cars').update(payload).eq('id', carId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('cars').insert(payload).select().single();
        if (error) throw error;
        carId = data.id;
      }

      // Delete removed images
      for (const imgId of deletedImageIds) {
        const img = existingImages.find((i) => i.id === imgId);
        if (img) {
          await supabase.storage.from(STORAGE_BUCKET).remove([img.storage_path]);
        }
        await supabase.from('car_images').delete().eq('id', imgId);
      }

      // Update main image flags for existing images
      for (const img of currentImages) {
        const wasMain = existingImages.find((i) => i.id === img.id)?.is_main;
        if (wasMain !== img.is_main) {
          await supabase.from('car_images').update({ is_main: img.is_main }).eq('id', img.id);
        }
      }

      // Upload new images
      if (newImages.length > 0) {
        setUploading(true);
        const hasMain = currentImages.some((i) => i.is_main);
        let sortOrder = currentImages.length;

        for (let i = 0; i < newImages.length; i++) {
          const newImg = newImages[i];
          const ext = newImg.file.name.split('.').pop() || 'jpg';
          const fileName = `${carId}/${Date.now()}_${i}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, newImg.file, { contentType: newImg.file.type });

          if (upErr) throw upErr;

          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

          const isFirst = i === 0 && !hasMain && currentImages.length === 0;

          const { error: dbErr } = await supabase.from('car_images').insert({
            car_id: carId,
            storage_path: fileName,
            public_url: urlData.publicUrl,
            label: newImg.label,
            is_main: isFirst,
            sort_order: sortOrder++,
          });

          if (dbErr) throw dbErr;
          URL.revokeObjectURL(newImg.preview);
        }
        setUploading(false);
      }

      show(car ? 'Car updated successfully!' : 'Car added successfully!', 'success');
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      show(msg, 'error');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Brand *</label>
            <input required value={form.brand} onChange={(e) => update('brand', e.target.value)} className={inputClass} placeholder="e.g. Toyota" />
          </div>
          <div>
            <label className={labelClass}>Model *</label>
            <input required value={form.model} onChange={(e) => update('model', e.target.value)} className={inputClass} placeholder="e.g. Camry" />
          </div>
          <div>
            <label className={labelClass}>Variant</label>
            <input value={form.variant} onChange={(e) => update('variant', e.target.value)} className={inputClass} placeholder="e.g. 2.5L XLE" />
          </div>
          <div>
            <label className={labelClass}>Year *</label>
            <input required type="number" min="1900" max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => update('year', parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Price (₹) *</label>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', parseFloat(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mileage (km)</label>
            <input type="number" min="0" value={form.mileage} onChange={(e) => update('mileage', parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Specifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Fuel Type</label>
            <select value={form.fuel_type} onChange={(e) => update('fuel_type', e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Transmission</label>
            <select value={form.transmission} onChange={(e) => update('transmission', e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Engine</label>
            <input value={form.engine} onChange={(e) => update('engine', e.target.value)} className={inputClass} placeholder="e.g. 2.0L Turbo" />
          </div>
          <div>
            <label className={labelClass}>Color</label>
            <input value={form.color} onChange={(e) => update('color', e.target.value)} className={inputClass} placeholder="e.g. Pearl White" />
          </div>
          <div>
            <label className={labelClass}>Seating Capacity</label>
            <input type="number" min="1" max="10" value={form.seating_capacity} onChange={(e) => update('seating_capacity', parseInt(e.target.value) || 5)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)} className={inputClass} placeholder="e.g. Mumbai" />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className={`${inputClass} resize-none`} placeholder="Describe the car..." />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Status & Visibility</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Condition</label>
            <select value={form.condition} onChange={(e) => update('condition', e.target.value)} className={inputClass}>
              <option value="used">Used</option>
              <option value="new">New</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Availability</label>
            <select value={form.availability} onChange={(e) => update('availability', e.target.value)} className={inputClass}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer pb-2.5">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update('featured', e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Featured on homepage</span>
            </label>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Car Images</h3>

        {/* Existing images */}
        {currentImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {currentImages.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 aspect-square">
                <img src={img.public_url} alt={img.label} className="w-full h-full object-cover" />
                {img.is_main && (
                  <span className="absolute top-1 left-1 px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold uppercase flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" /> Main
                  </span>
                )}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!img.is_main && (
                    <button type="button" onClick={() => setMainImage(img.id)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500" title="Set as main">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => deleteExistingImage(img.id)} className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {img.label && (
                  <span className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-white text-[10px] text-center py-0.5">{img.label}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New images */}
        {newImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {newImages.map((img, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-blue-300 aspect-square">
                <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
                <select
                  value={img.label}
                  onChange={(e) => updateNewLabel(idx, e.target.value)}
                  className="absolute bottom-0 left-0 right-0 w-full px-1 py-1 bg-slate-900/80 text-white text-[10px] border-none focus:outline-none"
                >
                  <option value="">Label (optional)</option>
                  {IMAGE_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
        >
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          <ImagePlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">Click to upload images</p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB each</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 sticky bottom-0 bg-slate-50 pt-4 pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving || uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploading ? 'Uploading images...' : 'Saving...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {car ? 'Update Car' : 'Add Car'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving || uploading}
          className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
