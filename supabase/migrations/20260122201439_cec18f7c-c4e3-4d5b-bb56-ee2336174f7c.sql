-- Add PIN and authentication fields to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create subscriber sessions table for authentication tokens
CREATE TABLE IF NOT EXISTS public.subscriber_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on subscriber_sessions
ALTER TABLE public.subscriber_sessions ENABLE ROW LEVEL SECURITY;

-- Sessions are managed by edge functions only (no direct access)
CREATE POLICY "subscriber_sessions_no_direct_access" 
ON public.subscriber_sessions 
FOR ALL 
USING (false);

-- Create subscriber payment requests table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  months INTEGER NOT NULL DEFAULT 1,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mtn_momo', 'orange_money')),
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  external_transaction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Payment requests are managed by edge functions only
CREATE POLICY "payment_requests_no_direct_access" 
ON public.payment_requests 
FOR ALL 
USING (false);

-- Create trigger for updated_at on payment_requests
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriber_sessions_token ON public.subscriber_sessions(token);
CREATE INDEX IF NOT EXISTS idx_subscriber_sessions_subscriber ON public.subscriber_sessions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_subscriber ON public.payment_requests(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON public.subscribers(phone);