// Data Management and Analytics System
class DataManager {
  constructor() {
    this.currentTimeRange = "24h"
    this.currentTab = "eeg"
    this.isLoading = false
    this.refreshInterval = null
    this.autoRefreshEnabled = true
    this.refreshRate = 30000 // 30 seconds

    this.initializeEventListeners()
    this.loadInitialData()
  }

  initializeEventListeners() {
    // Time range selector
    document.getElementById("dataTimeRange").addEventListener("change", (e) => {
      this.currentTimeRange = e.target.value
      this.loadAllData()
    })

    // Export data button
    document.getElementById("exportData").addEventListener("click", () => this.exportCurrentData())

    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Auto-refresh toggle (you can add this button to UI)
    this.setupAutoRefresh()
  }

  async loadInitialData() {
    if (!window.currentUser) {
      this.showLoginMessage()
      return
    }

    await this.loadAllData()
  }

  async loadAllData() {
    this.setLoadingState(true)

    try {
      await Promise.all([this.loadEEGData(), this.loadVitalSignsData(), this.loadMoodData(), this.loadSessionsData()])
    } catch (error) {
      console.error("Error loading data:", error)
      this.showErrorMessage("Failed to load data")
    } finally {
      this.setLoadingState(false)
    }
  }

  async loadEEGData() {
    try {
      const data = await window.getEEGData(this.currentTimeRange)
      this.populateEEGTable(data)
      return data
    } catch (error) {
      console.error("Error loading EEG data:", error)
      return []
    }
  }

  async loadVitalSignsData() {
    try {
      const data = await window.getVitalSigns(this.currentTimeRange)
      this.populateVitalTable(data)
      return data
    } catch (error) {
      console.error("Error loading vital signs data:", error)
      return []
    }
  }

  async loadMoodData() {
    try {
      const data = await window.getMoodPredictions(this.currentTimeRange)
      this.populateMoodTable(data)
      return data
    } catch (error) {
      console.error("Error loading mood data:", error)
      return []
    }
  }

  async loadSessionsData() {
    try {
      const data = await window.getDeviceSessions(this.currentTimeRange)
      this.populateSessionsTable(data)
      return data
    } catch (error) {
      console.error("Error loading sessions data:", error)
      return []
    }
  }

  populateEEGTable(data) {
    const tbody = document.querySelector("#eegDataTable tbody")
    tbody.innerHTML = ""

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No EEG data available</td></tr>'
      return
    }

