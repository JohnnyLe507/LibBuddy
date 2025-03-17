import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const users: { name: string; password: string }[] = [];
let refreshTokens: string[] = []; //Replace with database

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

function generateAccessToken(user: any) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
}

app.listen(3000)
