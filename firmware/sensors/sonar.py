from hc_sr04 import HCSR04;
from parallax_ping import ParallaxPing;
import RPi.GPIO as GPIO;

class Sonar():
    ''' Object Factory to instantiate
        the correct ultrassound sensor given
        the GPIO pins.
    '''
    def create(config):
        if(len(config["pins"]) == 1):
            return ParallaxPing(config);
        return HCSR04(config);

if __name__ == "__main__":
    
    sonar1 = Sonar.create({"pins": [10],
					"center_offset": 14,
					"orientation": 0,
					"max_range": 300,
					"min_range": 7});
    sonar2 = Sonar.create({"pins": [4, 17],
					"center_offset": 7,
					"orientation": 90,
					"max_range": 300,
					"min_range": 7});
    
    try:
        while(True):
            distance1 = sonar1.getData();
            distance2 = sonar2.getData();
            print("Distance #1: " + str(distance1)
                  + " cm\nDistance #2: " + str(distance2) + " cm");
    except KeyboardInterrupt:
        GPIO.cleanup()
