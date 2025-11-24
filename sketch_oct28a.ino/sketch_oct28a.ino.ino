#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <U8g2lib.h>
#include <Wire.h>
#include <DHT.h>
#include <ArduinoOTA.h>
#include <Update.h>

// ────────────────────── PINS ──────────────────────
#define SDA_PIN       0
#define SCL_PIN       1
#define DHT_PIN       4
#define SPEAKER_PIN   2
#define BUTTON_PIN    3
#define LED_PIN       8   // On-board LED / status

// ────────────────────── CONFIG ──────────────────────
#if __has_include("env.h")
#include "env.h"
const char* ssid       = WIFI_SSID;
const char* password   = WIFI_PASSWORD;
const char* backend    = BACKEND_URL;
#else
const char* ssid       = "LAN4";
const char* password   = "21148860";
const char* backend    = "https://nex-os.vercel.app";
#endif

// ────────────────────── OBJECTS ──────────────────────
U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE);
DHT dht(DHT_PIN, DHT11);

// ────────────────────── GLOBAL STATE ──────────────────────
unsigned long lastPoll = 0;
unsigned long lastTel = 0;
float localTemp = 0, localHum = 0;
String weatherAlert = "";
String quote = "", character = "", anime = "";
int alarmHour = -1, alarmMinute = -1;
bool emoActive = false;
bool sedentaryAlert = false;
bool otaPending = true;

volatile bool buttonPressed = false;
void IRAM_ATTR buttonISR() { buttonPressed = true; }

// ────────────────────── SETUP ──────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(SPEAKER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), buttonISR, FALLING);
  ledcAttach(SPEAKER_PIN, 5000, 10);

  Wire.begin(SDA_PIN, SCL_PIN);
  u8g2.begin();
  u8g2.setContrast(120);
  dht.begin();

  // Boot animation
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_logisoso20_tr);
  u8g2.drawStr(15, 40, "NexOS");
  u8g2.setFont(u8g2_font_6x10_tr);
  u8g2.drawStr(28, 58, "Dhaka v1.0");
  u8g2.sendBuffer();
  tone(SPEAKER_PIN, 1000, 150); delay(200);
  tone(SPEAKER_PIN, 1500, 250);

  // ────── Wi-Fi — GUARANTEED TO WORK ──────
  Serial.println("Connecting to Wi-Fi...");
  WiFi.disconnect(true);
  delay(1000);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  delay(2000);  // Critical pause

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries++ < 40) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    Serial.print(".");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi CONNECTED! IP: " + WiFi.localIP().toString());
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_6x10_tr);
    u8g2.drawStr(5, 20, "WiFi CONNECTED");
    u8g2.drawStr(5, 35, WiFi.localIP().toString().c_str());
    u8g2.drawStr(5, 50, "NexOS Ready");
    u8g2.sendBuffer();

    tone(SPEAKER_PIN, 800, 100); delay(150);
    tone(SPEAKER_PIN, 1200, 100); delay(150);
    tone(SPEAKER_PIN, 1600, 300);
  } else {
    Serial.println("\nWiFi FAILED");
    u8g2.clearBuffer();
    u8g2.drawStr(5, 30, "WiFi FAILED");
    u8g2.drawStr(5, 50, "Check hotspot");
    u8g2.sendBuffer();
    tone(SPEAKER_PIN, 200, 1500);
    while (true) delay(1000); // Stop here
  }

  ArduinoOTA.setHostname("NexOS");
  ArduinoOTA.begin();
  lastPoll = millis();
}

// ────────────────────── MAIN LOOP ──────────────────────
void loop() {
  ArduinoOTA.handle();

  // Button = instant quote
  if (buttonPressed) {
    buttonPressed = false;
    fetchQuote();
  }

  // Poll backend every 10 seconds
  if (millis() - lastPoll > 3000) {
    lastPoll = millis();
    fetchAllData();
  }
  if (millis() - lastTel > 5000) {
    lastTel = millis();
    postTelemetry();
  }

  checkAlarm();
  if (sedentaryAlert) { sedentaryAlert = false; playSedentary(); }
  if (emoActive) { emoCycle(); }

  drawScreen();
  delay(50);
}

// ────────────────────── BACKEND POLLING ──────────────────────
void fetchAllData() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.setTimeout(10000);

  // 1. Alarm
  http.begin(String(backend) + "/api/alarm");
  if (http.GET() == 200) {
    DynamicJsonDocument doc(256);
    deserializeJson(doc, http.getString());
    alarmHour = doc["hour"] | -1;
    alarmMinute = doc["minute"] | -1;
  }

  // 2. State (emo, sedentary, OTA)
  http.begin(String(backend) + "/api/state");
  if (http.GET() == 200) {
    DynamicJsonDocument doc(512);
    deserializeJson(doc, http.getString());
    emoActive = doc["emoActive"] | false;
    sedentaryAlert = doc["sedentaryAlert"] | false;
    otaPending = doc["otaPending"] | false;
    const char* u = doc["otaUrl"] | "";
    if (otaPending && String(u).length() > 0) performOTA(String(u).c_str());
  }

  // 3. Weather (Dhaka)
  http.begin(String(backend) + "/api/weather");
  if (http.GET() == 200) {
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, http.getString());
    localTemp = doc["temp"].as<float>();
    localHum = doc["hum"].as<float>();
    JsonArray alerts = doc["alerts"];
    weatherAlert = alerts.size() > 0 ? alerts[0].as<String>() : "";
  }

  // 4. Quote
  fetchQuote();

  http.end();
}

