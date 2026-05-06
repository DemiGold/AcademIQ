import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // THE FIX: Added the options object to force the redirect to the dashboard
    // THE FIX: Added the options object to force the redirect to the dashboard
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        // This dynamically grabs your URL (whether it's localhost or your live Vercel domain!)
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) alert(error.message);
    else alert('Check your email for the login link!');
    setLoading(false);
  };

  return (
    // THE NEW WRAPPER: This forces the container into the exact center of the screen
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      
      <div className="container">
        <div className="header">
          <h1>AcademIQ</h1>
          <div className="course">Student Login</div>
        </div>
        <div id="start-screen" style={{ textAlign: 'center' }}>
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Your Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '12px', width: '80%', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ccc' }}
            />
            <button className="start-btn" type="submit" disabled={loading} style={{ width: '80%' }}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default Login;