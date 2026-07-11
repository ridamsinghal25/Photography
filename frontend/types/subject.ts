export type SubjectFields = {
  name?: string;
  instaHandle?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  country?: string;
  portfolio_url?: string;
};

export type SubjectCreateInput = SubjectFields & { name: string };

export type Subject = {
  id: string;
  name: string;
  instaHandle: string | null;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  country: string | null;
  portfolio_url: string | null;
  created_at: string;
  updated_at: string;
};
