from client_socket import *;
from gridmap import *;
from robot import *;

class Slam():
    def __init__(self, config):
        self.config = config;
        
        # Configura o veiculo:
        self.robot  = Robot(config['robot'], config['map']['resolution']);
        
        # Configura o mapa:
        print('Create map.');
        self.map = GridMAP(config['map']);
        
        # Conecta com o servidor:
        #print('Connecting to ' + config['server']['ip'] + ':' + config['server']['port']);
        #try:
            #self.socket = ClientSocket(config['server']['ip'], config['server']['port']);
            #self.socket.start();
        #except:
            #print('Connection refused.');
            #exit();
            
    def dataAssociation(self):
        """ Transforma as leituras dos sensores 
            em células do mapa.
        """
        pass;
            
    def localization(self):
        """ Atualiza a posição atual do robo. """
        pass;
    
    def mapping(self):
        """ Atualiza o mapa. """
        pass;
    
    def SLAM(self):
        while(self.nextControl is not None):
            self.move(self.next_control);
			
    
    def sendData(self):
        """ Send the current state of the robot
            to the server.
        """
        pass;
        
    def cleanup(self):
        self.robot.cleanup();

if __name__ == "__main__":
    try:
        config_file = open('CONFIG.json', 'r');
        config = json.loads(config_file.read());
        
        slam = Slam(config);
        slam.cleanup();
    except json.JSONDecodeError:
        print('Invalid configuration file.');
        GPIO.cleanup();
    except KeyboardInterrupt:
        GPIO.cleanup();
