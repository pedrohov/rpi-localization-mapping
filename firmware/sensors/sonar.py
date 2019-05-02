from hc_sr04 import HCSR04;
from parallax_ping import ParallaxPing;
import RPi.GPIO as GPIO;

class Sonar():
    ''' Object Factory to instantiate
        the correct ultrassound sensor given
        the GPIO pins.
    '''
    def create(pins):
        if(len(pins) == 1):
            return ParallaxPing(pins[0]);
        return HCSR04(pins[0], pins[1]);

if __name__ == "__main__":
    
    sonar1 = Sonar.create([10]);
    sonar2 = Sonar.create([4, 17]);
    
    try:
        while(True):
            distance1 = sonar1.getData();
            distance2 = sonar2.getData();
            print("Distance #1: " + str(distance1)
                  + " cm\nDistance #2: " + str(distance2) + " cm");
    except KeyboardInterrupt:
        GPIO.cleanup()