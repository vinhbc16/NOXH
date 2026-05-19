ALTER TABLE users
    ADD COLUMN cccd_front_url TEXT,
    ADD COLUMN cccd_back_url TEXT,
    ADD COLUMN portrait_url TEXT;

CREATE TABLE user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    document_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'UPLOADED',
    uploaded_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(user_id, document_type)
);
