import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Upload, CheckCircle, Clock, XCircle, Image as ImageIcon } from 'lucide-react';

interface KYCVerification {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  full_address: string;
  country: string;
  id_number: string;
  id_front_photo_url: string;
  id_back_photo_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function KYCPage() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [kyc, setKyc] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    full_address: '',
    country: '',
    id_number: '',
  });
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadKYC();
  }, [profile]);

  const loadKYC = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading KYC:', error);
      } else if (data) {
        setKyc(data);
      }
    } catch (err) {
      console.error('Error loading KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFrontIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBackIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    if (!profile || !frontIdFile || !backIdFile) {
      setError('Please upload both front and back photos of your ID');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const frontPhotoBase64 = await convertToBase64(frontIdFile);
      const backPhotoBase64 = await convertToBase64(backIdFile);

      const { error: insertError } = await supabase
        .from('kyc_verifications')
        .insert({
          user_id: profile.id,
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          full_address: formData.full_address,
          country: formData.country,
          id_number: formData.id_number,
          id_front_photo_url: frontPhotoBase64,
          id_back_photo_url: backPhotoBase64,
          status: 'pending',
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        loadKYC();
      }, 2000);
    } catch (err: any) {
      console.error('KYC submission error:', err);
      setError(err.message || 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (kyc) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-4 sm:py-6 md:py-8 px-3 sm:px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0f0f0f] rounded-lg p-6 sm:p-8 border border-teal-900/30">
            <div className="text-center mb-6">
              {kyc.status === 'pending' && (
                <>
                  <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">KYC Under Review</h2>
                  <p className="text-sm sm:text-base text-gray-400">
                    We are reviewing your personal details. Verification may take 3 to 6 hours.
                  </p>
                </>
              )}
              {kyc.status === 'approved' && (
                <>
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">KYC Verified</h2>
                  <p className="text-sm sm:text-base text-gray-400">
                    Your account has been verified. You can now access all features.
                  </p>
                </>
              )}
              {kyc.status === 'rejected' && (
                <>
                  <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">KYC Rejected</h2>
                  <p className="text-sm sm:text-base text-gray-400">
                    Your verification was rejected. Please contact support for more information.
                  </p>
                </>
              )}
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-gray-400 text-sm sm:text-base">Full Name:</span>
                <span className="text-white font-medium text-sm sm:text-base">{kyc.full_name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-gray-400 text-sm sm:text-base">Phone:</span>
                <span className="text-white font-medium text-sm sm:text-base">{kyc.phone_number}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-gray-400 text-sm sm:text-base">Country:</span>
                <span className="text-white font-medium text-sm sm:text-base">{kyc.country}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-gray-400 text-sm sm:text-base">ID Number:</span>
                <span className="text-white font-medium text-sm sm:text-base">{kyc.id_number}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="text-gray-400 text-sm sm:text-base">Submitted:</span>
                <span className="text-white font-medium text-sm sm:text-base">
                  {new Date(kyc.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] py-4 sm:py-6 md:py-8 px-3 sm:px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#0f0f0f] rounded-lg p-6 sm:p-8 border border-teal-900/30 text-center">
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">KYC Submitted Successfully</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6">
              We are reviewing your personal details. Verification may take 3 to 6 hours.
            </p>
            <div className="text-yellow-400 text-sm animate-pulse">
              Redirecting...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-4 sm:py-6 md:py-8 px-3 sm:px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0f0f0f] rounded-lg p-6 sm:p-8 border border-teal-900/30">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('kyc')}</h1>
          <p className="text-sm sm:text-base text-gray-400 mb-6">
            Complete your KYC verification to access all platform features
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address *
              </label>
              <textarea
                required
                value={formData.full_address}
                onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                rows={3}
                placeholder="Enter your full address"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Country *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Enter your country"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Number (Passport or National ID) *
              </label>
              <input
                type="text"
                required
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                placeholder="Enter your ID number"
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-teal-900/30 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Front Photo of ID *
                </label>
                <div className="border-2 border-dashed border-teal-900/30 rounded-lg p-4 text-center hover:border-teal-600 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontFileChange}
                    required
                    className="hidden"
                    id="front-id-upload"
                  />
                  <label htmlFor="front-id-upload" className="cursor-pointer block">
                    {frontPreview ? (
                      <img src={frontPreview} alt="Front ID" className="w-full h-32 object-cover rounded-md mb-2" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className="text-gray-400 text-sm">
                      {frontIdFile ? frontIdFile.name : 'Click to upload'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Back Photo of ID *
                </label>
                <div className="border-2 border-dashed border-teal-900/30 rounded-lg p-4 text-center hover:border-teal-600 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackFileChange}
                    required
                    className="hidden"
                    id="back-id-upload"
                  />
                  <label htmlFor="back-id-upload" className="cursor-pointer block">
                    {backPreview ? (
                      <img src={backPreview} alt="Back ID" className="w-full h-32 object-cover rounded-md mb-2" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className="text-gray-400 text-sm">
                      {backIdFile ? backIdFile.name : 'Click to upload'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-teal-900/20 border border-teal-600/30 rounded-lg p-4">
              <p className="text-teal-300 text-sm">
                <strong>Note:</strong> Please ensure your ID photos are clear and all details are visible. Accepted formats: Passport and National ID cards.
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </span>
              ) : (
                t('submit')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
