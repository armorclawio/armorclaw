declare global {
    // Cloudflare D1 Database types
    interface D1Database {
        prepare(query: string): D1PreparedStatement;
        dump(): Promise<ArrayBuffer>;
        batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
        exec(query: string): Promise<D1ExecResult>;
    }

    interface D1PreparedStatement {
        bind(...values: unknown[]): D1PreparedStatement;
        first<T = unknown>(colName?: string): Promise<T | null>;
        run<T = unknown>(): Promise<D1Result<T>>;
        all<T = unknown>(): Promise<D1Result<T[]>>;
        raw<T = unknown>(): Promise<T[]>;
    }

    interface D1Result<T = unknown> {
        results?: T;
        success: boolean;
        error?: string;
        meta: {
            duration: number;
            size_after: number;
            rows_read: number;
            rows_written: number;
        };
    }

    interface D1ExecResult {
        count: number;
        duration: number;
    }

    // Cloudflare R2 Storage types
    interface R2Bucket {
        get(key: string): Promise<R2Object | null>;
        put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
        delete(key: string): Promise<void>;
        list(options?: R2ListOptions): Promise<R2Objects>;
        head(key: string): Promise<R2Object | null>;
    }

    interface R2Object {
        key: string;
        size: number;
        etag: string;
        httpEtag: string;
        uploaded: Date;
        httpMetadata?: R2HTTPMetadata;
        customMetadata?: Record<string, string>;
        body: ReadableStream;
        arrayBuffer(): Promise<ArrayBuffer>;
        text(): Promise<string>;
        json<T>(): Promise<T>;
        blob(): Promise<Blob>;
    }

    interface R2PutOptions {
        httpMetadata?: R2HTTPMetadata;
        customMetadata?: Record<string, string>;
    }

    interface R2HTTPMetadata {
        contentType?: string;
        contentLanguage?: string;
        contentDisposition?: string;
        contentEncoding?: string;
        cacheControl?: string;
        cacheExpiry?: Date;
    }

    interface R2ListOptions {
        limit?: number;
        prefix?: string;
        cursor?: string;
        delimiter?: string;
    }

    interface R2Objects {
        objects: R2Object[];
        truncated: boolean;
        cursor?: string;
        delimitedPrefixes: string[];
    }
}

// Extend CloudflareEnv to include our D1 database and R2 storage
declare module '@opennextjs/cloudflare' {
    interface CloudflareEnv {
        DB: D1Database;
        STORAGE: R2Bucket;
        GLM_API_KEY?: string; // 智谱 AI API Key
    }
}

