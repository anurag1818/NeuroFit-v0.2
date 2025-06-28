// Emergency Alert and Management System
class EmergencyManager {
  constructor() {
    this.emergencyContact = null
    this.emergencyThreshold = "high" // 'high', 'critical', 'extreme'
    this.locationEnabled = false
    this.currentLocation = null
    this.alertHistory = []
    this.isMonitoring = true
    this.lastAlertTime = null
    this.alertCooldown = 5 * 60 * 1000 // 5 minutes cooldown between alerts

    this.thresholds = {
      high: { stress: 80, heartRate: { min: 45, max: 130 }, spo2: 88 },
      critical: { stress: 90, heartRate: { min: 40, max: 140 }, spo2: 85 },
      extreme: { stress: 95, heartRate: { min: 35, max: 150 }, spo2: 80 },
    }

    this.initializeEventListeners()
    this.loadEmergencySettings()
    this.requestLocationPermission()
  }

  initializeEventListeners() {
    // Emergency settings
    document.getElementById("saveEmergencySettings").addEventListener("click", () => this.saveEmergencySettings())
    document.getElementById("testEmergencyAlert").addEventListener("click", () => this.testEmergencyAlert())
    document.getElementById("manualEmergencyAlert").addEventListener("click", () => this.triggerManualAlert())
    document.getElementById("enableLocation").addEventListener("click", () => this.requestLocationPermission())

    // Quick action emergency button
    document.getElementById("emergencyAlert").addEventListener("click", () => this.triggerManualAlert())
  }

  async loadEmergencySettings() {
    if (!window.currentUser) return

    try {
      const { data, error } = await window.supabaseClient
        .from("users")
        .select("emergency_contact, emergency_name")
        .eq("id", window.currentUser.id)
        .single()

      if (error) throw error

      if (data) {
        this.emergencyContact = {
          name: data.emergency_name,
          phone: data.emergency_contact,
        }

        // Update UI
        document.getElementById("emergencyName").value = data.emergency_name || ""
        document.getElementById("emergencyPhone").value = data.emergency_contact || ""
      }
    } catch (error) {
      console.error("Error loading emergency settings:", error)
    }
  }

