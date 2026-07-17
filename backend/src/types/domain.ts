export interface Address {
  line1: string;
  line2: string;
}

export interface UserProfileSnapshot {
  _id?: unknown;
  name: string;
  email: string;
  image: string;
  phone: string;
  address: Address;
  gender: string;
  dob: string;
}

export interface DoctorSnapshot {
  _id?: unknown;
  name: string;
  email?: string;
  image: string;
  speciality: string;
  degree: string;
  experience: string;
  about: string;
  available: boolean;
  fees: number;
  address: Address;
  date: number;
  slots_booked?: Record<string, string[]>;
}
