import RPi.GPIO as GPIO;
import time;

class ParallaxPing():
    ''' Class for the Ping))) ultrasonic sensor.
        Provides readings within 3cm to 3m range.
    '''
    def __init__(self, config):
        self.pin = config["pins"][0];
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(self.pin, GPIO.OUT);
        
        self.center_offset = config["center_offset"];
        self.orient_offset = config["orientation"];
        self.orientation   = config["orientation"];
        self.max_range     = config["max_range"];
        self.min_range     = config["min_range"];
    
    def getData(self):
        ''' Returns the distance in centimeters. '''
        GPIO.setup(self.pin, GPIO.OUT);

        # Cleanup output:
        GPIO.output(self.pin, 0);
        time.sleep(0.000002);
        
        # Send pulse:
        GPIO.output(self.pin, GPIO.HIGH);
        time.sleep(0.000005);

        GPIO.output(self.pin, GPIO.LOW);
        GPIO.setup(self.pin, GPIO.IN);

        # Get the pulse start time:
        pulse_start = time.time();
        while(GPIO.input(self.pin) == 0):
            pulse_start = time.time();

        # Wait for the pulse to be received back:
        pulse_end = time.time();
        while(GPIO.input(self.pin) == 1):
            pulse_end = time.time();
                
        pulse_duration = pulse_end - pulse_start;
        distance = self.convertDurationToCM(pulse_duration);
        time.sleep(0.1);
        return distance;
        
    def getInfo(self, n_readings=1):
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
        # 17000 = 34000 / 2
        return round(duration * 17000, 2);
        
    def updateOrientation(self, new_orientation):
        ''' Atualiza a orientacao do sensor em relacao ao veiculo. '''
        self.orientation = (new_orientation + self.orient_offset) % 360;

if __name__ == "__main__":
    
    sonar = ParallaxPing({"type": "sonar",
						"pins": [10],
						"center_offset": 14,
						"orientation": 0,
						"max_range": 300,
						"min_range": 10});
    try:
        while(True):
            distance = sonar.getData();
            print("Distance: " + str(distance) + "cm");
    except KeyboardInterrupt:
        GPIO.cleanup()
