import RPi.GPIO as GPIO;
import time;

class HCSR04():
    ''' Class for the HC-SR04 ultrasonic sensor.
        Provides readings within 2cm to 4m range.
    '''
    def __init__(self, trig_pin, echo_pin):
        self.trig_pin = trig_pin;
        self.echo_pin = echo_pin;
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(trig_pin, GPIO.OUT)
        GPIO.setup(echo_pin, GPIO.IN)
        
        # Cleanup output:
        GPIO.output(trig_pin, GPIO.LOW);
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
    
    def convertDurationToCM(self, duration):
        ''' Converts the pulse duration into distance. '''
        # Check if the duration is valid.
        # Pulse durations bigger than 0.5s or less than 0s
        # shouldn't be considered.
        if(duration <= 0 or duration >= 500):
            return -1;
        return round(duration * 17150, 2);

if __name__ == "__main__":
    
    sonar = HCSR04(4, 17);    
    try:
        while(True):
            distance = sonar.getData();
            print("Distance: " + str(distance) + "cm");
    except KeyboardInterrupt:
        GPIO.cleanup()
