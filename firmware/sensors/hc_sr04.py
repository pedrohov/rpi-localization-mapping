import RPi.GPIO as GPIO;
import time;

class HCSR04():
    ''' Class for the HC-SR04 ultrasonic sensor.
        Provides readings within 2cm to 4m range.
    '''
    def __init__(self, config):
        self.trig_pin = config["pins"][0];
        self.echo_pin = config["pins"][1];
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(self.trig_pin, GPIO.OUT);
        GPIO.setup(self.echo_pin, GPIO.IN);
        
        self.center_offset = config["center_offset"];
        self.orient_offset = config["orientation"];
        self.orientation   = config["orientation"];
        self.max_range     = config["max_range"];
        self.min_range     = config["min_range"];
        
        # Cleanup output:
        GPIO.output(self.trig_pin, GPIO.LOW);
        time.sleep(2);
        
    def getData(self):
        ''' Returns the distance in centimeters. '''
        # Send pulse:
        GPIO.output(self.trig_pin, GPIO.HIGH);
        time.sleep(0.00001);
        GPIO.output(self.trig_pin, GPIO.LOW);
        
        # Get the pulse start time:
        pulse_start = time.time();
        while(GPIO.input(self.echo_pin) == 0):
            pulse_start = time.time();
            
        # Wait for the pulse to be received back:
        pulse_end = time.time();
        while(GPIO.input(self.echo_pin) == 1):
            pulse_end = time.time();
            
        pulse_duration = pulse_end - pulse_start;
        time.sleep(0.1);
        return self.convertDurationToCM(pulse_duration);
        
    def getInfo(self, n_readings=10):
        info = {};
        res = 0;
        for i in range(0, n_readings):
            res += self.getData();
        res = res / n_readings;
        
        info["data"] = res;
        info["obstacle_found"] = True;
        if(info["data"] > self.max_range):
            info["obstacle_found"] = False;
            info['data'] = self.max_range;
        info["orientation"] = self.orientation;
        info["offset"] = self.center_offset;
        info["min_range"] = self.min_range;
        return info;
    
    def convertDurationToCM(self, duration):
        ''' Converte a duracao do pulso em distancia. '''
        # Check if the duration is valid.
        # Pulse durations bigger than 0.5s or less than 0s
        # shouldn't be considered.
        if(duration <= 0 or duration >= 500):
            return -1;
        return round(duration * 17150, 2);
        
    def updateOrientation(self, new_orientation):
        ''' Atualiza a orientacao do sensor em relacao ao veiculo. '''
        self.orientation = (new_orientation + self.orient_offset) % 360;

if __name__ == "__main__":
    
    sonar = HCSR04({"type": "sonar",
                    "pins": [4, 17],
                    "center_offset": 7,
                    "orientation": 90,
                    "max_range": 300,
                    "min_range": 10});
    
    try:
        while(True):
            distance = sonar.getData();
            print("Distance: " + str(distance) + "cm");
            info = sonar.getInfo();
            print(info);
    except KeyboardInterrupt:
        GPIO.cleanup()
