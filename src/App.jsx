import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import AppTour from './components/AppTour'
import TourDebugButton from './components/TourDebugButton'

import Login from './pages/Login'
import Register from './pages/Register'
import RegisterTeacher from './pages/RegisterTeacher'
import Verify from './pages/Verify'
import VerifyCode from './pages/VerifyCode'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Subjects from './pages/Subjects'
import SubjectDetail from './pages/SubjectDetail'
import NotificationsPage from './pages/Notifications'
import MyResults from './pages/MyResults'
import UserProfile from './pages/UserProfile'
import Home from './pages/Home'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import CalendarPage from './pages/Calendar'

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <AppTour />
      <TourDebugButton />
      <main className="container">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-teacher" element={<RegisterTeacher />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="/my"
            element={
              <ProtectedRoute roles={["STUDENT"]}>
                <MyResults />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
