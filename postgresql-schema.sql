-- ================================================
-- LeadGen-AI PostgreSQL Database Schema
-- ================================================
-- Version: 1.0
-- Database: PostgreSQL 12+
-- Purpose: Complete database schema for LeadGen-AI application
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLE: users
-- Purpose: Store user accounts and authentication
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ================================================
-- TABLE: profiles
-- Purpose: Extended user profile information
-- ================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    phone VARCHAR(20),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ================================================
-- TABLE: business_profiles
-- Purpose: User's business information
-- ================================================
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website TEXT,
    size VARCHAR(50),
    target_industries TEXT[],
    target_locations TEXT[],
    ideal_customer_profile TEXT,
    value_proposition TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for business_profiles table
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- ================================================
-- TABLE: leads
-- Purpose: Store leads in CRM pipeline
-- ================================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    website TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    location VARCHAR(255),
    contact_name VARCHAR(255),
    contact_title VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url TEXT,
    fit_score INTEGER CHECK (fit_score >= 0 AND fit_score <= 100),
    status VARCHAR(50) DEFAULT 'new',
    stage VARCHAR(50) DEFAULT 'leads',
    notes TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'))
);

-- Indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_fit_score ON leads(fit_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- ================================================
-- TABLE: search_filters
-- Purpose: Save search criteria for lead generation
-- ================================================
CREATE TABLE IF NOT EXISTS search_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for search_filters table
CREATE INDEX IF NOT EXISTS idx_search_filters_user_id ON search_filters(user_id);

-- ================================================
-- TABLE: email_templates
-- Purpose: Store reusable email templates
-- ================================================
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(100),
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for email_templates table
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);

-- ================================================
-- TABLE: email_campaigns
-- Purpose: Track email campaigns
-- ================================================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'))
);

-- Indexes for email_campaigns table
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON email_campaigns(sent_at);

-- ================================================
-- TABLE: email_logs
-- Purpose: Track individual email sends
-- ================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    sent_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'))
);

-- Indexes for email_logs table
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- ================================================
-- TABLE: user_stats
-- Purpose: Track user statistics and analytics
-- ================================================
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_leads INTEGER DEFAULT 0,
    total_emails_sent INTEGER DEFAULT 0,
    total_emails_opened INTEGER DEFAULT 0,
    total_campaigns INTEGER DEFAULT 0,
    last_lead_generated_at TIMESTAMP WITH TIME ZONE,
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_stats table
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- ================================================
-- TRIGGER FUNCTIONS
-- Purpose: Automatically update timestamps
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_profiles_updated_at BEFORE UPDATE ON business_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_filters_updated_at BEFORE UPDATE ON search_filters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGER: Auto-create profile after user creation
-- ================================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.id);
    INSERT INTO user_stats (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_profile_after_user
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ================================================
-- VIEWS
-- Purpose: Convenient queries for common data
-- ================================================

-- View: User overview with profile
CREATE OR REPLACE VIEW user_overview AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.email_verified,
    u.is_active,
    u.created_at,
    u.last_login_at,
    p.company_name,
    p.job_title,
    p.phone,
    us.total_leads,
    us.total_emails_sent,
    us.total_emails_opened,
    us.total_campaigns
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_stats us ON u.id = us.user_id;

-- View: Lead statistics by user
CREATE OR REPLACE VIEW lead_stats_by_user AS
SELECT 
    user_id,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE status = 'new') as new_leads,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
    COUNT(*) FILTER (WHERE status = 'qualified') as qualified_leads,
    COUNT(*) FILTER (WHERE status = 'won') as won_leads,
    COUNT(*) FILTER (WHERE status = 'lost') as lost_leads,
    AVG(fit_score) as avg_fit_score,
    MAX(created_at) as last_lead_created
FROM leads
GROUP BY user_id;

-- View: Email campaign performance
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
    id,
    user_id,
    name,
    status,
    total_recipients,
    total_sent,
    total_opened,
    total_clicked,
    total_bounced,
    CASE 
        WHEN total_sent > 0 THEN ROUND((total_opened::NUMERIC / total_sent * 100), 2)
        ELSE 0
    END as open_rate,
    CASE 
        WHEN total_sent > 0 THEN ROUND((total_clicked::NUMERIC / total_sent * 100), 2)
        ELSE 0
    END as click_rate,
    sent_at,
    created_at
FROM email_campaigns;

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

-- Insert sample user (password: "password123" hashed with bcrypt)
-- Uncomment to use:
/*
INSERT INTO users (email, password_hash, name, email_verified) VALUES
('demo@leadgen.ai', '$2b$10$rKvE3Y0qV5dKQH2xJ9eqKO7bF3J9G3d7YqH3L5Z6N7K8M9P0Q1R2S', 'Demo User', true);
*/

-- ================================================
-- GRANTS (Optional - set permissions)
-- ================================================

-- Grant permissions to application user
-- Uncomment and modify as needed:
/*
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO leadgen_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO leadgen_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO leadgen_user;
*/

-- ================================================
-- ANALYTICS FUNCTIONS
-- ================================================

-- Function: Get user dashboard stats
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
    total_leads BIGINT,
    new_leads BIGINT,
    qualified_leads BIGINT,
    total_emails_sent BIGINT,
    email_open_rate NUMERIC,
    active_campaigns BIGINT,
    avg_lead_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(l.id) as total_leads,
        COUNT(l.id) FILTER (WHERE l.status = 'new') as new_leads,
        COUNT(l.id) FILTER (WHERE l.status = 'qualified') as qualified_leads,
        COALESCE(us.total_emails_sent, 0)::BIGINT as total_emails_sent,
        CASE 
            WHEN us.total_emails_sent > 0 
            THEN ROUND((us.total_emails_opened::NUMERIC / us.total_emails_sent * 100), 2)
            ELSE 0
        END as email_open_rate,
        COUNT(DISTINCT ec.id) FILTER (WHERE ec.status IN ('scheduled', 'sending', 'sent')) as active_campaigns,
        COALESCE(AVG(l.fit_score), 0) as avg_lead_score
    FROM users u
    LEFT JOIN leads l ON u.id = l.user_id
    LEFT JOIN user_stats us ON u.id = us.user_id
    LEFT JOIN email_campaigns ec ON u.id = ec.user_id
    WHERE u.id = p_user_id
    GROUP BY us.total_emails_sent, us.total_emails_opened;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_user_stage ON leads(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_status ON email_logs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_status ON email_campaigns(user_id, status);

-- Full-text search indexes (optional, for advanced search)
-- CREATE INDEX IF NOT EXISTS idx_leads_company_search ON leads USING gin(to_tsvector('english', company_name));
-- CREATE INDEX IF NOT EXISTS idx_leads_contact_search ON leads USING gin(to_tsvector('english', contact_name));

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE business_profiles IS 'Business information for users';
COMMENT ON TABLE leads IS 'CRM leads and contacts';
COMMENT ON TABLE search_filters IS 'Saved search filters for lead generation';
COMMENT ON TABLE email_templates IS 'Reusable email templates';
COMMENT ON TABLE email_campaigns IS 'Email campaign tracking';
COMMENT ON TABLE email_logs IS 'Individual email send logs';
COMMENT ON TABLE user_stats IS 'User statistics and analytics';

-- ================================================
-- SCHEMA VERSION
-- ================================================

CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES
('1.0.0', 'Initial schema with all core tables');

-- ================================================
-- END OF SCHEMA
-- ================================================

SELECT 'PostgreSQL schema created successfully! ✅' as status;
