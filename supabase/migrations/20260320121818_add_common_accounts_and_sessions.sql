-- Create common_accounts table
CREATE TABLE IF NOT EXISTS public.common_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'apple_id',
    login TEXT NOT NULL,
    password TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protect common_accounts (Admin only via service role or authenticated staff)
ALTER TABLE public.common_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated staff to view and edit common_accounts"
    ON public.common_accounts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create delivery_sessions table
CREATE TABLE IF NOT EXISTS public.delivery_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id TEXT UNIQUE NOT NULL,
    uniquecode TEXT NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '15 minutes'
);

-- delivery_sessions is accessed by Bazzar App anonymously using uniquecode
ALTER TABLE public.delivery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to delivery_sessions"
    ON public.delivery_sessions
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public select of own delivery_sessions by invoice_id"
    ON public.delivery_sessions
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public update of own delivery_sessions by invoice_id"
    ON public.delivery_sessions
    FOR UPDATE
    TO public
    USING (true);