import RPi.GPIO as GPIO;
import time;

class Infrared():

    def __init__(self, pin):
        self.pin = pin;
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(self.pin, GPIO.IN);
    
    def getData(self):
        ''' Returns 1 if there is no
            obstacle in range.
        '''
        return GPIO.input(self.pin);

if __name__ == "__main__":
    infrared = Infrared(9);
    
    try:
        while(True):
            data = infrared.getData();
            print(data);
            time.sleep(0.2);
    except:
        GPIO.cleanup();
