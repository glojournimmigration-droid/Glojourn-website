import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Upload, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

const docOptions = [
    { key: "passport", label: "Passport (all pages)", flag: "passport" },
    { key: "visas", label: "U.S. visas / I-94", flag: "visas" },
    { key: "work_permits", label: "Work permits / Green Card", flag: "workPermits" },
    { key: "certificates", label: "Birth/Marriage Certificates", flag: "certificates" },
    { key: "prior_applications", label: "Prior Applications / Notices", flag: "priorApplications" },
    { key: "tax_financials", label: "Tax Returns / Pay Slips", flag: "taxFinancials" }
];

const initialIntakeForm = (user) => ({
    visaType: "other",
    priority: "medium",
    intakeForm: {
        generalInformation: {
            fullLegalName: "",
            otherNames: "",
            dateOfBirth: "",
            birthCityCountry: "",
            citizenshipCountries: [],
            educationLevel: "",
            gender: "",
            maritalStatus: "",
            address: { city: "", state: "", zip: "", country: "" },
            phoneMobile: "",
            email: user?.email || "",
            preferredContactMethod: "email"
        },
        immigrationHistory: {
            beenToUS: false,
            lastEntryDate: "",
            lastEntryPlace: "",
            currentStatus: "",
            i94Number: ""
        },
        passportInformation: {
            passportNumber: "",
            issuedDate: "",
            expirationDate: "",
            ssn: ""
        },
        educationEmployment: {
            highestEducation: "",
            currentEmployer: { companyName: "", position: "" }
        },
        consultation: {
            purposes: [],
            description: "",
            howHeard: ""
        },
        documentsProvided: {},
        acknowledgment: { agreed: false }
    }
});

