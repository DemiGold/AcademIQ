import { Link } from 'react-router-dom';
import { Rocket, BookOpen, ShieldCheck, Zap } from 'lucide-react';

const Home = () => {
  return (
    <div className="container">
      <div className="header">
        <div className="uni">University of Lagos — AcademIQ</div>
        <h1>Master Your Year 1 Exams</h1>
        <div className="course">The Ultimate 2nd Semester CBT Practice Hub</div>
      </div>

      <div id="start-screen" style={{ padding: '40px 20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', color: '#1a5276' }}>🚀 Prepare Like a Pro</h2>
          <p style={{ color: '#555', maxWidth: '600px', margin: '15px auto', lineHeight: '1.6' }}>
            Access verified PQs for GST 112, MTH 102, and more. Join 500+ students practicing in a real CBT environment.
          </p>
        </div>

        <div className="info-grid" style={{ marginBottom: '40px' }}>
          <div className="info-card">
            <Zap color="#f39c12" size={24} />
            <div className="label" style={{ marginTop: '10px' }}>Fast Access</div>
            <div className="value" style={{ fontSize: '14px' }}>Instant Token Activation</div>
          </div>
          <div className="info-card">
            <BookOpen color="#1a5276" size={24} />
            <div className="label" style={{ marginTop: '10px' }}>All Courses</div>
            <div className="value" style={{ fontSize: '14px' }}>GST, MTH, PHY, BIO, COS</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="start-btn">Get Started Now</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;