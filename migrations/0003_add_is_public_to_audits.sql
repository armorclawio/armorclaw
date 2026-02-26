-- Migration to add is_public column to audits table
ALTER TABLE audits ADD COLUMN is_public INTEGER DEFAULT 0;
