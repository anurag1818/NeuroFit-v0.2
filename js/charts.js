import { Chart } from "@/components/ui/chart"
// Chart Management System
class ChartManager {
  constructor() {
    this.brainwaveChart = null
    this.vitalChart = null
    this.meditationChart = null
    this.isRealTimeActive = false
    this.dataBuffer = {
      brainwave: [],
      vital: [],
      meditation: [],
    }
    this.maxDataPoints = 50

    this.initializeCharts()
  }

  initializeCharts() {
    this.createBrainwaveChart()
    this.createVitalChart()
    this.createMeditationChart()
  }

  createBrainwaveChart() {
    const ctx = document.getElementById("brainwaveChart")
    if (!ctx) return

    this.brainwaveChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Alpha",
            data: [],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: false,
          },
          {
            label: "Beta",
            data: [],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: false,
          },
          {
            label: "Theta",
            data: [],
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            tension: 0.4,
            fill: false,
          },
          {
            label: "Delta",
            data: [],
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Power (μV²)",
            },
            min: 0,
            max: 1,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          title: {
            display: true,
            text: "Real-time Brainwave Activity",
          },
        },
        animation: {
          duration: 0,
        },
      },
    })
  }

  createVitalChart() {
    const ctx = document.getElementById("vitalChart")
    if (!ctx) return

    this.vitalChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Heart Rate (BPM)",
            data: [],
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            yAxisID: "y",
          },
          {
            label: "SpO2 (%)",
            data: [],
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.1)",
            tension: 0.4,
            yAxisID: "y1",
          },
          {
            label: "Stress Index",
            data: [],
            borderColor: "#f97316",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
            tension: 0.4,
            yAxisID: "y2",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Heart Rate (BPM)",
            },
            min: 40,
            max: 140,
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "SpO2 (%)",
            },
            min: 85,
            max: 100,
            grid: {
              drawOnChartArea: false,
            },
          },
          y2: {
            type: "linear",
            display: false,
            min: 0,
            max: 100,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          title: {
            display: true,
            text: "Real-time Vital Signs",
          },
        },
        animation: {
          duration: 0,
        },
      },
    })
  }

  createMeditationChart() {
    const ctx = document.getElementById("meditationChart")
    if (!ctx) return

    this.meditationChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Relaxation Level",
            data: [],
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Heart Rate Variability",
            data: [],
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Time (minutes)",
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Level (%)",
            },
            min: 0,
            max: 100,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          title: {
            display: true,
            text: "Meditation Progress",
          },
        },
        animation: {
          duration: 0,
        },
      },
    })
  }

  updateBrainwaveChart(data) {
    if (!this.brainwaveChart) return

    const now = new Date()
    const timeLabel = now.toLocaleTimeString()

    // Add new data point
    this.brainwaveChart.data.labels.push(timeLabel)
    this.brainwaveChart.data.datasets[0].data.push(data.alpha)
    this.brainwaveChart.data.datasets[1].data.push(data.beta)
    this.brainwaveChart.data.datasets[2].data.push(data.theta)
    this.brainwaveChart.data.datasets[3].data.push(data.delta)

    // Keep only last N data points
    if (this.brainwaveChart.data.labels.length > this.maxDataPoints) {
      this.brainwaveChart.data.labels.shift()
      this.brainwaveChart.data.datasets.forEach((dataset) => {
        dataset.data.shift()
      })
    }

    this.brainwaveChart.update("none")
  }

  updateVitalChart(data) {
    if (!this.vitalChart) return

    const now = new Date()
    const timeLabel = now.toLocaleTimeString()

    // Add new data point
    this.vitalChart.data.labels.push(timeLabel)
    this.vitalChart.data.datasets[0].data.push(data.heartRate)
    this.vitalChart.data.datasets[1].data.push(data.spo2)
    this.vitalChart.data.datasets[2].data.push(data.stressIndex)

    // Keep only last N data points
    if (this.vitalChart.data.labels.length > this.maxDataPoints) {
      this.vitalChart.data.labels.shift()
      this.vitalChart.data.datasets.forEach((dataset) => {
        dataset.data.shift()
      })
    }

    this.vitalChart.update("none")
  }

  updateMeditationChart(relaxationLevel, hrvLevel) {
    if (!this.meditationChart) return

    const now = new Date()
    const timeLabel = now.toLocaleTimeString()

    // Add new data point
    this.meditationChart.data.labels.push(timeLabel)
    this.meditationChart.data.datasets[0].data.push(relaxationLevel)
    this.meditationChart.data.datasets[1].data.push(hrvLevel)

    // Keep only last N data points
    if (this.meditationChart.data.labels.length > this.maxDataPoints) {
      this.meditationChart.data.labels.shift()
      this.meditationChart.data.datasets.forEach((dataset) => {
        dataset.data.shift()
      })
    }

    this.meditationChart.update("none")
  }

  startRealTimeUpdates() {
    this.isRealTimeActive = true
    console.log("Real-time chart updates started")
  }

  stopRealTimeUpdates() {
    this.isRealTimeActive = false
    console.log("Real-time chart updates stopped")
  }

  clearAllCharts() {
    if (this.brainwaveChart) {
      this.brainwaveChart.data.labels = []
      this.brainwaveChart.data.datasets.forEach((dataset) => {
        dataset.data = []
      })
      this.brainwaveChart.update()
    }

    if (this.vitalChart) {
      this.vitalChart.data.labels = []
      this.vitalChart.data.datasets.forEach((dataset) => {
        dataset.data = []
      })
      this.vitalChart.update()
    }

    if (this.meditationChart) {
      this.meditationChart.data.labels = []
      this.meditationChart.data.datasets.forEach((dataset) => {
        dataset.data = []
      })
      this.meditationChart.update()
    }
  }

  exportChartData(chartType) {
    let chart
    let filename

    switch (chartType) {
      case "brainwave":
        chart = this.brainwaveChart
        filename = "brainwave_data.csv"
        break
      case "vital":
        chart = this.vitalChart
        filename = "vital_signs_data.csv"
        break
      case "meditation":
        chart = this.meditationChart
        filename = "meditation_data.csv"
        break
      default:
        return
    }

    if (!chart) return

    // Convert chart data to CSV
    let csv = "Time,"
    csv += chart.data.datasets.map((dataset) => dataset.label).join(",") + "\n"

    for (let i = 0; i < chart.data.labels.length; i++) {
      csv += chart.data.labels[i] + ","
      csv += chart.data.datasets.map((dataset) => dataset.data[i] || "").join(",") + "\n"
    }

    // Download CSV file
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Load historical data into charts
  async loadHistoricalData(timeRange = "24h") {
    try {
      // Load EEG data
      const eegData = await window.getEEGData(timeRange)
      if (eegData.length > 0) {
        this.populateBrainwaveChart(eegData)
      }

      // Load vital signs data
      const vitalData = await window.getVitalSigns(timeRange)
      if (vitalData.length > 0) {
        this.populateVitalChart(vitalData)
      }
    } catch (error) {
      console.error("Error loading historical data:", error)
    }
  }

  populateBrainwaveChart(data) {
    if (!this.brainwaveChart) return

    this.brainwaveChart.data.labels = []
    this.brainwaveChart.data.datasets.forEach((dataset) => {
      dataset.data = []
    })

    data.slice(-this.maxDataPoints).forEach((item) => {
      const time = new Date(item.timestamp).toLocaleTimeString()
      this.brainwaveChart.data.labels.push(time)
      this.brainwaveChart.data.datasets[0].data.push(item.alpha_power)
      this.brainwaveChart.data.datasets[1].data.push(item.beta_power)
      this.brainwaveChart.data.datasets[2].data.push(item.theta_power)
      this.brainwaveChart.data.datasets[3].data.push(item.delta_power)
    })

    this.brainwaveChart.update()
  }

  populateVitalChart(data) {
    if (!this.vitalChart) return

    this.vitalChart.data.labels = []
    this.vitalChart.data.datasets.forEach((dataset) => {
      dataset.data = []
    })

    data.slice(-this.maxDataPoints).forEach((item) => {
      const time = new Date(item.timestamp).toLocaleTimeString()
      this.vitalChart.data.labels.push(time)
      this.vitalChart.data.datasets[0].data.push(item.heart_rate)
      this.vitalChart.data.datasets[1].data.push(item.spo2)
      this.vitalChart.data.datasets[2].data.push(item.stress_index)
    })

    this.vitalChart.update()
  }
}

// Initialize Chart Manager
const chartManager = new ChartManager()

// Export for global access
window.chartManager = chartManager

// Set up chart control event listeners
document.addEventListener("DOMContentLoaded", () => {
  const toggleBrainChart = document.getElementById("toggleBrainChart")
  if (toggleBrainChart) {
    let isPaused = false
    toggleBrainChart.addEventListener("click", () => {
      isPaused = !isPaused
      if (isPaused) {
        chartManager.stopRealTimeUpdates()
        toggleBrainChart.innerHTML = '<i class="fas fa-play"></i>'
      } else {
        chartManager.startRealTimeUpdates()
        toggleBrainChart.innerHTML = '<i class="fas fa-pause"></i>'
      }
    })
  }
})

// Declare getEEGData and getVitalSigns functions for demonstration purposes
window.getEEGData = async (timeRange) => {
  // Simulate fetching EEG data
  return []
}

window.getVitalSigns = async (timeRange) => {
  // Simulate fetching vital signs data
  return []
}