    data.forEach((item) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${(item.alpha_power * 100).toFixed(2)}%</td>
                <td>${(item.beta_power * 100).toFixed(2)}%</td>
                <td>${(item.theta_power * 100).toFixed(2)}%</td>
                <td>${(item.delta_power * 100).toFixed(2)}%</td>
                <td>${item.gamma_power ? (item.gamma_power * 100).toFixed(2) + "%" : "N/A"}</td>
                <td>${item.attention_level ? item.attention_level.toFixed(1) : "N/A"}</td>
                <td>${item.meditation_level ? item.meditation_level.toFixed(1) : "N/A"}</td>
            `
      tbody.appendChild(row)
    })
  }

  populateVitalTable(data) {
    const tbody = document.querySelector("#vitalDataTable tbody")
    tbody.innerHTML = ""

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No vital signs data available</td></tr>'
      return
    }

    data.forEach((item) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item.heart_rate || "N/A"}</td>
                <td>${item.spo2 ? item.spo2.toFixed(1) + "%" : "N/A"}</td>
                <td>${item.hrv_rmssd ? item.hrv_rmssd.toFixed(2) : "N/A"}</td>
                <td>${item.hrv_sdnn ? item.hrv_sdnn.toFixed(2) : "N/A"}</td>
                <td>${item.stress_index ? item.stress_index.toFixed(1) : "N/A"}</td>
            `
      tbody.appendChild(row)
    })
  }

  populateMoodTable(data) {
    const tbody = document.querySelector("#moodDataTable tbody")
    tbody.innerHTML = ""

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No mood data available</td></tr>'
      return
    }

    data.forEach((item) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>
                    <span class="mood-badge mood-${item.predicted_mood.toLowerCase()}">
                        ${item.predicted_mood}
                    </span>
                </td>
                <td>${(item.confidence * 100).toFixed(1)}%</td>
                <td>${item.stress_level ? item.stress_level.toFixed(1) : "N/A"}</td>
                <td>${item.focus_level ? item.focus_level.toFixed(1) : "N/A"}</td>
                <td>${item.relaxation_level ? item.relaxation_level.toFixed(1) : "N/A"}</td>
            `
      tbody.appendChild(row)
    })
  }

  populateSessionsTable(data) {
    const tbody = document.querySelector("#sessionsDataTable tbody")
    tbody.innerHTML = ""

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No session data available</td></tr>'
      return
    }

    data.forEach((item) => {
      const row = document.createElement("tr")
      const duration = item.session_end ? this.calculateDuration(item.session_start, item.session_end) : "Ongoing"

      row.innerHTML = `
                <td>${item.id.substring(0, 8)}...</td>
                <td>${new Date(item.session_start).toLocaleString()}</td>
                <td>${item.session_end ? new Date(item.session_end).toLocaleString() : "Ongoing"}</td>
                <td>${duration}</td>
                <td>${item.device_mac || "Unknown"}</td>
                <td>
                    <span class="status-badge ${item.is_active ? "active" : "inactive"}">
                        ${item.is_active ? "Active" : "Completed"}
                    </span>
                </td>
            `
      tbody.appendChild(row)
    })
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(`${tabName}DataTab`).classList.add("active")

    this.currentTab = tabName
  }

  async exportCurrentData() {
    this.setLoadingState(true)

    try {
      let data, filename, headers

      switch (this.currentTab) {
        case "eeg":
          data = await this.loadEEGData()
          filename = `neurofit_eeg_data_${this.currentTimeRange}.csv`
          headers = [
            "Timestamp",
            "Alpha Power",
            "Beta Power",
            "Theta Power",
            "Delta Power",
            "Gamma Power",
            "Attention Level",
            "Meditation Level",
          ]
          break

        case "vital":
          data = await this.loadVitalSignsData()
          filename = `neurofit_vital_signs_${this.currentTimeRange}.csv`
          headers = ["Timestamp", "Heart Rate", "SpO2", "HRV RMSSD", "HRV SDNN", "Stress Index"]
          break

        case "mood":
          data = await this.loadMoodData()
          filename = `neurofit_mood_data_${this.currentTimeRange}.csv`
          headers = ["Timestamp", "Predicted Mood", "Confidence", "Stress Level", "Focus Level", "Relaxation Level"]
          break

        case "sessions":
          data = await this.loadSessionsData()
          filename = `neurofit_sessions_${this.currentTimeRange}.csv`
          headers = ["Session ID", "Start Time", "End Time", "Duration", "Device MAC", "Status"]
          break

        default:
          throw new Error("Unknown tab")
      }

      this.downloadCSV(data, filename, headers)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export data")
    } finally {
      this.setLoadingState(false)
    }
  }

  downloadCSV(data, filename, headers) {
    if (data.length === 0) {
      alert("No data to export")
      return
    }

    let csv = headers.join(",") + "\n"

    data.forEach((item) => {
      let row = []

      switch (this.currentTab) {
        case "eeg":
          row = [
            new Date(item.timestamp).toISOString(),
            item.alpha_power,
            item.beta_power,
            item.theta_power,
            item.delta_power,
            item.gamma_power || "",
            item.attention_level || "",
            item.meditation_level || "",
          ]
          break

        case "vital":
          row = [
            new Date(item.timestamp).toISOString(),
            item.heart_rate || "",
            item.spo2 || "",
            item.hrv_rmssd || "",
            item.hrv_sdnn || "",
            item.stress_index || "",
          ]
          break

        case "mood":
          row = [
            new Date(item.timestamp).toISOString(),
            item.predicted_mood,
            item.confidence,
            item.stress_level || "",
            item.focus_level || "",
            item.relaxation_level || "",
          ]
          break

        case "sessions":
          const duration = item.session_end ? this.calculateDuration(item.session_start, item.session_end) : "Ongoing"
          row = [
            item.id,
            new Date(item.session_start).toISOString(),
            item.session_end ? new Date(item.session_end).toISOString() : "",
            duration,
            item.device_mac || "",
            item.is_active ? "Active" : "Completed",
          ]
          break
      }

      csv += row.map((field) => `"${field}"`).join(",") + "\n"
    })

    // Download file
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  calculateDuration(startTime, endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  setupAutoRefresh() {
    if (this.autoRefreshEnabled) {
      this.refreshInterval = setInterval(() => {
        if (window.currentUser && !this.isLoading) {
          this.loadAllData()
        }
      }, this.refreshRate)
    }
  }

  setLoadingState(loading) {
    this.isLoading = loading

    const exportBtn = document.getElementById("exportData")
    const timeRangeSelect = document.getElementById("dataTimeRange")

    if (loading) {
      exportBtn.disabled = true
      exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...'
      timeRangeSelect.disabled = true
    } else {
      exportBtn.disabled = false
      exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Data'
      timeRangeSelect.disabled = false
    }
  }

  showLoginMessage() {
    const tables = ["eegDataTable", "vitalDataTable", "moodDataTable", "sessionsDataTable"]

    tables.forEach((tableId) => {
      const tbody = document.querySelector(`#${tableId} tbody`)
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">Please log in to view your data</td></tr>'
    })
  }

  showErrorMessage(message) {
    const tables = ["eegDataTable", "vitalDataTable", "moodDataTable", "sessionsDataTable"]

    tables.forEach((tableId) => {
      const tbody = document.querySelector(`#${tableId} tbody`)
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${message}</td></tr>`
    })
  }

  // Public methods
  refreshData() {
    this.loadAllData()
  }

  setAutoRefresh(enabled) {
    this.autoRefreshEnabled = enabled

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }

    if (enabled) {
      this.setupAutoRefresh()
    }
  }

  getCurrentTimeRange() {
    return this.currentTimeRange
  }

  getCurrentTab() {
    return this.currentTab
  }
}

// Initialize Data Manager
const dataManager = new DataManager()

// Export for global access
window.dataManager = dataManager
