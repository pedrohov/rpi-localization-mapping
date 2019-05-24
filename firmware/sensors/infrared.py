import RPi.GPIO as GPIO;
import time;

class Infrared():

    def __init__(self, config):
        self.pin = config["pins"][0];
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(self.pin, GPIO.IN);
        
        self.center_offset = config["center_offset"];
        self.orientation   = config["orientation"];
        self.range = config["range"];
    
    def getData(self):
        ''' Retorna True se existe
            um obstaculo no alcance.
        '''
        # 1 = Nao existe obstaculo.
        if(GPIO.input(self.pin) == 1):
            return False;
        return True;
        
    def getInfo(self):
        info = {};
        info["obstacle_found"] = self.getData();
        info["orientation"] = self.orientation;
        info["offset"] = self.center_offset;
        info['data'] = 0;
        if(info['obstacle_found'] is False):
            info['data'] = 25;
        
        return info;

if __name__ == "__main__":
    infrared = Infrared(9);
    
    try:
        while(True):
            data = infrared.getData();
            print(data);
            time.sleep(0.2);
    except:
        GPIO.cleanup();