const IntakeForm = ({ user, onSuccess }) => {
    const [formData, setFormData] = useState(() => initialIntakeForm(user));
    const [selectedFiles, setSelectedFiles] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Helper to update deeply nested state
    const updateForm = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            intakeForm: {
                ...prev.intakeForm,
                [section]: {
                    ...prev.intakeForm[section],
                    [field]: value
                }
            }
        }));
    };

    const updateAddress = (field, value) => {
        setFormData(prev => ({
            ...prev,
            intakeForm: {
                ...prev.intakeForm,
                generalInformation: {
                    ...prev.intakeForm.generalInformation,
                    address: {
                        ...prev.intakeForm.generalInformation.address,
                        [field]: value
                    }
                }
            }
        }));
    };

    const handleFileSelection = (docType, file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }
        setSelectedFiles(prev => ({ ...prev, [docType]: file }));
    };

    const handleSubmit = async () => {
        // Validations
        const general = formData.intakeForm.generalInformation;
        if (!general.fullLegalName || !general.dateOfBirth || !general.email) {
            toast.error("Please fill in required General Information");
            return;
        }

        if (!formData.intakeForm.acknowledgment.agreed) {
            toast.error("Please agree to the terms");
            return;
        }

        if (!selectedFiles['passport']) {
            toast.error("Passport upload is required");
            return;
        }

        setSubmitting(true);
        try {
            // Prepare Payload
            const payload = {
                visaType: formData.visaType,
                priority: formData.priority,
                applicationDetails: {
                    destinationCountry: "USA", // Default
                    purposeOfVisit: formData.intakeForm.consultation.description
                },
                intakeForm: {
                    ...formData.intakeForm,
                    documentsProvided: docOptions.reduce((acc, opt) => {
                        if (selectedFiles[opt.key]) acc[opt.flag] = true;
                        return acc;
                    }, {})
                }
            };

            // 1. Create Application
            const res = await apiClient.post("/applications", payload);
            const appId = res.data.application.id;

            // 2. Upload Files
            const uploads = Object.entries(selectedFiles);
            for (const [docType, file] of uploads) {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("application_id", appId);
                fd.append("document_type", docType);
                await apiClient.post("/documents/upload", fd, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
            }

            // 3. Submit
            await apiClient.put(`/applications/${appId}`, { status: "submitted" });

            toast.success("Application submitted successfully!");
            onSuccess();

        } catch (error) {
            console.error(error);
            toast.error("Failed to submit application. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-heading font-bold text-primary-navy">Start Your Journey</h2>
                <p className="text-slate-600">Complete the intake form to initiate your immigration case.</p>
            </div>

            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

                {/* General Info */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Basic details about the primary applicant.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Legal Name *</Label>
                            <Input
                                value={formData.intakeForm.generalInformation.fullLegalName}
                                onChange={(e) => updateForm('generalInformation', 'fullLegalName', e.target.value)}
                                placeholder="Same as passport"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Birth *</Label>
                            <Input
                                type="date"
                                value={formData.intakeForm.generalInformation.dateOfBirth}
                                onChange={(e) => updateForm('generalInformation', 'dateOfBirth', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={formData.intakeForm.generalInformation.email}
                                onChange={(e) => updateForm('generalInformation', 'email', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone Mobile</Label>
                            <Input
                                value={formData.intakeForm.generalInformation.phoneMobile}
                                onChange={(e) => updateForm('generalInformation', 'phoneMobile', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Current Mailing Address</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="City" value={formData.intakeForm.generalInformation.address.city} onChange={e => updateAddress('city', e.target.value)} />
                                <Input placeholder="State" value={formData.intakeForm.generalInformation.address.state} onChange={e => updateAddress('state', e.target.value)} />
                                <Input placeholder="Zip Code" value={formData.intakeForm.generalInformation.address.zip} onChange={e => updateAddress('zip', e.target.value)} />
                                <Input placeholder="Country" value={formData.intakeForm.generalInformation.address.country} onChange={e => updateAddress('country', e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Immigration History */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Immigration History</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Have you been to the US?</Label>
                            <Select
                                onValueChange={(v) => updateForm('immigrationHistory', 'beenToUS', v === 'yes')}
                            >
                                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Current Immigration Status</Label>
                            <Input
                                placeholder="e.g. Visitor, Student, None"
                                value={formData.intakeForm.immigrationHistory.currentStatus}
                                onChange={(e) => updateForm('immigrationHistory', 'currentStatus', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Documents - Integrated */}
                <Card className="border-slate-200 shadow-sm border-l-4 border-l-accent-gold">
                    <CardHeader>
                        <CardTitle>Required Documents</CardTitle>
                        <CardDescription>Upload clear scans/photos. Passport is mandatory to start.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {docOptions.map((opt) => (
                            <div key={opt.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                                <div className="mb-2 sm:mb-0">
                                    <Label className="font-semibold text-primary-navy">{opt.label}</Label>
                                    {opt.key === 'passport' && <span className="text-rose-500 ml-1">*</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="file"
                                        className="w-full sm:w-64 cursor-pointer"
                                        onChange={(e) => handleFileSelection(opt.key, e.target.files[0])}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Consultation */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Case Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Describe your immigration goals or questions</Label>
                            <Textarea
                                className="min-h-[100px]"
                                value={formData.intakeForm.consultation.description}
                                onChange={(e) => updateForm('consultation', 'description', e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                            <Checkbox
                                id="terms"
                                checked={formData.intakeForm.acknowledgment.agreed}
                                onCheckedChange={(c) => setFormData(prev => ({
                                    ...prev,
                                    intakeForm: { ...prev.intakeForm, acknowledgment: { agreed: c } }
                                }))}
                            />
                            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I certify that the information provided is true and accurate.
                            </label>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 flex justify-end p-4">
                        <Button type="button" size="lg" className="w-full sm:w-auto font-bold bg-accent-gold text-primary-navy hover:bg-accent-gold-dim" onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Application & Documents
                        </Button>
                    </CardFooter>
                </Card>

            </form>
        </div>
    );
};

export default IntakeForm;
