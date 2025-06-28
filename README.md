# NeuroFit Band

A smart wearable device that uses EEG and heart rate sensors to track stress, focus, and mood, providing real-time insights with personalized guidance through a web application.

## 🌟 Features

- Real-time biofeedback dashboard showing EEG and HRV data
- Mood tracking with historical graphs
- Guided meditation and breathing sessions
- Personalized suggestions powered by machine learning
- Emergency alerts for prolonged high-stress periods

## 🛠️ Technology Stack

### Web Application

- HTML5
- CSS3
- JavaScript
- Supabase (Backend)
- TensorFlow.js (Machine Learning)
- Web Bluetooth API

### Hardware Components

- EEG Sensor (Modified AD8232 ECG sensor)
- PPG/HRV Sensor (MAX30102 / MAX86150)
- Microcontroller with BLE (ESP32-WROOM / nRF52840)
- 3.7V Li-Po Battery (500-1000mAh)
- TP4056 Charging Circuit
- Vibration Motor
- Optional OLED Display (SSD1306 0.96")

## 📊 Data Metrics

### Brainwave Measurements

| Type  | State | Frequency (Hz) |
|-------|--------|---------------|
| Alpha | Relaxed, meditative | 8-12 Hz |
| Beta  | Active thinking, stress | 12-30 Hz |
| Theta | Deep relaxation | 4-8 Hz |
| Delta | Deep sleep | 0.5-4 Hz |
| Gamma | High-level cognition | 30-100 Hz |

## 🚀 Getting Started

1. Clone this repository
2. Open `index.html` in your browser
3. Enable Bluetooth in your browser settings
4. Connect your NeuroFit Band device
5. Start monitoring your metrics!

## 📁 Project Structure

```plaintext
├── index.html              # Main application entry
├── styles.css             # Global styles
├── arduino/               # Firmware for the band
├── components/            # UI components
│   └── ui/
├── js/                   # Application logic
│   ├── app.js
│   ├── bluetooth.js      # BLE communication
│   ├── charts.js        # Data visualization
│   ├── data-manager.js  # Data handling
│   ├── emergency.js     # Alert system
│   ├── meditation.js    # Meditation features
│   └── tensorflow-model.js
└── scripts/             # Database scripts
```

## 🔋 Battery Life

- Expected battery life: 2-4 days
- Power-saving features implemented
- Smart sleep mode during idle state

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔮 Future Enhancements

- Cloud sync capabilities
- Enhanced ML models for better mood prediction
- Social features for community support
- Advanced meditation guidance
- Integration with other health platforms

## ⚡ Performance

The device provides real-time monitoring with minimal latency, optimized for both performance and battery life through efficient BLE communication protocols.
