import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import MyCourses from './pages/MyCourses';
import StudentAssignments from './pages/StudentAssignments';
import StudentQuizzes from './pages/StudentQuizzes';
import StudentGrades from './pages/StudentGrades';
import StudentCommunication from './pages/StudentCommunication';
import Profile from './pages/Profile';
import StudentDashboard from './pages/StudentDashboard';
import Attendance from './pages/Attendance';
import MyAttendance from './pages/MyAttendance';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TakeQuiz from './pages/TakeQuiz';
import QuizResults from './pages/QuizResults';
import Gradebook from './pages/Gradebook';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSections from './pages/teacher/TeacherSections';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherQuizzes from './pages/teacher/TeacherQuizzes';
import TeacherMaterials from './pages/teacher/TeacherMaterials';
import TeacherAnnouncements from './pages/teacher/TeacherAnnouncements';
import TeacherRubrics from './pages/teacher/TeacherRubrics';
import TeacherLayout from './layouts/TeacherLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { ReactElement } from 'react';

/** Requires a logged-in user; otherwise sends them to /login. */
const PrivateRoute = ({ children }: { children: ReactElement }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/** Requires one of the given roles; otherwise sends them to their dashboard. */
const RoleRoute = ({ roles, children }: { roles: string[]; children: ReactElement }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!user || !roles.includes(user.role)) {
        const fallback = user?.role === 'admin' ? '/admin' : user?.role === 'teacher' ? '/teacher' : '/dashboard';
        return <Navigate to={fallback} replace />;
    }
    return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />

              {/* Everything below requires login */}
              <Route element={<PrivateRoute><Outlet /></PrivateRoute>}>
                {/* Admin */}
                <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminLayout /></RoleRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="batches" element={<AdminBatches />} />
                  <Route path="policies" element={<AdminPolicies />} />
                  <Route path="academic" element={<AcademicStructure />} />
                  <Route path="allocations" element={<AdminAllocations />} />
                </Route>

                {/* Student */}
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/my-assignments" element={<StudentAssignments />} />
                <Route path="/my-quizzes" element={<StudentQuizzes />} />
                <Route path="/my-grades" element={<StudentGrades />} />
                <Route path="/communication" element={<StudentCommunication />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/my-attendance" element={<MyAttendance />} />
                <Route path="/quiz/:quizId/take" element={<TakeQuiz />} />
                <Route path="/quiz-results/:attemptId" element={<QuizResults />} />

                {/* Teacher */}
                <Route element={<RoleRoute roles={['teacher', 'admin']}><TeacherLayout /></RoleRoute>}>
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                  <Route path="/teacher/sections" element={<TeacherSections />} />
                  <Route path="/teacher/attendance" element={<TeacherAttendance />} />
                  <Route path="/teacher/assignments" element={<TeacherAssignments />} />
                  <Route path="/teacher/quizzes" element={<TeacherQuizzes />} />
                  <Route path="/teacher/materials" element={<TeacherMaterials />} />
                  <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
                  <Route path="/teacher/rubrics" element={<TeacherRubrics />} />
                </Route>
                <Route path="/take-attendance" element={<RoleRoute roles={['teacher', 'admin']}><Attendance /></RoleRoute>} />
                <Route path="/gradebook/:courseId" element={<RoleRoute roles={['teacher', 'admin']}><Gradebook /></RoleRoute>} />
              </Route>
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
