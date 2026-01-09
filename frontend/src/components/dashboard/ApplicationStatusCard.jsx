import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, User } from "lucide-react";

const getStatusColor = (status) => {
    const colors = {
        submitted: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20",
        under_review: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",
        processing: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20",
        approved: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
        rejected: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
        draft: "bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20"
    };
    return colors[status] || "bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20";
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A");

const ApplicationStatusCard = ({ application }) => {
    if (!application) return null;

    return (
        <Card className="border-slate-200 shadow-sm border-l-4 border-l-accent-gold overflow-hidden hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-4 bg-slate-50/50">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold tracking-widest text-primary-navy/60 uppercase">Case Status</span>
                        </div>
                        <CardTitle className="text-xl font-heading text-primary-navy">
                            {application.status === 'draft' ? "Application In Progress" : "immigration Case"}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Case #{application.case_number} · {application.status === "draft" ? "Please complete requirements" : "Currently being processed"}
                        </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(application.status)} text-sm px-4 py-1.5 rounded-full border shadow-none font-medium tracking-wide`}>
                        {(application?.status || "unknown").replace("_", " ").toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid sm:grid-cols-3 gap-6 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Submitted On</span>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Clock className="w-4 h-4 text-accent-gold-dim" />
                            {application.created_at ? formatDate(application.created_at) : 'Not submitted yet'}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Last Activity</span>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-accent-gold-dim" />
                            {formatDate(application.updated_at)}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Case Manager</span>
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <User className="w-4 h-4 text-accent-gold-dim" />
                            {application.assigned_manager ? 'Assigned' : 'Pending Assignment'}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ApplicationStatusCard;
