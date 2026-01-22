-- =====================================================
-- LA PATIENCE TV - Complete Database Schema
-- =====================================================

-- 1. Create ENUM types
CREATE TYPE public.app_role AS ENUM ('admin', 'commercial', 'technician');
CREATE TYPE public.payment_method AS ENUM ('mtn_momo', 'orange_money', 'cash');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'suspended');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (CRITICAL: separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 4. Create zones table
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  quartier TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create bouquets table
CREATE TABLE public.bouquets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in FCFA
  channels_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create subscribers table
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  address TEXT NOT NULL,
  zone_id UUID REFERENCES public.zones(id),
  bouquet_id UUID REFERENCES public.bouquets(id),
  line_number TEXT, -- Cable line identifier
  subscription_status subscription_status NOT NULL DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  signal_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in FCFA
  payment_method payment_method NOT NULL,
  transaction_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  months_paid INTEGER NOT NULL DEFAULT 1,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  receipt_number TEXT,
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create promotions table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_zones UUID[] DEFAULT '{}',
  target_bouquets UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Create ticket_messages table for support chat
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false, -- Internal notes not visible to subscriber
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Create FAQ table
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- HELPER FUNCTIONS (Security Definer)
-- =====================================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Check if user is commercial
CREATE OR REPLACE FUNCTION public.is_commercial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'commercial')
$$;

-- Check if user is technician
CREATE OR REPLACE FUNCTION public.is_technician(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'technician')
$$;

-- Check if user has any staff role
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'commercial', 'technician')
  )
$$;

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO ticket_count FROM public.support_tickets;
  RETURN 'TKT-' || LPAD(ticket_count::TEXT, 5, '0');
END;
$$;

-- Generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  payment_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO payment_count FROM public.payments;
  RETURN 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(payment_count::TEXT, 4, '0');
END;
$$;

-- Auto-generate ticket number trigger
CREATE OR REPLACE FUNCTION public.auto_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_ticket_number();

-- Auto-generate receipt number trigger
CREATE OR REPLACE FUNCTION public.auto_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := public.generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_receipt_number
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_receipt_number();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bouquets_updated_at BEFORE UPDATE ON public.bouquets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouquets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR public.is_staff(auth.uid())
);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (
  auth.uid() = id
);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR public.is_admin(auth.uid())
);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- USER_ROLES POLICIES
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE USING (
  public.is_admin(auth.uid())
);
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- ZONES POLICIES
CREATE POLICY "zones_select" ON public.zones FOR SELECT USING (
  public.is_staff(auth.uid())
);
CREATE POLICY "zones_insert" ON public.zones FOR INSERT WITH CHECK (
  public.is_admin(auth.uid()) OR public.is_technician(auth.uid())
);
CREATE POLICY "zones_update" ON public.zones FOR UPDATE USING (
  public.is_admin(auth.uid()) OR public.is_technician(auth.uid())
);
CREATE POLICY "zones_delete" ON public.zones FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- BOUQUETS POLICIES
CREATE POLICY "bouquets_select" ON public.bouquets FOR SELECT USING (true);
CREATE POLICY "bouquets_insert" ON public.bouquets FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
CREATE POLICY "bouquets_update" ON public.bouquets FOR UPDATE USING (
  public.is_admin(auth.uid())
);
CREATE POLICY "bouquets_delete" ON public.bouquets FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- SUBSCRIBERS POLICIES
CREATE POLICY "subscribers_select" ON public.subscribers FOR SELECT USING (
  public.is_staff(auth.uid())
);
CREATE POLICY "subscribers_insert" ON public.subscribers FOR INSERT WITH CHECK (
  public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
);
CREATE POLICY "subscribers_update" ON public.subscribers FOR UPDATE USING (
  public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
);
CREATE POLICY "subscribers_delete" ON public.subscribers FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- PAYMENTS POLICIES
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (
  public.is_staff(auth.uid())
);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (
  public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
);
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (
  public.is_admin(auth.uid()) OR public.is_commercial(auth.uid())
);
CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- SUPPORT_TICKETS POLICIES
CREATE POLICY "tickets_select" ON public.support_tickets FOR SELECT USING (
  public.is_staff(auth.uid())
);
CREATE POLICY "tickets_insert" ON public.support_tickets FOR INSERT WITH CHECK (
  public.is_staff(auth.uid())
);
CREATE POLICY "tickets_update" ON public.support_tickets FOR UPDATE USING (
  public.is_staff(auth.uid())
);
CREATE POLICY "tickets_delete" ON public.support_tickets FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- PROMOTIONS POLICIES
CREATE POLICY "promotions_select" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "promotions_insert" ON public.promotions FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
CREATE POLICY "promotions_update" ON public.promotions FOR UPDATE USING (
  public.is_admin(auth.uid())
);
CREATE POLICY "promotions_delete" ON public.promotions FOR DELETE USING (
  public.is_admin(auth.uid())
);

-- TICKET_MESSAGES POLICIES
CREATE POLICY "messages_select" ON public.ticket_messages FOR SELECT USING (
  public.is_staff(auth.uid())
);
CREATE POLICY "messages_insert" ON public.ticket_messages FOR INSERT WITH CHECK (
  public.is_staff(auth.uid())
);

-- FAQS POLICIES
CREATE POLICY "faqs_select" ON public.faqs FOR SELECT USING (is_published = true OR public.is_staff(auth.uid()));
CREATE POLICY "faqs_insert" ON public.faqs FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "faqs_update" ON public.faqs FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "faqs_delete" ON public.faqs FOR DELETE USING (public.is_admin(auth.uid()));

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_subscribers_zone ON public.subscribers(zone_id);
CREATE INDEX idx_subscribers_bouquet ON public.subscribers(bouquet_id);
CREATE INDEX idx_subscribers_status ON public.subscribers(subscription_status);
CREATE INDEX idx_subscribers_phone ON public.subscribers(phone);
CREATE INDEX idx_payments_subscriber ON public.payments(subscriber_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_tickets_subscriber ON public.support_tickets(subscriber_id);
CREATE INDEX idx_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);