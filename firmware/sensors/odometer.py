import RPi.GPIO as GPIO;
import time;
from threading import Thread;

class Odometer(Thread):

    def __init__(self, config):
        Thread.__init__(self);
		
        # Configura os pinos da chave optica:
        self.pin = config['pin'];
        GPIO.setmode(GPIO.BCM);
        GPIO.setup(self.pin, GPIO.IN);
		
        # Informacoes sobre odometria:
        self.count_per_revolution  = config['count_per_revolution'];
        self.wheel_circumference   = config['wheel_circumference'];
        self.encoder_circumference = config['encoder_circumference'];
		
        # Informacoes para o processo de contagem:
        self.counter   = 0;
        self.lastState = self.getData();
		
        # True se o odometro estiver contando:
        self.isActive  = False;
		
        # True se a thread nao for destruida:
        self.isAlive   = True;
        
        # Inicia a thread:
        self.start();
		
    def kill(self):
        self.isAlive = False;
        
    def run(self):
        while(self.isAlive):
            if(self.isActive):
                self.count();
       
    def init(self):
        self.counter = 0;
        self.isActive = True;
       
    def stop(self):
        odometry = self.getOdometry();
        self.counter = 0;
        self.isActive = False;
        return odometry;
		
    def count(self):
        """ Incrementa o contador quando
            o estado da chave optica mudar.
        """
        data = self.getData();
        if(data != self.lastState):
            self.counter += 1;
            self.lastState = data;
			
    def getData(self):
        return GPIO.input(self.pin);
        
    def getOdometry(self):
        revolutions = self.counter / self.count_per_revolution;
        return {
            "counts": self.counter,
            "revolutions": revolutions,
            "distance": revolutions * self.wheel_circumference
        };

if __name__ == "__main__":
    odometer = Odometer({
        "pin": 21,
        "count_per_revolution": 20,
        "wheel_circumference": 42.73,
        "encoder_circumference": 4.08
        });
        
	
    for i in range(5):
        odometer.init();
        time.sleep(1);
        print(odometer.stop());

    odometer.kill();
    GPIO.cleanup();
