import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { User, Flag, Mail, MapPin, FileCheck } from "lucide-react";

const IntakeSnapshot = ({ application }) => {
    if (!application) return null;

    const {
        generalInformation,
        immigrationHistory,
        passportInformation,
        consultation,
        documentsProvided
    } = application.intake_form || {};

    const InfoItem = ({ label, value, icon: Icon }) => (
        <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </p>
            <p className="text-slate-900 font-medium text-sm break-words">{value || <span className="text-slate-400 italic">Not provided</span>}</p>
        </div>
    );

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden h-full">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-heading text-primary-navy">Submission Details</CardTitle>
                <CardDescription>Snapshot of your application profile</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                    <div className="p-6">
                        <h4 className="font-heading font-semibold text-primary-navy mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-accent-gold-dim" /> Personal Info
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <InfoItem label="Full Name" value={generalInformation?.fullLegalName} />
                            <InfoItem label="Email" value={generalInformation?.email} />
                            <InfoItem label="Mobile" value={generalInformation?.phoneMobile} />
                            <InfoItem label="Citizenship" value={(generalInformation?.citizenshipCountries || []).join(", ")} icon={Flag} />
                        </div>
                    </div>

                    <div className="p-6">
                        <h4 className="font-heading font-semibold text-primary-navy mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-accent-gold-dim" /> Location & Status
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <InfoItem label="Current Status" value={immigrationHistory?.currentStatus} />
                            {/*  <InfoItem label="Last Entry" value={immigrationHistory?.lastEntryDate ? new Date(immigrationHistory.lastEntryDate).toLocaleDateString() : null} /> */}
                            <InfoItem label="Passport" value={passportInformation?.passportNumber ? `Ends in ...${passportInformation.passportNumber.slice(-4)}` : "N/A"} />
                        </div>
                    </div>

                    <div className="p-6 text-sm">
                        <h4 className="font-heading font-semibold text-primary-navy mb-4 flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-accent-gold-dim" /> Service Details
                        </h4>
                        <div className="mb-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Purpose</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {(consultation?.purposes || []).map((p, i) => (
                                    <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs">
                                        {p}
                                    </span>
                                ))}
                                {(!consultation?.purposes || consultation.purposes.length === 0) && "N/A"}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default IntakeSnapshot;