  async saveEmergencySettings() {
    const name = document.getElementById("emergencyName").value.trim()
    const phone = document.getElementById("emergencyPhone").value.trim()
    const threshold = document.getElementById("emergencyThreshold").value

    if (!name || !phone) {
      alert("Please enter both contact name and phone number")
      return
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))) {
      alert("Please enter a valid phone number")
      return
    }

    this.emergencyContact = { name, phone }
    this.emergencyThreshold = threshold

    // Save to database
    if (window.currentUser) {
      try {
        const { error } = await window.updateUserProfile({
          emergency_name: name,
          emergency_contact: phone,
        })

        if (error) throw error

        alert("Emergency settings saved successfully!")
        this.updateEmergencyStatus("safe", "Emergency contact configured")
      } catch (error) {
        console.error("Error saving emergency settings:", error)
        alert("Failed to save emergency settings")
      }
    }
  }

  async requestLocationPermission() {
    if (!navigator.geolocation) {
      this.updateLocationStatus("Location services not supported")
      return
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        })
      })

      this.locationEnabled = true
      this.currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(),
      }

      this.updateLocationStatus(`Location enabled (±${Math.round(position.coords.accuracy)}m)`)

      // Start watching position for continuous updates
      this.startLocationWatching()
    } catch (error) {
      console.error("Location permission denied:", error)
      this.locationEnabled = false
      this.updateLocationStatus("Location permission denied")
    }
  }

  startLocationWatching() {
    if (!navigator.geolocation) return

    navigator.geolocation.watchPosition(
      (position) => {
        this.currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        }
      },
      (error) => {
        console.error("Location watching error:", error)
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 600000, // 10 minutes
      },
    )
  }

  handleEmergencyCondition(conditionData) {
    if (!this.isMonitoring) return

    const { type, severity, vitalSigns } = conditionData
    const threshold = this.thresholds[this.emergencyThreshold]

    // Check if condition meets threshold
    let shouldAlert = false
    let alertMessage = ""

    switch (type) {
      case "high_stress":
        if (vitalSigns.stressIndex >= threshold.stress) {
          shouldAlert = true
          alertMessage = `High stress level detected: ${vitalSigns.stressIndex.toFixed(1)}`
        }
        break

      case "abnormal_heart_rate":
        if (vitalSigns.heartRate < threshold.heartRate.min || vitalSigns.heartRate > threshold.heartRate.max) {
          shouldAlert = true
          alertMessage = `Abnormal heart rate: ${vitalSigns.heartRate} BPM`
        }
        break

      case "low_oxygen":
        if (vitalSigns.spo2 < threshold.spo2) {
          shouldAlert = true
          alertMessage = `Low oxygen saturation: ${vitalSigns.spo2.toFixed(1)}%`
        }
        break
    }

    if (shouldAlert) {
      this.triggerEmergencyAlert(type, severity, alertMessage, vitalSigns)
    }
  }

  async triggerEmergencyAlert(type, severity, message, vitalSigns) {
    // Check cooldown period
    if (this.lastAlertTime && Date.now() - this.lastAlertTime < this.alertCooldown) {
      console.log("Emergency alert in cooldown period")
      return
    }

    this.lastAlertTime = Date.now()

    const alertData = {
      type: type,
      severity: severity,
      message: message,
      timestamp: new Date(),
      vitalSigns: vitalSigns,
      location: this.currentLocation,
      sent: false,
    }

    // Update UI immediately
    this.updateEmergencyStatus("danger", message)

    // Add to history
    this.alertHistory.unshift(alertData)
    this.updateAlertHistory()

    // Send alert
    const success = await this.sendEmergencyAlert(alertData)
    alertData.sent = success

    // Store in database
    if (window.currentUser) {
      await window.insertEmergencyAlert({
        type: type,
        severity: severity,
        latitude: this.currentLocation?.latitude,
        longitude: this.currentLocation?.longitude,
        vitalSigns: vitalSigns,
        sent: success,
      })
    }

    // Trigger device vibration/alert
    if (window.bluetoothManager) {
      await window.bluetoothManager.triggerEmergencyAlert()
    }

    console.log(`Emergency alert triggered: ${message}`)
  }

  async sendEmergencyAlert(alertData) {
    if (!this.emergencyContact) {
      console.error("No emergency contact configured")
      return false
    }

    try {
      // Prepare alert message
      let alertMessage = `🚨 NEUROFIT EMERGENCY ALERT 🚨\n\n`
      alertMessage += `User: ${window.currentUser?.user_metadata?.full_name || "Unknown"}\n`
      alertMessage += `Alert: ${alertData.message}\n`
      alertMessage += `Time: ${alertData.timestamp.toLocaleString()}\n`

      if (alertData.vitalSigns) {
        alertMessage += `\nVital Signs:\n`
        alertMessage += `• Heart Rate: ${alertData.vitalSigns.heartRate} BPM\n`
        alertMessage += `• SpO2: ${alertData.vitalSigns.spo2?.toFixed(1)}%\n`
        alertMessage += `• Stress Index: ${alertData.vitalSigns.stressIndex?.toFixed(1)}\n`
      }

      if (alertData.location) {
        alertMessage += `\nLocation:\n`
        alertMessage += `• Lat: ${alertData.location.latitude.toFixed(6)}\n`
        alertMessage += `• Lng: ${alertData.location.longitude.toFixed(6)}\n`
        alertMessage += `• Google Maps: https://maps.google.com/?q=${alertData.location.latitude},${alertData.location.longitude}\n`
      }

      alertMessage += `\nThis is an automated alert from NeuroFit Band.`

      // In a real implementation, you would integrate with:
      // - SMS service (Twilio, AWS SNS, etc.)
      // - Email service
      // - Push notifications
      // - Emergency services API

      console.log("Emergency alert message:", alertMessage)
      console.log("Sending to:", this.emergencyContact)

      // Simulate sending (replace with actual implementation)
      await this.simulateAlertSending(alertMessage)

      return true
    } catch (error) {
      console.error("Failed to send emergency alert:", error)
      return false
    }
  }

  async simulateAlertSending(message) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Show alert in browser (for demo purposes)
    if (confirm(`EMERGENCY ALERT WOULD BE SENT:\n\n${message}\n\nClick OK to simulate successful sending.`)) {
      console.log("Emergency alert sent successfully (simulated)")
    } else {
      throw new Error("Alert sending cancelled")
    }
  }

  async testEmergencyAlert() {
    const testAlert = {
      type: "test",
      severity: "low",
      message: "This is a test emergency alert",
      timestamp: new Date(),
      vitalSigns: {
        heartRate: 75,
        spo2: 98.5,
        stressIndex: 25,
      },
      location: this.currentLocation,
    }

    await this.sendEmergencyAlert(testAlert)

    // Add to history
    this.alertHistory.unshift(testAlert)
    this.updateAlertHistory()
  }

  async triggerManualAlert() {
    if (!this.emergencyContact) {
      alert("Please configure emergency contact first")
      return
    }

    const confirmed = confirm(
      "This will send an emergency alert to your emergency contact. " +
        "Only use this in case of a real emergency. Continue?",
    )

    if (!confirmed) return

    await this.triggerEmergencyAlert("manual", "critical", "Manual emergency alert triggered by user", {
      heartRate: 0, // Will be filled with current data if available
      spo2: 0,
      stressIndex: 100,
    })
  }

  updateEmergencyStatus(status, message) {
    const statusIcon = document.getElementById("emergencyStatusIcon")
    const statusText = document.getElementById("emergencyStatusText")
    const statusDetail = document.getElementById("emergencyStatusDetail")

    // Update icon and styling
    statusIcon.className = `status-icon ${status}`

    switch (status) {
      case "safe":
        statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>'
        statusText.textContent = "All Systems Normal"
        break
      case "warning":
        statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>'
        statusText.textContent = "Warning Detected"
        break
      case "danger":
        statusIcon.innerHTML = '<i class="fas fa-exclamation-circle"></i>'
        statusText.textContent = "Emergency Alert Active"
        break
    }

    statusDetail.textContent = message
  }

  updateLocationStatus(status) {
    const locationStatus = document.getElementById("locationStatus")
    const enableButton = document.getElementById("enableLocation")

    locationStatus.textContent = status

    if (this.locationEnabled) {
      enableButton.textContent = "Update Location"
      enableButton.className = "btn-success"
    } else {
      enableButton.textContent = "Enable Location"
      enableButton.className = "btn-secondary"
    }
  }

  updateAlertHistory() {
    const historyContainer = document.getElementById("alertHistory")

    if (this.alertHistory.length === 0) {
      historyContainer.innerHTML = '<p class="no-alerts">No recent alerts</p>'
      return
    }

    historyContainer.innerHTML = ""

    this.alertHistory.slice(0, 10).forEach((alert) => {
      const alertElement = document.createElement("div")
      alertElement.className = "alert-item"

      const severityColor =
        {
          low: "#10b981",
          high: "#f59e0b",
          critical: "#ef4444",
        }[alert.severity] || "#6b7280"

      alertElement.innerHTML = `
                <div>
                    <strong style="color: ${severityColor}">${alert.type.toUpperCase()}</strong>
                    <br>
                    <small>${alert.message}</small>
                    <br>
                    <small>${alert.timestamp.toLocaleString()}</small>
                </div>
                <div>
                    <span class="alert-status ${alert.sent ? "sent" : "failed"}">
                        ${alert.sent ? "✓ Sent" : "✗ Failed"}
                    </span>
                </div>
            `

      historyContainer.appendChild(alertElement)
    })
  }

  // Public methods
  setMonitoring(enabled) {
    this.isMonitoring = enabled
    console.log(`Emergency monitoring ${enabled ? "enabled" : "disabled"}`)
  }

  getEmergencyContact() {
    return this.emergencyContact
  }

  getCurrentLocation() {
    return this.currentLocation
  }

  getAlertHistory() {
    return this.alertHistory
  }
}

// Initialize Emergency Manager
const emergencyManager = new EmergencyManager()

// Export for global access
window.emergencyManager = emergencyManager
