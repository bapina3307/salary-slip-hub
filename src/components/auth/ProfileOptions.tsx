import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
const supabase = createClient('your-supabase-url', 'your-supabase-anon-key');

const ProfileOptions: React.FC = () => {
  const { logout, user } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully!');
      setShowChangePasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button onClick={() => setDropdownOpen(!dropdownOpen)}>
        Administrator
      </Button>
      {dropdownOpen && (
        <ul className="absolute right-0 bg-white shadow-md rounded-md p-2">
          <li>
            <Button variant="link" onClick={() => setShowChangePasswordModal(true)}>
              Change Password
            </Button>
          </li>
          <li>
            <Button variant="link" onClick={logout}>Log Out</Button>
          </li>
        </ul>
      )}

      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
            <Input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileOptions;