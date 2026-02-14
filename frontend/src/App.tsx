// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminBatches from './pages/admin/AdminBatches';
import AdminPolicies from './pages/admin/AdminPolicies';
import AcademicStructure from './pages/admin/AcademicStructure';
import AdminAllocations from './pages/admin/AdminAllocations';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import MyAttendance from './pages/MyAttendance';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TakeQuiz from './pages/TakeQuiz';
import QuizResults from './pages/QuizResults';
import Gradebook from './pages/Gradebook';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSections from './pages/teacher/TeacherSections';
import { AuthProvider } from './context/AuthContext';

// const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
//     const { isAuthenticated } = useAuth();
//     return isAuthenticated ? children : <Navigate to="/login" />;
// };

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route element={<Layout />}>
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="batches" element={<AdminBatches />} />
                <Route path="policies" element={<AdminPolicies />} />
                <Route path="academic" element={<AcademicStructure />} />
                <Route path="allocations" element={<AdminAllocations />} />
                {/* <Route path="policies" element={<AdminPolicies />} /> */}
              </Route>

              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/sections" element={<TeacherSections />} />
              <Route path="/take-attendance" element={<Attendance />} />
              <Route path="/my-attendance" element={<MyAttendance />} />
              <Route path="/quiz/:quizId/take" element={<TakeQuiz />} />
              <Route path="/quiz-results/:attemptId" element={<QuizResults />} />
              <Route path="/gradebook/:courseId" element={<Gradebook />} />
              {/* Example Protected Route */}
              {/* <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} /> */}
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
