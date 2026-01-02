import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Globe, LayoutDashboard, Users, FileText, LogOut, Loader2, User, UserPlus, Eye, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [applications, setApplications] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedManager, setSelectedManager] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, managersRes] = await Promise.all([
        apiClient.get("/applications"),
        apiClient.get("/users?role=manager")
      ]);
      setApplications(appsRes.data.applications || []);
      setManagers(managersRes.data.users || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedApp || !selectedManager) {
      toast.error("Please select a manager");
      return;
    }
    setAssigning(true);
    try {
      await apiClient.post("/assignments", {
        application_id: selectedApp.id,
        manager_id: selectedManager
      });
      toast.success("Application assigned successfully");
      setDialogOpen(false);
      setSelectedApp(null);
      setSelectedManager("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign");
    } finally {
      setAssigning(false);
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

  const newApplications = applications.filter(a => a.status !== "draft" && !a.assigned_manager);
  const assignedApplications = applications.filter(a => a.assigned_manager);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="coordinator-dashboard">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Globe className="w-8 h-8 text-teal-600" />
          <span className="font-heading text-xl font-bold text-slate-900">Glojourn</span>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="sidebar-link active w-full">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </div>
        </nav>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">{user?.name}</p>
              <p className="text-xs text-slate-500">Coordinator</p>
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
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-slate-900">Coordinator Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage and assign applications to managers</p>
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
                  <p className="text-sm text-slate-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{newApplications.length}</p>
                  <p className="text-sm text-slate-600">New Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{assignedApplications.length}</p>
                  <p className="text-sm text-slate-600">Assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{managers.length}</p>
                  <p className="text-sm text-slate-600">Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Applications */}
        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              New Applications (Pending Assignment)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newApplications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Visa Type</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.client_name}</TableCell>
                      <TableCell>{app.client_email}</TableCell>
                      <TableCell>{app.personal_details?.visa_type || "-"}</TableCell>
                      <TableCell>{app.personal_details?.destination_country || "-"}</TableCell>
                      <TableCell>{app.documents?.length || 0}</TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Dialog open={dialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (!open) setSelectedApp(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-teal-600 hover:bg-teal-700"
                              onClick={() => setSelectedApp(app)}
                              data-testid={`assign-btn-${app.id}`}
                            >
                              <UserPlus className="w-4 h-4 mr-1" /> Assign
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Application to Manager</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="p-4 bg-slate-50 rounded-sm">
                                <p className="font-medium">{app.client_name}</p>
                                <p className="text-sm text-slate-600">{app.client_email}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                  {app.personal_details?.visa_type} - {app.personal_details?.destination_country}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Select Manager</label>
                                <Select value={selectedManager} onValueChange={setSelectedManager}>
                                  <SelectTrigger data-testid="select-manager">
                                    <SelectValue placeholder="Choose a manager" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {managers.map((m) => (
                                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                className="w-full bg-slate-900 hover:bg-teal-700"
                                onClick={handleAssign}
                                disabled={assigning || !selectedManager}
                                data-testid="confirm-assign-btn"
                              >
                                {assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Confirm Assignment
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-slate-500 text-center py-8">No new applications pending assignment</p>
            )}
          </CardContent>
        </Card>

        {/* All Applications */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              All Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Visa Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Manager</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.client_name}</TableCell>
                      <TableCell>{app.personal_details?.visa_type || "-"}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(app.status)} border`}>
                          {app.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.assigned_manager ?
                          (app.assigned_manager.name || managers.find(m => m.id === app.assigned_manager)?.name || "Assigned") :
                          <span className="text-slate-400">Not assigned</span>
                        }
                      </TableCell>
                      <TableCell>{app.documents?.length || 0}</TableCell>
                      <TableCell>{new Date(app.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-slate-500 text-center py-8">No applications yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CoordinatorDashboard;
