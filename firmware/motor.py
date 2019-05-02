import RPi.GPIO as GPIO;
import time;

class Motor():
    """ Defines motor connection for the CI L298.
        The IN1 and IN2 pins control the direction of rotation.
        This class considers the enabled pins as always on.
    """
    def __init__(self, IN1, IN2):
        # Define the pins as output:
        self.IN1 = IN1;
        self.IN2 = IN2;
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(IN1, GPIO.OUT);
        GPIO.setup(IN2, GPIO.OUT);
        
        # Set all pins to low:
        self.stop();
        
    def forward(self):
        GPIO.output(self.IN1, True);
        GPIO.output(self.IN2, False);
        
    def reverse(self):
        GPIO.output(self.IN1, False);
        GPIO.output(self.IN2, True);
        
    def stop(self):
        GPIO.output(self.IN1, False);
        GPIO.output(self.IN2, False);
    
if __name__ == "__main__":
    # Test individual motors:
    try:
        # Top Left Motor:
        top_left = Motor(11, 5);
        top_left.forward();
        time.sleep(1);
        top_left.reverse();
        time.sleep(1);
        
        # Bottom Left Motor:
        bottom_left = Motor(22, 27);
        bottom_left.forward();
        time.sleep(1);
        bottom_left.reverse();
        time.sleep(1);
        
        # Top Right Motor:
        top_right = Motor(26, 19);
        time.sleep(1);
        top_right.forward();
        time.sleep(1);
        top_right.reverse();
        
        # Bottom Right Motor:
        bottom_right = Motor(6, 13);
        bottom_right.forward();
        time.sleep(1);
        bottom_right.reverse();
        time.sleep(1);
        
        time.sleep(1);
        GPIO.cleanup();
    except:    
        GPIO.cleanup();
