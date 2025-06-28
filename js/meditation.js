// Meditation and Relaxation Manager
class MeditationManager {
  constructor() {
    this.isActive = false
    this.currentSession = null
    this.sessionTimer = null
    this.breathingTimer = null
    this.sessionStartTime = null
    this.sessionDuration = 0
    this.breathingPhase = "inhale" // 'inhale', 'hold', 'exhale', 'pause'
    this.breathingCycle = 0

    // Breathing patterns (in seconds)
    this.breathingPatterns = {
      "stress-relief": { inhale: 4, hold: 4, exhale: 6, pause: 2 },
      "focus-boost": { inhale: 4, hold: 7, exhale: 8, pause: 1 },
      "deep-relaxation": { inhale: 6, hold: 2, exhale: 8, pause: 2 },
      "sleep-preparation": { inhale: 4, hold: 2, exhale: 8, pause: 4 },
    }

    // Session durations (in minutes)
    this.sessionDurations = {
      "stress-relief": 10,
      "focus-boost": 15,
      "deep-relaxation": 20,
      "sleep-preparation": 25,
    }

    this.initializeEventListeners()
  }

  initializeEventListeners() {
    // Meditation controls
    document.getElementById("startMeditationBtn").addEventListener("click", () => this.startMeditation())
    document.getElementById("pauseMeditationBtn").addEventListener("click", () => this.pauseMeditation())
    document.getElementById("stopMeditationBtn").addEventListener("click", () => this.stopMeditation())

    // Quick action meditation button
    document.getElementById("startMeditation").addEventListener("click", () => {
      this.switchToMeditationPage()
      this.startMeditation()
    })

    // Breathing exercise button
    document.getElementById("breathingExercise").addEventListener("click", () => {
      this.switchToMeditationPage()
      this.startBreathingExercise()
    })
  }

  switchToMeditationPage() {
    // Switch to meditation page
    document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"))
    document.getElementById("meditation").classList.add("active")

    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"))
    document.querySelector('[data-page="meditation"]').classList.add("active")
  }

  startMeditation() {
    if (this.isActive) return

    const sessionType = document.getElementById("meditationSession").value
    this.sessionDuration = this.sessionDurations[sessionType] * 60 // Convert to seconds

    this.isActive = true
    this.sessionStartTime = new Date()
    this.currentSession = {
      type: sessionType,
      startTime: this.sessionStartTime,
      duration: this.sessionDuration,
      completed: false,
    }

    // Update UI
    this.updateMeditationUI(true)

    // Start session timer
    this.startSessionTimer()

    // Start breathing animation
    this.startBreathingAnimation(sessionType)

    // Start real-time feedback
    this.startRealTimeFeedback()

    // Log session start
    console.log(`Started ${sessionType} meditation session for ${this.sessionDuration / 60} minutes`)

    // Store session in database
    if (window.currentUser) {
      this.storeMeditationSession()
    }
  }

  pauseMeditation() {
    if (!this.isActive) return

    if (this.sessionTimer) {
      clearInterval(this.sessionTimer)
      this.sessionTimer = null
    }

    if (this.breathingTimer) {
      clearTimeout(this.breathingTimer)
      this.breathingTimer = null
    }

    this.updateMeditationUI(false, true)
    console.log("Meditation session paused")
  }

