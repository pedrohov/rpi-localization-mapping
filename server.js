var Server = require('ws').Server;
var port   = process.env.PORT || 8080;
var ws     = new Server({ port: port });

// Sockets:
let appSocket = null;
let robotSocket = null;

// SLAM Data:
var readings = [];

ws.on('connection', function(socket) {

    console.log('New connection');

    socket.on('message', function(msg) {
        // Parse message:
        try {
            msg = JSON.parse(msg);
        }
        catch(e) {
            return;
        }

        console.log(msg.command)
        let response = null;

        // Socket identification:
        if(msg.command === 'app_socket') {
            appSocket = this;
        } else if(msg.command === 'robot_socket') {
            robotSocket = this;
        }

        // Visualization App - Get robot data:
        if(msg.command === 'get_robot_data') {
            appSocket.send(JSON.stringify({ data: readings }));
        }
        // Visualization App - Start SLAM:
        else if(msg.command === 'start_robot') {
            if(robotSocket) {
                robotSocket.send(JSON.stringify({
                    command: 'start'
                }))
            }
        }

        // Firmware - Add new data:
        if(msg.command === 'new_robot_data') {
            if(appSocket) {
                appSocket.send(JSON.stringify({ data: readings }));
            }
        }
    });
  
    socket.on('close', function() {
        if(this === appSocket)
            console.log('Closing connection with App');
        else if(this === robotSocket)
            console.log('Closing connection with Robot');
    });

});