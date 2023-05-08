#include <Servo.h>

Servo servo_lights_off;
Servo servo_AC;

int pin_GM_button = 2;
int pin_GN_button = 4;

int pin_lights_off = 11;
int pin_AC = 9;

int state_GM_button = 0;
int state_GN_button = 0;
int prev_state_GM_button = 0;
int prev_state_GN_button = 0;

void setup() {
  servo_lights_off.attach(pin_lights_off);
  servo_AC.attach(pin_AC);
  Serial.begin(9600);

  // start the handshake
  while (Serial.available() <= 0) {
    Serial.println("-1"); // send a starting message
    delay(300);            // wait 1/3 second
  }
}

void loop() {
  while (Serial.available()) {
    state_GM_button = digitalRead(pin_GM_button);
    state_GN_button = digitalRead(pin_GN_button);
    // GM button is pressed
    if (state_GM_button != prev_state_GM_button && state_GM_button == 1) {
      // turn on the AC
      servo_AC.write(180);
      delay(1000);
      servo_AC.write(0);
      delay(1000);
      
      // send message to P5.js
      Serial.println("0");
    }
    // GN button is pressed
    if (state_GN_button != prev_state_GN_button && state_GN_button == 1) {
      // turn off the lights
      servo_lights_off.write(0);
      delay(1000);
      servo_lights_off.write(180);
      delay(1000);
      // turn off the AC, double click is needed to go to Night mode from Morning mode
      servo_AC.write(180);
      delay(1000);
      servo_AC.write(0);
      delay(2000);
      servo_AC.write(180);
      delay(1000);
      servo_AC.write(0);
      delay(2000);

      // send message to P5.js
      Serial.println("1");
    }
    
    // update the previous states of the buttons
    prev_state_GM_button = state_GM_button;
    prev_state_GN_button = state_GN_button;
  }
}