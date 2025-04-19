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
app.get('/users', authenticateToken, async(req: any, res: any) => {
    try {
        const result = await pool.query('SELECT id, name FROM users');
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
      }
});

app.post('/token', async(req: any, res: any) => {
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
            const accesstoken = generateAccessToken({ name: user.name });
            res.json({ accesstoken: accesstoken });
        });
    } catch (err) {
        res.status(500).send();
    }
});

app.post('/register', async(req:any , res:any) => {
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

app.post('/login', async(req:any, res:any) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE name = $1', [req.body.name]);

        // If no user is found
        if (result.rows.length === 0) {
          return res.status(400).send('Cannot find user');
        }
        const user = result.rows[0];

        if(await bcrypt.compare(req.body.password, user.password)) {
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

app.delete('/logout', async(req:any, res:any) => {
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

app.get('/book/:id', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`https://openlibrary.org/works/${id}.json`);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

function generateAccessToken(user: any) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
}

function authenticateToken(req:any, res:any, next:any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err:any, user:any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
app.listen(3000)
