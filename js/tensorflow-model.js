// // TensorFlow Lite Model for Mood Prediction
// const tf = require("@tensorflow/tfjs") // Declare the tf variable

class TensorFlowModel {
  constructor() {
    this.model = null
    this.isModelLoaded = false
    this.modelUrl = "models/mood_classifier.json" // You'll need to create this
    this.predictionHistory = []
    this.maxHistoryLength = 100
    this.trainingData = []
    this.isTraining = false

    // Feature normalization parameters
    this.featureStats = {
      alpha: { min: 0, max: 1, mean: 0.3, std: 0.15 },
      beta: { min: 0, max: 1, mean: 0.25, std: 0.12 },
      theta: { min: 0, max: 1, mean: 0.2, std: 0.1 },
      delta: { min: 0, max: 1, mean: 0.15, std: 0.08 },
      gamma: { min: 0, max: 1, mean: 0.1, std: 0.05 },
      heartRate: { min: 40, max: 180, mean: 75, std: 15 },
      spo2: { min: 85, max: 100, mean: 98, std: 2 },
      stressIndex: { min: 0, max: 100, mean: 30, std: 20 },
    }

    // Mood classification labels
    this.moodLabels = ["Calm", "Focused", "Stressed", "Anxious", "Excited", "Tired"]
    this.numClasses = this.moodLabels.length

    // Model architecture parameters
    this.modelConfig = {
      inputShape: [8], // 5 EEG bands + 3 vital signs
      hiddenLayers: [32, 16, 8],
      outputShape: this.numClasses,
      learningRate: 0.001,
      batchSize: 32,
      epochs: 50,
    }

    this.loadModel()
  }

  async loadModel() {
    try {
      console.log("Loading TensorFlow model...")

      // Try to load pre-trained model first
      try {
        this.model = await tf.loadLayersModel(this.modelUrl)
        console.log("Pre-trained model loaded successfully")
      } catch (error) {
        console.log("No pre-trained model found, creating new model...")
        this.model = await this.createModel()

        // Generate some synthetic training data for demonstration
        await this.generateSyntheticTrainingData()

        // Train the model with synthetic data
        await this.trainModel()
      }

      this.isModelLoaded = true
      console.log("TensorFlow model ready")

      // Warm up the model with a dummy prediction
      await this.warmUpModel()
    } catch (error) {
      console.error("Failed to load TensorFlow model:", error)
      this.isModelLoaded = false
    }
  }

