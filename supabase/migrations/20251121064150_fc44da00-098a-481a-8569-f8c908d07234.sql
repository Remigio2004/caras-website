-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin');

-- Create user_roles table with admin role logic
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  poster_url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "Events are viewable by everyone"
  ON public.events FOR SELECT
  USING (true);

-- Only admins can insert, update, delete events
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create gallery table
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Everyone can view gallery
CREATE POLICY "Gallery is viewable by everyone"
  ON public.gallery FOR SELECT
  USING (true);

-- Only admins can insert, update, delete gallery items
CREATE POLICY "Admins can insert gallery items"
  ON public.gallery FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update gallery items"
  ON public.gallery FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete gallery items"
  ON public.gallery FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create membership_applications table
CREATE TABLE public.membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  contact TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

-- Only admins can view applications
CREATE POLICY "Admins can view all applications"
  ON public.membership_applications FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Anyone can submit applications
CREATE POLICY "Anyone can submit applications"
  ON public.membership_applications FOR INSERT
  WITH CHECK (true);

-- Only admins can update, delete applications
CREATE POLICY "Admins can update applications"
  ON public.membership_applications FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete applications"
  ON public.membership_applications FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Create hero_content table
CREATE TABLE public.hero_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  subtext TEXT NOT NULL,
  background_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;

-- Everyone can view hero content
CREATE POLICY "Hero content is viewable by everyone"
  ON public.hero_content FOR SELECT
  USING (true);

-- Only admins can update hero content
CREATE POLICY "Admins can update hero content"
  ON public.hero_content FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Insert default hero content
INSERT INTO public.hero_content (headline, subtext, background_url)
VALUES (
  'Serving the Lord at His Altar',
  'The Confraternity of Augustinian Recollect Altar Servers of the Minor Basilica and Parish of San Sebastian – Shrine of Our Lady of Mt. Carmel.',
  '/assets/hero-basilica.jpg'
);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hero_content_updated_at
  BEFORE UPDATE ON public.hero_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
