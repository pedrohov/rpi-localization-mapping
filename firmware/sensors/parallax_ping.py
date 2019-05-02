import RPi.GPIO as GPIO;
import time;

class ParallaxPing():
    ''' Class for the Ping))) ultrasonic sensor.
        Provides readings within 3cm to 3m range.
    '''
    def __init__(self, pin):
        self.pin = pin;
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(pin, GPIO.OUT);
    
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
    
    def convertDurationToCM(self, duration):
        ''' Converts the pulse duration into distance. '''
        # Check if the duration is valid.
        # Pulse durations bigger than 0.5s or less than 0s
        # shouldn't be considered.
        if(duration <= 0 or duration >= 500):
            return -1;
        # 17000 = 34000 / 2
        return round(duration * 17000, 2);

if __name__ == "__main__":
    
    sonar = ParallaxPing(10);
    
    try:
        while(True):
            distance = sonar.getData();
            print("Distance: " + str(distance) + "cm");
    except KeyboardInterrupt:
        GPIO.cleanup()