var Server = require('ws').Server;
var port   = process.env.PORT || 8080;
var ws     = new Server({ port: port });

// Sockets:
let app_sockets  = [];
let robot_socket = null;

ws.on('connection', function(socket) {

    console.log('> New WebSocket');

    socket.on('message', function(msg) {
        // Tenta transformar a mensagem em um objeto JSON:
        try {
            msg = JSON.parse(msg);
        }
        catch(error) {
            return;
        }

        // Exibe a mensagem no console:
        console.log('> Message:');
        console.log(msg);
        let response = null;

        // Mensagens de identificacao do WebSocket:
        if(msg.command === 'app_socket') {
            app_sockets.push(this);
        } else if(msg.command === 'robot_socket') {
            robot_socket = this;
            appMulticast(msg);
        }

        // App de Visualizacao - Get Robot Data:
        if(msg.command === 'get_robot_data') {
            appMulticast({ data: readings });
        }
        // Visualization App - Start SLAM:
        else if(msg.command === 'start_slam') {
            if(robot_socket) {
                robot_socket.send(JSON.stringify({
                    command: 'start'
                }))
            }
        }

        // Firmware - Add new data:
        if(msg.command === 'new_robot_data') {
            appMulticast(msg);
        }
    });
  
    socket.on('close', function() {
        index = app_sockets.indexOf(this);
        if(index >= 0) {
            app_sockets.splice(index, 1);
            console.log('Closing connection with App #' + index);
        }
        else
            console.log('Closing connection with Robot');
    });

});

function appMulticast(msg) {
    // Envia uma mensagem a todos os sockets para visualizacao:
    if(app_sockets.length > 0) {
        for(let i = 0; i < app_sockets.length; i++)
            app_sockets[i].send(JSON.stringify(msg));
    }
}

console.log('Server is listening at port ' + port);