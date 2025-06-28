-- NeuroFit Band Database Schema
-- Create tables for storing sensor data and user information

-- Users table for authentication and profile
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    emergency_contact VARCHAR(20),
    emergency_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device sessions table
CREATE TABLE IF NOT EXISTS device_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_mac VARCHAR(17) NOT NULL,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EEG data table for brainwave measurements
CREATE TABLE IF NOT EXISTS eeg_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES device_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alpha_power DECIMAL(10,4),
    beta_power DECIMAL(10,4),
    theta_power DECIMAL(10,4),
    delta_power DECIMAL(10,4),
    gamma_power DECIMAL(10,4),
    attention_level DECIMAL(5,2),
    meditation_level DECIMAL(5,2),
    raw_signal JSONB
);

-- Heart rate and SpO2 data table
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES device_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    heart_rate INTEGER,
    spo2 DECIMAL(5,2),
    hrv_rmssd DECIMAL(8,4),
    hrv_sdnn DECIMAL(8,4),
    stress_index DECIMAL(5,2),
    raw_ppg JSONB
);

-- Mood predictions from ML model
CREATE TABLE IF NOT EXISTS mood_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES device_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    predicted_mood VARCHAR(50),
    confidence DECIMAL(5,4),
    stress_level DECIMAL(5,2),
    focus_level DECIMAL(5,2),
    relaxation_level DECIMAL(5,2),
    features JSONB
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    vital_signs JSONB,
    sent_successfully BOOLEAN DEFAULT false,
    response_received BOOLEAN DEFAULT false
);

-- Meditation sessions table
CREATE TABLE IF NOT EXISTS meditation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50),
    duration_minutes INTEGER,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    avg_heart_rate INTEGER,
    stress_reduction DECIMAL(5,2),
    completed BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_eeg_data_user_timestamp ON eeg_data(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vital_signs_user_timestamp ON vital_signs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mood_predictions_user_timestamp ON mood_predictions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_active ON device_sessions(user_id, is_active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE eeg_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own sessions" ON device_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own EEG data" ON eeg_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own vital signs" ON vital_signs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own mood predictions" ON mood_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own emergency alerts" ON emergency_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own meditation sessions" ON meditation_sessions FOR ALL USING (auth.uid() = user_id);
