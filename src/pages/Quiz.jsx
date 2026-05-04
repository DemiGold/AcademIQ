import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Quiz = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  
  const [quizPhase, setQuizPhase] = useState('setup');
  
  const [availableTopics, setAvailableTopics] = useState([]);
  const [config, setConfig] = useState({ topicId: 'all', count: '20' });
  const [setupLoading, setSetupLoading] = useState(true);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [showReview, setShowReview] = useState(false);

  const labels = ['A', 'B', 'C', 'D'];

  // 1. Fetch Topics & CHECK PREMIUM SECURITY
  useEffect(() => {
    const fetchSetupData = async () => {
      // SECURITY CHECK: Bounce non-premium users who tried to guess the URL
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      
      const { data: profile } = await supabase.from('profiles').select('has_premium_access, role').eq('id', user.id).single();
      const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
      
      if (!profile?.has_premium_access && profile?.role !== 'admin' && !isPreview) {
        alert("Security Alert: You need an active premium token to access this exam.");
        navigate('/dashboard');
        return;
      }

      // If they passed the check, load the topics
      const { data } = await supabase
        .from('topics')
        .select('id, name')
        .eq('course_code', courseCode);
      
      if (data) setAvailableTopics(data);
      setSetupLoading(false);
    };
    
    fetchSetupData();
  }, [courseCode, navigate]);

  // 2. Timer Logic
  useEffect(() => {
    if (quizPhase !== 'active') return;
    if (timeLeft <= 0) submitExam();
    
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizPhase]);

  // 3. Handle Starting the Quiz
  const startQuiz = async () => {
    setSetupLoading(true);
    
    let query = supabase.from('questions').select('*, topics(name)').eq('course_code', courseCode);
    if (config.topicId !== 'all') {
      query = query.eq('topic_id', config.topicId);
    }
    
    const { data } = await query;
    
    if (data && data.length > 0) {
      const shuffled = data.sort(() => 0.5 - Math.random());
      const selectedQuestions = config.count === 'all' ? shuffled : shuffled.slice(0, parseInt(config.count));
      
      setQuestions(selectedQuestions);
      setQuizPhase('active');
    } else {
      alert("No questions found for this selection. Admin needs to add questions!");
    }
    setSetupLoading(false);
  };

  // 4. Handle Submission
  const submitExam = async () => {
    setQuizPhase('result');
    
    let correct = 0;
    questions.forEach((q, i) => { if (userAnswers[i] === q.correct_index) correct++; });
    const scorePercent = Math.round((correct / questions.length) * 100);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('exam_attempts').insert({
        user_id: user.id,
        course_code: courseCode,
        score_percent: scorePercent,
        correct_count: correct,
        total_questions: questions.length
      });
    }
  };

  if (setupLoading) return <div className="container" style={{ textAlign: 'center', marginTop: '50px', color: '#1a5276' }}><h2>Loading Exam Environment...</h2></div>;

  // ==========================================
  // PHASE 1: SETUP SCREEN
  // ==========================================
  if (quizPhase === 'setup') {
    return (
      <div className="container" style={{ maxWidth: '600px', padding: '20px' }}>
        <div style={{ background: '#1a5276', color: 'white', padding: '20px', borderRadius: '12px 12px 0 0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.8 }}>AcademIQ CBT Engine</div>
          <h1 style={{ margin: '10px 0 0 0' }}>Configure {courseCode}</h1>
        </div>
        
        <div style={{ background: 'white', padding: '40px 30px', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '25px', textAlign: 'center' }}>Customize Your Session</h2>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#34495e' }}>Filter by Topic:</label>
            <select 
              style={{ width: '100%', marginBottom: '25px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
              value={config.topicId}
              onChange={(e) => setConfig({...config, topicId: e.target.value})}
            >
              <option value="all">All Topics (Full Exam)</option>
              {availableTopics.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#34495e' }}>Number of Questions:</label>
            <select 
              style={{ width: '100%', marginBottom: '35px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
              value={config.count}
              onChange={(e) => setConfig({...config, count: e.target.value})}
            >
              <option value="10">Quick Test (10 Questions)</option>
              <option value="20">Standard (20 Questions)</option>
              <option value="50">Deep Dive (50 Questions)</option>
              <option value="all">Marathon (All Available)</option>
            </select>

            <button onClick={startQuiz} style={{ width: '100%', padding: '15px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
              🚀 Start Timer & Begin
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: '15px', background: '#f8f9fa', color: '#7f8c8d', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: RESULT SCREEN
  // ==========================================
  if (quizPhase === 'result') {
    let correct = 0;
    questions.forEach((q, i) => { if (userAnswers[i] === q.correct_index) correct++; });
    const wrong = questions.length - correct;
    const pct = Math.round((correct / questions.length) * 100);

    let grade, bg;
    if (pct >= 70) { grade = 'A — Excellent!'; bg = 'linear-gradient(135deg, #1e8449, #27ae60)'; }
    else if (pct >= 60) { grade = 'B — Good'; bg = 'linear-gradient(135deg, #1a5276, #2e86c1)'; }
    else if (pct >= 50) { grade = 'C — Average'; bg = 'linear-gradient(135deg, #b7950b, #f39c12)'; }
    else if (pct >= 45) { grade = 'D — Pass'; bg = 'linear-gradient(135deg, #ca6f1e, #e67e22)'; }
    else { grade = 'F — Fail — Keep Studying!'; bg = 'linear-gradient(135deg, #922b21, #e74c3c)'; }

    return (
      <div className="container" style={{ maxWidth: '800px', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#2c3e50', margin: '0 0 20px 0' }}>🎓 Exam Completed!</h2>
          
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '900', margin: '0 auto 20px' }}>
            {pct}%
          </div>
          
          <div style={{ display: 'inline-block', padding: '8px 24px', background: bg, color: 'white', borderRadius: '30px', fontWeight: 'bold', fontSize: '18px', marginBottom: '30px' }}>
            {grade}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: '#f8f9fa', padding: '15px 25px', borderRadius: '8px', borderBottom: '4px solid #2ecc71' }}><div style={{ color: '#7f8c8d', fontSize: '14px' }}>Correct</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{correct}</div></div>
            <div style={{ background: '#f8f9fa', padding: '15px 25px', borderRadius: '8px', borderBottom: '4px solid #e74c3c' }}><div style={{ color: '#7f8c8d', fontSize: '14px' }}>Wrong</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{wrong}</div></div>
            <div style={{ background: '#f8f9fa', padding: '15px 25px', borderRadius: '8px', borderBottom: '4px solid #3498db' }}><div style={{ color: '#7f8c8d', fontSize: '14px' }}>Total</div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>{questions.length}</div></div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '12px 24px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#2c3e50' }}>🏠 Dashboard</button>
            <button onClick={() => setShowReview(!showReview)} style={{ padding: '12px 24px', background: '#1a5276', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📋 Review Answers</button>
          </div>

          {showReview && (
            <div style={{ marginTop: '40px', textAlign: 'left', borderTop: '2px solid #eee', paddingTop: '30px' }}>
              <h3 style={{ color: '#1a5276', marginBottom: '20px' }}>📋 Detailed Review & Explanations</h3>
              
              {questions.map((q, i) => {
                const isCorrect = userAnswers[i] === q.correct_index;
                return (
                  <div key={i} style={{ background: isCorrect ? '#f0fbf4' : '#fdf2f2', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: isCorrect ? '5px solid #2ecc71' : '5px solid #e74c3c' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50', marginBottom: '15px' }}>{i + 1}. {q.question_text}</div>
                    
                    <div style={{ fontSize: '15px', marginBottom: '8px' }}>
                      Your answer: <span style={{ color: isCorrect ? '#27ae60' : '#c0392b', fontWeight: 'bold' }}>
                        {userAnswers[i] !== undefined ? `${labels[userAnswers[i]]}. ${q.options[userAnswers[i]]}` : 'Not answered'}
                      </span>
                    </div>
                    
                    {!isCorrect && (
                      <div style={{ fontSize: '15px', marginBottom: '8px' }}>
                        Correct answer: <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{labels[q.correct_index]}. {q.options[q.correct_index]}</span>
                      </div>
                    )}

                    {/* NEW: THE EXPLANATION DISPLAY */}
                    {q.explanation && (
                      <div style={{ marginTop: '15px', padding: '15px', background: 'white', borderRadius: '6px', border: '1px solid #eee', fontSize: '14px', color: '#555', display: 'flex', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>💡</span> 
                        <div><strong>Explanation:</strong> {q.explanation}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 3: ACTIVE EXAM SCREEN
  // ==========================================
  return (
    <div className="container" style={{ maxWidth: '800px', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#1a5276', margin: 0 }}>{courseCode} CBT</h1>
        <div style={{ background: timeLeft < 300 ? '#fadbd8' : '#e6f1fb', color: timeLeft < 300 ? '#c0392b' : '#1a5276', padding: '10px 20px', borderRadius: '30px', fontWeight: '900', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div style={{ height: '8px', background: '#eee', borderRadius: '4px', marginBottom: '30px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#2ecc71', width: `${((current + 1) / questions.length) * 100}%`, transition: 'width 0.3s ease' }}></div>
      </div>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f8c8d', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
          <span>Question {current + 1} of {questions.length}</span>
          <span style={{ background: '#f8f9fa', padding: '4px 10px', borderRadius: '4px' }}>{questions[current]?.topics?.name || 'General'}</span>
        </div>

        <div style={{ fontSize: '20px', color: '#2c3e50', lineHeight: '1.6', marginBottom: '30px', fontWeight: '500' }}>
          {questions[current]?.question_text}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          {questions[current]?.options.map((opt, i) => (
            <button 
              key={i} 
              // Changed from 'correct' to a proper selected state so students aren't confused!
              style={{ padding: '15px 20px', textAlign: 'left', border: userAnswers[current] === i ? '2px solid #1a5276' : '2px solid #eee', background: userAnswers[current] === i ? '#f0f4f8' : 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', gap: '15px', alignItems: 'center', transition: 'all 0.2s' }}
              onClick={() => setUserAnswers({ ...userAnswers, [current]: i })}
            >
              <span style={{ background: userAnswers[current] === i ? '#1a5276' : '#f8f9fa', color: userAnswers[current] === i ? 'white' : '#7f8c8d', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontWeight: 'bold' }}>{labels[i]}</span> 
              {opt}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <button style={{ padding: '12px 24px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', color: '#7f8c8d', fontWeight: 'bold', cursor: current === 0 ? 'not-allowed' : 'pointer', opacity: current === 0 ? 0.5 : 1 }} disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Previous</button>
          
          <button style={{ padding: '12px 24px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => { if (window.confirm("Are you sure you want to submit your exam early?")) submitExam(); }}>Submit Exam</button>
          
          <button style={{ padding: '12px 24px', background: '#1a5276', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: current === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: current === questions.length - 1 ? 0.5 : 1 }} disabled={current === questions.length - 1} onClick={() => setCurrent(c => c + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;