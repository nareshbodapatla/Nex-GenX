const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const secretKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcxODg4MzUzMiwiZXhwIjoxNzE4ODg3MTMyfQ.V9wRX75VMLhhtf0LPQRXTWyj7WzQjX9HyHCb010Wybo'; // Replace with your actual secret key

let users = [];
let id = 1;

// Middleware to authenticate JWT token
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    });
}

// Global error handler middleware
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Bad request - invalid JSON' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
}

// Login endpoint to generate token
app.post('/login', (req, res) => {
    const token = jwt.sign({ userId: 1 }, secretKey, { expiresIn: '1h' });
    res.json({ token });
});

// Create a new user
app.post('/users', authenticate, (req, res, next) => {
    try {
        const user = { id: id++, ...req.body };
        users.push(user);
        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
});

// Get user details
app.get('/users/:id', authenticate, (req, res, next) => {
    try {
        const user = users.find(u => u.id === parseInt(req.params.id));
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        next(err);
    }
});

// Update user information
app.put('/users/:id', authenticate, (req, res, next) => {
    try {
        const user = users.find(u => u.id === parseInt(req.params.id));
        if (user) {
            Object.assign(user, req.body);
            res.json(user);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        next(err);
    }
});

// Delete a user
app.delete('/users/:id', authenticate, (req, res, next) => {
    try {
        const index = users.findIndex(u => u.id === parseInt(req.params.id));
        if (index !== -1) {
            users.splice(index, 1);
            res.status(204).send();
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        next(err);
    }
});

// Use the error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
