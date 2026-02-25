'use client';

import { useSidebar } from './SidebarProvider';
import { AnalysisResultView } from './AnalysisResultView';

export function AuditReportDrawer() {
    const { activeAuditId, setActiveAuditId } = useSidebar();

    if (!activeAuditId) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300"
                onClick={() => setActiveAuditId(null)}
            />

            {/* Drawer */}
            <aside
                className="fixed right-0 top-0 h-full w-full md:w-[500px] lg:w-[600px] bg-background border-l border-line z-[70] shadow-2xl transition-transform duration-300 transform translate-x-0 overflow-y-auto"
            >
                <div className="p-6">
                    <AnalysisResultView
                        auditId={activeAuditId}
                        onClose={() => setActiveAuditId(null)}
                    />
                </div>
            </aside>
        </>
    );
}
