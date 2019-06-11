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

		# True se a thread nao for destruida:
		self.isAlive   = True;

	def run(self):
		while(self.isAlive):
			message = self.socket.recv();

			try:
				self.message = json.loads(message);
				print(self.message);
			except json.decoder.JSONDecodeError:
				print('Received an invalid message. Message discarded.');
				continue;
			except:
				print('Connection error.');
				return;

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
	
	def kill(self):
		self.socket.close();
		self.isAlive = False;
        
if __name__ == '__main__':
	receiver = ClientSocket('192.168.0.100', '8080');
	receiver.start();
	receiver.send({ 'command': 'put', 'data': [1, 2, 3, 4] });
	receiver.kill();
