import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, BookOpen, Key, LayoutDashboard, ShieldCheck, Edit, Plus, Trash2, Upload, FolderTree, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('courses'); 
  const [loading, setLoading] = useState(false);
  
  // Dashboard State
  const [stats, setStats] = useState({totalAdmins: 0, totalStudents: 0, premiumStudents: 0, freeStudents: 0, tokensUsed: 0 });
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tokensList, setTokensList] = useState([]);

  // Question Bank State
  const [selectedCourse, setSelectedCourse] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  
  // Forms State
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [qForm, setQForm] = useState({ id: null, question_text: '', optA: '', optB: '', optC: '', optD: '', correct_index: 0, explanation: '' });
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ id: null, code: '', name: '', is_active: true });

  useEffect(() => {
    fetchDashboardData();
    fetchCourses();
    fetchTokens();
  }, []);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchDashboardData = async () => {
    // 1. Count Admins
    const { count: adminCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin');
    
    // 2. Count Total Students
    const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    
    // 3. Count Premium Students
    const { count: premiumCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('has_premium_access', true);
    
    // 4. Count Tokens Actually Used
    const { count: usedTokens } = await supabase.from('tokens').select('*', { count: 'exact', head: true }).eq('is_used', true);

    setStats({ 
      totalAdmins: adminCount || 0,
      totalStudents: studentCount || 0, 
      premiumStudents: premiumCount || 0,
      freeStudents: (studentCount || 0) - (premiumCount || 0),
      tokensUsed: usedTokens || 0
    });

    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('*').order('code');
    if (data) setCourses(data);
  };

  const fetchTokens = async () => {
    const { data } = await supabase.from('tokens').select('*').order('created_at', { ascending: false });
    if (data) setTokensList(data);
  };

  // ==========================================
  // COURSES LOGIC
  // ==========================================
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    let error;
    if (courseForm.id) {
      const { error: err } = await supabase.from('courses').update({ code: courseForm.code, name: courseForm.name }).eq('id', courseForm.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('courses').insert([{ code: courseForm.code, name: courseForm.name, is_active: true }]);
      error = err;
    }
    if (error) alert("Error: " + error.message);
    else { setShowCourseForm(false); fetchCourses(); }
    setLoading(false);
  };

  const handleToggleCourseStatus = async (id, currentStatus) => {
    await supabase.from('courses').update({ is_active: !currentStatus }).eq('id', id);
    fetchCourses();
  };

  // ==========================================
  // TOKEN LOGIC
  // ==========================================
  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part1 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `ACAD-${part1}-${part2}`;
  };

  const handleGenerateBatch = async () => {
    setLoading(true);
    const newTokens = Array.from({length: 10}, () => ({ token_code: generateRandomToken(), is_used: false }));
    const { error } = await supabase.from('tokens').insert(newTokens);
    if (error) alert("Error generating tokens: " + error.message);
    else fetchTokens();
    setLoading(false);
  };

  const handleDeleteToken = async (id) => {
    if(window.confirm("Delete this token?")) {
      await supabase.from('tokens').delete().eq('id', id);
      fetchTokens();
    }
  };

  // ==========================================
  // USER MANAGEMENT LOGIC
  // ==========================================
  const handleTogglePremium = async (id, currentStatus) => {
    await supabase.from('profiles').update({ has_premium_access: !currentStatus }).eq('id', id);
    fetchDashboardData();
  };

  const handleUpdateUsername = async (id, currentName) => {
    const newName = window.prompt("Enter new username:", currentName || '');
    if (newName !== null && newName.trim() !== '') {
      await supabase.from('profiles').update({ username: newName.trim() }).eq('id', id);
      fetchDashboardData();
    }
  };

  // ==========================================
  // QUESTION BANK LOGIC
  // ==========================================
  useEffect(() => {
    if (selectedCourse) fetchTopics(selectedCourse);
    else { setTopics([]); setSelectedTopic(''); setQuestions([]); }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedTopic) fetchQuestions(selectedTopic);
    else setQuestions([]);
  }, [selectedTopic]);

  const fetchTopics = async (courseCode) => {
    const { data } = await supabase.from('topics').select('*').eq('course_code', courseCode).order('name');
    if (data) {
      setTopics(data);
      if (data.length > 0) setSelectedTopic(data[0].id);
      else setSelectedTopic('');
    }
  };

  const fetchQuestions = async (topicId) => {
    const { data } = await supabase.from('questions').select('*').eq('topic_id', topicId).order('created_at');
    if (data) setQuestions(data);
  };

  const handleAddTopic = async () => {
    if (!selectedCourse) return alert("Select a course first!");
    const topicName = window.prompt("Enter new topic name:");
    if (!topicName) return;
    const { error } = await supabase.from('topics').insert([{ course_code: selectedCourse, name: topicName }]);
    if (error) alert("Error: " + error.message);
    else fetchTopics(selectedCourse);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      course_code: selectedCourse,
      topic_id: selectedTopic, 
      topic: topics.find(t => t.id === selectedTopic)?.name, 
      question_text: qForm.question_text,
      options: [qForm.optA, qForm.optB, qForm.optC, qForm.optD], 
      correct_index: parseInt(qForm.correct_index),
      explanation: qForm.explanation
    };

    let error;
    if (qForm.id) {
      const { error: updateErr } = await supabase.from('questions').update(payload).eq('id', qForm.id);
      error = updateErr;
    } else {
      const { error: insertErr } = await supabase.from('questions').insert([payload]);
      error = insertErr;
    }

    if (error) alert("Error saving question: " + error.message);
    else { setShowQuestionForm(false); fetchQuestions(selectedTopic); }
    setLoading(false);
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Delete this question permanently?")) {
      await supabase.from('questions').delete().eq('id', id);
      fetchQuestions(selectedTopic);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const file = e.target.csvFile.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rows = event.target.result.split(/\r?\n/).filter(row => row.trim().length > 0);
        const dataRows = rows.slice(1);
        const payload = dataRows.map(row => {
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
          return {
            course_code: selectedCourse, topic_id: selectedTopic, topic: topics.find(t => t.id === selectedTopic)?.name, 
            question_text: cols[0], options: [cols[1], cols[2], cols[3], cols[4]], correct_index: parseInt(cols[5]), explanation: cols[6] || ''
          };
        });
        const { error } = await supabase.from('questions').insert(payload);
        if (error) throw error;
        alert(`Successfully uploaded ${payload.length} questions!`);
        setShowBulkUpload(false); fetchQuestions(selectedTopic);
      } catch (err) { alert("Upload failed. Error: " + err.message); }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================
  
    const renderOverview = () => (
    <div>
      <h2 style={{ color: '#1a5276', marginBottom: '20px' }}>Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '4px solid #3498db' }}>
          <div style={{ color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Students</div>
          <div style={{ fontSize: '32px', color: '#2c3e50', fontWeight: '900' }}>{stats.totalStudents}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '4px solid #2ecc71' }}>
          <div style={{ color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Premium Students</div>
          <div style={{ fontSize: '32px', color: '#27ae60', fontWeight: '900' }}>{stats.premiumStudents}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '4px solid #e74c3c' }}>
          <div style={{ color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Free Trial Students</div>
          <div style={{ fontSize: '32px', color: '#c0392b', fontWeight: '900' }}>{stats.freeStudents}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '4px solid #f39c12' }}>
          <div style={{ color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tokens Claimed</div>
          <div style={{ fontSize: '32px', color: '#d35400', fontWeight: '900' }}>{stats.tokensUsed}</div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderBottom: '4px solid #9b59b6' }}>
          <div style={{ color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Admin Accounts</div>
          <div style={{ fontSize: '32px', color: '#8e44ad', fontWeight: '900' }}>{stats.totalAdmins}</div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #1a5276, #2980b9)', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(26, 82, 118, 0.2)' }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Est. Revenue (Premium × ₦2000)</div>
          <div style={{ fontSize: '32px', color: 'white', fontWeight: '900' }}>₦{stats.premiumStudents * 2000}</div>
        </div>

      </div>
    </div>
  );
  const renderCourses = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5276', margin: 0 }}>Master Courses</h2>
        <button onClick={() => { setCourseForm({ id: null, code: '', name: '', is_active: true }); setShowCourseForm(true); }} style={{ padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px' }}><Plus size={18}/> Add Course</button>
      </div>

      {showCourseForm && (
        <form onSubmit={handleSaveCourse} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #2ecc71', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0 }}>{courseForm.id ? 'Edit Course' : 'New Course'}</h3>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Course Code</label><input required value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value.toUpperCase()})} placeholder="e.g. BIO102" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
            <div style={{ flex: 2 }}><label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Course Name</label><input required value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} placeholder="e.g. General Biology II" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Course</button>
            <button type="button" onClick={() => setShowCourseForm(false)} style={{ padding: '10px 20px', background: '#ecf0f1', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
        {courses.map(course => (
          <div key={course.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: course.is_active ? '5px solid #2ecc71' : '5px solid #e74c3c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: course.is_active ? '#1a5276' : '#7f8c8d' }}>{course.code} {course.is_active ? '' : '(Hidden)'}</h3>
              <p style={{ margin: 0, color: '#666' }}>{course.name}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setCourseForm(course); setShowCourseForm(true); }} style={{ padding: '8px 12px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Edit size={16}/> Edit</button>
              <button onClick={() => handleToggleCourseStatus(course.id, course.is_active)} style={{ padding: '8px 12px', background: course.is_active ? '#fadbd8' : '#d5f5e3', color: course.is_active ? '#c0392b' : '#1e8449', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                {course.is_active ? <><XCircle size={16}/> Hide</> : <><CheckCircle size={16}/> Show</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTokens = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5276', margin: 0 }}>Token Engine</h2>
        <button onClick={handleGenerateBatch} disabled={loading} style={{ padding: '10px 20px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', gap: '8px' }}><RefreshCw size={18} className={loading ? 'spin' : ''} /> Generate 10 Tokens</button>
      </div>
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}><th style={{ padding: '10px' }}>Code</th><th style={{ padding: '10px' }}>Status</th><th style={{ padding: '10px' }}>Action</th></tr>
          </thead>
          <tbody>
            {tokensList.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee', background: t.is_used ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '16px', color: t.is_used ? '#999' : '#1a5276' }}>{t.token_code}</td>
                <td style={{ padding: '10px' }}><span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: t.is_used ? '#fadbd8' : '#d5f5e3', color: t.is_used ? '#c0392b' : '#1e8449' }}>{t.is_used ? 'Used' : 'Active'}</span></td>
                <td style={{ padding: '10px' }}><button onClick={() => handleDeleteToken(t.id)} style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }}><Trash2 size={18}/></button></td>
              </tr>
            ))}
            {tokensList.length === 0 && <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No tokens generated yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <h2 style={{ color: '#1a5276', marginBottom: '20px' }}>Student Management</h2>
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}><th style={{ padding: '10px' }}>Email</th><th style={{ padding: '10px' }}>Username</th><th style={{ padding: '10px' }}>Access Level</th><th style={{ padding: '10px' }}>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', color: '#555' }}>{u.email}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.username || '—'}</td>
                <td style={{ padding: '10px' }}><span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: u.has_premium_access ? '#d5f5e3' : '#eee', color: u.has_premium_access ? '#1e8449' : '#666' }}>{u.has_premium_access ? 'Premium' : 'Free Trial'}</span></td>
                <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleUpdateUsername(u.id, u.username)} style={{ padding: '6px 10px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Edit size={14}/> Name</button>
                  <button onClick={() => handleTogglePremium(u.id, u.has_premium_access)} style={{ padding: '6px 10px', background: u.has_premium_access ? '#fadbd8' : '#d5f5e3', color: u.has_premium_access ? '#c0392b' : '#1e8449', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>{u.has_premium_access ? 'Revoke Premium' : 'Grant Premium'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Keep the renderQuestionBank exactly as it is in your current code...
  const renderQuestionBank = () => (
    <div>
      <h2 style={{ color: '#1a5276', marginBottom: '20px' }}>Question Bank Management</h2>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Select Course</label>
          <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">-- Choose a Course --</option>
            {courses.map(c => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>Select Topic</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} disabled={!selectedCourse}>
              <option value="">{topics.length === 0 ? '-- No topics found --' : '-- Choose a Topic --'}</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={handleAddTopic} disabled={!selectedCourse} style={{ padding: '10px 15px', background: '#1a5276', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Plus size={18} /></button>
          </div>
        </div>
      </div>

      {selectedTopic && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <button onClick={() => { setQForm({ id: null, question_text: '', optA: '', optB: '', optC: '', optD: '', correct_index: 0, explanation: '' }); setShowQuestionForm(true); setShowBulkUpload(false); }} style={{ padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px' }}><Plus size={18} /> Add Single</button>
          <button onClick={() => { setShowBulkUpload(true); setShowQuestionForm(false); }} style={{ padding: '10px 20px', background: '#34495e', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px' }}><Upload size={18} /> Bulk Upload</button>
        </div>
      )}

      {showBulkUpload && (
        <div style={{ background: 'white', padding: '25px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #34495e' }}>
          <h3 style={{ marginTop: 0, color: '#34495e' }}>Bulk Upload via CSV</h3>
          <form onSubmit={handleBulkUpload} style={{ display: 'flex', gap: '15px' }}>
            <input type="file" name="csvFile" accept=".csv" required style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }} />
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#34495e', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }}>Upload</button>
            <button type="button" onClick={() => setShowBulkUpload(false)} style={{ padding: '10px 20px', background: '#ecf0f1', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </form>
        </div>
      )}

      {showQuestionForm && (
        <form onSubmit={handleSaveQuestion} style={{ background: 'white', padding: '25px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #2ecc71' }}>
          <h3 style={{ marginTop: 0, color: '#2ecc71' }}>{qForm.id ? 'Edit Question' : 'Add New'}</h3>
          <textarea required value={qForm.question_text} onChange={(e) => setQForm({...qForm, question_text: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginBottom: '15px', minHeight: '80px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input required value={qForm.optA} onChange={(e) => setQForm({...qForm, optA: e.target.value})} placeholder="Option A" style={{ padding: '8px', border: '1px solid #ccc' }} />
            <input required value={qForm.optB} onChange={(e) => setQForm({...qForm, optB: e.target.value})} placeholder="Option B" style={{ padding: '8px', border: '1px solid #ccc' }} />
            <input required value={qForm.optC} onChange={(e) => setQForm({...qForm, optC: e.target.value})} placeholder="Option C" style={{ padding: '8px', border: '1px solid #ccc' }} />
            <input required value={qForm.optD} onChange={(e) => setQForm({...qForm, optD: e.target.value})} placeholder="Option D" style={{ padding: '8px', border: '1px solid #ccc' }} />
          </div>
          <select value={qForm.correct_index} onChange={(e) => setQForm({...qForm, correct_index: e.target.value})} style={{ padding: '10px', border: '1px solid #ccc', marginBottom: '15px' }}><option value={0}>Opt A</option><option value={1}>Opt B</option><option value={2}>Opt C</option><option value={3}>Opt D</option></select>
          <textarea value={qForm.explanation} onChange={(e) => setQForm({...qForm, explanation: e.target.value})} placeholder="Explanation..." style={{ width: '100%', padding: '10px', border: '1px solid #ccc', marginBottom: '20px' }} />
          <div style={{ display: 'flex', gap: '10px' }}><button type="submit" style={{ padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px' }}>Save</button><button type="button" onClick={() => setShowQuestionForm(false)} style={{ padding: '10px 20px', background: '#ecf0f1', border: 'none', borderRadius: '6px' }}>Cancel</button></div>
        </form>
      )}

      {selectedTopic && !showQuestionForm && !showBulkUpload && (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {questions.map((q, index) => (
            <div key={q.id} style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
              <div><div style={{ fontWeight: 'bold', color: '#1a5276', marginBottom: '10px' }}>{index + 1}. {q.question_text}</div></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setQForm({ id: q.id, question_text: q.question_text, optA: q.options[0], optB: q.options[1], optC: q.options[2], optD: q.options[3], correct_index: q.correct_index, explanation: q.explanation || '' }); setShowQuestionForm(true); }} style={{ padding: '8px', background: '#ecf0f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Edit size={16} /></button>
                <button onClick={() => handleDeleteQuestion(q.id)} style={{ padding: '8px', background: '#fadbd8', color: '#c0392b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f8', fontFamily: 'system-ui, sans-serif' }}>
      {/* SIDEBAR */}
      <div style={{ width: '250px', background: '#1a5276', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={24} /> AcademIQ Admin</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ background: activeTab === 'overview' ? '#154360' : 'transparent', color: 'white', border: 'none', padding: '12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '10px' }}><LayoutDashboard size={18} /> Overview</button>
          <button onClick={() => setActiveTab('questions')} style={{ background: activeTab === 'questions' ? '#154360' : 'transparent', color: 'white', border: 'none', padding: '12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '10px' }}><FolderTree size={18} /> Question Bank</button>
          <button onClick={() => setActiveTab('courses')} style={{ background: activeTab === 'courses' ? '#154360' : 'transparent', color: 'white', border: 'none', padding: '12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '10px' }}><BookOpen size={18} /> Courses</button>
          <button onClick={() => setActiveTab('tokens')} style={{ background: activeTab === 'tokens' ? '#154360' : 'transparent', color: 'white', border: 'none', padding: '12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '10px' }}><Key size={18} /> Token Engine</button>
          <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#154360' : 'transparent', color: 'white', border: 'none', padding: '12px', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', display: 'flex', gap: '10px' }}><Users size={18} /> Users</button>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => navigate('/dashboard?preview=true')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '12px', width: '100%', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>← View as Student</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'questions' && renderQuestionBank()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'tokens' && renderTokens()}
        {activeTab === 'users' && renderUsers()}
      </div>
    </div>
  );
};

export default AdminDashboard;
