import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, LogOut, Loader2, User, FileText, CheckCircle2, Clock, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const docOptions = [
  { key: "passport", label: "Passport (all pages with stamps/visas)", flag: "passport" },
  { key: "visas", label: "U.S. visas and I-94 records", flag: "visas" },
  { key: "work_permits", label: "Work permits, green card, or naturalization certificate", flag: "workPermits" },
  { key: "certificates", label: "Birth, marriage, and divorce certificates", flag: "certificates" },
  { key: "prior_applications", label: "Prior immigration applications and all USCIS or court notices", flag: "priorApplications" },
  { key: "tax_financials", label: "Tax returns, pay slips, and employment letters", flag: "taxFinancials" }
];

const requiredDocTypes = docOptions.map((opt) => opt.key);

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
      gender: "",
      maritalStatus: "",
      address: { city: "", state: "", zip: "", country: "" },
      phoneMobile: "",
      phoneOther: "",
      email: user?.email || "",
      preferredContactMethod: "email",
      preferredContactOther: ""
    },
    immigrationHistory: {
      beenToUS: false,
      lastEntryDate: "",
      lastEntryPlace: "",
      mannerOfLastEntry: "",
      classOfAdmission: "",
      i94Number: "",
      currentStatus: "",
      entries: []
    },
    passportInformation: {
      passportCountry: "",
      passportNumber: "",
      issuedDate: "",
      expirationDate: "",
      placeOfIssue: "",
      alienNumber: "",
      ssn: ""
    },
    educationEmployment: {
      highestEducation: "",
      educationList: [
        { school: "", degreeField: "", country: "", yearsFrom: "", yearsTo: "" }
      ],
      currentEmployer: { companyName: "", position: "", startDate: "", address: "", workContact: "" },
      previousEmployment: ""
    },
    consultation: {
      purposes: [],
      otherPurpose: "",
      description: "",
      howHeard: "",
      howHeardOther: ""
    },
    documentsProvided: {
      passport: false,
      visas: false,
      workPermits: false,
      certificates: false,
      priorApplications: false,
      taxFinancials: false
    },
    acknowledgment: { agreed: false }
  }
});

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [formData, setFormData] = useState(() => initialIntakeForm(null));

  useEffect(() => {
    setFormData(initialIntakeForm(user));
  }, [user]);

  useEffect(() => {
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const res = await apiClient.get("/applications/my-application");
      setApplication(res.data.application);
    } catch (error) {
      if (error.response?.status === 404) {
        setApplication(null);
      } else {
        console.error("Error fetching application:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileUpload = async (docType, file) => {
    if (!file || !application) {
      toast.error("Submit your intake form before uploading documents.");
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
      toast.success("Document uploaded successfully");
      fetchApplication();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to upload document";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!application) return;

    const docs = application.documents || [];
    const missing = requiredDocTypes.filter((type) => !docs.some((doc) => doc.document_type === type));
    if (missing.length) {
      toast.error(`Upload all required documents: ${missing.join(", ")}`);
      return;
    }

    setFinalizing(true);
    try {
      await apiClient.put(`/applications/${application.id}`, { status: "submitted" });
      toast.success("Submitted for review. A coordinator will process your case next.");
      fetchApplication();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to submit for review";
      toast.error(message);
    } finally {
      setFinalizing(false);
    }
  };

  const uploadedTypes = new Set(application?.documents?.map((doc) => doc.document_type) || []);
  const missingDocs = requiredDocTypes.filter((type) => !uploadedTypes.has(type));
  const allDocsUploaded = missingDocs.length === 0;

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "N/A");

  const updateGeneral = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      intakeForm: {
        ...prev.intakeForm,
        generalInformation: {
          ...prev.intakeForm.generalInformation,
          [key]: value
        }
      }
    }));
  };

  const updateGeneralAddress = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      intakeForm: {
        ...prev.intakeForm,
        generalInformation: {
          ...prev.intakeForm.generalInformation,
          address: {
            ...prev.intakeForm.generalInformation.address,
            [key]: value
          }
        }
      }
    }));
  };

  const updateImmigration = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      intakeForm: {
        ...prev.intakeForm,
        immigrationHistory: {
          ...prev.intakeForm.immigrationHistory,
          [key]: value
        }
      }
    }));
  };

  const updatePassport = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      intakeForm: {
        ...prev.intakeForm,
        passportInformation: {
          ...prev.intakeForm.passportInformation,
          [key]: value
        }
      }
    }));
  };

  const updateEducationItem = (index, key, value) => {
    setFormData((prev) => {
      const list = [...prev.intakeForm.educationEmployment.educationList];
      list[index] = { ...list[index], [key]: value };
      return {
        ...prev,
        intakeForm: {
          ...prev.intakeForm,
          educationEmployment: {
            ...prev.intakeForm.educationEmployment,
            educationList: list
          }
        }
      };
    });
  };

  const addEducationItem = () => {
    setFormData((prev) => ({
      ...prev,
      intakeForm: {
        ...prev.intakeForm,
        educationEmployment: {
          ...prev.intakeForm.educationEmployment,
          educationList: [
            ...prev.intakeForm.educationEmployment.educationList,
            { school: "", degreeField: "", country: "", yearsFrom: "", yearsTo: "" }
          ]
        }
      }
    }));
  };

  const updateEmployment = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      intakeForm: {
        ...prev.intakeForm,
        educationEmployment: {
          ...prev.intakeForm.educationEmployment,
          currentEmployer: {
            ...prev.intakeForm.educationEmployment.currentEmployer,
            [key]: value
          }
        }
      }
    }));
  };

  const togglePurpose = (value) => {
    setFormData((prev) => {
      const current = new Set(prev.intakeForm.consultation.purposes);
      current.has(value) ? current.delete(value) : current.add(value);
      return {
        ...prev,
        intakeForm: {
          ...prev.intakeForm,
          consultation: {
            ...prev.intakeForm.consultation,
            purposes: Array.from(current)
          }
        }
      };
    });
  };

  const toggleDocument = (key) => {
    setFormData((prev) => ({
      ...prev,
      intakeForm: {
        ...prev.intakeForm,
        documentsProvided: {
          ...prev.intakeForm.documentsProvided,
          [key]: !prev.intakeForm.documentsProvided[key]
        }
      }
    }));
  };

  const handleSubmitIntake = async (e) => {
    e.preventDefault();
    const general = formData.intakeForm.generalInformation;
    const consultation = formData.intakeForm.consultation;

    if (!general.fullLegalName.trim()) {
      toast.error("Full legal name is required");
      return;
    }
    if (!general.email.trim()) {
      toast.error("Email is required");
      return;
    }
    const cleanedCitizenships = (general.citizenshipCountries || [])
      .map((c) => c.trim())
      .filter(Boolean);

    if (!general.dateOfBirth) {
      toast.error("Date of birth is required");
      return;
    }
    if (!general.birthCityCountry.trim()) {
      toast.error("City and country of birth are required");
      return;
    }
    if (!cleanedCitizenships.length) {
      toast.error("Add at least one citizenship");
      return;
    }
    if (!consultation.purposes.length) {
      toast.error("Select at least one purpose");
      return;
    }
    const addr = general.address || {};
    if (!addr.city || !addr.state || !addr.zip || !addr.country) {
      toast.error("Complete your mailing address");
      return;
    }
    if (!formData.intakeForm.acknowledgment.agreed) {
      toast.error("Please acknowledge the disclaimer to continue");
      return;
    }

    setSubmitting(true);

    const payload = {
      visaType: formData.visaType,
      priority: formData.priority,
      applicationDetails: {},
      intakeForm: {
        ...formData.intakeForm,
        generalInformation: {
          ...general,
          citizenshipCountries: cleanedCitizenships
        },
        consultation
      }
    };

    if (formData.intakeForm.immigrationHistory.lastEntryPlace?.trim()) {
      payload.applicationDetails.destinationCountry = formData.intakeForm.immigrationHistory.lastEntryPlace;
    }
    if (formData.intakeForm.consultation.description?.trim().length >= 10) {
      payload.applicationDetails.purposeOfVisit = formData.intakeForm.consultation.description.trim();
    }

    try {
      const res = await apiClient.post("/applications", payload);
      setApplication(res.data.application);
      toast.success("Intake saved. Upload all required documents, then submit for review.");
    } catch (error) {
      const message = error.response?.data?.message
        || error.response?.data?.errors?.[0]?.msg
        || "Failed to submit intake";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-50 text-blue-700 border-blue-200",
      under_review: "bg-amber-50 text-amber-700 border-amber-200",
      processing: "bg-purple-50 text-purple-700 border-purple-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200"
    };
    return colors[status] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-teal-600" />
          <span className="font-heading text-lg font-bold text-slate-900">Glojourn Client Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">{user?.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600">
            <LogOut className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-slate-900">My Overview</h1>
          <p className="text-slate-600">Submit your intake and track your case</p>
        </div>

        {application ? (
          <div className="grid gap-6">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-teal-500">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Client Intake</CardTitle>
                    <CardDescription>
                      Case #{application.case_number} · {application.status === "draft" ? "Upload documents and submit for review" : "Submitted"}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(application.status)} text-sm px-3 py-1`}>
                    {(application?.status || "unknown").replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 text-sm mt-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    Submitted: {formatDate(application.created_at)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Last Update: {formatDate(application.updated_at)}
                  </div>
                  {application.assigned_manager && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4" />
                      Case Manager Assigned
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Intake Snapshot</CardTitle>
                <CardDescription>Key details from your submitted form</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">General</p>
                  <p>{application.intake_form?.generalInformation?.fullLegalName}</p>
                  <p>{application.intake_form?.generalInformation?.email}</p>
                  <p>{application.intake_form?.generalInformation?.phoneMobile}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Citizenship</p>
                  <p>{(application.intake_form?.generalInformation?.citizenshipCountries || []).join(", ") || "N/A"}</p>
                  <p className="font-semibold text-slate-900 mt-3">Preferred Contact</p>
                  <p>{application.intake_form?.generalInformation?.preferredContactMethod}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Immigration Status</p>
                  <p>{application.intake_form?.immigrationHistory?.currentStatus || "Not provided"}</p>
                  <p className="font-semibold text-slate-900 mt-3">Purpose</p>
                  <p>{(application.intake_form?.consultation?.purposes || []).join(", ") || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Passport</p>
                  <p>{application.intake_form?.passportInformation?.passportNumber ? `#${application.intake_form.passportInformation.passportNumber}` : "Not provided"}</p>
                  <p className="font-semibold text-slate-900 mt-3">Documents Prepared</p>
                  <p>
                    {Object.entries(application.intake_form?.documentsProvided || {})
                      .filter(([, val]) => val)
                      .map(([key]) => key.replace(/([A-Z])/g, " $1")).join(", ") || "None flagged"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="documents" className="w-full">
              <TabsList className="w-full sm:w-auto grid grid-cols-2">
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="messages">Messages / Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upload Required Documents</CardTitle>
                    <CardDescription>All required documents must be uploaded before the case can move forward.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm text-slate-700">
                        {missingDocs.length
                          ? `Missing: ${missingDocs.join(', ')}`
                          : 'All required documents uploaded.'}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSubmitForReview}
                        disabled={!application || !allDocsUploaded || finalizing || uploading || application.status !== "draft"}
                      >
                        {finalizing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Submit for review
                      </Button>
                    </div>

                    <div className="space-y-4 mt-4">
                      {docOptions.map((opt) => {
                        const inputId = `upload-${opt.key}`;
                        return (
                          <div key={opt.key} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="flex items-start gap-3">
                              <Upload className="w-4 h-4 mt-1 text-teal-600" />
                              <div>
                                <p className="font-medium text-sm text-slate-900">{opt.label}</p>
                                <p className="text-xs text-slate-500">Accepted: PDF, JPEG, PNG (max 5MB)</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={uploadedTypes.has(opt.key) ? "default" : "outline"} className="text-xs">
                                {uploadedTypes.has(opt.key) ? "Uploaded" : "Required"}
                              </Badge>
                              <input
                                id={inputId}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const selected = e.target.files?.[0];
                                  handleFileUpload(opt.key, selected);
                                  e.target.value = "";
                                }}
                                disabled={uploading}
                              />
                              <label htmlFor={inputId}>
                                <Button type="button" size="sm" className="cursor-pointer" disabled={uploading}>
                                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                  Upload
                                </Button>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">Uploaded Files</h4>
                      {application.documents?.length > 0 ? (
                        <div className="grid gap-3">
                          {application.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-slate-100">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-teal-600" />
                                <div>
                                  <p className="font-medium text-sm text-slate-900">{doc.file_name}</p>
                                  <p className="text-xs text-slate-500">{new Date(doc.uploaded_at || doc.createdAt || Date.now()).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">{doc.document_type || "Document"}</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No documents uploaded yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Communication</CardTitle>
                    <CardDescription>Messages from your case manager</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Placeholder for messages - Assuming backend could provide this later */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-md">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm">No pending actions or new messages from your manager.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <form onSubmit={handleSubmitIntake} className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>As printed on your passport</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full legal name</Label>
                    <Input value={formData.intakeForm.generalInformation.fullLegalName} onChange={(e) => updateGeneral("fullLegalName", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Other names / aliases</Label>
                    <Input value={formData.intakeForm.generalInformation.otherNames} onChange={(e) => updateGeneral("otherNames", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <Input type="date" value={formData.intakeForm.generalInformation.dateOfBirth} onChange={(e) => updateGeneral("dateOfBirth", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>City and country of birth</Label>
                    <Input value={formData.intakeForm.generalInformation.birthCityCountry} onChange={(e) => updateGeneral("birthCityCountry", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Citizenship / nationality (comma separated)</Label>
                    <Input
                      value={formData.intakeForm.generalInformation.citizenshipCountries.join(", ")}
                      onChange={(e) => updateGeneral("citizenshipCountries", e.target.value.split(",").map((c) => c.trim()))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.intakeForm.generalInformation.gender} onValueChange={(value) => updateGeneral("gender", value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marital status</Label>
                    <Select value={formData.intakeForm.generalInformation.maritalStatus} onValueChange={(value) => updateGeneral("maritalStatus", value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={formData.intakeForm.generalInformation.address.city} onChange={(e) => updateGeneralAddress("city", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={formData.intakeForm.generalInformation.address.state} onChange={(e) => updateGeneralAddress("state", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP</Label>
                    <Input value={formData.intakeForm.generalInformation.address.zip} onChange={(e) => updateGeneralAddress("zip", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={formData.intakeForm.generalInformation.address.country} onChange={(e) => updateGeneralAddress("country", e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone (mobile)</Label>
                    <Input value={formData.intakeForm.generalInformation.phoneMobile} onChange={(e) => updateGeneral("phoneMobile", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Other phone</Label>
                    <Input value={formData.intakeForm.generalInformation.phoneOther} onChange={(e) => updateGeneral("phoneOther", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={formData.intakeForm.generalInformation.email} onChange={(e) => updateGeneral("email", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred contact method</Label>
                    <Select value={formData.intakeForm.generalInformation.preferredContactMethod} onValueChange={(value) => updateGeneral("preferredContactMethod", value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Immigration Status & Travel</CardTitle>
                <CardDescription>Tell us about your U.S. travel history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox id="beenToUS" checked={formData.intakeForm.immigrationHistory.beenToUS} onCheckedChange={(checked) => updateImmigration("beenToUS", !!checked)} />
                  <Label htmlFor="beenToUS" className="text-sm">I have been to the United States before</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of last entry</Label>
                    <Input type="date" value={formData.intakeForm.immigrationHistory.lastEntryDate} onChange={(e) => updateImmigration("lastEntryDate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Place of last entry (city, state)</Label>
                    <Input value={formData.intakeForm.immigrationHistory.lastEntryPlace} onChange={(e) => updateImmigration("lastEntryPlace", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Manner of last entry</Label>
                    <Select value={formData.intakeForm.immigrationHistory.mannerOfLastEntry} onValueChange={(value) => updateImmigration("mannerOfLastEntry", value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="visa_waiver">Visa Waiver</SelectItem>
                        <SelectItem value="parole">Parole</SelectItem>
                        <SelectItem value="without_inspection">Without inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Class of admission (e.g., B-2)</Label>
                    <Input value={formData.intakeForm.immigrationHistory.classOfAdmission} onChange={(e) => updateImmigration("classOfAdmission", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>I-94 number</Label>
                    <Input value={formData.intakeForm.immigrationHistory.i94Number} onChange={(e) => updateImmigration("i94Number", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Current immigration status</Label>
                    <Select value={formData.intakeForm.immigrationHistory.currentStatus} onValueChange={(value) => updateImmigration("currentStatus", value)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="visitor">Visitor</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="worker">Worker</SelectItem>
                        <SelectItem value="tps">TPS</SelectItem>
                        <SelectItem value="daca">DACA</SelectItem>
                        <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                        <SelectItem value="citizen">U.S. Citizen</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Passport & ID</CardTitle>
                <CardDescription>Include your latest passport details</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Passport country</Label>
                  <Input value={formData.intakeForm.passportInformation.passportCountry} onChange={(e) => updatePassport("passportCountry", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Passport number</Label>
                  <Input value={formData.intakeForm.passportInformation.passportNumber} onChange={(e) => updatePassport("passportNumber", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date issued</Label>
                  <Input type="date" value={formData.intakeForm.passportInformation.issuedDate} onChange={(e) => updatePassport("issuedDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Expiration date</Label>
                  <Input type="date" value={formData.intakeForm.passportInformation.expirationDate} onChange={(e) => updatePassport("expirationDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Place of issue</Label>
                  <Input value={formData.intakeForm.passportInformation.placeOfIssue} onChange={(e) => updatePassport("placeOfIssue", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Alien number (A-Number)</Label>
                  <Input value={formData.intakeForm.passportInformation.alienNumber} onChange={(e) => updatePassport("alienNumber", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>U.S. Social Security Number</Label>
                  <Input value={formData.intakeForm.passportInformation.ssn} onChange={(e) => updatePassport("ssn", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Education & Employment</CardTitle>
                <CardDescription>Tell us about your background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Highest education completed</Label>
                  <Select value={formData.intakeForm.educationEmployment.highestEducation} onValueChange={(value) => setFormData((prev) => ({
                    ...prev,
                    intakeForm: {
                      ...prev.intakeForm,
                      educationEmployment: {
                        ...prev.intakeForm.educationEmployment,
                        highestEducation: value
                      }
                    }
                  }))}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less_than_high_school">Less than high school</SelectItem>
                      <SelectItem value="high_school">High school</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="bachelor">Bachelor</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Education history (secondary and above)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addEducationItem}>Add school</Button>
                  </div>
                  <div className="space-y-3">
                    {formData.intakeForm.educationEmployment.educationList.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-slate-100 rounded-md p-3">
                        <Input placeholder="School / University" value={item.school} onChange={(e) => updateEducationItem(idx, "school", e.target.value)} />
                        <Input placeholder="Degree / Field" value={item.degreeField} onChange={(e) => updateEducationItem(idx, "degreeField", e.target.value)} />
                        <Input placeholder="Country" value={item.country} onChange={(e) => updateEducationItem(idx, "country", e.target.value)} />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="From" value={item.yearsFrom} onChange={(e) => updateEducationItem(idx, "yearsFrom", e.target.value)} />
                          <Input placeholder="To" value={item.yearsTo} onChange={(e) => updateEducationItem(idx, "yearsTo", e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current employer</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Company name" value={formData.intakeForm.educationEmployment.currentEmployer.companyName} onChange={(e) => updateEmployment("companyName", e.target.value)} />
                    <Input placeholder="Position / Job title" value={formData.intakeForm.educationEmployment.currentEmployer.position} onChange={(e) => updateEmployment("position", e.target.value)} />
                    <Input type="date" placeholder="Start date" value={formData.intakeForm.educationEmployment.currentEmployer.startDate} onChange={(e) => updateEmployment("startDate", e.target.value)} />
                    <Input placeholder="Address" value={formData.intakeForm.educationEmployment.currentEmployer.address} onChange={(e) => updateEmployment("address", e.target.value)} />
                    <Input placeholder="Work phone/email" value={formData.intakeForm.educationEmployment.currentEmployer.workContact} onChange={(e) => updateEmployment("workContact", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Previous relevant employment (last 5 years)</Label>
                  <Textarea rows={3} value={formData.intakeForm.educationEmployment.previousEmployment} onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    intakeForm: {
                      ...prev.intakeForm,
                      educationEmployment: {
                        ...prev.intakeForm.educationEmployment,
                        previousEmployment: e.target.value
                      }
                    }
                  }))} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Purpose of Consultation</CardTitle>
                <CardDescription>Select all that apply</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Family petition",
                  "Employment or work visa",
                  "Student or exchange visa",
                  "Green card (permanent residence)",
                  "Naturalization/citizenship",
                  "Asylum or humanitarian relief",
                  "Removal/deportation defense"
                ].map((item) => (
                  <label key={item} className="flex items-center gap-3 text-sm text-slate-700">
                    <Checkbox checked={formData.intakeForm.consultation.purposes.includes(item)} onCheckedChange={() => togglePurpose(item)} />
                    <span>{item}</span>
                  </label>
                ))}
                <div className="space-y-2">
                  <Label>Other</Label>
                  <Input value={formData.intakeForm.consultation.otherPurpose} onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    intakeForm: {
                      ...prev.intakeForm,
                      consultation: {
                        ...prev.intakeForm.consultation,
                        otherPurpose: e.target.value
                      }
                    }
                  }))} />
                </div>
                <div className="space-y-2">
                  <Label>Describe your situation and goals</Label>
                  <Textarea rows={4} value={formData.intakeForm.consultation.description} onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    intakeForm: {
                      ...prev.intakeForm,
                      consultation: {
                        ...prev.intakeForm.consultation,
                        description: e.target.value
                      }
                    }
                  }))} />
                </div>
                <div className="space-y-2">
                  <Label>How did you hear about us?</Label>
                  <Select value={formData.intakeForm.consultation.howHeard} onValueChange={(value) => setFormData((prev) => ({
                    ...prev,
                    intakeForm: {
                      ...prev.intakeForm,
                      consultation: {
                        ...prev.intakeForm.consultation,
                        howHeard: value
                      }
                    }
                  }))}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referral">Referral (friend/family)</SelectItem>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Other (optional)" value={formData.intakeForm.consultation.howHeardOther} onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    intakeForm: {
                      ...prev.intakeForm,
                      consultation: {
                        ...prev.intakeForm.consultation,
                        howHeardOther: e.target.value
                      }
                    }
                  }))} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Documents You Can Bring</CardTitle>
                <CardDescription>Check what you can provide</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
                {["passport", "visas", "workPermits", "certificates", "priorApplications", "taxFinancials"].map((item) => (
                  <label key={item} className="flex items-center gap-3">
                    <Checkbox checked={formData.intakeForm.documentsProvided[item]} onCheckedChange={() => toggleDocument(item)} />
                    <span className="capitalize">{item.replace(/([A-Z])/g, " $1")}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Finalize</CardTitle>
                <CardDescription>Set urgency and acknowledge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visa type (for routing)</Label>
                    <Select value={formData.visaType} onValueChange={(value) => setFormData((prev) => ({ ...prev, visaType: value }))}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tourist">Tourist</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <Checkbox checked={formData.intakeForm.acknowledgment.agreed} onCheckedChange={(checked) => setFormData((prev) => ({
                    ...prev,
                    intakeForm: {
                      ...prev.intakeForm,
                      acknowledgment: { agreed: !!checked }
                    }
                  }))} />
                  <span>This intake form is for preliminary evaluation only and does not create an attorney–client relationship.</span>
                </label>

                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Intake Form
                </Button>
              </CardContent>
            </Card>
          </form>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;
