import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

const DocumentUpload = ({
    application,
    docOptions,
    requiredDocTypes,
    onRefresh,
    loading = false // Accept loading prop but default to false
}) => {
    const [uploading, setUploading] = useState(false);

    // If application is null, we can't do much, but we should handle it gracefully
    if (!application) return null;

    const uploadedTypes = new Set(application.documents?.map((doc) => doc.document_type) || []);
    const missingDocs = requiredDocTypes.filter((type) => !uploadedTypes.has(type));

    const handleFileUpload = async (docType, file) => {
        if (!file) return;
        if (!application) {
            toast.error("Application context missing.");
            return;
        }

        // Size check
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large. Max 5MB allowed.");
            return;
        }

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("application_id", application.id);
        uploadData.append("document_type", docType);

        try {
            await apiClient.post("/documents/upload", uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success(`${docOptions.find(d => d.key === docType)?.label || 'Document'} uploaded successfully`);
            onRefresh(); // Trigger parent refresh
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to upload document";
            toast.error(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg font-heading text-primary-navy">Missing Documents</CardTitle>
                        <CardDescription>Required for case processing</CardDescription>
                    </div>
                    {missingDocs.length === 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> All clear
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
                {/* Upload List */}
                <div className="divide-y divide-slate-100">
                    {docOptions.map((opt) => {
                        const isUploaded = uploadedTypes.has(opt.key);
                        const inputId = `upload-${opt.key}`;

                        return (
                            <div key={opt.key} className={`p-4 flex items-center justify-between transition-colors ${isUploaded ? 'bg-white opacity-60' : 'bg-white hover:bg-slate-50'}`}>
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {isUploaded ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h5 className={`text-sm font-medium ${isUploaded ? 'text-slate-500' : 'text-primary-navy'}`}>
                                            {opt.label}
                                        </h5>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {isUploaded ? 'Received' : 'Required • PDF, JPG, PNG'}
                                        </p>
                                    </div>
                                </div>

                                {!isUploaded && (
                                    <div className="ml-4">
                                        <input
                                            id={inputId}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => {
                                                handleFileUpload(opt.key, e.target.files?.[0]);
                                                e.target.value = "";
                                            }}
                                            disabled={uploading || loading}
                                        />
                                        <label htmlFor={inputId}>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="cursor-pointer border-slate-200 text-slate-600 hover:text-accent-gold-dim hover:border-accent-gold-dim"
                                                disabled={uploading || loading}
                                                asChild
                                            >
                                                <span>
                                                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Upload"}
                                                </span>
                                            </Button>
                                        </label>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Recently Uploaded Section (Mini View) */}
                {application.documents?.length > 0 && (
                    <div className="bg-slate-50 p-4 border-t border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recently Uploaded</h4>
                        <div className="space-y-2">
                            {application.documents.slice(0, 3).map((doc, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                    <FileText className="w-3 h-3 text-emerald-500" />
                                    <span className="truncate max-w-[200px]">{doc.file_name}</span>
                                    <span className="text-xs text-slate-400 ml-auto">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                            {application.documents.length > 3 && (
                                <div className="text-xs text-center text-slate-400 pt-2">
                                    + {application.documents.length - 3} more files
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
};

export default DocumentUpload;