  async createModel() {
    console.log("Creating new neural network model...")

    const model = tf.sequential()

    // Input layer
    model.add(
      tf.layers.dense({
        inputShape: this.modelConfig.inputShape,
        units: this.modelConfig.hiddenLayers[0],
        activation: "relu",
        kernelInitializer: "heNormal",
      }),
    )

    // Add dropout for regularization
    model.add(tf.layers.dropout({ rate: 0.3 }))

    // Hidden layers
    for (let i = 1; i < this.modelConfig.hiddenLayers.length; i++) {
      model.add(
        tf.layers.dense({
          units: this.modelConfig.hiddenLayers[i],
          activation: "relu",
          kernelInitializer: "heNormal",
        }),
      )
      model.add(tf.layers.dropout({ rate: 0.2 }))
    }

    // Output layer
    model.add(
      tf.layers.dense({
        units: this.modelConfig.outputShape,
        activation: "softmax",
      }),
    )

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(this.modelConfig.learningRate),
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    })

    console.log("Model architecture:")
    model.summary()

    return model
  }

  async generateSyntheticTrainingData() {
    console.log("Generating synthetic training data...")

    const numSamples = 1000
    this.trainingData = []

    for (let i = 0; i < numSamples; i++) {
      const sample = this.generateSyntheticSample()
      this.trainingData.push(sample)
    }

    console.log(`Generated ${numSamples} synthetic training samples`)
  }

  generateSyntheticSample() {
    // Generate realistic biometric data patterns for different moods
    const moodIndex = Math.floor(Math.random() * this.numClasses)
    const mood = this.moodLabels[moodIndex]

    let features

    switch (mood) {
      case "Calm":
        features = {
          alpha: this.randomNormal(0.6, 0.1), // High alpha for relaxation
          beta: this.randomNormal(0.2, 0.05), // Low beta
          theta: this.randomNormal(0.3, 0.08), // Moderate theta
          delta: this.randomNormal(0.2, 0.05), // Low delta (awake)
          gamma: this.randomNormal(0.1, 0.03), // Low gamma
          heartRate: this.randomNormal(65, 8), // Lower heart rate
          spo2: this.randomNormal(98.5, 1), // Normal SpO2
          stressIndex: this.randomNormal(20, 10), // Low stress
        }
        break

      case "Focused":
        features = {
          alpha: this.randomNormal(0.4, 0.1), // Moderate alpha
          beta: this.randomNormal(0.5, 0.1), // High beta for focus
          theta: this.randomNormal(0.2, 0.05), // Low theta
          delta: this.randomNormal(0.1, 0.03), // Very low delta
          gamma: this.randomNormal(0.3, 0.08), // Higher gamma for concentration
          heartRate: this.randomNormal(75, 10), // Normal heart rate
          spo2: this.randomNormal(98, 1.5), // Normal SpO2
          stressIndex: this.randomNormal(35, 15), // Moderate stress
        }
        break

      case "Stressed":
        features = {
          alpha: this.randomNormal(0.2, 0.08), // Low alpha
          beta: this.randomNormal(0.7, 0.1), // Very high beta
          theta: this.randomNormal(0.15, 0.05), // Low theta
          delta: this.randomNormal(0.1, 0.03), // Low delta
          gamma: this.randomNormal(0.4, 0.1), // High gamma
          heartRate: this.randomNormal(90, 15), // Elevated heart rate
          spo2: this.randomNormal(97, 2), // Slightly lower SpO2
          stressIndex: this.randomNormal(75, 15), // High stress
        }
        break

      case "Anxious":
        features = {
          alpha: this.randomNormal(0.15, 0.05), // Very low alpha
          beta: this.randomNormal(0.8, 0.1), // Very high beta
          theta: this.randomNormal(0.25, 0.08), // Moderate theta
          delta: this.randomNormal(0.1, 0.03), // Low delta
          gamma: this.randomNormal(0.5, 0.12), // High gamma
          heartRate: this.randomNormal(95, 20), // High heart rate
          spo2: this.randomNormal(96.5, 2.5), // Lower SpO2
          stressIndex: this.randomNormal(85, 12), // Very high stress
        }
        break

      case "Excited":
        features = {
          alpha: this.randomNormal(0.3, 0.1), // Moderate alpha
          beta: this.randomNormal(0.6, 0.12), // High beta
          theta: this.randomNormal(0.2, 0.06), // Low theta
          delta: this.randomNormal(0.08, 0.02), // Very low delta
          gamma: this.randomNormal(0.4, 0.1), // High gamma
          heartRate: this.randomNormal(85, 12), // Elevated heart rate
          spo2: this.randomNormal(98, 1.5), // Normal SpO2
          stressIndex: this.randomNormal(45, 20), // Moderate stress
        }
        break

      case "Tired":
        features = {
          alpha: this.randomNormal(0.5, 0.12), // High alpha
          beta: this.randomNormal(0.15, 0.05), // Very low beta
          theta: this.randomNormal(0.6, 0.15), // High theta
          delta: this.randomNormal(0.4, 0.1), // High delta
          gamma: this.randomNormal(0.05, 0.02), // Very low gamma
          heartRate: this.randomNormal(60, 8), // Low heart rate
          spo2: this.randomNormal(97.5, 2), // Slightly lower SpO2
          stressIndex: this.randomNormal(25, 12), // Low stress
        }
        break
    }

    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features)

    // Create one-hot encoded label
    const label = new Array(this.numClasses).fill(0)
    label[moodIndex] = 1

    return {
      features: normalizedFeatures,
      label: label,
      mood: mood,
    }
  }

  randomNormal(mean, std) {
    // Box-Muller transform for normal distribution
    let u = 0,
      v = 0
    while (u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    return z * std + mean
  }

  normalizeFeatures(features) {
    const normalized = []

    for (const [key, value] of Object.entries(features)) {
      if (this.featureStats[key]) {
        const stats = this.featureStats[key]
        // Z-score normalization
        const normalizedValue = (value - stats.mean) / stats.std
        normalized.push(Math.max(-3, Math.min(3, normalizedValue))) // Clip to [-3, 3]
      }
    }

    return normalized
  }

  async trainModel() {
    if (!this.model || this.trainingData.length === 0) {
      console.error("Model or training data not available")
      return
    }

    console.log("Starting model training...")
    this.isTraining = true

    try {
      // Prepare training data
      const features = this.trainingData.map((sample) => sample.features)
      const labels = this.trainingData.map((sample) => sample.label)

      const xs = tf.tensor2d(features)
      const ys = tf.tensor2d(labels)

      // Split data into training and validation sets
      const splitIndex = Math.floor(features.length * 0.8)

      const xTrain = xs.slice([0, 0], [splitIndex, -1])
      const yTrain = ys.slice([0, 0], [splitIndex, -1])
      const xVal = xs.slice([splitIndex, 0], [-1, -1])
      const yVal = ys.slice([splitIndex, 0], [-1, -1])

      // Training callbacks
      const callbacks = {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_acc = ${logs.val_acc.toFixed(4)}`,
          )
        },
        onTrainEnd: () => {
          console.log("Training completed!")
          this.isTraining = false
        },
      }

      // Train the model
      const history = await this.model.fit(xTrain, yTrain, {
        epochs: this.modelConfig.epochs,
        batchSize: this.modelConfig.batchSize,
        validationData: [xVal, yVal],
        shuffle: true,
        callbacks: callbacks,
      })

      // Clean up tensors
      xs.dispose()
      ys.dispose()
      xTrain.dispose()
      yTrain.dispose()
      xVal.dispose()
      yVal.dispose()

      // Save the trained model
      await this.saveModel()

      console.log("Model training completed successfully")
    } catch (error) {
      console.error("Training failed:", error)
      this.isTraining = false
    }
  }

  async saveModel() {
    try {
      await this.model.save("localstorage://neurofit-mood-model")
      console.log("Model saved to local storage")
    } catch (error) {
      console.error("Failed to save model:", error)
    }
  }

  async loadSavedModel() {
    try {
      this.model = await tf.loadLayersModel("localstorage://neurofit-mood-model")
      console.log("Saved model loaded from local storage")
      return true
    } catch (error) {
      console.log("No saved model found in local storage")
      return false
    }
  }

  async warmUpModel() {
    if (!this.model) return

    // Create dummy input to warm up the model
    const dummyInput = tf.zeros([1, 8])
    const prediction = this.model.predict(dummyInput)
    prediction.dispose()
    dummyInput.dispose()

    console.log("Model warmed up successfully")
  }

  async predictMood(eegData, vitalData = null) {
    if (!this.isModelLoaded || !this.model) {
      return this.ruleBasedPrediction(eegData, vitalData)
    }

    try {
      // Prepare input features
      const features = this.prepareFeatures(eegData, vitalData)

      // Make prediction
      const prediction = this.model.predict(features)
      const probabilities = await prediction.data()

      // Find the class with highest probability
      const maxIndex = probabilities.indexOf(Math.max(...probabilities))
      const confidence = probabilities[maxIndex]
      const predictedMood = this.moodLabels[maxIndex]

      // Calculate additional metrics
      const stressLevel = this.calculateStressLevel(eegData, vitalData)
      const focusLevel = this.calculateFocusLevel(eegData)
      const relaxationLevel = this.calculateRelaxationLevel(eegData)

      const result = {
        mood: predictedMood,
        confidence: confidence,
        probabilities: Array.from(probabilities),
        stressLevel: stressLevel,
        focusLevel: focusLevel,
        relaxationLevel: relaxationLevel,
        features: await features.data(),
        timestamp: new Date(),
      }

      // Store prediction in history
      this.predictionHistory.push(result)
      if (this.predictionHistory.length > this.maxHistoryLength) {
        this.predictionHistory.shift()
      }

      // Update UI
      this.updateMoodDisplay(result)

      // Store in database
      if (window.currentUser) {
        await window.insertMoodPrediction(result)
      }

      // Clean up tensors
      features.dispose()
      prediction.dispose()

      return result
    } catch (error) {
      console.error("Prediction error:", error)
      return this.ruleBasedPrediction(eegData, vitalData)
    }
  }

  prepareFeatures(eegData, vitalData) {
    // Prepare features for model input
    const rawFeatures = {
      alpha: eegData.alpha || 0,
      beta: eegData.beta || 0,
      theta: eegData.theta || 0,
      delta: eegData.delta || 0,
      gamma: eegData.gamma || 0,
      heartRate: vitalData?.heartRate || 75,
      spo2: vitalData?.spo2 || 98,
      stressIndex: vitalData?.stressIndex || 30,
    }

    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(rawFeatures)

    return tf.tensor2d([normalizedFeatures])
  }

  ruleBasedPrediction(eegData, vitalData) {
    // Fallback rule-based mood prediction
    let mood = "Calm"
    let confidence = 0.7

    const stressLevel = this.calculateStressLevel(eegData, vitalData)
    const focusLevel = this.calculateFocusLevel(eegData)
    const relaxationLevel = this.calculateRelaxationLevel(eegData)

    // Rule-based classification
    if (stressLevel > 80) {
      mood = "Stressed"
      confidence = 0.8
    } else if (stressLevel > 70 && eegData.beta > 0.7) {
      mood = "Anxious"
      confidence = 0.75
    } else if (focusLevel > 70 && eegData.beta > 0.5) {
      mood = "Focused"
      confidence = 0.8
    } else if (relaxationLevel > 70) {
      mood = "Calm"
      confidence = 0.85
    } else if (eegData.theta > 0.5 && eegData.delta > 0.3) {
      mood = "Tired"
      confidence = 0.7
    } else if (eegData.beta > 0.6 && vitalData?.heartRate > 85) {
      mood = "Excited"
      confidence = 0.65
    }

    const result = {
      mood: mood,
      confidence: confidence,
      probabilities: this.createRuleBasedProbabilities(mood, confidence),
      stressLevel: stressLevel,
      focusLevel: focusLevel,
      relaxationLevel: relaxationLevel,
      features: Object.values(eegData),
      timestamp: new Date(),
      method: "rule-based",
    }

    this.updateMoodDisplay(result)

    if (window.currentUser) {
      window.insertMoodPrediction(result)
    }

    return result
  }

  createRuleBasedProbabilities(predictedMood, confidence) {
    const probabilities = new Array(this.numClasses).fill((1 - confidence) / (this.numClasses - 1))
    const moodIndex = this.moodLabels.indexOf(predictedMood)
    if (moodIndex !== -1) {
      probabilities[moodIndex] = confidence
    }
    return probabilities
  }

  calculateStressLevel(eegData, vitalData) {
    let stressScore = 0

    // EEG-based stress indicators
    if (eegData.beta > 0.5) {
      stressScore += (eegData.beta - 0.5) * 100
    }

    if (eegData.alpha < 0.3) {
      stressScore += (0.3 - eegData.alpha) * 50
    }

    if (eegData.gamma > 0.3) {
      stressScore += (eegData.gamma - 0.3) * 80
    }

    // Vital signs stress indicators
    if (vitalData) {
      if (vitalData.heartRate > 90) {
        stressScore += (vitalData.heartRate - 90) * 2
      }

      if (vitalData.stressIndex) {
        stressScore += vitalData.stressIndex * 0.5
      }

      if (vitalData.spo2 < 96) {
        stressScore += (96 - vitalData.spo2) * 10
      }
    }

    return Math.min(Math.max(stressScore, 0), 100)
  }

  calculateFocusLevel(eegData) {
    let focusScore = 0

    // Beta waves indicate focused attention
    if (eegData.beta > 0.3 && eegData.beta < 0.7) {
      focusScore += 60
    }

    // Low theta during waking hours indicates focus
    if (eegData.theta < 0.3) {
      focusScore += 30
    }

    // Gamma waves associated with cognitive processing
    if (eegData.gamma > 0.2 && eegData.gamma < 0.4) {
      focusScore += 20
    }

    // Use attention level if available
    if (eegData.attention) {
      focusScore = (focusScore + eegData.attention) / 2
    }

    return Math.min(Math.max(focusScore, 0), 100)
  }

  calculateRelaxationLevel(eegData) {
    let relaxationScore = 0

    // Alpha waves indicate relaxation
    if (eegData.alpha > 0.4) {
      relaxationScore += eegData.alpha * 80
    }

    // Low beta indicates less mental activity
    if (eegData.beta < 0.4) {
      relaxationScore += (0.4 - eegData.beta) * 50
    }

    // Low gamma indicates relaxed state
    if (eegData.gamma < 0.2) {
      relaxationScore += (0.2 - eegData.gamma) * 40
    }

    // Use meditation level if available
    if (eegData.meditation) {
      relaxationScore = (relaxationScore + eegData.meditation) / 2
    }

    return Math.min(Math.max(relaxationScore, 0), 100)
  }

  updateMoodDisplay(result) {
    // Update mood icon
    const moodIcon = document.getElementById("moodIcon")
    const currentMood = document.getElementById("currentMood")
    const moodConfidence = document.getElementById("moodConfidence")

    if (moodIcon && currentMood && moodConfidence) {
      // Set mood icon based on predicted mood
      const moodIcons = {
        Calm: "fas fa-smile",
        Focused: "fas fa-eye",
        Stressed: "fas fa-frown",
        Anxious: "fas fa-dizzy",
        Excited: "fas fa-grin-stars",
        Tired: "fas fa-tired",
      }

      const moodColors = {
        Calm: "#10b981",
        Focused: "#3b82f6",
        Stressed: "#f59e0b",
        Anxious: "#ef4444",
        Excited: "#8b5cf6",
        Tired: "#6b7280",
      }

      moodIcon.className = moodIcons[result.mood] || "fas fa-meh"
      moodIcon.style.color = moodColors[result.mood] || "#6b7280"

      currentMood.textContent = result.mood
      currentMood.style.color = moodColors[result.mood] || "#6b7280"

      moodConfidence.textContent = `Confidence: ${(result.confidence * 100).toFixed(1)}%`
    }

    // Update level bars
    const focusLevel = document.getElementById("focusLevel")
    const relaxationLevel = document.getElementById("relaxationLevel")
    const attentionLevel = document.getElementById("attentionLevel")

    if (focusLevel) {
      focusLevel.style.width = `${result.focusLevel}%`
    }

    if (relaxationLevel) {
      relaxationLevel.style.width = `${result.relaxationLevel}%`
    }

    if (attentionLevel) {
      // Use focus level as attention level if not provided separately
      attentionLevel.style.width = `${result.focusLevel}%`
    }
  }

  // Advanced analytics methods
  getMoodTrends(timeRange = "24h") {
    const now = new Date()
    let startTime

    switch (timeRange) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const recentPredictions = this.predictionHistory.filter((prediction) => prediction.timestamp >= startTime)

    // Calculate mood distribution
    const moodCounts = {}
    this.moodLabels.forEach((mood) => (moodCounts[mood] = 0))

    recentPredictions.forEach((prediction) => {
      moodCounts[prediction.mood]++
    })

    // Calculate average metrics
    const avgStress = recentPredictions.reduce((sum, p) => sum + p.stressLevel, 0) / recentPredictions.length || 0
    const avgFocus = recentPredictions.reduce((sum, p) => sum + p.focusLevel, 0) / recentPredictions.length || 0
    const avgRelaxation =
      recentPredictions.reduce((sum, p) => sum + p.relaxationLevel, 0) / recentPredictions.length || 0

    return {
      timeRange,
      totalPredictions: recentPredictions.length,
      moodDistribution: moodCounts,
      averageMetrics: {
        stress: avgStress,
        focus: avgFocus,
        relaxation: avgRelaxation,
      },
      predictions: recentPredictions,
    }
  }

  getPersonalizedRecommendations(currentMood, metrics) {
    const recommendations = []

    switch (currentMood) {
      case "Stressed":
        recommendations.push({
          type: "meditation",
          title: "Try Deep Breathing",
          description: "A 10-minute breathing exercise can help reduce stress levels",
          action: "start_meditation",
          priority: "high",
        })

        if (metrics.stressLevel > 80) {
          recommendations.push({
            type: "break",
            title: "Take a Break",
            description: "Consider taking a short walk or stepping away from stressful activities",
            priority: "high",
          })
        }
        break

      case "Anxious":
        recommendations.push({
          type: "meditation",
          title: "Calming Meditation",
          description: "Try our anxiety-relief meditation session",
          action: "start_meditation",
          priority: "high",
        })

        recommendations.push({
          type: "breathing",
          title: "4-7-8 Breathing",
          description: "This breathing technique can help calm anxiety",
          action: "breathing_exercise",
          priority: "medium",
        })
        break

      case "Tired":
        recommendations.push({
          type: "energy",
          title: "Energy Boost",
          description: "Try some light exercise or a short walk",
          priority: "medium",
        })

        if (new Date().getHours() > 20) {
          recommendations.push({
            type: "sleep",
            title: "Sleep Preparation",
            description: "Consider starting your bedtime routine",
            action: "start_meditation",
            priority: "high",
          })
        }
        break

      case "Focused":
        recommendations.push({
          type: "productivity",
          title: "Maintain Focus",
          description: "Great time for deep work or challenging tasks",
          priority: "low",
        })
        break

      case "Calm":
        recommendations.push({
          type: "maintenance",
          title: "Maintain Balance",
          description: "You're in a great state - keep it up!",
          priority: "low",
        })
        break
    }

    return recommendations
  }

  // Continuous learning methods
  addTrainingExample(eegData, vitalData, userFeedback) {
    // Allow users to provide feedback to improve the model
    const features = this.prepareFeatures(eegData, vitalData)
    const moodIndex = this.moodLabels.indexOf(userFeedback.mood)

    if (moodIndex !== -1) {
      const label = new Array(this.numClasses).fill(0)
      label[moodIndex] = 1

      this.trainingData.push({
        features: features.arraySync()[0],
        label: label,
        mood: userFeedback.mood,
        timestamp: new Date(),
        source: "user_feedback",
      })

      // Retrain model periodically
      if (this.trainingData.length % 50 === 0) {
        this.retrainModel()
      }
    }

    features.dispose()
  }

  async retrainModel() {
    if (this.isTraining || this.trainingData.length < 100) return

    console.log("Retraining model with new data...")
    await this.trainModel()
  }

  // Export/Import methods
  async exportModel() {
    if (!this.model) return null

    try {
      const modelData = await this.model.save(tf.io.withSaveHandler(async (artifacts) => artifacts))
      return {
        model: modelData,
        featureStats: this.featureStats,
        moodLabels: this.moodLabels,
        modelConfig: this.modelConfig,
        trainingDataSize: this.trainingData.length,
        exportDate: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Failed to export model:", error)
      return null
    }
  }

  async importModel(modelData) {
    try {
      this.model = await tf.loadLayersModel(tf.io.fromMemory(modelData.model))
      this.featureStats = modelData.featureStats
      this.moodLabels = modelData.moodLabels
      this.modelConfig = modelData.modelConfig
      this.isModelLoaded = true

      console.log("Model imported successfully")
      return true
    } catch (error) {
      console.error("Failed to import model:", error)
      return false
    }
  }

  // Public API methods
  isReady() {
    return this.isModelLoaded && this.model !== null
  }

  getModelInfo() {
    return {
      isLoaded: this.isModelLoaded,
      isTraining: this.isTraining,
      moodLabels: this.moodLabels,
      predictionCount: this.predictionHistory.length,
      trainingDataSize: this.trainingData.length,
      modelConfig: this.modelConfig,
    }
  }

  getPredictionHistory() {
    return this.predictionHistory
  }

  clearHistory() {
    this.predictionHistory = []
  }

  // Cleanup method
  dispose() {
    if (this.model) {
      this.model.dispose()
    }

    // Clean up any remaining tensors
    tf.disposeVariables()

    console.log("TensorFlow model disposed")
  }
}

// Initialize TensorFlow Model
const tensorflowModel = new TensorFlowModel()

// Export for global access
window.tensorflowModel = tensorflowModel

// Add model status indicator to UI
document.addEventListener("DOMContentLoaded", () => {
  const statusIndicator = document.createElement("div")
  statusIndicator.id = "modelStatus"
  statusIndicator.className = "model-status"
  statusIndicator.innerHTML = `
        <div class="status-content">
            <i class="fas fa-brain"></i>
            <span id="modelStatusText">Loading AI Model...</span>
        </div>
    `

  // Add to page header or appropriate location
  const pageHeader = document.querySelector(".page-header")
  if (pageHeader) {
    pageHeader.appendChild(statusIndicator)
  }

  // Update status when model is ready
  const checkModelStatus = () => {
    const statusText = document.getElementById("modelStatusText")
    if (statusText) {
      if (tensorflowModel.isReady()) {
        statusText.textContent = "AI Model Ready"
        statusIndicator.classList.add("ready")
      } else if (tensorflowModel.isTraining) {
        statusText.textContent = "Training AI Model..."
        statusIndicator.classList.add("training")
      } else {
        statusText.textContent = "Loading AI Model..."
      }
    }
  }

  // Check status periodically
  const statusInterval = setInterval(() => {
    checkModelStatus()
    if (tensorflowModel.isReady()) {
      clearInterval(statusInterval)
    }
  }, 1000)
})

// Add CSS for model status indicator
const modelStatusStyles = `
    .model-status {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        z-index: 1000;
        transition: all 0.3s ease;
    }
    
    .model-status.ready {
        background: rgba(16, 185, 129, 0.9);
    }
    
    .model-status.training {
        background: rgba(245, 158, 11, 0.9);
    }
    
    .status-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .status-content i {
        font-size: 1rem;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .model-status.training .status-content i {
        animation: pulse 1.5s infinite;
    }
`

// Inject model status styles
const modelStyleSheet = document.createElement("style")
modelStyleSheet.textContent = modelStatusStyles
document.head.appendChild(modelStyleSheet)

console.log("TensorFlow Model Manager loaded successfully!")
