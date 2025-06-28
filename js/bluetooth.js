// Bluetooth Low Energy (BLE) Connection Manager
class BluetoothManager {
  constructor() {
    this.device = null
    this.server = null
    this.service = null
    this.eegCharacteristic = null
    this.vitalCharacteristic = null
    this.commandCharacteristic = null
    this.isConnected = false
    this.currentUser = null // Declare currentUser
    this.currentSession = null // Declare currentSession

    // Service and characteristic UUIDs (must match Arduino code)
    this.SERVICE_UUID = "12345678-1234-1234-1234-123456789abc"
    this.EEG_CHAR_UUID = "87654321-4321-4321-4321-cba987654321"
    this.VITAL_CHAR_UUID = "11111111-2222-3333-4444-555555555555"
    this.COMMAND_CHAR_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

    this.onDataReceived = null
    this.onConnectionChanged = null

    this.initializeEventListeners()
  }

  initializeEventListeners() {
    document.getElementById("scanDevices").addEventListener("click", () => this.scanForDevices())
    document.getElementById("connectDevice").addEventListener("click", () => this.connectToDevice())
    document.getElementById("disconnectDevice").addEventListener("click", () => this.disconnect())
  }

  async scanForDevices() {
    if (!navigator.bluetooth) {
      this.logMessage("Bluetooth not supported in this browser", "error")
      return
    }

    try {
      this.logMessage("Scanning for NeuroFit Band devices...", "info")

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: "NeuroFit-Band" }, { services: [this.SERVICE_UUID] }],
        optionalServices: [this.SERVICE_UUID],
      })

      this.device = device
      this.device.addEventListener("gattserverdisconnected", () => this.onDisconnected())

      this.logMessage(`Found device: ${device.name}`, "success")
      this.showDeviceInfo(device)

      document.getElementById("connectDevice").classList.remove("hidden")
    } catch (error) {
      this.logMessage(`Scan failed: ${error.message}`, "error")
    }
  }

  async connectToDevice() {
    if (!this.device) {
      this.logMessage("No device selected", "error")
      return
    }

    try {
      this.logMessage("Connecting to device...", "info")

      this.server = await this.device.gatt.connect()
      this.logMessage("Connected to GATT server", "success")

      this.service = await this.server.getPrimaryService(this.SERVICE_UUID)
      this.logMessage("Got NeuroFit service", "success")

      // Get characteristics
      this.eegCharacteristic = await this.service.getCharacteristic(this.EEG_CHAR_UUID)
      this.vitalCharacteristic = await this.service.getCharacteristic(this.VITAL_CHAR_UUID)
      this.commandCharacteristic = await this.service.getCharacteristic(this.COMMAND_CHAR_UUID)

      // Start notifications
      await this.eegCharacteristic.startNotifications()
      await this.vitalCharacteristic.startNotifications()

      // Set up data listeners
      this.eegCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
        this.handleEEGData(event.target.value)
      })

      this.vitalCharacteristic.addEventListener("characteristicvaluechanged", (event) => {
        this.handleVitalData(event.target.value)
      })

      this.isConnected = true
      this.updateConnectionStatus(true)
      this.logMessage("Device connected and ready!", "success")

      // Create new session in database
      if (this.currentUser) {
        this.currentSession = await this.createDeviceSession(this.device.id || "unknown")
      }

      // Send start session command
      await this.sendCommand("START_SESSION")
    } catch (error) {
      this.logMessage(`Connection failed: ${error.message}`, "error")
      this.isConnected = false
      this.updateConnectionStatus(false)
    }
  }

  async disconnect() {
    try {
      if (this.device && this.device.gatt.connected) {
        // Send stop session command
        await this.sendCommand("STOP_SESSION")

        // End session in database
        if (this.currentSession) {
          await this.endDeviceSession(this.currentSession.id)
        }

        await this.device.gatt.disconnect()
      }

      this.onDisconnected()
      this.logMessage("Disconnected from device", "info")
    } catch (error) {
      this.logMessage(`Disconnect error: ${error.message}`, "error")
    }
  }

  onDisconnected() {
    this.isConnected = false
    this.device = null
    this.server = null
    this.service = null
    this.eegCharacteristic = null
    this.vitalCharacteristic = null
    this.commandCharacteristic = null
    this.currentSession = null // Reset currentSession on disconnect

    this.updateConnectionStatus(false)

    if (this.onConnectionChanged) {
      this.onConnectionChanged(false)
    }
  }

  handleEEGData(value) {
    try {
      const decoder = new TextDecoder()
      const jsonString = decoder.decode(value)
      const eegData = JSON.parse(jsonString)

      // Store in database
      if (this.currentUser) {
        this.insertEEGData(eegData)
      }

      // Update UI
      if (this.onDataReceived) {
        this.onDataReceived("eeg", eegData)
      }

      // Update dashboard metrics
      this.updateEEGMetrics(eegData)
    } catch (error) {
      console.error("EEG data parsing error:", error)
    }
  }

  handleVitalData(value) {
    try {
      const decoder = new TextDecoder()
      const jsonString = decoder.decode(value)
      const vitalData = JSON.parse(jsonString)

      // Store in database
      if (this.currentUser) {
        this.insertVitalSigns(vitalData)
      }

      // Update UI
      if (this.onDataReceived) {
        this.onDataReceived("vital", vitalData)
      }

      // Update dashboard metrics
      this.updateVitalMetrics(vitalData)

      // Check for emergency conditions
      this.checkEmergencyConditions(vitalData)
    } catch (error) {
      console.error("Vital data parsing error:", error)
    }
  }

  async sendCommand(command) {
    if (!this.commandCharacteristic) {
      console.error("Command characteristic not available")
      return
    }

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(command)
      await this.commandCharacteristic.writeValue(data)
      this.logMessage(`Command sent: ${command}`, "info")
    } catch (error) {
      this.logMessage(`Command failed: ${error.message}`, "error")
    }
  }

  updateEEGMetrics(data) {
    document.getElementById("alphaValue").textContent = `${(data.alpha * 100).toFixed(1)}%`
    document.getElementById("betaValue").textContent = `${(data.beta * 100).toFixed(1)}%`
    document.getElementById("thetaValue").textContent = `${(data.theta * 100).toFixed(1)}%`
    document.getElementById("deltaValue").textContent = `${(data.delta * 100).toFixed(1)}%`

    // Update progress bars
    document.getElementById("attentionLevel").style.width = `${data.attention}%`

    // Update charts
    if (window.chartManager) {
      window.chartManager.updateBrainwaveChart(data)
    }
  }

  updateVitalMetrics(data) {
    document.getElementById("heartRateValue").textContent = `${data.heartRate} BPM`
    document.getElementById("spo2Value").textContent = `${data.spo2.toFixed(1)}%`
    document.getElementById("stressValue").textContent = data.stressIndex.toFixed(1)

    // Update charts
    if (window.chartManager) {
      window.chartManager.updateVitalChart(data)
    }
  }

  checkEmergencyConditions(vitalData) {
    const stressThreshold = 85 // Configurable
    const heartRateMin = 50
    const heartRateMax = 120
    const spo2Min = 90

    let emergencyDetected = false
    let alertType = ""
    let severity = "low"

    if (vitalData.stressIndex > stressThreshold) {
      emergencyDetected = true
      alertType = "high_stress"
      severity = vitalData.stressIndex > 95 ? "critical" : "high"
    }

    if (vitalData.heartRate < heartRateMin || vitalData.heartRate > heartRateMax) {
      emergencyDetected = true
      alertType = "abnormal_heart_rate"
      severity = "high"
    }

    if (vitalData.spo2 < spo2Min) {
      emergencyDetected = true
      alertType = "low_oxygen"
      severity = "critical"
    }

    if (emergencyDetected && window.emergencyManager) {
      window.emergencyManager.handleEmergencyCondition({
        type: alertType,
        severity: severity,
        vitalSigns: vitalData,
      })
    }
  }

  updateConnectionStatus(connected) {
    const indicator = document.getElementById("connectionIndicator")
    const statusCircle = document.getElementById("deviceStatusCircle")
    const statusText = document.getElementById("deviceStatusText")
    const deviceInfo = document.getElementById("deviceInfo")

    if (connected) {
      indicator.className = "status-indicator connected"
      indicator.innerHTML = '<i class="fas fa-circle"></i><span>Connected</span>'

      if (statusCircle) statusCircle.className = "status-circle connected"
      if (statusText) statusText.textContent = "Connected"
      if (deviceInfo) deviceInfo.textContent = `Connected to ${this.device?.name || "NeuroFit Band"}`

      document.getElementById("connectDevice").classList.add("hidden")
      document.getElementById("disconnectDevice").classList.remove("hidden")
    } else {
      indicator.className = "status-indicator disconnected"
      indicator.innerHTML = '<i class="fas fa-circle"></i><span>Disconnected</span>'

      if (statusCircle) statusCircle.className = "status-circle"
      if (statusText) statusText.textContent = "Not Connected"
      if (deviceInfo) deviceInfo.textContent = "Click scan to find your NeuroFit Band"

      document.getElementById("connectDevice").classList.add("hidden")
      document.getElementById("disconnectDevice").classList.add("hidden")
    }
  }

  showDeviceInfo(device) {
    const deviceList = document.getElementById("deviceList")
    const devicesContainer = document.getElementById("devices")

    devicesContainer.innerHTML = `
            <div class="device-item">
                <div>
                    <strong>${device.name || "Unknown Device"}</strong>
                    <br>
                    <small>ID: ${device.id}</small>
                </div>
                <button class="btn-primary" onclick="bluetoothManager.connectToDevice()">
                    Connect
                </button>
            </div>
        `

    deviceList.classList.remove("hidden")
  }

  logMessage(message, type = "info") {
    const logContainer = document.getElementById("connectionLog")
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = document.createElement("div")

    logEntry.className = `log-entry log-${type}`
    logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`

    logContainer.appendChild(logEntry)
    logContainer.scrollTop = logContainer.scrollHeight

    // Keep only last 50 log entries
    while (logContainer.children.length > 50) {
      logContainer.removeChild(logContainer.firstChild)
    }
  }

  // Public methods for external use
  async calibrateDevice() {
    await this.sendCommand("CALIBRATE")
  }

  async triggerEmergencyAlert() {
    await this.sendCommand("EMERGENCY")
  }

  getConnectionStatus() {
    return this.isConnected
  }

  // Placeholder methods for database operations
  async createDeviceSession(deviceId) {
    // Implement database session creation logic here
    console.log(`Creating session for device: ${deviceId}`)
    return { id: "session-id" } // Return a mock session object
  }

  async endDeviceSession(sessionId) {
    // Implement database session end logic here
    console.log(`Ending session: ${sessionId}`)
  }

  insertEEGData(data) {
    // Implement EEG data insertion logic here
    console.log("Inserting EEG data:", data)
  }

  insertVitalSigns(data) {
    // Implement vital signs insertion logic here
    console.log("Inserting vital signs:", data)
  }
}

// Initialize Bluetooth Manager
const bluetoothManager = new BluetoothManager()

// Set up data callback
bluetoothManager.onDataReceived = (type, data) => {
  console.log(`Received ${type} data:`, data)

  // Process with TensorFlow model
  if (window.tensorflowModel && type === "eeg") {
    window.tensorflowModel.predictMood(data)
  }
}

// Set up connection callback
bluetoothManager.onConnectionChanged = (connected) => {
  console.log(`Connection status changed: ${connected}`)

  if (connected) {
    // Start real-time data processing
    if (window.chartManager) {
      window.chartManager.startRealTimeUpdates()
    }
  } else {
    // Stop real-time data processing
    if (window.chartManager) {
      window.chartManager.stopRealTimeUpdates()
    }
  }
}

// Export for global access
window.bluetoothManager = bluetoothManager
