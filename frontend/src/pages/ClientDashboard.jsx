import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button"; // Still needed for intake form mode
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Import New Components
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ApplicationStatusCard from "@/components/dashboard/ApplicationStatusCard";
import IntakeSnapshot from "@/components/dashboard/IntakeSnapshot";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import MessageCenter from "@/components/dashboard/MessageCenter";
import IntakeForm from "@/components/dashboard/IntakeForm";

// Reuse the intake form logic/components for the "creation" phase? 
// The user prompt only asked to improve UI/UX of dashboard.
// Looking at the original file, it had TWO modes:
// 1. No application -> Show Intake Form logic (lines 103, 107, 388 etc)
// 2. Application exists -> Show Dashboard logic (lines 574+)
//
// The new design primarily addresses the "Dashboard" view (Post-submission).
// However, I should probably keep the intake form logic or wrap it nicely too.
// Given the complexity, I will keep the Intake Form logic INLINE for now but style it better if I can, 
// OR focus mainly on the dashboard part if `application` exists. 
//
// Wait, the "Intake Form" creation flow is massive (lines 33-91, 388-527). 
// I should probably extract that too if I want a clean file, but my plan only detailed the Dashboard view.
// I'll stick to the plan: modularize the *Dashboard* view. 
// The Intake Form view will remain but I'll ensure the Navbar wraps it too.

const docOptions = [
  { key: "passport", label: "Passport (all pages with stamps/visas)", flag: "passport" },
  { key: "visas", label: "U.S. visas and I-94 records", flag: "visas" },
  { key: "work_permits", label: "Work permits, green card, or naturalization certificate", flag: "workPermits" },
  { key: "certificates", label: "Birth, marriage, and divorce certificates", flag: "certificates" },
  { key: "prior_applications", label: "Prior immigration applications and all USCIS or court notices", flag: "priorApplications" },
  { key: "tax_financials", label: "Tax returns, pay slips, and employment letters", flag: "taxFinancials" }
];

const requiredDocTypes = docOptions.map((opt) => opt.key);


const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentRequests, setDocumentRequests] = useState([]);

  // Dashboard States
  const [activeTab, setActiveTab] = useState("documents");


  useEffect(() => {
    fetchApplication();
    fetchDocumentRequests();
  }, [user]); // Added fetch deps in separate effect if needed, but [] is fine for mount.

  const fetchDocumentRequests = async () => {
    try {
      const res = await apiClient.get("/document-requests");
      setDocumentRequests(res.data.requests || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchApplication = async () => {
    try {
      setLoading(true);
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


  // ... (Keep Intake Form Helper functions: handleFileSelection, updateGeneral, etc. 
  // For brevity in this artifact, I am assuming I will COPY them from the previous file.
  // BUT for the `ClientDashboard.jsx` rewrite I must provide the FULL content.)
  // I will only include the Render logic here to show the structure.

  // NOTE: For the actual write_to_file, I need to include the Intake Form logic because 
  // if I remove it, the user can't create an application!
  // Since the user asked for "Redesign", they likely want the form to look good too.
  // But that is a huge task. The "Dashboard" usually implies the view AFTER login/submission.
  // The intake form IS part of the dashboard.
  // Given the constraints and the "Professional" request, I will try to clean up the intake form 
  // but mostly focus on wrapping it in the new layout.

  // ... (Intake Form Handlers) ...

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNavbar user={user} onLogout={handleLogout} />

      <main className="container-custom mx-auto px-4 py-8 md:py-12">

        {!application ? (
          <IntakeForm user={user} onSuccess={fetchApplication} />
        ) : (
          // DASHBOARD VIEW
          <div className="space-y-8 animate-in fade-in duration-500">
            <DashboardHeader user={user} />

            <ApplicationStatusCard application={application} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Snapshot (1/3) */}
              <div className="space-y-8">
                <IntakeSnapshot application={application} />
              </div>

              {/* Right Column: Interactive (2/3) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="grid md:grid-cols-2 gap-8 h-[600px]">
                  <DocumentUpload
                    application={application}
                    docOptions={docOptions}
                    requiredDocTypes={requiredDocTypes}
                    onRefresh={fetchApplication}
                  />
                  <MessageCenter
                    requests={documentRequests}
                    onChangeTab={setActiveTab}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientDashboard;