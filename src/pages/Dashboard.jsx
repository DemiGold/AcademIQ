import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, Lock, Unlock, LogOut, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Token Activation State
  const [tokenInput, setTokenInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUserData();
    fetchActiveCourses();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // PRO TIP: Always log the error so you aren't debugging blind!
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Profile Fetch Error:", error.message);
      }

      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      
      if (data?.role === 'admin' && !isPreview) {
        navigate('/admin');
        return; 
      }
      
      // THE FIX: Merge the auth email into the profile state so the UI can use it
      if (data) {
        setUserProfile({ ...data, email: user.email });
      }
    }
  };

  const fetchActiveCourses = async () => {
    const { data, error } = await supabase.from('courses').select('*').eq('is_active', true).order('code');
    if (error) console.error("Error fetching courses:", error);
    if (data) setCourses(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // --- FIXED TOKEN ACTIVATION LOGIC ---
  const handleTokenActivation = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    
    setIsActivating(true);
    setActivationMessage({ text: '', type: '' });
    const cleanToken = tokenInput.trim().toUpperCase();

    // BUG FIX: Always fetch the raw user ID directly from the auth session to prevent null errors
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setActivationMessage({ text: 'Session expired. Please refresh the page.', type: 'error' });
      setIsActivating(false);
      return;
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('token_code', cleanToken)
      .single();

    if (tokenError || !tokenData) {
      setActivationMessage({ text: 'Invalid token code. Please check and try again.', type: 'error' });
      setIsActivating(false);
      return;
    }

    if (tokenData.is_used) {
      setActivationMessage({ text: 'This token has already been used by another account.', type: 'error' });
      setIsActivating(false);
      return;
    }

    const { error: updateTokenError } = await supabase
      .from('tokens')
      .update({ is_used: true })
      .eq('id', tokenData.id);

    if (updateTokenError) {
      setActivationMessage({ text: 'Server error updating token. Please try again.', type: 'error' });
      setIsActivating(false);
      return;
    }

    // BUG FIX: Use the guaranteed 'user.id' from the auth session here instead of the state variable
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ has_premium_access: true })
      .eq('id', user.id);

    if (profileError) {
      setActivationMessage({ text: 'Server error upgrading account.', type: 'error' });
      setIsActivating(false);
      return;
    }

    setActivationMessage({ text: 'Success! Your premium access is now active.', type: 'success' });
    setUserProfile({ ...userProfile, has_premium_access: true });
    setTokenInput('');
    setIsActivating(false);
  };

  if (loading) return <div className="container"><h2 style={{ textAlign: 'center', color: '#1a5276', marginTop: '40px' }}>Loading Dashboard...</h2></div>;

  return (
    <div className="container" style={{ maxWidth: '1000px', padding: 'clamp(15px, 4vw, 30px)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '15px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 28px)', color: '#1a5276', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎓 AcademIQ
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: 'clamp(14px, 3vw, 16px)' }}>
            Welcome back, {userProfile?.username || userProfile?.email?.split('@')[0] || 'Student'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ padding: '6px 12px', borderRadius: '20px', background: userProfile?.has_premium_access ? '#d5f5e3' : '#fadbd8', color: userProfile?.has_premium_access ? '#1e8449' : '#c0392b', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            {userProfile?.has_premium_access ? '🟢 Premium' : '🔴 Locked'}
          </div>
          
          {userProfile?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} style={{ background: '#f39c12', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}>
              ⚙️ Admin Panel
            </button>
          )}

          <button onClick={handleLogout} style={{ background: '#f4f6f8', border: '1px solid #ccc', color: '#333', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* FIXED RESPONSIVE TOKEN BANNER */}
      {!userProfile?.has_premium_access && (
        <div style={{ background: 'linear-gradient(to right, #1a5276, #2980b9)', borderRadius: '12px', padding: 'clamp(20px, 4vw, 30px)', color: 'white', marginBottom: '40px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 15px rgba(26, 82, 118, 0.2)' }}>
          <div style={{ flex: '1 1 250px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: 'clamp(20px, 4vw, 24px)', display: 'flex', alignItems: 'center', gap: '10px' }}><KeyRound size={24} /> Unlock Full Access</h2>
            <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.5', fontSize: '14px' }}>You are currently on a free trial. Enter your activation token below to unlock all CBT exams, past questions, and detailed explanations.</p>
          </div>
          
          <div style={{ flex: '1 1 300px', background: 'rgba(255,255,255,0.1)', padding: 'clamp(15px, 3vw, 20px)', borderRadius: '8px', width: '100%' }}>
            
            {/* Added flexWrap: 'wrap' to the form to stack nicely on mobile */}
            <form onSubmit={handleTokenActivation} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="ACAD-XXXX-XXXX" 
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                style={{ flex: '1 1 180px', padding: '12px', borderRadius: '6px', border: 'none', outline: 'none', fontSize: '16px', textTransform: 'uppercase', fontFamily: 'monospace' }}
              />
              <button 
                type="submit" 
                disabled={isActivating || !tokenInput.trim()}
                style={{ flex: '1 1 100px', background: '#2ecc71', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: isActivating || !tokenInput.trim() ? 'not-allowed' : 'pointer', opacity: isActivating || !tokenInput.trim() ? 0.7 : 1 }}
              >
                {isActivating ? 'Checking...' : 'Activate'}
              </button>
            </form>
            
            {activationMessage.text && (
              <div style={{ marginTop: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', color: activationMessage.type === 'error' ? '#ffb8b8' : '#55efc4' }}>
                {activationMessage.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />} 
                {activationMessage.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COURSE GRID */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', fontSize: 'clamp(18px, 4vw, 22px)', margin: '0 0 5px 0' }}>Available CBT Exams</h2>
        <p style={{ color: '#7f8c8d', margin: 0, fontSize: '14px' }}>Select a course to configure your session.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ background: 'white', borderRadius: '10px', padding: '20px', border: '1px solid #eee', borderTop: '4px solid #1a5276', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#1a5276', fontWeight: '900' }}>{course.code}</h3>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '13px', lineHeight: '1.4' }}>{course.name}</p>
              </div>
              <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                {userProfile?.has_premium_access ? <Unlock color="#2ecc71" size={18} /> : <Lock color="#e74c3c" size={18} />}
              </div>
            </div>
            <div style={{ marginTop: 'auto' }}>
              <button 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', background: userProfile?.has_premium_access ? '#1a5276' : '#bdc3c7', color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: userProfile?.has_premium_access ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => {
                  if (userProfile?.has_premium_access) navigate(`/quiz/${course.code}`);
                  else alert("Please enter your Activation Token in the section above to unlock this exam.");
                }}
              >
                <BookOpen size={16} /> {userProfile?.has_premium_access ? 'Configure Setup' : 'Locked'}
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '30px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center', color: '#7f8c8d', fontSize: '15px', border: '1px dashed #ccc' }}>
            No courses are currently available. Check back later!
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;