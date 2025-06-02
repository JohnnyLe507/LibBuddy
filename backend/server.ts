import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import cors from 'cors';
import axios from 'axios';
import pool from './db';

dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); //replace origin
app.use(express.json());

const users: { name: string; password: string }[] = [];
// let refreshTokens: string[] = []; //Replace with database
app.get('/users', async (req: any, res: any) => {
    try {
        const result = await pool.query('SELECT *, name FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/token', async (req: any, res: any) => {
    const refreshtoken = req.body.token;
    if (refreshtoken == null) return res.sendStatus(401);
    try {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1',
            [refreshtoken]
        );

        if (result.rows.length === 0) {
            return res.sendStatus(403);
        }

        jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET as string, (err: any, user: any) => {
            if (err) return res.sendStatus(403);
            const userPayload = { id: user.id, name: user.name };
            const accesstoken = generateAccessToken(userPayload);
            res.json({ accesstoken: accesstoken });
        });
    } catch (err) {
        res.status(500).send();
    }
});

app.post('/register', async (req: any, res: any) => {
    try {
        const salt = await bcrypt.genSalt(); // default is 10
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        // const user = { name:req.body.name, password: hashedPassword };
        // users.push(user);
        const user = await pool.query(
            'INSERT INTO users (name, password) VALUES ($1, $2) RETURNING *',
            [req.body.name, hashedPassword]
        );
        res.status(201).json(user.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username already taken' });
        }
        res.status(500).send();
    }
});

app.post('/login', async (req: any, res: any) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE name = $1', [req.body.name]);

        // If no user is found
        if (result.rows.length === 0) {
            return res.status(400).send('Cannot find user');
        }
        const user = result.rows[0];

        if (await bcrypt.compare(req.body.password, user.password)) {
            // res.send('Success');
            if (!process.env.REFRESH_TOKEN_SECRET) {
                res.status(400).send('Cannot find Refresh Token');
                return;
            }
            const userPayload = { id: user.id, name: user.name };
            const accesstoken = generateAccessToken(userPayload);
            const refreshtoken = jwt.sign(userPayload, process.env.REFRESH_TOKEN_SECRET);
            // refreshTokens.push(refreshtoken);
            await pool.query(
                'INSERT INTO refresh_tokens (token, user_id) VALUES ($1, $2)',
                [refreshtoken, user.id]
            );
            res.json({ accesstoken: accesstoken, refreshtoken: refreshtoken });
        } else {
            res.send('Not Allowed');
        }
    } catch {
        res.status(500).send();
    }
});

app.delete('/logout', async (req: any, res: any) => {
    try {
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [req.body.token]);
        res.sendStatus(204); // No content – logout successful
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log out' });
    }
});

app.get('/search', async (req: any, res: any) => {
    try {
        const response = await axios.get(`https://openlibrary.org/search.json?q=${req.query.q}`);
        const data = (response.data as { docs: any[] }).docs;
        const uniqueResults = Array.from(
            new Map(data.map(book => [book.title, book])).values()
        );
        const topResults = uniqueResults.slice(0, 10);
        res.json(topResults);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/works/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://openlibrary.org/works/${id}.json`);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/authors/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://openlibrary.org/authors/${id}.json`);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/authors/:id/works', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://openlibrary.org/authors/${id}/works.json`);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/subjects/:subject', async (req: any, res: any) => {
    try {
        const { subject } = req.params;
        const response = await axios.get(`https://openlibrary.org/subjects/${subject}.json?limit=1`);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.post('/add-to-reading-list', authenticateToken, async (req: any, res: any) => {
    const userId = req.user.id;
    const { bookId } = req.body;

    try {
        await pool.query(
            'INSERT INTO reading_list (user_id, book_id) VALUES ($1, $2)',
            [userId, bookId]
        );
        res.sendStatus(200);
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'Book already in reading list' });
        }
        console.error(err);
        res.sendStatus(500);
    }
}
);

// GET /reading-list
app.get('/reading-list', authenticateToken, async (req: any, res: any) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'SELECT * FROM reading_list WHERE user_id = $1',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching reading list:', error);
        res.status(500).json({ error: 'Failed to fetch reading list' });
    }
});

// DELETE /reading-list/:bookId
app.delete('/reading-list/:bookId', authenticateToken, async (req: any, res: any) => {
    const userId = req.user.id;
    const { bookId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM reading_list WHERE user_id = $1 AND book_id = $2 RETURNING *',
            [userId, bookId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Book not found in reading list' });
        }

        res.json({ message: 'Book removed from reading list' });
    } catch (error) {
        console.error('Error removing book:', error);
        res.status(500).json({ error: 'Failed to remove book from reading list' });
    }
});


function generateAccessToken(user: any) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
}

function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
app.listen(3000)
