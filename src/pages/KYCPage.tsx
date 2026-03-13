import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { notifyKYC } from '../lib/telegram';
import { CheckCircle, Clock, XCircle, Image as ImageIcon } from 'lucide-react';

interface KYCVerification {
  id: string; user_id: string; full_name: string; phone_number: string;
  full_address: string; country: string; id_number: string;
  id_front_photo_url: string; id_back_photo_url: string;
  status: 'pending' | 'approved' | 'rejected'; created_at: string;
}

const INPUT_STYLE = { background: '#0a0808', border: '1.5px solid rgba(0,235,255,0.15)', color: '#F5F5F0' };

// Upload ID photo to Supabase Storage, fallback to base64
async function uploadKYCPhoto(file: File, userId: string, side: 'front' | 'back'): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `kyc/${userId}/${side}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('assets')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (!error) {
    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    return data.publicUrl;
  }

  // Fallback: base64
  console.warn('[KYCPage] Storage upload failed, using base64:', error.message);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function KYCPage() {
  const { profile, user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [kyc, setKyc] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone_number: '', full_address: '', country: '', id_number: '' });
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
  const [backIdFile, setBackIdFile]   = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview]   = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  // Load KYC once per user ID — not on every profile object change
  useEffect(() => {
    const id = profile?.id;
    if (!id) { setLoading(false); return; }
    if (fetchedRef.current === id) return;
    fetchedRef.current = id;
    loadKYC(id);
  }, [profile?.id]);

  const loadKYC = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) setKyc(data);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const validateFile = (file: File): string | null => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return 'Only JPEG, PNG, or WebP images accepted.';
    if (file.size > 10 * 1024 * 1024) return 'File must be under 10 MB.';
    return null;
  };

  const handleFile = (file: File, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError('');
    setFile(file);
    const r = new FileReader();
    r.onloadend = () => setPreview(r.result as string);
    r.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (profile.kyc_status === 'pending')  { setError('Your KYC is already pending review.'); return; }
    if (profile.kyc_status === 'verified') { setError('Your account is already verified.'); return; }
    if (!frontIdFile || !backIdFile) { setError('Please upload both front and back photos of your ID.'); return; }

    // Validate all fields
    const { full_name, phone_number, full_address, country, id_number } = formData;
    if (!full_name.trim() || !phone_number.trim() || !full_address.trim() || !country.trim() || !id_number.trim()) {
      setError('Please fill in all required fields.'); return;
    }

    setSubmitting(true); setError('');
    try {
      // Upload both ID photos (Storage with base64 fallback)
      const [frontUrl, backUrl] = await Promise.all([
        uploadKYCPhoto(frontIdFile, profile.id, 'front'),
        uploadKYCPhoto(backIdFile,  profile.id, 'back'),
      ]);

      const { error: ie } = await supabase.from('kyc_verifications').insert({
        user_id: profile.id,
        ...formData,
        id_front_photo_url: frontUrl,
        id_back_photo_url:  backUrl,
        status: 'pending',
      });
      if (ie) throw ie;

      const { error: ue } = await supabase.from('profiles')
        .update({ kyc_status: 'pending' })
        .eq('id', profile.id);
      if (ue) throw ue;

      // Fire Telegram notification (non-blocking)
      notifyKYC({
        email:       user?.email ?? 'unknown',
        fullName:    formData.full_name,
        idNumber:    formData.id_number,
        country:     formData.country,
        phoneNumber: formData.phone_number,
        frontUrl,
        backUrl,
      }).catch(e => console.warn('[Telegram] KYC notify failed:', e));

      await refreshProfile();
      setSuccess(true);
      // Reset guard so loadKYC re-fetches the new record
      fetchedRef.current = null;
      setTimeout(() => loadKYC(profile.id), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080808' }}>
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'rgba(0,235,255,0.4)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (kyc) {
    const cfg = {
      pending:  { Icon: Clock,       color: '#EAB308', bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  title: 'KYC Under Review', body: 'We are reviewing your details. This may take 3–6 hours.' },
      approved: { Icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', title: 'KYC Verified',     body: 'Your account is verified. You can access all features.' },
      rejected: { Icon: XCircle,     color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)', title: 'KYC Rejected',     body: 'Verification was rejected. Please contact support.' },
    }[kyc.status];
    return (
      <div className="min-h-screen py-8 px-4 pb-20" style={{ background: '#080808' }}>
        <div className="max-w-xl mx-auto rounded-2xl p-8" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <cfg.Icon className="w-8 h-8" style={{ color: cfg.color }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#F5F5F0' }}>{cfg.title}</h2>
            <p style={{ color: '#A0B0C0' }}>{cfg.body}</p>
          </div>
          <div className="space-y-3 rounded-xl p-5" style={{ background: 'rgba(0,235,255,0.03)', border: '1px solid rgba(0,235,255,0.08)' }}>
            {[
              ['Full Name', kyc.full_name],
              ['Phone', kyc.phone_number],
              ['Country', kyc.country],
              ['ID Number', kyc.id_number],
              ['Submitted', new Date(kyc.created_at).toLocaleDateString()],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span style={{ color: '#7A8899' }}>{l}</span>
                <span className="font-medium" style={{ color: '#F5F5F0' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Show uploaded ID photos if available and are URLs (not base64) */}
          {(kyc.id_front_photo_url || kyc.id_back_photo_url) && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {kyc.id_front_photo_url && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: '#5A6677' }}>Front of ID</p>
                  <img
                    src={kyc.id_front_photo_url}
                    alt="Front ID"
                    className="w-full h-28 object-cover rounded-xl cursor-pointer"
                    style={{ border: '1px solid rgba(0,235,255,0.2)' }}
                    onClick={() => window.open(kyc.id_front_photo_url, '_blank')}
                  />
                </div>
              )}
              {kyc.id_back_photo_url && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: '#5A6677' }}>Back of ID</p>
                  <img
                    src={kyc.id_back_photo_url}
                    alt="Back ID"
                    className="w-full h-28 object-cover rounded-xl cursor-pointer"
                    style={{ border: '1px solid rgba(0,235,255,0.2)' }}
                    onClick={() => window.open(kyc.id_back_photo_url, '_blank')}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#080808' }}>
      <div className="max-w-md w-full text-center rounded-2xl p-10" style={{ background: '#0f0d0d', border: '1px solid rgba(16,185,129,0.25)' }}>
        <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#F5F5F0' }}>Submitted Successfully</h2>
        <p style={{ color: '#A0B0C0' }}>We are reviewing your details. This may take 3–6 hours.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 pb-20" style={{ background: '#080808' }}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0f0d0d', border: '1px solid rgba(0,235,255,0.12)' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #FFC0CB55, #E6E6FA77, #B0E0E6AA, #00EBFF66, transparent)' }} />
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#F5F5F0', letterSpacing: '-0.02em' }}>{t('kyc')}</h1>
            <p className="text-sm mb-8" style={{ color: '#7A8899' }}>Complete verification to unlock all platform features</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { id: 'full_name',    label: 'Full Name',                         type: 'text', ph: 'Enter your full name' },
                { id: 'phone_number', label: 'Phone Number',                       type: 'tel',  ph: '+1 234 567 8900' },
                { id: 'country',      label: 'Country',                            type: 'text', ph: 'Enter your country' },
                { id: 'id_number',    label: 'ID Number (Passport / National ID)', type: 'text', ph: 'Enter your ID number' },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#7A8899' }}>{f.label} *</label>
                  <input
                    type={f.type} required
                    value={formData[f.id as keyof typeof formData]}
                    onChange={e => setFormData({ ...formData, [f.id]: e.target.value })}
                    placeholder={f.ph}
                    className="w-full px-4 py-3.5 rounded-xl text-base focus:outline-none transition-all"
                    style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#7A8899' }}>Full Address *</label>
                <textarea
                  required rows={3}
                  value={formData.full_address}
                  onChange={e => setFormData({ ...formData, full_address: e.target.value })}
                  placeholder="Enter your full address"
                  className="w-full px-4 py-3.5 rounded-xl text-base focus:outline-none transition-all resize-none"
                  style={INPUT_STYLE}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(0,235,255,0.15)')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#7A8899' }}>ID Photos *</label>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'front-id', label: 'Front of ID',
                      file: frontIdFile, preview: frontPreview,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, setFrontIdFile, setFrontPreview);
                      },
                    },
                    {
                      id: 'back-id', label: 'Back of ID',
                      file: backIdFile, preview: backPreview,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f, setBackIdFile, setBackPreview);
                      },
                    },
                  ].map(slot => (
                    <div key={slot.id}>
                      <p className="text-xs mb-2" style={{ color: '#A0B0C0' }}>{slot.label}</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={slot.onChange}
                        required
                        className="hidden"
                        id={slot.id}
                      />
                      <label
                        htmlFor={slot.id}
                        className="flex flex-col items-center justify-center gap-2 w-full py-6 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]"
                        style={{
                          border: `2px dashed ${slot.file ? 'rgba(0,235,255,0.45)' : 'rgba(0,235,255,0.2)'}`,
                          background: slot.file ? 'rgba(0,235,255,0.04)' : 'transparent',
                        }}>
                        {slot.preview ? (
                          <img src={slot.preview} alt={slot.label} className="w-full h-28 object-cover rounded-lg" />
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8" style={{ color: '#5A6677' }} />
                            <span className="text-xs text-center" style={{ color: '#8899AA' }}>
                              Tap to upload · JPEG/PNG · max 10 MB
                            </span>
                          </>
                        )}
                        {slot.file && (
                          <span className="text-xs truncate w-full text-center px-2" style={{ color: '#00EBFF' }}>
                            {slot.file.name}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(0,235,255,0.04)', border: '1px solid rgba(0,235,255,0.1)', color: '#A0B0C0' }}>
                Ensure all text is clearly visible. Accepted: Passport, National ID card. Max 10 MB per photo.
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold text-base transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ background: '#00EBFF', color: '#080808', boxShadow: '0 0 32px rgba(0,235,255,0.3)' }}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: '#080808', borderTopColor: 'transparent' }} />
                    Uploading & Submitting…
                  </span>
                ) : t('submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
