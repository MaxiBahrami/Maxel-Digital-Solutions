-- PostgreSQL schema. Customer data is deliberately not part of the repository.
CREATE TABLE inquiries (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    company VARCHAR(150) NOT NULL DEFAULT '',
    service TEXT NOT NULL CHECK (service IN ('websites', 'digital-products', 'digital-improvements', 'not-sure')),
    budget VARCHAR(100) NOT NULL,
    timeline VARCHAR(100) NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 20 AND 5000),
    consent BOOLEAN NOT NULL CHECK (consent = TRUE),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived')),
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inquiries_created ON inquiries (created_at DESC);
CREATE INDEX idx_inquiries_email_created ON inquiries (email, created_at DESC);
CREATE INDEX idx_inquiries_ip_created ON inquiries (ip_hash, created_at DESC);

CREATE TABLE admin_sessions (
    token_hash TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_admin_sessions_expiry ON admin_sessions (expires_at);
