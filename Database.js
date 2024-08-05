var mysql = require('mysql');

function DBconnection() {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'KasunSQL',
        database: 'mpay'
    });

    connection.connect(function(err) {
        if (err) {
            console.error('Error connecting to database: ' + err.stack);
            return;
        }
        console.log('Connected to database as id ' + connection.threadId);
    });

    connection.on('error', function(err) {
        console.error('Database error: ' + err.stack);
        // Handle disconnects/reconnects as needed
    });

    return connection;
}

module.exports= DBconnection;
