-- AWS Health Map V1 - Initial Database Schema
-- This migration creates the core tables for storing AWS health events and region status

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create aws_health_events table for storing RSS feed events
CREATE TABLE IF NOT EXISTS public.aws_health_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guid VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
    region_code VARCHAR(20),
    status VARCHAR(20) CHECK (status IN ('operational', 'issue', 'outage')),
    source VARCHAR(50) DEFAULT 'aws_rss',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_aws_health_events_region_date ON public.aws_health_events(region_code, pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_aws_health_events_status ON public.aws_health_events(status);
CREATE INDEX IF NOT EXISTS idx_aws_health_events_pub_date ON public.aws_health_events(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_aws_health_events_guid ON public.aws_health_events(guid);

-- Create region_status table for tracking current status of each region
CREATE TABLE IF NOT EXISTS public.region_status (
    region_code VARCHAR(20) PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL,
    current_status VARCHAR(20) NOT NULL CHECK (current_status IN ('operational', 'issue', 'outage')),
    last_status_change TIMESTAMP WITH TIME ZONE,
    last_event_id UUID REFERENCES public.aws_health_events(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_simulations table for development testing
CREATE TABLE IF NOT EXISTS public.test_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code VARCHAR(20) NOT NULL,
    simulated_status VARCHAR(20) NOT NULL CHECK (simulated_status IN ('issue', 'outage')),
    description TEXT,
    created_by VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active simulations
CREATE INDEX IF NOT EXISTS idx_test_simulations_active ON public.test_simulations(is_active, expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_aws_health_events_updated_at 
    BEFORE UPDATE ON public.aws_health_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_region_status_updated_at 
    BEFORE UPDATE ON public.region_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial region data (AWS regions with their coordinates)
INSERT INTO public.region_status (region_code, region_name, current_status, latitude, longitude) VALUES
    ('af-south-1', 'Africa (Cape Town)', 'operational', -33.9249, 18.4241),
    ('ap-east-1', 'Asia Pacific (Hong Kong)', 'operational', 22.3964, 114.1095),
    ('ap-northeast-1', 'Asia Pacific (Tokyo)', 'operational', 35.6895, 139.6917),
    ('ap-northeast-2', 'Asia Pacific (Seoul)', 'operational', 37.5665, 126.9780),
    ('ap-northeast-3', 'Asia Pacific (Osaka)', 'operational', 34.6937, 135.5023),
    ('ap-south-1', 'Asia Pacific (Mumbai)', 'operational', 19.0760, 72.8777),
    ('ap-south-2', 'Asia Pacific (Hyderabad)', 'operational', 17.3850, 78.4867),
    ('ap-southeast-1', 'Asia Pacific (Singapore)', 'operational', 1.3521, 103.8198),
    ('ap-southeast-2', 'Asia Pacific (Sydney)', 'operational', -33.8688, 151.2093),
    ('ap-southeast-3', 'Asia Pacific (Jakarta)', 'operational', -6.2088, 106.8456),
    ('ap-southeast-4', 'Asia Pacific (Melbourne)', 'operational', -37.8136, 144.9631),
    ('ap-southeast-5', 'Asia Pacific (Thailand)', 'operational', 13.7563, 100.5018),
    ('ap-southeast-6', 'Asia Pacific (Malaysia)', 'operational', 3.1390, 101.6869),
    ('ca-west-1', 'Canada (Calgary)', 'operational', 51.0447, -114.0719),
    ('ca-central-1', 'Canada (Central)', 'operational', 45.5017, -73.5673),
    ('cn-north-1', 'China (Beijing)', 'operational', 39.9042, 116.4074),
    ('cn-northwest-1', 'China (Ningxia)', 'operational', 38.4722, 106.2719),
    ('eu-central-1', 'Europe (Frankfurt)', 'operational', 50.1109, 8.6821),
    ('eu-central-2', 'Europe (Zurich)', 'operational', 47.3769, 8.5417),
    ('eu-north-1', 'Europe (Stockholm)', 'operational', 59.3293, 18.0686),
    ('eu-south-1', 'Europe (Milan)', 'operational', 45.4642, 9.1900),
    ('eu-south-2', 'Europe (Spain)', 'operational', 40.4168, -3.7038),
    ('eu-west-1', 'Europe (Ireland)', 'operational', 53.3498, -6.2603),
    ('eu-west-2', 'Europe (London)', 'operational', 51.5074, -0.1276),
    ('eu-west-3', 'Europe (Paris)', 'operational', 48.8566, 2.3522),
    ('il-central-1', 'Israel (Tel Aviv)', 'operational', 32.0853, 34.7818),
    ('me-central-1', 'Middle East (UAE)', 'operational', 25.2048, 55.2708),
    ('me-south-1', 'Middle East (Bahrain)', 'operational', 26.2285, 50.5875),
    ('mx-central-1', 'Mexico (Central)', 'operational', 19.4326, -99.1332),
    ('sa-east-1', 'South America (São Paulo)', 'operational', -23.5505, -46.6333),
    ('us-east-1', 'US East (N. Virginia)', 'operational', 38.9072, -77.0369),
    ('us-east-2', 'US East (Ohio)', 'operational', 39.9612, -82.9988),
    ('us-west-1', 'US West (N. California)', 'operational', 37.7749, -122.4194),
    ('us-west-2', 'US West (Oregon)', 'operational', 45.5155, -122.6784)
ON CONFLICT (region_code) DO NOTHING;

-- Enable Row Level Security (RLS) for future authentication needs
ALTER TABLE public.aws_health_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_simulations ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (since this is a public monitoring tool)
CREATE POLICY "Allow public read access on aws_health_events" ON public.aws_health_events
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on region_status" ON public.region_status
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on test_simulations" ON public.test_simulations
    FOR SELECT USING (true);

-- Allow public insert for health events (RSS processing)
CREATE POLICY "Allow public insert on aws_health_events" ON public.aws_health_events
    FOR INSERT WITH CHECK (true);

-- Allow public update for region status
CREATE POLICY "Allow public update on region_status" ON public.region_status
    FOR UPDATE USING (true);

-- Allow public insert/update/delete for test simulations (development features)
CREATE POLICY "Allow public insert on test_simulations" ON public.test_simulations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on test_simulations" ON public.test_simulations
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on test_simulations" ON public.test_simulations
    FOR DELETE USING (true);

-- Create a view for easy querying of recent events with region information
CREATE OR REPLACE VIEW public.recent_events_with_regions AS
SELECT 
    e.id,
    e.guid,
    e.title,
    e.description,
    e.pub_date,
    e.region_code,
    e.status,
    e.source,
    r.region_name,
    r.latitude,
    r.longitude,
    e.created_at,
    e.updated_at
FROM public.aws_health_events e
LEFT JOIN public.region_status r ON e.region_code = r.region_code
ORDER BY e.pub_date DESC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;