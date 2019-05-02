import RPi.GPIO as GPIO;
import time;

class Odometer():

    def __init__(self, config):
        self.pin = config['pin'];
        self.count_per_revolution = config['count_per_revolution'];
        self.wheel_circumference  = config['wheel_circumference'];
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(self.pin, GPIO.IN);
        
        self.counter = 0;
               
    def getData(self):
        return GPIO.input(self.pin);

if __name__ == "__main__":
    odometer = Odometer(21);
    
    while(True):
        print(str(odometer.getData()));
        time.sleep(0.2);