import asyncio;
import websockets;
import json;

class Websocket():
    """ Class for handling connections with the app.
        Receives the Setpoint used for the quadcopter's PID.
    """

    def __init__(self, ip, port):
        self.ip      = ip;
        self.port    = port;
        self.server  = None;
        self.message = None;
        
    def start(self):
        self.server = websockets.serve(self.receiver, self.ip, self.port);
        asyncio.get_event_loop().run_until_complete(self.server);
        asyncio.get_event_loop().run_forever();
        
    async def receiver(self, websocket, path):
        """ Waits for connections over the websocket
            and updates the message if any is received.
        """
        while True:
            try:
                message = await websocket.recv();
                message = json.loads(message);
                print(message);

                # Change current message:
                self.message = message;

            # Treat decoding error:
            except json.decoder.JSONDecodeError:
                continue;
            # Treat on connection close error:
            except websockets.exceptions.ConnectionClosed:
                continue;

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
    receiver = Websocket('localhost', 8080);
    receiver.start();