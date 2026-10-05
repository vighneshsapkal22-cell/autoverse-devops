export type Availability = 'available' | 'sold';
export type CarCondition = 'new' | 'used';

export interface Car {
  id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  engine: string;
  color: string;
  seating_capacity: number;
  location: string;
  description: string;
  availability: Availability;
  condition: CarCondition;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarImage {
  id: string;
  car_id: string;
  storage_path: string;
  public_url: string;
  label: string;
  is_main: boolean;
  sort_order: number;
  created_at: string;
}

export interface CarWithImages extends Car {
  images: CarImage[];
}

export type EnquiryStatus = 'new' | 'read' | 'responded';

export interface Enquiry {
  id: string;
  car_id: string | null;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
}

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'];
export const TRANSMISSIONS = ['Manual', 'Automatic', 'Semi-Automatic', 'CVT'];
export const IMAGE_LABELS = [
  'Front',
  'Front-Left',
  'Front-Right',
  'Side',
  'Rear',
  'Interior',
  'Dashboard',
  'Seats',
  'Steering',
  'Infotainment',
  'Engine',
  'Boot',
  'Other',
];
