import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import cors from 'cors';
import axios from 'axios';

dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); //replace origin
app.use(express.json());

const users: { name: string; password: string }[] = [];
let refreshTokens: string[] = []; //Replace with database
app.get('/users', (req: any, res: any) => {
    res.json(users);
});

app.post('/token', (req: any, res: any) => {
    const refreshtoken = req.body.token;
    if (refreshtoken == null) return res.sendStatus(401);
    if (!refreshTokens.includes(refreshtoken)) return res.sendStatus(403);
    jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET as string, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        const accesstoken = generateAccessToken({ name: user.name });
        res.json({ accesstoken: accesstoken });
    });
});

app.post('/register', async(req, res) => {
  try {
    const salt = await bcrypt.genSalt(); // default is 10
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = { name:req.body.name, password: hashedPassword };
    users.push(user);
    res.status(201).json(user);
  } catch {
    res.status(500).send();
  }
});

app.post('/login', async(req, res) => {
    const user = users.find(user => user.name === req.body.name);
    if (user == null) {
        res.status(400).send('Cannot find user');
        return;
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)) {
            // res.send('Success');
            if (!process.env.REFRESH_TOKEN_SECRET) {
                res.status(400).send('Cannot find Refresh Token');
                return;
            }
            const accesstoken = generateAccessToken(user);
            const refreshtoken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
            refreshTokens.push(refreshtoken);
            res.json({ accesstoken: accesstoken, refreshtoken: refreshtoken });
        } else {
            res.send('Not Allowed');
        }
    } catch {
        res.status(500).send();
    }
});

app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token);
    res.sendStatus(204);
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

function generateAccessToken(user: any) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
}

app.listen(3000)
