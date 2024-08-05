const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const dbConnection = require('./Database');

const app = express();
const port = 8080;

// Configure body-parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Sign up
// POST Method
// Link http://localhost:8080/signup
app.post('/signup', (req, res) => {
    const { fullName, email, pin } = req.body;

    if (!fullName || !email || !pin) {
        return res.status(400).send({ error: true, message: 'Please provide fullName, email, and pin' });
    }

    const connection = dbConnection();

    const query = 'INSERT INTO users (fullName, email, pin) VALUES (?, ?, ?)';
    connection.query(query, [fullName, email, pin], (err, results) => {
        if (err) {
            console.error('Error during signup query:', err); // Detailed logging
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        res.send({ error: false, data: results, message: 'User registered successfully' });
    });

    connection.end();
});

// Sign in
// POST Method
// http://localhost:8080/signin
app.post('/signin', (req, res) => {
    const { email, pin } = req.body;

    if (!email || !pin) {
        return res.status(400).send({ error: true, message: 'Please provide email and pin' });
    }

    const connection = dbConnection();

    const query = 'SELECT * FROM users WHERE email = ? AND pin = ?';
    connection.query(query, [email, pin], (err, results) => {
        if (err) {
            console.error('Error during signin query:', err); // Detailed logging
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        if (results.length > 0) {
            req.session.email = email; // Store email in session
            console.log('Session email set:', req.session.email); // Debug log
            res.send({ error: false, message: 'Valid credentials' });
        } else {
            res.send({ error: true, message: 'Invalid credentials' });
        }
    });

    connection.end();
});

// Debug route to set email in session manually for testing
// POST Method
// Link http://localhost:8080/setemail
app.post('/setemail', (req, res) => {
    const { email } = req.body;
    req.session.email = email;
    res.send({ error: false, message: 'Email set in session' });
});

// Reset password
// POST Method
// Link http://localhost:8080/resetpassword
app.post('/resetpassword', (req, res) => {
    const { currentPin, newPin, confirmPin } = req.body;
    const email = req.session.email; // Get email from session

    console.log('Session email:', email); // Debug log
    console.log('Request body:', req.body); // Debug log

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
            console.error('Error during select query:', err); // Detailed logging
            connection.end(); // Ensure connection is closed
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        if (results.length > 0) {
            const updateQuery = 'UPDATE users SET pin = ? WHERE email = ?';
            connection.query(updateQuery, [newPin, email], (updateErr, updateResults) => {
                connection.end(); // Ensure connection is closed after all queries
                if (updateErr) {
                    console.error('Error during update query:', updateErr); // Detailed logging
                    return res.status(500).send({ error: true, message: 'Database error' });
                }
                res.send({ error: false, message: 'Password reset successfully' });
            });
        } else {
            connection.end(); // Ensure connection is closed
            res.send({ error: true, message: 'Invalid current pin' });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
