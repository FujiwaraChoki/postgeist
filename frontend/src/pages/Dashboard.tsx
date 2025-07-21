import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  User,
  BarChart3,
  MessageSquare,
  Calendar,
  Trash2,
  TrendingUp,
  Users,
  Activity,
  Sparkles,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import apiService from "../lib/api";
import type { UserSummary } from "../types";
import { formatDate, sanitizeUsername, validateUsername, cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import AddUserModal from "../components/AddUserModal";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(`Failed to load users: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete @${username}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUser(username);
      toast.success(`User @${username} deleted successfully`);
      loadUsers();
    } catch (error) {
      toast.error(`Failed to delete user: ${error}`);
    }
  };

  const filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPosts = users.reduce((sum, user) => sum + user.postsCount, 0);
  const analyzedUsers = users.filter(user => user.hasAnalysis).length;
  const totalCommunities = users.reduce((sum, user) => sum + user.communities, 0);

  if (loading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 border border-border/50">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to Postgeist
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                AI-powered Twitter analysis and content generation. Transform how you understand and create social media
                content.
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all duration-300 self-start lg:self-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add User
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">+{analyzedUsers} analyzed</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCommunities}</div>
            <p className="text-xs text-muted-foreground">Content categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <CardDescription>Find and manage your analyzed Twitter profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent className="space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{users.length === 0 ? "No users found" : "No matching users"}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {users.length === 0
                  ? "Get started by adding a Twitter user to analyze their posting patterns and generate content ideas."
                  : "No users match your search criteria. Try adjusting your search term."}
              </p>
            </div>
            {users.length === 0 && (
              <Button onClick={() => setShowAddModal(true)} variant="outline" size="lg" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First User
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, index) => (
            <Card
              key={user.username}
              className={cn("group hover-lift transition-all duration-300", "hover:border-primary/50 hover:shadow-lg")}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg leading-none">@{user.username}</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(user.lastUpdated)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteUser(user.username)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{user.postsCount}</div>
                    <div className="text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">{user.communities}</div>
                    <div className="text-xs text-muted-foreground">Communities</div>
                  </div>
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        user.hasAnalysis ? "text-green-600" : "text-muted-foreground"
                      )}
                    >
                      {user.hasAnalysis ? "✓" : "○"}
                    </div>
                    <div className="text-xs text-muted-foreground">Analysis</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {user.hasAnalysis && (
                    <Badge variant="success" className="text-xs">
                      Analyzed
                    </Badge>
                  )}
                  {user.customInstructions && (
                    <Badge variant="info" className="text-xs">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Custom Instructions
                    </Badge>
                  )}
                  {user.communities > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {user.communities} Communities
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild className="flex-1" size="sm">
                    <Link to={`/user/${user.username}`}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analysis
                      <ChevronRight className="w-3 h-3 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/user/${user.username}/settings`}>Settings</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={loadUsers} />
    </div>
  );
}
