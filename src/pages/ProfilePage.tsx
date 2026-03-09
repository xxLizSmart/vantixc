import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Upload } from 'lucide-react';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const updates: any = {};

      if (username && username !== profile.username) {
        updates.username = username;
      }

      if (avatarFile) {
        const avatarBase64 = await convertToBase64(avatarFile);
        updates.avatar_url = avatarBase64;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);

        if (updateError) throw updateError;

        await refreshProfile();
        setSuccess(true);
        setAvatarFile(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8 px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

        <div className="bg-[#0f0f0f] rounded-lg p-6 border border-teal-900/30">
          {success && (
            <div className="mb-6 bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md text-sm">
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                {profile?.avatar_url || avatarFile ? (
                  <img
                    src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url!}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full border-4 border-gray-700 object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-teal-900/30 bg-[#1a1a1a] flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-500" />
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-teal-600 p-2 rounded-full cursor-pointer hover:bg-teal-700 transition-colors"
                >
                  <Upload className="w-5 h-5 text-white" />
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.id || ''}
                disabled
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                <div className="text-gray-400 text-sm mb-1">Member Since</div>
                <div className="text-white font-semibold">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-teal-900/30">
                <div className="text-gray-400 text-sm mb-1">Account Type</div>
                <div className="text-white font-semibold">
                  {profile?.is_admin ? 'Admin' : 'Trader'}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
