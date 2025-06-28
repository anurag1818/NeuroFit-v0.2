// Global variables declaration
let supabaseClient = null;
let currentUser = null;
let currentSession = null;
let isInitialized = false;

// Initialize Supabase client
supabaseClient = window.supabase.createClient(
    "https://wbkmlhkjmlouchzkbaqr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6India21saGtqbWxvdWNoemtiYXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTYwNDAsImV4cCI6MjA2NTQ5MjA0MH0.An7kS7OUIeD1O5FMcaHp0HPt_A9Ix4o5CA91jF0yBYY"
);

// Helper function to ensure client is initialized
function ensureInitialized() {
    if (!supabaseClient) {
        throw new Error('Supabase client is not initialized');
    }
}

// Authentication functions
async function signUp(email, password, fullName) {
    ensureInitialized();
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabaseClient.from("users").insert([
        {
          id: data.user.id,
          email: email,
          full_name: fullName,
        },
      ])

      if (profileError) console.error("Profile creation error:", profileError)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Sign up error:", error)
    return { success: false, error: error.message }
  }
}

async function signIn(email, password) {
  try {
    ensureInitialized();
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) throw error

    currentUser = data.user
    return { success: true, data }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: error.message }
  }
}

async function signOut() {
  try {
    ensureInitialized();
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error

    currentUser = null
    currentSession = null
    return { success: true }
  } catch (error) {
    console.error("Sign out error:", error)
    return { success: false, error: error.message }
  }
}

