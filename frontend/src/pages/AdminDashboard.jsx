import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe, LayoutDashboard, Users, FileText, Calendar, LogOut, Loader2, User,
  TrendingUp, CheckCircle2, Clock, AlertCircle, BarChart3, Plus
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "coordinator" });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await apiClient.post("/auth/create-user", newUser);
      toast.success("Team member created successfully");
      setIsCreateUserOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "coordinator" });
      fetchData(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, sessionsRes] = await Promise.all([
        apiClient.get("/admin/stats"),
        apiClient.get("/users"),
        apiClient.get("/sessions")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setSessions(sessionsRes.data.sessions || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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

  const getRoleColor = (role) => {
    const colors = {
      client: "bg-blue-50 text-blue-700",
      coordinator: "bg-purple-50 text-purple-700",
      manager: "bg-emerald-50 text-emerald-700",
      admin: "bg-rose-50 text-rose-700"
    };
    return colors[role] || "bg-slate-50 text-slate-700";
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

  const successRate = stats?.applications?.total > 0
    ? Math.round((stats.applications.approved / stats.applications.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Globe className="w-8 h-8 text-teal-600" />
          <span className="font-heading text-xl font-bold text-slate-900">Glojourn</span>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="sidebar-link active w-full">
            <LayoutDashboard className="w-5 h-5" /> Overview
          </div>
        </nav>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <User className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900 text-sm">{user?.name}</p>
              <p className="text-xs text-slate-500">Administrator</p>
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
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Monitor all operations and team performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.applications?.total || 0}</p>
                  <p className="text-sm text-slate-600">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.applications?.submitted || 0}</p>
                  <p className="text-sm text-slate-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {(stats?.applications?.under_review || 0) + (stats?.applications?.processing || 0)}
                  </p>
                  <p className="text-sm text-slate-600">In Progress</p>
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
                  <p className="text-2xl font-bold text-slate-900">{stats?.applications?.approved || 0}</p>
                  <p className="text-sm text-slate-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{successRate}%</p>
                  <p className="text-sm text-slate-600">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-700">{stats?.users?.clients || 0}</p>
                <p className="text-sm text-blue-600 mt-1">Clients</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-purple-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-700">{stats?.users?.coordinators || 0}</p>
                <p className="text-sm text-purple-600 mt-1">Coordinators</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-emerald-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-700">{stats?.users?.managers || 0}</p>
                <p className="text-sm text-emerald-600 mt-1">Managers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-700">{stats?.sessions || 0}</p>
                <p className="text-sm text-amber-600 mt-1">Sessions Booked</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications" data-testid="tab-applications">Recent Applications</TabsTrigger>
            <TabsTrigger value="team" data-testid="tab-team">Team Members</TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Recent Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recent_applications?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Visa Type</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Documents</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recent_applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.client_name}</TableCell>
                          <TableCell>{app.client_email}</TableCell>
                          <TableCell>{app.personal_details?.visa_type || "-"}</TableCell>
                          <TableCell>{app.personal_details?.destination_country || "-"}</TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              {app.assigned_manager ? (
                                <span className="font-medium text-slate-900">Mgr: {app.assigned_manager.name}</span>
                              ) : <span className="text-slate-400">No Manager</span>}
                              {app.assigned_coordinator ? (
                                <span className="text-slate-500">Crd: {app.assigned_coordinator.name}</span>
                              ) : <span className="text-slate-400">No Coordinator</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(app.status)} border`}>
                              {app.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{app.documents?.length || 0}</TableCell>
                          <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-slate-500 text-center py-8">No applications yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Team Members
                </CardTitle>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700 h-9">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>
                        Create a new account for a coordinator or manager.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-name">Name</Label>
                        <Input
                          id="new-name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Jane Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-email">Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="jane@glojourn.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="********"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-role">Role</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={createLoading}>
                          {createLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Create Account
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(u.role)}>
                              {u.role.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-slate-500 text-center py-8">No team members</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Booked Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time Slot</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.client_name}</TableCell>
                          <TableCell>{session.date}</TableCell>
                          <TableCell>{session.time_slot}</TableCell>
                          <TableCell>
                            <Badge className="bg-teal-50 text-teal-700">
                              {session.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{session.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-slate-500 text-center py-8">No sessions booked</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
