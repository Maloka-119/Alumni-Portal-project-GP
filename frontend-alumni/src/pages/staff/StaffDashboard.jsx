import React, { useState, useEffect } from 'react'
import { LogOut, User, Menu, X } from 'lucide-react'
import './StaffDashboard.css'
import API from '../../services/api'

const StaffDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await API.get('/staff/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.data.status === 'success') {
          setCurrentUser({
            username: res.data.data.fullName,
            nationalId: res.data.data.nationalId,
            workId: res.data.data.workId,
            email: res.data.data.email,
            roles: res.data.data.roles || [],
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleProfile = () => setProfileOpen(!profileOpen)
  const handleLogout = () => {
    localStorage.removeItem('token')
    alert('Logging out...')
  }

  if (loading) {
    return (
      <div className="dashboard-root">
        <div className="loading-screen">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`dashboard-root ${sidebarOpen ? 'sidebar-visible' : ''}`}>
      <header className="header-bar">
        <div className="header-section-left">
          <button className="menu-toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="header-title-text">Staff Control Panel</h1>
        </div>

        <div className="header-section-right">
          <button className="icon-action-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
          <button className="icon-action-btn" onClick={toggleProfile}>
            <User size={20} />
          </button>

          {profileOpen && currentUser && (
            <div className="profile-menu">
              <div className="profile-details">
                <div className="profile-item">
                  <span className="profile-label">Username</span>
                  <span className="profile-value">{currentUser.username}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">National ID</span>
                  <span className="profile-value">{currentUser.nationalId}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Work ID</span>
                  <span className="profile-value">{currentUser.workId}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{currentUser.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Roles</span>
                  <span className="profile-value">
                    {currentUser.roles.length > 0
                      ? currentUser.roles.join(', ')
                      : 'No roles assigned'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div
        className={`sidebar-overlay-panel ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="sidebar-panel">
        <nav className="sidebar-nav">
          <p style={{ padding: '1rem', color: '#888' }}>Sidebar empty</p>
        </nav>
      </aside>

      <main className="main-section">
        <div className="content-container">
          {currentUser ? (
            <div className="welcome-box">
              <h2 className="welcome-heading">
                Welcome back, {currentUser.username}!
              </h2>
              <p className="welcome-text">Profile loaded successfully.</p>
            </div>
          ) : (
            <div className="welcome-box">
              <h2 className="welcome-heading">Welcome back!</h2>
              <p className="welcome-text">Unable to load your profile.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default StaffDashboard
