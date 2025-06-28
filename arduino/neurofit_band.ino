/*
 * NeuroFit Band - ESP32 Firmware
 * Reads EEG and PPG data, processes signals, and sends via BLE
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "driver/adc.h"
#include "esp_adc_cal.h"

// BLE Service and Characteristic UUIDs
#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define EEG_CHAR_UUID       "87654321-4321-4321-4321-cba987654321"
#define VITAL_CHAR_UUID     "11111111-2222-3333-4444-555555555555"
#define COMMAND_CHAR_UUID   "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

// Pin definitions
#define EEG_PIN A0
#define PPG_PIN A1
#define LED_PIN 2
#define VIBRATION_PIN 4

// Sampling parameters
#define SAMPLING_RATE 250  // Hz
#define BUFFER_SIZE 1000
#define FFT_SIZE 256

// Global variables
BLEServer* pServer = NULL;
BLECharacteristic* pEEGCharacteristic = NULL;
BLECharacteristic* pVitalCharacteristic = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Data buffers
float eegBuffer[BUFFER_SIZE];
float ppgBuffer[BUFFER_SIZE];
int bufferIndex = 0;

// Timing variables
unsigned long lastSample = 0;
unsigned long lastTransmit = 0;
const unsigned long sampleInterval = 1000 / SAMPLING_RATE; // 4ms for 250Hz
const unsigned long transmitInterval = 1000; // 1 second

// Signal processing variables
struct EEGMetrics {
  float alpha;
  float beta;
  float theta;
  float delta;
  float gamma;
  float attention;
  float meditation;
};

struct VitalSigns {
  int heartRate;
  float spo2;
  float hrvRMSSD;
  float hrvSDNN;
  float stressIndex;
};

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      digitalWrite(LED_PIN, HIGH);
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      digitalWrite(LED_PIN, LOW);
    }
};

class MyCommandCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String value = pCharacteristic->getValue().c_str();
      
      if (value == "START_SESSION") {
        startNewSession();
      } else if (value == "STOP_SESSION") {
        stopSession();
      } else if (value == "CALIBRATE") {
        calibrateSensors();
      } else if (value == "EMERGENCY") {
        triggerEmergencyAlert();
      }
    }
};

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(VIBRATION_PIN, OUTPUT);
  
  // Initialize ADC
  adc1_config_width(ADC_WIDTH_BIT_12);
  adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_11);
  adc1_config_channel_atten(ADC1_CHANNEL_1, ADC_ATTEN_DB_11);
  
  // Initialize BLE
  BLEDevice::init("NeuroFit-Band");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  // EEG Data Characteristic
  pEEGCharacteristic = pService->createCharacteristic(
                         EEG_CHAR_UUID,
                         BLECharacteristic::PROPERTY_READ |
                         BLECharacteristic::PROPERTY_WRITE |
                         BLECharacteristic::PROPERTY_NOTIFY
                       );
  pEEGCharacteristic->addDescriptor(new BLE2902());

  // Vital Signs Characteristic
  pVitalCharacteristic = pService->createCharacteristic(
                          VITAL_CHAR_UUID,
                          BLECharacteristic::PROPERTY_READ |
                          BLECharacteristic::PROPERTY_WRITE |
                          BLECharacteristic::PROPERTY_NOTIFY
                        );
  pVitalCharacteristic->addDescriptor(new BLE2902());

  // Command Characteristic
  pCommandCharacteristic = pService->createCharacteristic(
                            COMMAND_CHAR_UUID,
                            BLECharacteristic::PROPERTY_READ |
                            BLECharacteristic::PROPERTY_WRITE
                          );
  pCommandCharacteristic->setCallbacks(new MyCommandCallbacks());

  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
  
  Serial.println("NeuroFit Band ready for connection!");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Sample sensors at specified rate
  if (currentTime - lastSample >= sampleInterval) {
    sampleSensors();
    lastSample = currentTime;
  }
  
  // Transmit data every second
  if (currentTime - lastTransmit >= transmitInterval && deviceConnected) {
    processAndTransmitData();
    lastTransmit = currentTime;
  }
  
  // Handle BLE connection changes
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("Start advertising");
    oldDeviceConnected = deviceConnected;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
}

void sampleSensors() {
  // Read EEG signal (simulated with noise for demo)
  int eegRaw = adc1_get_raw(ADC1_CHANNEL_0);
  float eegVoltage = (eegRaw / 4095.0) * 3.3;
  eegBuffer[bufferIndex] = eegVoltage;
  
  // Read PPG signal
  int ppgRaw = adc1_get_raw(ADC1_CHANNEL_1);
  float ppgVoltage = (ppgRaw / 4095.0) * 3.3;
  ppgBuffer[bufferIndex] = ppgVoltage;
  
  bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
}

void processAndTransmitData() {
  // Process EEG data
  EEGMetrics eegMetrics = processEEGSignal();
  
  // Process vital signs
  VitalSigns vitalSigns = processVitalSigns();
  
  // Create JSON for EEG data
  DynamicJsonDocument eegDoc(1024);
  eegDoc["timestamp"] = millis();
  eegDoc["alpha"] = eegMetrics.alpha;
  eegDoc["beta"] = eegMetrics.beta;
  eegDoc["theta"] = eegMetrics.theta;
  eegDoc["delta"] = eegMetrics.delta;
  eegDoc["gamma"] = eegMetrics.gamma;
  eegDoc["attention"] = eegMetrics.attention;
  eegDoc["meditation"] = eegMetrics.meditation;
  
  String eegJson;
  serializeJson(eegDoc, eegJson);
  
  // Create JSON for vital signs
  DynamicJsonDocument vitalDoc(1024);
  vitalDoc["timestamp"] = millis();
  vitalDoc["heartRate"] = vitalSigns.heartRate;
  vitalDoc["spo2"] = vitalSigns.spo2;
  vitalDoc["hrvRMSSD"] = vitalSigns.hrvRMSSD;
  vitalDoc["hrvSDNN"] = vitalSigns.hrvSDNN;
  vitalDoc["stressIndex"] = vitalSigns.stressIndex;
  
  String vitalJson;
  serializeJson(vitalDoc, vitalJson);
  
  // Send via BLE
  pEEGCharacteristic->setValue(eegJson.c_str());
  pEEGCharacteristic->notify();
  
  pVitalCharacteristic->setValue(vitalJson.c_str());
  pVitalCharacteristic->notify();
  
  Serial.println("Data transmitted: " + eegJson);
}

EEGMetrics processEEGSignal() {
  EEGMetrics metrics;
  
  // Simple band power calculation (in real implementation, use FFT)
  float sum = 0;
  for (int i = 0; i < BUFFER_SIZE; i++) {
    sum += eegBuffer[i];
  }
  float mean = sum / BUFFER_SIZE;
  
  // Simulate different frequency bands (replace with actual FFT)
  metrics.alpha = random(20, 80) / 100.0;
  metrics.beta = random(10, 60) / 100.0;
  metrics.theta = random(15, 70) / 100.0;
  metrics.delta = random(5, 40) / 100.0;
  metrics.gamma = random(5, 30) / 100.0;
  
  // Calculate attention and meditation levels
  metrics.attention = (metrics.beta / (metrics.alpha + metrics.theta)) * 100;
  metrics.meditation = (metrics.alpha / (metrics.beta + metrics.gamma)) * 100;
  
  // Constrain values
  metrics.attention = constrain(metrics.attention, 0, 100);
  metrics.meditation = constrain(metrics.meditation, 0, 100);
  
  return metrics;
}

VitalSigns processVitalSigns() {
  VitalSigns signs;
  
  // Simple peak detection for heart rate (replace with proper algorithm)
  signs.heartRate = random(60, 100);
  signs.spo2 = random(95, 100) + random(0, 99) / 100.0;
  
  // HRV calculations (simplified)
  signs.hrvRMSSD = random(20, 80) / 10.0;
  signs.hrvSDNN = random(30, 120) / 10.0;
  
  // Stress index calculation
  signs.stressIndex = (100 - signs.hrvRMSSD) * 1.2;
  signs.stressIndex = constrain(signs.stressIndex, 0, 100);
  
  return signs;
}

void startNewSession() {
  Serial.println("Starting new session");
  // Reset buffers and counters
  bufferIndex = 0;
  memset(eegBuffer, 0, sizeof(eegBuffer));
  memset(ppgBuffer, 0, sizeof(ppgBuffer));
  
  // Vibrate to confirm
  digitalWrite(VIBRATION_PIN, HIGH);
  delay(200);
  digitalWrite(VIBRATION_PIN, LOW);
}

void stopSession() {
  Serial.println("Stopping session");
  // Vibrate twice to confirm
  for (int i = 0; i < 2; i++) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(100);
    digitalWrite(VIBRATION_PIN, LOW);
    delay(100);
  }
}

void calibrateSensors() {
  Serial.println("Calibrating sensors");
  // Implement sensor calibration routine
  for (int i = 0; i < 3; i++) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(50);
    digitalWrite(VIBRATION_PIN, LOW);
    delay(50);
  }
}

void triggerEmergencyAlert() {
  Serial.println("EMERGENCY ALERT TRIGGERED!");
  // Continuous vibration for emergency
  for (int i = 0; i < 10; i++) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(200);
    digitalWrite(VIBRATION_PIN, LOW);
    delay(100);
  }
}