  stopMeditation() {
    if (!this.isActive) return

    this.isActive = false

    // Clear timers
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer)
      this.sessionTimer = null
    }

    if (this.breathingTimer) {
      clearTimeout(this.breathingTimer)
      this.breathingTimer = null
    }

    // Calculate session stats
    const sessionEndTime = new Date()
    const actualDuration = Math.floor((sessionEndTime - this.sessionStartTime) / 1000)
    const completionPercentage = (actualDuration / this.sessionDuration) * 100

    // Update session data
    if (this.currentSession) {
      this.currentSession.endTime = sessionEndTime
      this.currentSession.actualDuration = actualDuration
      this.currentSession.completed = completionPercentage >= 90
    }

    // Update UI
    this.updateMeditationUI(false)
    this.resetBreathingAnimation()

    // Show session summary
    this.showSessionSummary(actualDuration, completionPercentage)

    // Update database
    if (window.currentUser && this.currentSession) {
      this.updateMeditationSession()
    }

    console.log(
      `Meditation session ended. Duration: ${actualDuration}s, Completion: ${completionPercentage.toFixed(1)}%`,
    )
  }

  startBreathingExercise() {
    // Quick 5-minute breathing exercise
    document.getElementById("meditationSession").value = "stress-relief"
    this.sessionDuration = 5 * 60 // 5 minutes
    this.startMeditation()
  }

  startSessionTimer() {
    let elapsed = 0

    this.sessionTimer = setInterval(() => {
      elapsed++
      const remaining = this.sessionDuration - elapsed

      if (remaining <= 0) {
        this.stopMeditation()
        return
      }

      // Update timer display
      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      document.getElementById("meditationTimer").textContent =
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }, 1000)
  }

  startBreathingAnimation(sessionType) {
    const pattern = this.breathingPatterns[sessionType]
    const circle = document.getElementById("breathingCircle")
    const text = document.getElementById("breathingText")

    const runBreathingCycle = () => {
      if (!this.isActive) return

      // Inhale phase
      this.breathingPhase = "inhale"
      circle.classList.add("inhale")
      circle.classList.remove("exhale")
      text.textContent = "Breathe In"

      this.breathingTimer = setTimeout(() => {
        if (!this.isActive) return

        // Hold phase
        this.breathingPhase = "hold"
        text.textContent = "Hold"

        this.breathingTimer = setTimeout(() => {
          if (!this.isActive) return

          // Exhale phase
          this.breathingPhase = "exhale"
          circle.classList.add("exhale")
          circle.classList.remove("inhale")
          text.textContent = "Breathe Out"

          this.breathingTimer = setTimeout(() => {
            if (!this.isActive) return

            // Pause phase
            this.breathingPhase = "pause"
            text.textContent = "Relax"

            this.breathingTimer = setTimeout(() => {
              this.breathingCycle++
              runBreathingCycle()
            }, pattern.pause * 1000)
          }, pattern.exhale * 1000)
        }, pattern.hold * 1000)
      }, pattern.inhale * 1000)
    }

    runBreathingCycle()
  }

  startRealTimeFeedback() {
    // Monitor real-time biometric data during meditation
    const updateFeedback = () => {
      if (!this.isActive) return

      // Get current biometric data (simulated for demo)
      const relaxationLevel = this.calculateRelaxationLevel()
      const hrvLevel = this.calculateHRVLevel()
      const meditationQuality = this.calculateMeditationQuality()

      // Update progress bars
      document.getElementById("meditationRelaxation").style.width = `${relaxationLevel}%`
      document.getElementById("meditationHRV").style.width = `${hrvLevel}%`
      document.getElementById("meditationQuality").style.width = `${meditationQuality}%`

      // Update meditation chart
      if (window.chartManager) {
        window.chartManager.updateMeditationChart(relaxationLevel, hrvLevel)
      }

      setTimeout(updateFeedback, 2000) // Update every 2 seconds
    }

    updateFeedback()
  }

  calculateRelaxationLevel() {
    // Simulate relaxation level based on session progress and breathing cycle
    const baseLevel = 30 + this.breathingCycle * 2
    const breathingBonus = this.breathingPhase === "exhale" ? 20 : 0
    return Math.min(baseLevel + breathingBonus + Math.random() * 10, 100)
  }

  calculateHRVLevel() {
    // Simulate HRV improvement during meditation
    const sessionProgress = this.sessionStartTime
      ? (Date.now() - this.sessionStartTime.getTime()) / (this.sessionDuration * 1000)
      : 0
    return Math.min(40 + sessionProgress * 40 + Math.random() * 15, 100)
  }

  calculateMeditationQuality() {
    // Combine relaxation and HRV for overall quality
    const relaxation = this.calculateRelaxationLevel()
    const hrv = this.calculateHRVLevel()
    return (relaxation + hrv) / 2
  }

  updateMeditationUI(isActive, isPaused = false) {
    const startBtn = document.getElementById("startMeditationBtn")
    const pauseBtn = document.getElementById("pauseMeditationBtn")
    const stopBtn = document.getElementById("stopMeditationBtn")

    if (isActive && !isPaused) {
      startBtn.classList.add("hidden")
      pauseBtn.classList.remove("hidden")
      stopBtn.classList.remove("hidden")
    } else if (isPaused) {
      startBtn.classList.remove("hidden")
      pauseBtn.classList.add("hidden")
      stopBtn.classList.remove("hidden")
      startBtn.innerHTML = '<i class="fas fa-play"></i> Resume'
    } else {
      startBtn.classList.remove("hidden")
      pauseBtn.classList.add("hidden")
      stopBtn.classList.add("hidden")
      startBtn.innerHTML = '<i class="fas fa-play"></i> Start'
    }
  }

  resetBreathingAnimation() {
    const circle = document.getElementById("breathingCircle")
    const text = document.getElementById("breathingText")

    circle.classList.remove("inhale", "exhale")
    text.textContent = "Breathe"

    // Reset timer display
    document.getElementById("meditationTimer").textContent = "00:00"

    // Reset progress bars
    document.getElementById("meditationRelaxation").style.width = "0%"
    document.getElementById("meditationHRV").style.width = "0%"
    document.getElementById("meditationQuality").style.width = "0%"
  }

  showSessionSummary(duration, completion) {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60

    const summary = `
            Meditation Session Complete!
            
            Duration: ${minutes}m ${seconds}s
            Completion: ${completion.toFixed(1)}%
            Breathing Cycles: ${this.breathingCycle}
            
            ${
              completion >= 90
                ? "Excellent work! 🧘‍♀️"
                : completion >= 70
                  ? "Good session! Keep it up! 👍"
                  : "Every minute counts! Try again soon. 💪"
            }
        `

    alert(summary) // In production, use a proper modal
  }

  storeMeditationSession() {
    if (!window.supabaseClient || !window.currentUser) return

    window.supabaseClient
      .from("meditation_sessions")
      .insert([
        {
          user_id: window.currentUser.id,
          session_type: this.currentSession.type,
          duration_minutes: this.sessionDuration / 60,
          start_time: this.currentSession.startTime.toISOString(),
          completed: false, // Will be updated when session ends
        },
      ])
      .then((response) => {
        if (response.error) {
          console.error("Error storing meditation session:", response.error)
        } else {
          console.log("Meditation session stored in database")
        }
      })
  }

  updateMeditationSession() {
    if (!window.supabaseClient || !window.currentUser || !this.currentSession) return

    window.supabaseClient
      .from("meditation_sessions")
      .update({
        end_time: this.currentSession.endTime.toISOString(),
        completed: this.currentSession.completed,
        // Add more metrics here
      })
      .eq("user_id", window.currentUser.id)
      .eq("start_time", this.currentSession.startTime.toISOString())
      .then((response) => {
        if (response.error) {
          console.error("Error updating meditation session:", response.error)
        } else {
          console.log("Meditation session updated in database")
        }
      })
  }

  // Public methods
  getCurrentSession() {
    return this.currentSession
  }

  isSessionActive() {
    return this.isActive
  }

  getBreathingCycle() {
    return this.breathingCycle
  }
}

// Initialize Meditation Manager
const meditationManager = new MeditationManager()

// Export for global access
window.meditationManager = meditationManager
