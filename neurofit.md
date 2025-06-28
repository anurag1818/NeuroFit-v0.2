# 🧠 NeuroFit Band – Overview

A wearable band that uses EEG and heart rate sensors to track stress, focus, and mood, and provides real-time insights with personalized guidance (like meditation, breathing exercises) via a mobile app.

## 🔧 1. Hardware Design

### 📦 Components List

| Component | Purpose | Suggested Model |
|-----------|---------|----------------|
| EEG Sensor | Brainwave data (focus, stress, mood) | Modified AD8232 ECG sensor |
| PPG/HRV Sensor | Heart rate variability + stress index | MAX30102 / MAX86150 |
| Microcontroller (BLE) | Data processing + Bluetooth transfer | ESP32-WROOM / nRF52840 |
| Battery | Power supply | 3.7V Li-Po (500-1000mAh) |
| Charging Circuit | USB charging | TP4056 Module |
| Vibration Motor | Haptic feedback for alerts | Mini coin vibration motor |
| OLED Display (Optional) | Minimal UI on band | SSD1306 0.96" OLED |
| Enclosure/Band Material | Housing all components | Silicone or TPU |

## 🧠 2. Brainwave Metrics (EEG)

| Brainwave | Interpretation | Frequency (Hz) |
|-----------|---------------|----------------|
| Alpha | Relaxed but alert (meditative state) | 8 – 12 Hz |
| Beta | Active thinking, stress | 12 – 30 Hz |
| Theta | Deep relaxation, creativity | 4 – 8 Hz |
| Delta | Deep sleep | 0.5 – 4 Hz |
| Gamma | High-level cognition | 30 – 100 Hz (up to ~120 Hz) |

> 📌 **Mood Detection**: Use AI/ML models on a combination of EEG + HRV patterns to infer stress, calmness, attention, or anxiety.

## 🧪 3. Software Stack

### ⛓ Firmware (ESP32/nRF52840)

- Read EEG & PPG signals
- Filter noise (bandpass filters)
- Compute HRV metrics (RMSSD, SDNN)
- Package + send via BLE to mobile app

> **Language**: C/C++ (ESP-IDF or Arduino), TinyML integration

### 📱 Mobile App (Android/iOS)

#### Features:

- Live biofeedback dashboard (EEG + HRV)
- Mood tracking + historical graphs
- Guided meditation, breathing session triggers
- Personalized suggestions via ML
- Emergency alert if stress is high for too long

#### Tech Stack:

- html-css-js-supabase (cross-platform)
- Bluetooth communication (BLE)
- TensorFlow Lite for on-device inference
- Firebase for optional cloud sync

## 🤖 4. ML Model Design (Mood Prediction)

### Inputs:

- EEG band power ratios (alpha/beta/theta)
- HRV metrics (RMSSD, LF/HF ratio)
- Activity (if accelerometer used)

### Output:

- Mood Classifier (Stress, Calm, Focused, Anxious)

> **Tools**: Scikit-learn, TensorFlow Lite  
> **Dataset**: OpenBCI, PhysioNet datasets, or custom-collected

## 🎨 5. Industrial/Enclosure Design

Form factor: Smart band/wristband style (similar to Mi Band)

### Material:

- Soft silicone outer shell with 3D printed base case

### Design goals:

- Skin contact electrodes for EEG
- Optical window for HRV sensor
- Ventilation and comfort

> Optional: Add a clip-on module or magnetic charging

## 🔋 6. Power Management

- Sleep mode for idle state
- Periodic data transmission
- Optimized BLE power profile
- Battery life target: 2-4 days

## 🛠 7. Development Tools

- PCB Design: KiCad / Eagle
- Prototyping: Breadboard + jumper wires initially
- 3D Design: Fusion 360 / TinkerCAD
- Mobile Testing: Android Studio / Xcode
- BLE Sniffer/Debugger: nRF Connect app

## 🚀 Final Output

### User Experience:

1. Wear the band → Auto start sensing
2. App opens → Shows mood & stress
3. Alerts via vibration or phone
4. Suggests deep breathing/meditation based on state
