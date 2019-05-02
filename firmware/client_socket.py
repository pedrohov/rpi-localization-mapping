import json;
from threading import Thread;
from websocket import create_connection;

class ClientSocket(Thread):
    """ Class for handling connections with the app.
        Sends the current state of the robot to the visualization app.
    """

    def __init__(self, ip, port):
        Thread.__init__(self);
        self.ip      = ip;
        self.port    = port;
        self.socket  = create_connection('ws://' + self.ip + ':' + self.port);
        self.message = None;

        self.send({ 'command': 'robot_socket' });
        #self.send({ 'command': 'new_robot_data' });

    def run(self):
        while(True):
            message = self.socket.recv();

            try:
                self.message = json.loads(message);
                print(self.message);
            except json.decoder.JSONDecodeError:
                continue;

    def send(self, data):
        self.socket.send(json.dumps(data));
        
    def hasMessage(self):
        """ Returns True if the server has a message available
            that hasn't been read yet.
        """
        if(self.message is not None):
            return True;
        return False;

    def getMessage(self):
        """ Returns the current message. """
        msg = self.message;
        self.message = None;
        return msg;
        
if __name__ == '__main__':
    receiver = ClientSocket('192.168.0.102', '8080');
    receiver.start();
    #receiver.send({ 'command': 'put', 'data': [1, 2, 3, 4] });