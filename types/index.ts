
export interface SessionUser {
    userId: string;
    name: string | null;
    email: string | null;
    image: string;
}

export interface AnalysisCheck {
    category: string;
    status: string;
    details: string;
    severity: 'info' | 'warning' | 'critical';
}

export interface AnalysisResult {
    score: number;
    status: 'passed' | 'warning' | 'failed';
    summary: {
        total_checks: number;
        passed: number;
        warnings: number;
        critical: number;
    };
    checks: AnalysisCheck[];
    recommendations: string[];
    metadata: {
        analyzed_at: string;
        analyzer_version: string;
        file_name: string;
    };
    is_public?: boolean;
    is_owner?: boolean;
}
