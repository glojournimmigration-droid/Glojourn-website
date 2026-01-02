import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe, LayoutDashboard, FileText, LogOut, Loader2, User, Eye, FileCheck,
  AlertCircle, CheckCircle2, XCircle, Send
} from "lucide-react";
import { toast } from "sonner";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Document request state
  const [requestDocType, setRequestDocType] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  // Status update state
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/applications");
      setApplications(res.data.applications || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDocument = async () => {
    if (!requestDocType || !requestMessage) {
      toast.error("Please fill in all fields");
      return;
    }
    setSendingRequest(true);
    try {
      await apiClient.post("/document-requests", {
        application_id: selectedApp.id,
        document_type: requestDocType,
        message: requestMessage
      });
      toast.success("Document request sent to client");
      setRequestDialogOpen(false);
      setRequestDocType("");
      setRequestMessage("");
    } catch {
      toast.error("Failed to send request");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error("Please select a status");
      return;
    }
    setUpdatingStatus(true);
    try {
      await apiClient.put(`/applications/${selectedApp.id}`, { status: newStatus });
      toast.success("Status updated successfully");
      setStatusDialogOpen(false);
      setNewStatus("");
      fetchData();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="manager-dashboard">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Globe className="w-8 h-8 text-teal-600" />
          <span className="font-heading text-xl font-bold text-slate-900">Glojourn</span>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="sidebar-link active w-full">
            <LayoutDashboard className="w-5 h-5" /> My Clients
          </div>
        </nav>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">{user?.name}</p>
              <p className="text-xs text-slate-500">Manager</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-rose-600"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-6 md:p-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-slate-900">Manager Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your assigned client applications</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                  <p className="text-sm text-slate-600">Assigned Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {applications.filter(a => a.status === "under_review").length}
                  </p>
                  <p className="text-sm text-slate-600">Under Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {applications.filter(a => a.status === "processing").length}
                  </p>
                  <p className="text-sm text-slate-600">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {applications.filter(a => a.status === "approved").length}
                  </p>
                  <p className="text-sm text-slate-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              My Assigned Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Visa Type</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.client_name}</TableCell>
                      <TableCell>{app.client_email}</TableCell>
                      <TableCell>{app.personal_details?.visa_type || "-"}</TableCell>
                      <TableCell>{app.personal_details?.destination_country || "-"}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(app.status)} border`}>
                          {app.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.documents?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* View Details */}
                          <Dialog open={viewDialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                            setViewDialogOpen(open);
                            if (!open) setSelectedApp(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedApp(app)}
                                data-testid={`view-btn-${app.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <div className="flex justify-between items-center pr-8">
                                  <DialogTitle>Application Details</DialogTitle>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedApp, null, 2));
                                      const downloadAnchorNode = document.createElement('a');
                                      downloadAnchorNode.setAttribute("href", dataStr);
                                      downloadAnchorNode.setAttribute("download", `application_${selectedApp.case_number || selectedApp.id}.json`);
                                      document.body.appendChild(downloadAnchorNode); // required for firefox
                                      downloadAnchorNode.click();
                                      downloadAnchorNode.remove();
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Download JSON
                                  </Button>
                                </div>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4 pt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-slate-500">Full Name</Label>
                                      <p className="font-medium">{app.personal_details?.full_name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500">Email</Label>
                                      <p className="font-medium">{app.client_email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500">Passport Number</Label>
                                      <p className="font-medium font-mono">{app.personal_details?.passport_number}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500">Nationality</Label>
                                      <p className="font-medium">{app.personal_details?.nationality || "-"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500">Visa Type</Label>
                                      <p className="font-medium">{app.personal_details?.visa_type || "-"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500">Destination</Label>
                                      <p className="font-medium">{app.personal_details?.destination_country || "-"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500">Phone</Label>
                                      <p className="font-medium">{app.personal_details?.phone || "-"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500">Date of Birth</Label>
                                      <p className="font-medium">{app.personal_details?.date_of_birth || "-"}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-slate-500">Address</Label>
                                    <p className="font-medium">{app.personal_details?.address || "-"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-slate-500 mb-2 block">Documents ({app.documents?.length || 0})</Label>
                                    {app.documents?.length > 0 ? (
                                      <div className="space-y-2">
                                        {app.documents.map((doc) => (
                                          <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-sm">
                                            <FileCheck className="w-4 h-4 text-teal-600" />
                                            <div>
                                              <p className="font-medium text-sm">{doc.file_name}</p>
                                              <p className="text-xs text-slate-500">{doc.document_type}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-slate-500">No documents uploaded</p>
                                    )}
                                  </div>
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>

                          {/* Request Document */}
                          <Dialog open={requestDialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                            setRequestDialogOpen(open);
                            if (!open) setSelectedApp(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                onClick={() => setSelectedApp(app)}
                                data-testid={`request-doc-btn-${app.id}`}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Document from Client</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div>
                                  <Label>Document Type</Label>
                                  <Select value={requestDocType} onValueChange={setRequestDocType}>
                                    <SelectTrigger className="mt-1" data-testid="request-doc-type">
                                      <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="passport">Passport</SelectItem>
                                        <SelectItem value="visas">U.S. Visas / I-94</SelectItem>
                                        <SelectItem value="work_permits">Work Permits / EAD</SelectItem>
                                        <SelectItem value="certificates">Birth / Marriage / Divorce Certificates</SelectItem>
                                        <SelectItem value="prior_applications">Prior Immigration Applications / Notices</SelectItem>
                                        <SelectItem value="tax_financials">Tax Returns / Financials</SelectItem>
                                        <SelectItem value="id_proof">Government ID Proof</SelectItem>
                                        <SelectItem value="financial">Financial Documents</SelectItem>
                                        <SelectItem value="educational">Educational Records</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Message to Client</Label>
                                  <Textarea
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    placeholder="Please provide additional details..."
                                    className="mt-1"
                                    data-testid="request-message"
                                  />
                                </div>
                                <Button
                                  className="w-full bg-amber-600 hover:bg-amber-700"
                                  onClick={handleRequestDocument}
                                  disabled={sendingRequest}
                                  data-testid="send-request-btn"
                                >
                                  {sendingRequest ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                  Send Request
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Update Status */}
                          <Dialog open={statusDialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                            setStatusDialogOpen(open);
                            if (!open) setSelectedApp(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-teal-600 hover:bg-teal-700"
                                onClick={() => {
                                  setSelectedApp(app);
                                  setNewStatus(app.status);
                                }}
                                data-testid={`update-status-btn-${app.id}`}
                              >
                                Update
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Application Status</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="p-4 bg-slate-50 rounded-sm">
                                  <p className="font-medium">{app.client_name}</p>
                                  <p className="text-sm text-slate-600">{app.personal_details?.visa_type} - {app.personal_details?.destination_country}</p>
                                </div>
                                <div>
                                  <Label>New Status</Label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="mt-1" data-testid="select-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="under_review">Under Review</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  className="w-full bg-slate-900 hover:bg-teal-700"
                                  onClick={handleUpdateStatus}
                                  disabled={updatingStatus}
                                  data-testid="confirm-status-btn"
                                >
                                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                  Update Status
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-slate-500 text-center py-8">No applications assigned to you yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ManagerDashboard;