// Database functions
async function createDeviceSession(deviceMac) {
  if (!currentUser) return null
  ensureInitialized();

  try {
    const { data, error } = await supabaseClient
      .from("device_sessions")
      .insert([
        {
          user_id: currentUser.id,
          device_mac: deviceMac,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) throw error

    currentSession = data
    return data
  } catch (error) {
    console.error("Session creation error:", error)
    return null
  }
}

async function endDeviceSession(sessionId) {
  try {
    const { error } = await supabaseClient
      .from("device_sessions")
      .update({
        session_end: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", sessionId)

    if (error) throw error

    currentSession = null
    return true
  } catch (error) {
    console.error("Session end error:", error)
    return false
  }
}

async function updateDeviceSession(sessionId, data) {
  if (!currentUser) return false
  ensureInitialized();

  try {
    const { error } = await supabaseClient
      .from("device_sessions")
      .update(data)
      .eq("id", sessionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Session update error:", error)
    return false
  }
}

async function insertEEGData(sessionId, eegData) {
  if (!currentUser || !sessionId) return false
  ensureInitialized();

  try {
    const { error } = await supabaseClient.from("eeg_data").insert([
      {
        user_id: currentUser.id,
        session_id: sessionId,
        alpha_power: eegData.alpha,
        beta_power: eegData.beta,
        theta_power: eegData.theta,
        delta_power: eegData.delta,
        gamma_power: eegData.gamma,
        attention_level: eegData.attention,
        meditation_level: eegData.meditation,
        raw_signal: eegData.raw || {},
      },
    ])

    if (error) throw error
    return true
  } catch (error) {
    console.error("EEG data insertion error:", error)
    return false
  }
}

async function insertVitalSigns(sessionId, vitalData) {
  if (!currentUser || !sessionId) return false
  ensureInitialized();

  try {
    const { error } = await supabaseClient.from("vital_signs").insert([
      {
        user_id: currentUser.id,
        session_id: sessionId,
        heart_rate: vitalData.heartRate,
        spo2: vitalData.spo2,
        hrv_rmssd: vitalData.hrvRMSSD,
        hrv_sdnn: vitalData.hrvSDNN,
        stress_index: vitalData.stressIndex,
        raw_ppg: vitalData.raw || {},
      },
    ])

    if (error) throw error
    return true
  } catch (error) {
    console.error("Vital signs insertion error:", error)
    return false
  }
}

async function insertMoodPrediction(sessionId, moodData) {
  if (!currentUser || !sessionId) return false
  ensureInitialized();

  try {
    const { error } = await supabaseClient.from("mood_predictions").insert([
      {
        user_id: currentUser.id,
        session_id: sessionId,
        predicted_mood: moodData.mood,
        confidence: moodData.confidence,
        stress_level: moodData.stressLevel,
        focus_level: moodData.focusLevel,
        relaxation_level: moodData.relaxationLevel,
        features: moodData.features || {},
      },
    ])

    if (error) throw error
    return true
  } catch (error) {
    console.error("Mood prediction insertion error:", error)
    return false
  }
}

async function insertEmergencyAlert(alert) {
  if (!currentUser) return false
  ensureInitialized();

  try {
    const { error } = await supabaseClient.from("emergency_alerts").insert([
      {
        user_id: currentUser.id,
        alert_type: alert.type,
        severity: alert.severity,
        location_lat: alert.latitude,
        location_lng: alert.longitude,
        vital_signs: alert.vitalSigns || {},
        sent_successfully: alert.sent || false,
      },
    ])

    if (error) throw error
    return true
  } catch (error) {
    console.error("Emergency alert insertion error:", error)
    return false
  }
}

async function updateUserProfile(profileData) {
  if (!currentUser) return false
  ensureInitialized();

  try {
    const { error } = await supabaseClient.from("users").update(profileData).eq("id", currentUser.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error("Profile update error:", error)
    return false
  }
}

// Data retrieval functions
async function getEEGData(sessionId = null, startTime = null, endTime = null) {
  if (!currentUser) return null
  ensureInitialized();

  try {
    let query = supabaseClient
      .from("eeg_data")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("timestamp", { ascending: false })

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    // Add time range filter
    const now = new Date()
    let start, end

    if (startTime) {
      start = new Date(startTime)
    } else {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    if (endTime) {
      end = new Date(endTime)
    } else {
      end = now
    }

    query = query.gte("timestamp", start.toISOString()).lte("timestamp", end.toISOString())

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("EEG data retrieval error:", error)
    return []
  }
}

async function getVitalSigns(sessionId = null, startTime = null, endTime = null) {
  if (!currentUser) return null
  ensureInitialized();

  try {
    let query = supabaseClient
      .from("vital_signs")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("timestamp", { ascending: false })

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    // Add time range filter (same logic as getEEGData)
    const now = new Date()
    let start, end

    if (startTime) {
      start = new Date(startTime)
    } else {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    if (endTime) {
      end = new Date(endTime)
    } else {
      end = now
    }

    query = query.gte("timestamp", start.toISOString()).lte("timestamp", end.toISOString())

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Vital signs retrieval error:", error)
    return []
  }
}

async function getMoodPredictions(sessionId = null, startTime = null, endTime = null) {
  if (!currentUser) return null
  ensureInitialized();

  try {
    let query = supabaseClient
      .from("mood_predictions")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("timestamp", { ascending: false })

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    // Add time range filter
    const now = new Date()
    let start, end

    if (startTime) {
      start = new Date(startTime)
    } else {
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    if (endTime) {
      end = new Date(endTime)
    } else {
      end = now
    }

    query = query.gte("timestamp", start.toISOString()).lte("timestamp", end.toISOString())

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Mood predictions retrieval error:", error)
    return []
  }
}

async function getDeviceSessions() {
  if (!currentUser) return null
  ensureInitialized();

  try {
    let query = supabaseClient
      .from("device_sessions")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("session_start", { ascending: false })

    // Add time range filter
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
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    query = query.gte("session_start", startTime.toISOString())

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Device sessions retrieval error:", error)
    return []
  }
}

// Set up auth state listener once the client is ready
if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            document.dispatchEvent(new CustomEvent('userSignedIn', { detail: session.user }));
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            document.dispatchEvent(new CustomEvent('userSignedOut'));
        }
    });
}

// Export the initialized client and helper functions
window.supabase = {
    client: supabaseClient,
    signUp,
    signIn,
    signOut,
    createDeviceSession,
    updateDeviceSession,
    insertEEGData,
    insertVitalSigns,
    insertMoodPrediction,
    insertEmergencyAlert,
    updateUserProfile,
    getDeviceSessions,
    getEEGData,
    getVitalSigns,
    getMoodPredictions
};
