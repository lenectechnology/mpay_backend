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


// Verify PIN
// POST Method
// Link http://localhost:8080/verifypin
app.post('/verifypin', (req, res) => {
    const { pin } = req.body;

    // Ensure the pin is provided
    if (!pin) {
        return res.status(400).send({ error: true, message: 'Please provide a pin' });
    }

    // Establish database connection
    const connection = dbConnection();

    // SQL query to verify if the pin matches a user in the database
    const query = 'SELECT * FROM users WHERE web_pin = ?';
    connection.query(query, [pin], (err, results) => {
        connection.end(); // Close the database connection

        if (err) {
            console.error('Error during PIN verification query:', err);
            return res.status(500).send({ error: true, message: 'Database error' });
        }

        // Check if a user was found
        if (results.length > 0) {
            // Success: valid PIN
            res.send({ error: false, message: 'PIN verified successfully', user: results[0] });
        } else {
            // Failure: invalid PIN
            res.send({ error: true, message: 'Invalid PIN' });
        }
    });
});




// Sign in
// POST Method
// http://localhost:8080/signin
app.post('/signin', (req, res) => {
    const { UserName, Password } = req.body;

    if (!UserName || !Password) {
        return res.status(400).send({ error: true, message: 'Please provide UserName and Password' });
    }

    const connection = dbConnection();

    const query = 'SELECT * FROM users WHERE UserName = ? AND Password = ?';
    connection.query(query, [UserName, Password], (err, results) => {
        if (err) {
            console.error('Error during signin query:', err); // Detailed logging
            return res.status(500).send({ error: true, message: 'Database error' });
        }
        if (results.length > 0) {
            req.session.UserName = UserName; // Store UserName in session
            console.log('Session UserName set:', req.session.UserName); // Debug log
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
