import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import AppTour from './components/AppTour'
import TourDebugButton from './components/TourDebugButton'

import Login from './pages/Login'
import Register from './pages/Register'
import CompleteRegistration from './pages/CompleteRegistration'
import VerifyCode from './pages/VerifyCode'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Subjects from './pages/Subjects'
import SubjectDetail from './pages/SubjectDetail'
import NotificationsPage from './pages/Notifications'
import MyResults from './pages/MyResults'
import MySubjects from './pages/MySubjects'
import MyBulletins from './pages/MyBulletins'
import UserProfile from './pages/UserProfile'
import Home from './pages/Home'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import PublicLayout from './components/PublicLayout'
import CalendarPage from './pages/Calendar'
import Messages from './pages/messaging/Messages'
import Observer from './pages/Observer'
import Absences from './pages/Absences'
import TenantCommercialAdmin from './pages/TenantCommercialAdmin'

export default function App() {
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <Sidebar />
      <AppTour />
      <TourDebugButton />
      <div className="app-body">
        <main id="main-content" className="container">
        <Routes>
          <Route path="/home" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Legacy registration paths — redirect to the unified register page */}
          <Route path="/register-teacher" element={<Navigate to="/register" replace />} />
          <Route path="/register-tutor" element={<Navigate to="/register" replace />} />
          {/* Legacy token-based email verification — no longer used */}
          <Route path="/verify" element={<Navigate to="/verify-code" replace />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/complete-registration"
            element={
              <ProtectedRoute>
                <CompleteRegistration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute roles={["STUDENT", "TEACHER", "ADMIN"]}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:conversationId"
            element={
              <ProtectedRoute roles={["STUDENT", "TEACHER", "ADMIN"]}>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects"
            element={
              <ProtectedRoute roles={["TEACHER", "ADMIN"]}>
                <Subjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects/:id"
            element={
              <ProtectedRoute>
                <SubjectDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/observer"
            element={
              <ProtectedRoute>
                <Observer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/absences"
            element={
              <ProtectedRoute>
                <Absences />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my"
            element={
              <ProtectedRoute roles={["STUDENT", "TUTOR"]}>
                <MyResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-subjects"
            element={
              <ProtectedRoute roles={["STUDENT", "TUTOR"]}>
                <MySubjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-bulletins"
            element={
              <ProtectedRoute roles={["STUDENT", "TUTOR"]}>
                <MyBulletins />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/commercial"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <TenantCommercialAdmin />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      </div>
    </div>
  )
}