void fetchQuote() {
  HTTPClient http;
  http.begin(String(backend) + "/api/quote");
  if (http.GET() == 200) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, http.getString());
    quote = doc["quote"].as<String>();
    character = doc["character"].as<String>();
    anime = doc["anime"].as<String>();
    tone(SPEAKER_PIN, 2000, 100);
  }
  http.end();
}

// ────────────────────── ALARM ──────────────────────
void checkAlarm() {
  if (alarmHour == -1) return;
  unsigned long totalMinutes = millis() / 60000UL;
  int currentHour = (totalMinutes / 60) % 24;
  int currentMinute = totalMinutes % 60;
  if (currentHour == alarmHour && currentMinute == alarmMinute) {
    for (int i = 0; i < 15; i++) {
      ledcWriteTone(0, 800 + i * 120);
      u8g2.clearBuffer();
      u8g2.setFont(u8g2_font_logisoso24_tr);
      u8g2.drawStr(10, 40, "WAKE UP!");
      u8g2.sendBuffer();
      delay(400);
    }
    alarmHour = -1;
  }
}

// ────────────────────── SEDENTARY & EMO ──────────────────────
void playSedentary() {
  tone(SPEAKER_PIN, 400, 800); delay(900);
  tone(SPEAKER_PIN, 300, 1000);
  for (int i = 0; i < 4; i++) {
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_logisoso18_tr);
    u8g2.drawStr(15, 38, "STAND UP!");
    u8g2.sendBuffer();
    delay(600);
    u8g2.clearBuffer(); u8g2.sendBuffer();
    delay(300);
  }
}

void emoCycle() {
  static uint8_t frame = 0;
  static unsigned long last = 0;
  if (millis() - last < 700) return;
  last = millis();

  frame = (frame + 1) % 10;
  tone(SPEAKER_PIN, 600 + frame * 200, 120);

  const char* faces[10] = {"^_^", ">_<", "O_O", "X_X", "@_@", "TwT", "-_-", "♥_♥", "UwU", "QwQ"};
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_logisoso24_tr);
  u8g2.drawStr(35, 42, faces[frame]);
  u8g2.sendBuffer();
}

// ────────────────────── DISPLAY ──────────────────────
void drawScreen() {
  static unsigned long lastFrame = micros();
  if (micros() - lastFrame < 16667) return; // ~60 FPS
  lastFrame = micros();

  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x10_tr);

  char buf[40];
  sprintf(buf, "T:%.1f°C  H:%.0f%%", localTemp, localHum);
  u8g2.drawStr(2, 10, buf);

  unsigned long uptime = (millis() / 1000) / 60;
  sprintf(buf, "Up:%lum", uptime);
  u8g2.drawStr(2, 22, buf);

  if (weatherAlert != "") {
    u8g2.drawStr(2, 36, "ALERT:");
    u8g2.drawStr(2, 48, weatherAlert.substring(0, 20).c_str());
  } else if (quote != "") {
    u8g2.drawStr(2, 36, quote.substring(0, 20).c_str());
    u8g2.drawStr(2, 48, ("—" + character).substring(0, 20).c_str());
  } else {
    u8g2.drawStr(2, 42, "NexOS • Dhaka");
  }

  u8g2.drawStr(2, 60, emoActive ? "EMO MODE" : "Normal");
  u8g2.sendBuffer();
}
void postTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) return;
  DynamicJsonDocument doc(256);
  doc["temp"] = t;
  doc["hum"] = h;
  doc["uptime"] = millis() / 1000;
  String out;
  serializeJson(doc, out);
  HTTPClient http;
  http.begin(String(backend) + "/api/telemetry");
  http.addHeader("Content-Type", "application/json");
  http.POST(out);
  http.end();
}

bool performOTA(const char* url) {
  HTTPClient http;
  http.begin(url);
  int code = http.GET();
  if (code != 200) { http.end(); return false; }
  int len = http.getSize();
  WiFiClient* stream = http.getStreamPtr();
  if (!Update.begin(len)) { http.end(); return false; }
  size_t written = Update.writeStream(*stream);
  bool ok = written == len && Update.end();
  http.end();
  if (ok && Update.isFinished()) { ESP.restart(); return true; }
  return false;
}