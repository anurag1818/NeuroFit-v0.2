// Main Application Controller
class NeuroFitApp {
  constructor() {
    this.currentPage = "dashboard"
    this.isInitialized = false
    this.managers = {}

    this.initializeApp()
    this.setupMobileMenu()
  }

  setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle')
    const menu = document.querySelector('.nav-menu')
    
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('show')
        toggle.querySelector('i').className = menu.classList.contains('show') ? 'fas fa-times' : 'fas fa-bars'
      })
    }
  }

  async initializeApp() {
    console.log("Initializing NeuroFit Band Application...")

    try {
      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.init())
      } else {
        await this.init()
      }
    } catch (error) {
      console.error("Failed to initialize application:", error)
      this.showErrorMessage("Failed to initialize application")
    }
  }

  async init() {
    // Initialize managers (they should already be initialized by their respective files)
    this.managers = {
      bluetooth: window.bluetoothManager,
      chart: window.chartManager,
      tensorflow: window.tensorflowModel,
      meditation: window.meditationManager,
      emergency: window.emergencyManager,
      data: window.dataManager,
    }

    // Set up navigation
    this.initializeNavigation()

    // Set up authentication
    this.initializeAuthentication()

    // Set up global event listeners
    this.initializeGlobalEvents()

    // Check authentication state
    await this.checkAuthState()

    // Load initial data if authenticated
    if (window.currentUser) {
      await this.loadInitialData()
    }

    this.isInitialized = true
    console.log("NeuroFit Band Application initialized successfully")
  }

  initializeNavigation() {
    // Navigation menu items
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const page = e.target.dataset.page
        if (page) {
          this.navigateToPage(page)
        }
      })
    })

    // Set initial page
    this.navigateToPage("dashboard")
  }

  initializeAuthentication() {
    // Login button
    document.getElementById("loginBtn").addEventListener("click", () => {
      this.showLoginModal()
    })

    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })

    // Login form
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleLogin()
    })

    // Signup form
    document.getElementById("signupForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSignup()
    })

    // Modal controls
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.hideModals()
      })
    })

    // Switch between login and signup
    document.getElementById("showSignup").addEventListener("click", (e) => {
      e.preventDefault()
      this.showSignupModal()
    })

    document.getElementById("showLogin").addEventListener("click", (e) => {
      e.preventDefault()
      this.showLoginModal()
    })

    // Close modals on outside click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModals()
        }
      })
    })
  }

  initializeGlobalEvents() {
    // Window resize handler
    window.addEventListener("resize", () => {
      if (this.managers.chart) {
        // Resize charts when window resizes
        setTimeout(() => {
          this.managers.chart.brainwaveChart?.resize()
          this.managers.chart.vitalChart?.resize()
          this.managers.chart.meditationChart?.resize()
        }, 100)
      }
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e)
    })

    // Page visibility change (pause/resume when tab is hidden/visible)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.onPageHidden()
      } else {
        this.onPageVisible()
      }
    })

    // Before unload (warn about active sessions)
    window.addEventListener("beforeunload", (e) => {
      if (this.managers.bluetooth?.isConnected || this.managers.meditation?.isSessionActive()) {
        e.preventDefault()
        e.returnValue = "You have an active session. Are you sure you want to leave?"
        return e.returnValue
      }
    })
  }

  async checkAuthState() {
    try {
      const {
        data: { session },
      } = await window.supabaseClient.auth.getSession()

      if (session) {
        window.currentUser = session.user
        this.onUserAuthenticated()
      } else {
        this.onUserUnauthenticated()
      }
    } catch (error) {
      console.error("Error checking auth state:", error)
      this.onUserUnauthenticated()
    }
  }

  async loadInitialData() {
    try {
      // Load historical data for charts
      if (this.managers.chart) {
        await this.managers.chart.loadHistoricalData()
      }

      // Load emergency settings
      if (this.managers.emergency) {
        await this.managers.emergency.loadEmergencySettings()
      }

      // Load data tables
      if (this.managers.data) {
        await this.managers.data.loadInitialData()
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active")
    })

    // Show selected page
    const targetPage = document.getElementById(pageName)
    if (targetPage) {
      targetPage.classList.add("active")
      this.currentPage = pageName
    }

    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active")
    })

    const activeNavItem = document.querySelector(`[data-page="${pageName}"]`)
    if (activeNavItem) {
      activeNavItem.classList.add("active")
    }

    // Page-specific initialization
    this.onPageChanged(pageName)
  }

  onPageChanged(pageName) {
    switch (pageName) {
      case "dashboard":
        // Refresh dashboard data
        if (this.managers.chart) {
          this.managers.chart.startRealTimeUpdates()
        }
        break

      case "bluetooth":
        // Update connection status
        if (this.managers.bluetooth) {
          this.managers.bluetooth.updateConnectionStatus(this.managers.bluetooth.isConnected)
        }
        break

      case "meditation":
        // Initialize meditation page
        break

      case "emergency":
        // Update emergency status
        if (this.managers.emergency) {
          this.managers.emergency.updateAlertHistory()
        }
        break

      case "data":
        // Refresh data tables
        if (this.managers.data && window.currentUser) {
          this.managers.data.refreshData()
        }
        break
    }
  }

  showLoginModal() {
    this.hideModals()
    document.getElementById("loginModal").classList.add("active")
  }

  showSignupModal() {
    this.hideModals()
    document.getElementById("signupModal").classList.add("active")
  }

  hideModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active")
    })
  }

  async handleLogin() {
    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value

    if (!email || !password) {
      alert("Please enter both email and password")
      return
    }

    try {
      const result = await window.signIn(email, password)

      if (result.success) {
        this.hideModals()
        this.onUserAuthenticated()
        await this.loadInitialData()
      } else {
        alert(result.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      alert("Login failed. Please try again.")
    }
  }

  async handleSignup() {
    const email = document.getElementById("signupEmail").value
    const password = document.getElementById("signupPassword").value
    const fullName = document.getElementById("signupName").value

    if (!email || !password || !fullName) {
      alert("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }

    try {
      const result = await window.signUp(email, password, fullName)

      if (result.success) {
        this.hideModals()
        alert("Account created successfully! Please check your email to verify your account.")
      } else {
        alert(result.error || "Signup failed")
      }
    } catch (error) {
      console.error("Signup error:", error)
      alert("Signup failed. Please try again.")
    }
  }

  async logout() {
    try {
      // Disconnect device if connected
      if (this.managers.bluetooth?.isConnected) {
        await this.managers.bluetooth.disconnect()
      }

      // Stop meditation session if active
      if (this.managers.meditation?.isSessionActive()) {
        this.managers.meditation.stopMeditation()
      }

      // Sign out
      await window.signOut()

      this.onUserUnauthenticated()
    } catch (error) {
      console.error("Logout error:", error)
      alert("Logout failed. Please try again.")
    }
  }

  onUserAuthenticated() {
    console.log("User authenticated:", window.currentUser?.email)

    // Update UI
    document.getElementById("loginBtn").classList.add("hidden")
    document.getElementById("userProfile").classList.remove("hidden")
    document.getElementById("userName").textContent =
      window.currentUser?.user_metadata?.full_name || window.currentUser?.email

    // Enable features that require authentication
    this.enableAuthenticatedFeatures()
  }

  onUserUnauthenticated() {
    console.log("User unauthenticated")

    // Update UI
    document.getElementById("loginBtn").classList.remove("hidden")
    document.getElementById("userProfile").classList.add("hidden")
    document.getElementById("userName").textContent = ""

    // Disable features that require authentication
    this.disableAuthenticatedFeatures()

    // Navigate to dashboard
    this.navigateToPage("dashboard")
  }

  enableAuthenticatedFeatures() {
    // Enable data export
    document.getElementById("exportData").disabled = false

    // Enable emergency settings
    document.getElementById("saveEmergencySettings").disabled = false

    // Show authenticated content
    document.querySelectorAll(".auth-required").forEach((element) => {
      element.classList.remove("hidden")
    })
  }

  disableAuthenticatedFeatures() {
    // Disable data export
    document.getElementById("exportData").disabled = true

    // Disable emergency settings
    document.getElementById("saveEmergencySettings").disabled = true

    // Hide authenticated content
    document.querySelectorAll(".auth-required").forEach((element) => {
      element.classList.add("hidden")
    })

    // Clear sensitive data from UI
    this.clearSensitiveData()
  }

  clearSensitiveData() {
    // Clear charts
    if (this.managers.chart) {
      this.managers.chart.clearAllCharts()
    }

    // Clear data tables
    if (this.managers.data) {
      this.managers.data.showLoginMessage()
    }

    // Reset metrics
    document.getElementById("alphaValue").textContent = "0%"
    document.getElementById("betaValue").textContent = "0%"
    document.getElementById("thetaValue").textContent = "0%"
    document.getElementById("deltaValue").textContent = "0%"
    document.getElementById("heartRateValue").textContent = "-- BPM"
    document.getElementById("spo2Value").textContent = "--%"
    document.getElementById("stressValue").textContent = "--"
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + key combinations
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "1":
          e.preventDefault()
          this.navigateToPage("dashboard")
          break
        case "2":
          e.preventDefault()
          this.navigateToPage("bluetooth")
          break
        case "3":
          e.preventDefault()
          this.navigateToPage("meditation")
          break
        case "4":
          e.preventDefault()
          this.navigateToPage("emergency")
          break
        case "5":
          e.preventDefault()
          this.navigateToPage("data")
          break
        case "e":
          e.preventDefault()
          if (this.managers.data) {
            this.managers.data.exportCurrentData()
          }
          break
      }
    }

    // Escape key to close modals
    if (e.key === "Escape") {
      this.hideModals()
    }
  }

  onPageHidden() {
    // Pause real-time updates when page is hidden
    if (this.managers.chart) {
      this.managers.chart.stopRealTimeUpdates()
    }

    // Pause data refresh
    if (this.managers.data) {
      this.managers.data.setAutoRefresh(false)
    }
  }

  onPageVisible() {
    // Resume real-time updates when page is visible
    if (this.managers.chart && this.managers.bluetooth?.isConnected) {
      this.managers.chart.startRealTimeUpdates()
    }

    // Resume data refresh
    if (this.managers.data) {
      this.managers.data.setAutoRefresh(true)
    }
  }

  showErrorMessage(message) {
    // Create and show error notification
    const notification = document.createElement("div")
    notification.className = "error-notification"
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `

    document.body.appendChild(notification)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 5000)

    // Manual close
    notification.querySelector(".notification-close").addEventListener("click", () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    })
  }

  showSuccessMessage(message) {
    // Create and show success notification
    const notification = document.createElement("div")
    notification.className = "success-notification"
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `

    document.body.appendChild(notification)

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)

    // Manual close
    notification.querySelector(".notification-close").addEventListener("click", () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    })
  }

  // Public methods
  getCurrentPage() {
    return this.currentPage
  }

  getManagers() {
    return this.managers
  }

  isAppInitialized() {
    return this.isInitialized
  }
}

// Initialize the application
const neuroFitApp = new NeuroFitApp()

// Export for global access
window.neuroFitApp = neuroFitApp

// Add some CSS for notifications
const notificationStyles = `
    .error-notification,
    .success-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    }
    
    .error-notification {
        background: #fee2e2;
        border: 1px solid #fecaca;
        color: #dc2626;
    }
    
    .success-notification {
        background: #d1fae5;
        border: 1px solid #a7f3d0;
        color: #059669;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-content i {
        font-size: 1.25rem;
    }
    
    .notification-content span {
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`

// Inject notification styles
const styleSheet = document.createElement("style")
styleSheet.textContent = notificationStyles
document.head.appendChild(styleSheet)

console.log("NeuroFit Band Application loaded successfully!")
