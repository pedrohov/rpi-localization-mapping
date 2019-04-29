import RPi.GPIO as GPIO;
import time;

class Odometer():

    def __init__(self, pin):
        self.pin = pin;
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(pin, GPIO.IN);
        
        self.counter = 0;
        
    def read(self):
        return GPIO.input(self.pin);

if __name__ == "__main__":
    odometer = Odometer(21);
    
    while(True):
        print(str(odometer.read()));
        time.sleep(0.2);