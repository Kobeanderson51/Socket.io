const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT || 3000;

const { Server } = require('socket.io');
const io = new Server(server);

const users = {}; // To keep track of connected users

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    // Store the user with the username and socket ID
    socket.on('set_username', (username) => {
        // Remove old username if it exists
        if (socket.username) {
            delete users[socket.username];
        }
        users[username] = socket.id;
        socket.username = username;
        io.emit('server_message', `${username} has joined the chat.`);
    });

    // Handle client messages
    socket.on('client message', (msg) => {
        console.log('message: ' + msg);
        // Broadcast the message to all other clients
        socket.broadcast.emit('server_message', msg);
    });

    // Handle kick command
    socket.on('kick_user', ({ userToKick, password }) => {
        if (password === 'k0b3') { // Simple password check
            const socketId = users[userToKick];
            if (socketId) {
                io.to(socketId).disconnectSockets(); // Disconnect the user
                io.emit('server_message', `${userToKick} has been kicked from the chat.`);
                delete users[userToKick]; // Remove the user from the users list
            } else {
                io.emit('server_message', `User ${userToKick} not found.`);
            }
        } else {
            io.emit('server_message', 'Invalid password.');
        }
    });

    // Handle direct messages
    socket.on('direct_message', ({ userToDM, dmMessage }) => {
        const socketId = users[userToDM];
        if (socketId) {
            io.to(socketId).emit('direct_message', { from: socket.username, message: dmMessage });
            socket.emit('server_message', `Direct message sent to ${userToDM}`);
        } else {
            socket.emit('server_message', `User ${userToDM} not found.`);
        }
    });

    // Send a welcome message to the newly connected user
    socket.emit('server_message', 'Hello from the server');

    // Handle user disconnect
    socket.on('disconnect', () => {
        if (socket.username) {
            delete users[socket.username];
            io.emit('server_message', `${socket.username} has left the chat.`);
        }
        console.log('user disconnected');
    });
});



server.listen(port, () => {
    console.log(`Server listening at port: ${port}`);
});
