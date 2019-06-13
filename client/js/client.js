// Socket settings:
let address = 'localhost';
let port    = '8080';
let socket  = null;

// Editor state:
let isSimulating = false;
let isConnected  = false;
let isEditing    = false;
let isPathing    = false;
let isGoto       = false;

let editAction = 'obstacle';

// Search:
let searchMethod = 'A*';

// Canvas:
let canvas  = null;
let context = null;

// Map:
let map = null;

window.onload = function() {
    canvas  = document.getElementById('canvas');
    context = canvas.getContext('2d');
    canvas.width  = window.innerWidth - $('.navbar').innerWidth();
    canvas.height = window.innerHeight;


    /*grid = [[0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 1, 0],
        [0, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0]]**/

    // Instancia o mapa:
    map = new GridMAP(canvas);

    // Define mouse events:
    window.addEventListener('wheel', function(event) {
        if(isConnected) {
            map.setZoom(event.deltaY);
            map.draw();
        }
    });

    window.addEventListener('mousemove', function(event) {
        let mouse = getMouseOffset(event);
        if(isEditing) {
            map.isHovering(mouse.x, mouse.y);
            map.draw();
        }
    });

    window.addEventListener('mousedown', function(event) {
        let mouse = getMouseOffset(event);

        // Pega a celula no mouse:
        let pos = map.getCellAtMouse(mouse.x, mouse.y);
        if(pos === null) return;

        // Edicao do mapa:
        if(isEditing && editAction && isConnected) {
            map.fillCell(mouse.x, mouse.y, editAction);
            map.draw();
        }
        // Criacao de rotas:
        else if(isPathing) {
            // Se ja existe uma posicao de inicio,
            // o usuario marcou a posicao final.
            // Inicia o algoritmo:
            if(map.start) {
                // Verifica se a celula esta livre:
                if(map.isOpen({x: pos.y, y: pos.x}))
                    map.end = {x: pos.y, y: pos.x};
                else return;

                // Executa o algoritmo de roteamento:
                map.isRoutingForRobot = false;
                map.search(searchMethod);
            }
            // Marca a posicao inicial:
            else {
                // Verifica se a celula esta livre:
                if(map.isOpen({x: pos.y, y: pos.x}))
                    map.start = {x: pos.y, y: pos.x};
            }

            map.draw();
        }
        // Movimento do veiculo:
        else if(isGoto) {
            map.isRoutingForRobot = true;
            map.goTo(pos);
        }
    });
}

function toggleConnect() {
    if(!isConnected) {
        openWebsocket();
    } else {
        socket.close();
    }
}

function toggleSimulate() {
    disableAll('simulate')

    if(isSimulating) {
        isSimulating = false;
        $('#simulationOptions').addClass('hidden');
    } else {
        isSimulating = true;
        if(!map.grid) {
            let size = 100;
            let prob = 0.2;

            let grid = new Array(size);
            for(let i=0; i < size; i++) {
                grid[i] = new Array(size)
                for(let j=0; j< size; j++)
                    grid[i][j] = prob;
            }
            map.grid = grid;
            map.draw();
        }

        $('#simulationOptions').removeClass('hidden');
    }
}

function toggleEdit() {
    disableAll('edit');

    if(isEditing) {
        isEditing = false;
        $('#edit').removeClass('selected');
        $('#editOptions').addClass('hidden');
    } else {
        isEditing = true;
        $('#edit').addClass('selected');
        $('#editOptions').removeClass('hidden');
    }
}

function togglePath() {
    disableAll('path');

    if(isPathing) {
        isPathing = false;
        $('#path').removeClass('selected');
        $('#searchOptions').addClass('hidden');
    } else {
        isPathing = true;
        $('#path').addClass('selected');
        $('#searchOptions').removeClass('hidden');
    }
}

function toggleGoto() {
    disableAll('goto');

    if(isGoto) {
        isGoto = false;
        $('#goto').removeClass('selected');
    } else {
        isGoto = true;
        $('#goto').addClass('selected');
    }
}

function disableAll(mode) {
    if(mode === 'simulate') {
        isGoto = false;
        $('#options').addClass('hidden');
    }

    if(isEditing && mode !== 'edit')
        toggleEdit();
    else if(isPathing && mode !== 'path')
        togglePath();
    else if(isGoto && mode !== 'goto')
        toggleGoto();
}

function openWebsocket() {
    try {
        address = document.getElementById('ip').value;
        port    = document.getElementById('port').value;

        socket = new WebSocket("ws://" + address + ":" + port);

        // When the connection is open, update the connection status:
        socket.onopen = function () {
            console.log("Connected");
            changeUIconnected();
            isConnected = true;
            
            let msg = { command: 'app_socket' };
            send(msg);
            send({command: 'start_robot'});
        };

        // Log errors:
        socket.onerror = function (error) {
            console.log("Disconnected");
        };

        // Update
        socket.onclose = function (event) {
            console.log('WebSocket is closed');

            // Code 1006: Abnormal Closure (https://www.iana.org/assignments/websocket/websocket.xml):
            if(event.code === 1006)
                alert("CONNECTION REFUSED:\nCheck if the IP:Port is correct and listening to connections.");

            socket = null;
            changeUIdisconnected();
            isConnected = false;

            // Enable address input:
            $('#ip').prop('disabled', false);
            $('#port').prop('disabled', false);
        };

        // Log messages from the server
        socket.onmessage = function(event) {
            console.log('Server: ' + event.data);
            data = JSON.parse(event.data);

            if(data.command === 'robot_socket')
                map.initialize(data);
            else if(data.command === 'new_robot_data')
                map.update(data);
        };

    } catch(exception) {
        console.log(exception);
    }
}

function changeUIconnected() {
    $('#connect').html('DISCONNECT');
    $('#ip').prop('disabled', true);
    $('#port').prop('disabled', true);

    $('#options').removeClass('hidden');

    isSimulating = false;
    $('#simulationOptions').addClass('hidden');
    $('#editOptions').addClass('hidden');
    $('#searchOptions').addClass('hidden');

    showMap();
}

function changeUIdisconnected() {
    $('#connect').html('CONNECT');
    $('#ip').prop('disabled', false);
    $('#port').prop('disabled', false);
    
    $('#options').addClass('hidden');

    if(!map.hasData())
        clearMap();
}

function clearMap() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function showMap() {
    map.draw();
    //map.update();
}

function send(object) {
    try {
        socket.send(JSON.stringify(object));
    } catch(e) {
        return;
    }
}

function getMouseOffset(event) {
    event = event || window.event;
    var x = (event.pageX || event.clientX) - canvas.getBoundingClientRect().left;
    var y = (event.pageY || event.clientY) - canvas.getBoundingClientRect().top;
    return {x, y};
}

function changeEditAction(button) {
    editAction = button.value;
}

function changeSearchMethod(button) {
    searchMethod = button.value;
}