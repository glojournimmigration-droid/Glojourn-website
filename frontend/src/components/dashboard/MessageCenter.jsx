import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, User, Clock, CheckCircle2 } from "lucide-react";

const MessageCenter = ({ requests, onChangeTab }) => {
    return (
        <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-heading text-primary-navy">Messages</CardTitle>
                    {requests.length > 0 && (
                        <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">{requests.length}</span>
                    )}
                </div>
                <CardDescription>Requests and updates from your case manager</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {requests.length > 0 ? (
                        requests.map((req) => {
                            const isNotification = req.document_type === 'general_notification';
                            return (
                                <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-full ${isNotification ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {isNotification ? <FileText className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-semibold text-primary-navy text-sm">
                                                    {isNotification ? "Message from Manager" : `Request: ${req.document_type.replace(/_/g, ' ').toUpperCase()}`}
                                                </h4>
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed mb-3">
                                                {req.message}
                                            </p>

                                            {!isNotification && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                                                    onClick={() => onChangeTab("documents")}
                                                >
                                                    Upload Requested Document
                                                </Button>
                                            )}

                                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                                                <User className="w-3 h-3" />
                                                <span>{req.created_by?.name || 'Case Manager'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500 h-64">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="font-medium text-slate-900">All caught up</p>
                            <p className="text-sm mt-1">No pending requests or messages.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default MessageCenter;
