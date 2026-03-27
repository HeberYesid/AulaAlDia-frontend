import React, { Suspense, lazy, Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import ContextualTipBanner from './components/ContextualTipBanner'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ maxWidth: 800, margin: '2rem auto', padding: '2rem' }}>
          <h2 style={{ color: 'var(--danger)' }}>Algo salió mal</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{this.state.error?.message}</p>
          <button className="btn" onClick={() => { this.setState({ error: null }); window.location.reload() }}>
            Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const AppTour = lazy(() => import('./components/AppTour'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const RegisterTeacher = lazy(() => import('./pages/RegisterTeacher'))
const RegisterTutor = lazy(() => import('./pages/RegisterTutor'))
const CompleteRegistration = lazy(() => import('./pages/CompleteRegistration'))
const VerifyCode = lazy(() => import('./pages/VerifyCode'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminNews = lazy(() => import('./pages/AdminNews'))
const Subjects = lazy(() => import('./pages/Subjects'))
const SubjectDetail = lazy(() => import('./pages/SubjectDetail'))
const NotificationsPage = lazy(() => import('./pages/Notifications'))
const MyResults = lazy(() => import('./pages/MyResults'))
const MySubjects = lazy(() => import('./pages/MySubjects'))
const MyBulletins = lazy(() => import('./pages/MyBulletins'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Home = lazy(() => import('./pages/Home'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Contact = lazy(() => import('./pages/Contact'))
const CalendarPage = lazy(() => import('./pages/Calendar'))
const Messages = lazy(() => import('./pages/messaging/Messages'))
const Observer = lazy(() => import('./pages/Observer'))
const Absences = lazy(() => import('./pages/Absences'))
const TenantOperationsAudit = lazy(() => import('./pages/TenantOperationsAudit'))
const TenantCommercialAdmin = lazy(() => import('./pages/TenantCommercialAdmin'))
const AcademicSettings = lazy(() => import('./pages/AcademicSettings'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminBulletins = lazy(() => import('./pages/AdminBulletins'))

const Curriculums = lazy(() => import('./pages/curriculums/Curriculums'))
const GradeLevels = lazy(() => import('./pages/curriculums/GradeLevels'))
const Sections = lazy(() => import('./pages/curriculums/Sections'))
const Courses = lazy(() => import('./pages/curriculums/Courses'))

function RouteFallback() {
  return <div aria-live="polite">Cargando...</div>
}

export default function App() {
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <Sidebar />
      <Suspense fallback={null}>
        <AppTour />
      </Suspense>
      <div className="app-body">
        <main id="main-content" className="container">
        <ContextualTipBanner />
        <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/home" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-teacher" element={<RegisterTeacher />} />
          <Route path="/register-tutor" element={<RegisterTutor />} />
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
              <ProtectedRoute roles={["STUDENT", "TEACHER", "ADMIN"]} requireTenant>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:conversationId"
            element={
              <ProtectedRoute roles={["STUDENT", "TEACHER", "ADMIN"]} requireTenant>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute requireActiveSchoolYear>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireActiveSchoolYear>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant requireActiveSchoolYear>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

            <Route
              path="/admin/news"
              element={
                <ProtectedRoute roles={["ADMIN"]} requireTenant requireActiveSchoolYear>
                  <AdminNews />
                </ProtectedRoute>
              }
            />

          <Route
            path="/subjects"
            element={
              <ProtectedRoute roles={["TEACHER", "ADMIN"]} requireTenant requireActiveSchoolYear>
                <Subjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects/:id"
            element={
              <ProtectedRoute roles={["TEACHER", "ADMIN", "STUDENT", "TUTOR"]} requireTenant requireActiveSchoolYear>
                <SubjectDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute requireTenant requireActiveSchoolYear>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendar"
            element={
              <ProtectedRoute requireTenant requireActiveSchoolYear>
                <CalendarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/observer"
            element={
              <ProtectedRoute requireTenant requireActiveSchoolYear>
                <Observer />
              </ProtectedRoute>
            }
          />

          <Route
            path="/absences"
            element={
              <ProtectedRoute requireTenant requireActiveSchoolYear>
                <Absences />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my"
            element={
              <ProtectedRoute roles={["STUDENT", "TUTOR"]} requireTenant requireActiveSchoolYear>
                <MyResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-subjects"
            element={
              <ProtectedRoute roles={["STUDENT", "TUTOR"]} requireTenant requireActiveSchoolYear>
                <MySubjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-bulletins"
            element={
              <ProtectedRoute roles={["STUDENT", "TUTOR"]} requireTenant requireActiveSchoolYear>
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
            path="/admin/operations"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant>
                <TenantOperationsAudit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant>
                <AdminUsers />
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

          <Route
            path="/admin/academic-settings"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant>
                <AcademicSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bulletins"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant requireActiveSchoolYear>
                <AdminBulletins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/grade-levels"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant requireActiveSchoolYear>
                <GradeLevels />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sections"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant requireActiveSchoolYear>
                <Sections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant requireActiveSchoolYear>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/curriculums"
            element={
              <ProtectedRoute roles={["ADMIN"]} requireTenant requireActiveSchoolYear>
                <Curriculums />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      </div>
    </div>
  )
}
