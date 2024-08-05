const express = require('express');
const bodyParser = require('body-parser');
const dbConnection = require('./Database');
const session = require('express-session');

const app = express();
const port = 8080;

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Sign up
// POST Mapping
// Link is "http://localhost:8080/signup"
app.post('/signup', (req, res) => {
    const { fullName, email, pin } = req.body;

    if (!fullName || !email || !pin) {
        return res.status(400).send({ error: true, message: 'Please provide fullName, email, and pin' });
    }

    const connection = dbConnection();

    const query = 'INSERT INTO users (fullName, email, pin) VALUES (?, ?, ?)';
    connection.query(query, [fullName, email, pin], (err, results) => {
        if (err) {
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        res.send({ error: false, data: results, message: 'User registered successfully' });
    });

    connection.end();
});

// Sign in
// POST Mapping
// Link is "http://localhost:8080/signin"
app.post('/signin', (req, res) => {
    const { email, pin } = req.body;

    if (!email || !pin) {
        return res.status(400).send({ error: true, message: 'Please provide email and pin' });
    }

    const connection = dbConnection();

    const query = 'SELECT * FROM users WHERE email = ? AND pin = ?';
    connection.query(query, [email, pin], (err, results) => {
        if (err) {
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        if (results.length > 0) {
            res.send({ error: false, message: 'Valid credentials' });
        } else {
            res.send({ error: true, message: 'Invalid credentials' });
        }
    });

    connection.end();
});

// Reset password
// POST Mapping
// Link is "http://localhost:8080/resetpassword"
app.post('/resetpassword', (req, res) => {
    const { email, newPin } = req.body;

    if (!email || !newPin) {
        return res.status(400).send({ error: true, message: 'Please provide email and new pin' });
    }

    const connection = dbConnection();

    const query = 'UPDATE users SET pin = ? WHERE email = ?';
    connection.query(query, [newPin, email], (err, results) => {
        if (err) {
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        if (results.affectedRows > 0) {
            res.send({ error: false, message: 'Password reset successfully' });
        } else {
            res.send({ error: true, message: 'Invalid email' });
        }
    });

    connection.end();
});

// Reset password
app.post('/resetpassword', (req, res) => {
    const { currentPin, newPin, confirmPin } = req.body;
    const email = req.session.email; // Get email from session

    if (!email || !currentPin || !newPin || !confirmPin) {
        return res.status(400).send({ error: true, message: 'Please provide current pin, new pin, and confirm pin' });
    }

    if (newPin !== confirmPin) {
        return res.status(400).send({ error: true, message: 'New pin and confirm pin do not match' });
    }

    const connection = dbConnection();

    const query = 'SELECT * FROM users WHERE email = ? AND pin = ?';
    connection.query(query, [email, currentPin], (err, results) => {
        if (err) {
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        if (results.length > 0) {
            const updateQuery = 'UPDATE users SET pin = ? WHERE email = ?';
            connection.query(updateQuery, [newPin, email], (updateErr, updateResults) => {
                if (updateErr) {
                    return res.status(500).send({ error: true, message: 'Database error' });
                }
                res.send({ error: false, message: 'Password reset successfully' });
            });
        } else {
            res.send({ error: true, message: 'Invalid current pin' });
        }
    });

    connection.end();
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
