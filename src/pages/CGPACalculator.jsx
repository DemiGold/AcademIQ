import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Plus, Trash2, ArrowLeft, Award, BookOpen } from 'lucide-react';

const CGPACalculator = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([
    { id: 1, code: '', units: '', grade: 'A' },
    { id: 2, code: '', units: '', grade: 'B' },
    { id: 3, code: '', units: '', grade: 'C' }
  ]);

  const gradeValues = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };

  const addCourse = () => {
    setCourses([...courses, { id: Date.now(), code: '', units: '', grade: 'A' }]);
  };

  const updateCourse = (id, field, value) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const calculateStats = () => {
    let totalUnits = 0;
    let totalPoints = 0;

    courses.forEach(c => {
      const u = parseFloat(c.units);
      if (!isNaN(u) && u > 0) {
        totalUnits += u;
        totalPoints += u * gradeValues[c.grade];
      }
    });

    const cgpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : '0.00';
    return { cgpa, totalUnits, totalPoints };
  };

  const getClassOfDegree = (cgpa) => {
    const score = parseFloat(cgpa);
    if (score >= 4.50) return { text: "First Class Honors", color: "#2ecc71", bg: "rgba(46, 204, 113, 0.2)" };
    if (score >= 3.50) return { text: "Second Class Upper", color: "#3498db", bg: "rgba(52, 152, 219, 0.2)" };
    if (score >= 2.40) return { text: "Second Class Lower", color: "#f1c40f", bg: "rgba(241, 196, 15, 0.2)" };
    if (score >= 1.50) return { text: "Third Class", color: "#e67e22", bg: "rgba(230, 126, 34, 0.2)" };
    return { text: "Pass / Fail", color: "#e74c3c", bg: "rgba(231, 76, 60, 0.2)" };
  };

  const { cgpa, totalUnits, totalPoints } = calculateStats();
  const degreeClass = getClassOfDegree(cgpa);

  return (
    <div className="container" style={{ maxWidth: '800px', padding: 'clamp(15px, 4vw, 30px)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 26px)', color: '#1a5276', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator size={28} color="#2ecc71" /> CGPA Calculator
        </h1>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', background: '#f8f9fa', color: '#2c3e50', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Premium Result Dashboard */}
      <div style={{ background: 'linear-gradient(135deg, #1a5276, #0e2b3d)', padding: 'clamp(20px, 5vw, 40px)', borderRadius: '16px', color: 'white', textAlign: 'center', marginBottom: '40px', boxShadow: '0 10px 30px rgba(26, 82, 118, 0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, fontWeight: 'bold' }}>Cumulative Grade Point Average</div>
          <div style={{ fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: '900', margin: '10px 0', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            {cgpa}
          </div>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: degreeClass.bg, color: degreeClass.color, padding: '8px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', border: `1px solid ${degreeClass.color}` }}>
            <Award size={18} /> {degreeClass.text}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7, textTransform: 'uppercase' }}>Total Units</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalUnits}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.7, textTransform: 'uppercase' }}>Total Points</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalPoints}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Entry Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <BookOpen size={20} /> Course Grades
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {courses.map((course, index) => (
            <div key={course.id} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e1e8ed', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
              
              <div style={{ width: '30px', height: '30px', background: '#f0f4f8', color: '#7f8c8d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {index + 1}
              </div>
              
              <input 
                placeholder="Course Code (e.g. MTH102)" 
                value={course.code} 
                onChange={(e) => updateCourse(course.id, 'code', e.target.value.toUpperCase())}
                style={{ flex: '2 1 120px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d9e0', outline: 'none', fontWeight: 'bold', color: '#2c3e50' }}
              />
              
              <input 
                type="number" 
                placeholder="Units" 
                min="1" max="6"
                value={course.units} 
                onChange={(e) => updateCourse(course.id, 'units', e.target.value)}
                style={{ flex: '1 1 70px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d9e0', outline: 'none', fontWeight: 'bold' }}
              />
              
              <select 
                value={course.grade} 
                onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                style={{ flex: '1 1 80px', padding: '12px', borderRadius: '8px', border: '1px solid #2ecc71', outline: 'none', fontWeight: '900', color: '#1a5276', background: '#f0fbf4', cursor: 'pointer' }}
              >
                <option value="A">A (5)</option>
                <option value="B">B (4)</option>
                <option value="C">C (3)</option>
                <option value="D">D (2)</option>
                <option value="E">E (1)</option>
                <option value="F">F (0)</option>
              </select>

              <button 
                onClick={() => removeCourse(course.id)}
                style={{ padding: '12px', background: 'transparent', color: '#e74c3c', border: 'none', cursor: 'pointer', opacity: courses.length === 1 ? 0.3 : 1 }}
                disabled={courses.length === 1}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={addCourse} 
          style={{ width: '100%', padding: '16px', background: '#f8f9fa', color: '#1a5276', border: '2px dashed #aed6f1', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '15px', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#e6f1fb'; e.currentTarget.style.borderColor = '#3498db'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.borderColor = '#aed6f1'; }}
        >
          <Plus size={20} /> Add Another Course
        </button>
      </div>
    </div>
  );
};

export default CGPACalculator;