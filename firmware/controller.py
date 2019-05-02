import RPi.GPIO as GPIO;
from motor import *;
import time;

class Controller():
    """ Class that controls each motor of the vehicle.
        It can execute a movement for a specified period
        of time, or execute a movement until it receives
        another command.
    """
    def __init__(self,
                 TL1, TL2, BL1, BL2,
                 TR1, TR2, BR1, BR2):
        GPIO.setmode(GPIO.BCM);
        self.top_left     = Motor(TL1, TL2);
        self.bottom_left  = Motor(BL1, BL2);
        self.top_right    = Motor(TR1, TR2);
        self.bottom_right = Motor(BR1, BR2);
        
    def forward(self, timer = None):
        self.top_left.forward();
        self.bottom_left.forward();
        self.top_right.forward();
        self.bottom_right.forward();
        
        if(timer is not None):
            time.sleep(timer);
            self.stop();
        
    def reverse(self, timer = None):
        self.top_left.reverse();
        self.bottom_left.reverse();
        self.top_right.reverse();
        self.bottom_right.reverse();
        
        if(timer is not None):
            time.sleep(timer);
            self.stop();
        
    def move_left(self, timer = None):
        self.top_left.reverse();
        self.bottom_left.reverse();
        self.top_right.forward();
        self.bottom_right.forward();
        
        if(timer is not None):
            time.sleep(timer);
            self.stop();
        
    def move_right(self, timer = None):
        self.top_left.forward();
        self.bottom_left.forward();
        self.top_right.reverse();
        self.bottom_right.reverse();
        
        if(timer is not None):
            time.sleep(timer);
            self.stop();
        
    def stop(self):
        self.top_left.stop();
        self.bottom_left.stop();
        self.top_right.stop();
        self.bottom_right.stop();

if __name__ == "__main__":
    try:
        # Test the controller:
        controller = Controller(11, 5, 22, 27, 26, 19, 6, 13);
        controller.forward(1);
        #controller.reverse(3);
        #controller.move_left(3);
        #controller.move_right(2);
        GPIO.cleanup();
    except:
        GPIO.cleanup();