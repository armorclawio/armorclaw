CREATE TABLE users (
    id TEXT PRIMARY KEY,
    github_id TEXT,
    email TEXT,
    name TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audits (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    skill_name TEXT,
    skill_hash TEXT,
    status TEXT,
    ebpf_log_json TEXT,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
