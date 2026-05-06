import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz'; // We will build this next
import './index.css';
import AdminDashboard from './pages/AdminDashboard';
import CGPACalculator from './pages/CGPACalculator'; // adjust path if needed


function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Landing page for all visitors */}
          <Route path="/" element={<Home />} />
          
          {/* Authentication page */}
          <Route path="/login" element={<Login />} />
          
          {/* Main hub for Year 1 students */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Dynamic route for the CBT exam session */}
          {/* :courseCode allows one component to handle MTH102, GST112, etc. */}
          <Route path="/quiz/:courseCode" element={<Quiz />} />
          <Route path="/DemiG/Admin" element={<AdminDashboard />} />
          <Route path="/cgpa" element={<CGPACalculator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;