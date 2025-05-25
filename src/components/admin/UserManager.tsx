
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'company' | 'participant';
  created_at?: string;
}

interface UserWithRoles extends Profile {
  user_roles: UserRole[];
}

export const UserManager = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'company' | 'participant'>('participant');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // First fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then fetch user roles separately using direct query
      const { data: userRoles, error: rolesError } = await supabase
        .rpc('get_user_roles_data') as { data: any[], error: any };

      // If the function doesn't exist, fall back to manual query
      let roles: UserRole[] = [];
      if (rolesError) {
        const { data, error } = await (supabase as any)
          .from('user_roles')
          .select('*');
        
        if (!error) {
          roles = data || [];
        }
      } else {
        roles = userRoles || [];
      }

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = profiles?.map(profile => ({
        ...profile,
        user_roles: roles.filter(role => role.user_id === profile.id)
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleAssignment = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await (supabase as any)
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: newRole,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role ${newRole} assigned successfully`,
      });

      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'company': return 'bg-blue-500';
      case 'participant': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.full_name || user.username || 'Unknown User'}</h3>
                    <p className="text-sm text-muted-foreground">@{user.username || 'no-username'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {user.user_roles?.map((role) => (
                      <Badge
                        key={role.id}
                        className={getRoleColor(role.role)}
                        onClick={() => removeRole(user.id, role.id)}
                        style={{ cursor: 'pointer' }}
                        title="Click to remove role"
                      >
                        {role.role}
                      </Badge>
                    ))}
                    {(!user.user_roles || user.user_roles?.length === 0) && (
                      <Badge variant="outline">No roles</Badge>
                    )}
                  </div>
                  
                  <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Assign Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign Role to {selectedUser?.full_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="participant">Participant</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleRoleAssignment}>
                            Assign Role
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Experience: {user.experience_level || 'Not specified'}</span>
                <span>Location: {user.location || 'Not specified'}</span>
                <span>Joined: {new Date(user.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
