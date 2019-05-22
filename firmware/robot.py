import json, sys, time;
import RPi.GPIO as GPIO;
from pathlib import Path;

sys.path.insert(0, str(Path().absolute()) + '/sensors/');
GPIO.setwarnings(False);

from controller    import *;
from infrared      import *;
from odometer      import *;
from sonar         import *;
from imu           import *;

# Define controles do veiculo:
FORWARD   = "Z1";
ROT_LEFT  = "Z2";
ROT_RIGHT = "Z3";

class Robot():
	
    def __init__(self, config, resolution):
        # Cria a posicao inicial do robo:
        self.position = {
            "x": config['x'],
            "y": config['y'],
            "orientation": config['orientation'],
        }
        self.resolution = resolution;
        
        # Configura os motores:
        print('Motor setup.');
        motors = config['motors'];
        self.motor_controller = Controller(motors['top_left'][0],
            motors['top_left'][1],
            motors['bottom_left'][0],
            motors['bottom_left'][1],
            motors['top_right'][0],
            motors['top_right'][1],
            motors['bottom_right'][0],
            motors['bottom_right'][1]);
        
        # Configura a Unidade de Medicao Inercial:
        print('IMU setup.');
        self.imu = MPU('IMUCONF');
        #print(self.imu.getData());
        
        # Configura os sensores de distancia:
        print('Sensor setup.');
        self.sensors = {};
        
        for (key, sensor) in config['measurement'].items():
            if(sensor["type"] == "infrared"):
                self.sensors[key] = Infrared(sensor);
            else:
                self.sensors[key] = Sonar.create(sensor);
                
        #print(self.sensors["front"].getData());
        #print(self.canMoveForward());
        
        # Configura o odometro:
        print('Odometer setup.');
        self.odometer = Odometer(config['odometry']);
            
        # Proximo controle a ser executado:
        self.next_control = None;
        
    def canMoveForward(self):
        distance = self.sensors["front"].getData();
        if(distance <= self.sensors["front"].min_range):
            return False;
        return True;
            
    def forward(self):
        time_ini = time.time();
		
        # Inicia a contagem do odometro:
        self.odometer.init();
		
        # Envia o comando para mover para frente:
        self.motor_controller.forward();
		
        # Termina a contagem quando a distancia for
        # igual a distancia de uma celula:
        distance = 0;
        while(distance < self.resolution):
            distance = self.odometer.getOdometry()["distance"];
		
        odometry_data = self.odometer.stop();
		
        # Tempo gasto para executar o comando:
        elapsed = time.time() - time_ini;
		
        return { "distance": distance, "time": elapsed };
    
    def rotateLeft(self):
        # Orientacao inicial:
        orientation = self.calcOrientation();
        target = orientation + 90;
        print(orientation);
        time_ini = time.time();
        
        self.motor_controller.rotateLeft();
        while(orientation < target):
            orientation = self.imu.getYaw();
            print(orientation);
        self.motor_controller.stop();
        
        # Tempo gasto para executar o comando:
        elapsed = time.time() - time_ini;
        
        return { "orientation": orientation, "time": elapsed };
    
    def rotateRight(self):
        pass;
    
    def sense(self):
        """ Le dados dos sensores.
            Retorna um dicionario com a informacao necessaria
            para a etapa de associacao de dados.
        """
        readings = {};
        for key, sensor in self.sensors.items():
            readings[key] = sensor.getInfo();
            
        return readings;
    
    def move(self, control):
        """ Decide qual sera o proximo controle a ser executado.
            Retorna False se nao puder executar o controle.
            Retorna dados da odometria se o controle for executado.
        """
        if(control is None):
            return False;
		
        odometry = {};	
        if(control == FORWARD):
            odometry = self.forward();
        elif(control == ROT_LEFT):
            odometry = self.rotateLeft();
        elif(control == ROT_RIGHT):
            odometry = self.rotateRight();
            
        return odometry;
        
    def calcOrientation(self):
        orientation = self.imu.getYaw();
        while(orientation is None):
            orientation = self.imu.getYaw();
        return orientation;
        
    def cleanup(self):
        if(self.odometer is not None):
            self.odometer.kill();
        GPIO.cleanup();

if __name__ == "__main__":
    try:
        config_file = open('CONFIG.json', 'r');
        config = json.loads(config_file.read());
        
        robot = Robot(config['robot'], config['map']['resolution']);
        print(robot.sense());
        print(robot.move(ROT_LEFT));
        #print(robot.move(FORWARD));
        robot.cleanup();
    except json.JSONDecodeError:
        print('Invalid configuration file.');
        GPIO.cleanup();
    except KeyboardInterrupt:
        GPIO.cleanup();
