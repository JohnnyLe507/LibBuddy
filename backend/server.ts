import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import cors from 'cors';
import axios from 'axios';
import pool from './db';
import NodeCache from "node-cache";

dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); //replace origin
app.use(express.json());
const cache = new NodeCache({ stdTTL: 3600 });

interface AuthenticatedRequest extends Request {
    user: { id: number; name: string };
}

interface JwtPayload {
    id: number;
    name: string;
}

app.get('/users', async (req: any, res: any) => {
    try {
        const result = await pool.query('SELECT *, name FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/token', async (req: Request, res: Response) => {
    const refreshtoken = req.body.token;
    if (refreshtoken == null) {
        res.sendStatus(401);
        return;
    }
    try {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1',
            [refreshtoken]
        );

        if (result.rows.length === 0) {
            res.sendStatus(403);
            return;
        }

        jwt.verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET as string, (err: any, user: any) => {
            if (err) {
                res.sendStatus(403);
                return;
            }
            const userPayload = { id: user.id, name: user.name };
            const accesstoken = generateAccessToken(userPayload);
            res.json({ accesstoken: accesstoken });
        });
    } catch (err) {
        res.status(500).send();
    }
});

app.post('/register', async (req: Request, res: Response) => {
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
            res.status(409).json({ error: 'Username already taken' });
            return;
        }
        res.status(500).send();
    }
});

app.post('/login', async (req: Request, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE name = $1', [req.body.name]);

        // If no user is found
        if (result.rows.length === 0) {
            res.status(400).send('Cannot find user')
            return;
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
            res.status(401).json({ error: 'Invalid password' });
            // res.send('Not Allowed');
        }
    } catch {
        res.status(500).send();
    }
});

app.delete('/logout', async (req: Request, res: Response) => {
    try {
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [req.body.token]);
        res.sendStatus(204); // No content – logout successful
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log out' });
    }
});

const cacheMiddleware = (key: string, ttl: number, fetchFn: () => Promise<any>, res: any) => {
    const cached = cache.get(key);
    if (cached) {
        return res.json(cached);
    }
    fetchFn().then(data => {
        cache.set(key, data, ttl);
        res.json(data);
    }).catch(err => {
        console.error(err);
        res.status(500).json({ error: err });
    });
};


app.get('/search', async (req: Request, res: Response) => {
    try {
        const response = await axios.get(`https://openlibrary.org/search.json?title=${req.query.q}`, {
            params: { q: req.query.q, limit: 10 },
        });
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

app.get('/works/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        cacheMiddleware(`works-${id}`, 86400, async () => {
            const response = await axios.get(`https://openlibrary.org/works/${id}.json`);
            return response.data;
        }, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/ratings/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        cacheMiddleware(`ratings-${id}`, 86400, async () => {
            const response = await axios.get(`https://openlibrary.org/works/${id}/ratings.json`);
            return response.data;
        }, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/editions/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        cacheMiddleware(`editions-${id}`, 86400, async () => {
            const response = await axios.get(`https://openlibrary.org/works/${id}/editions.json`);
            return response.data;
        }, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/authors/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        cacheMiddleware(`author-${id}`, 86400, async () => {
            const response = await axios.get(`https://openlibrary.org/authors/${id}.json`);
            return response.data;
        }, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/authors/:id/works', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        cacheMiddleware(`author-works-${id}`, 86400, async () => {
            const response = await axios.get(`https://openlibrary.org/authors/${id}/works.json`);
            return response.data;
        }, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.get('/subjects/:subject', async (req: Request, res: Response) => {
    try {
        const { subject } = req.params;
        const normalizedSubject = subject.toLowerCase();
        const { offset = 0, limit = 6, ebooks, published_in } = req.query;

        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
            details: "true",
        });

        if (ebooks === 'true') {
            params.append("ebooks", "true");
        }

        if (published_in) {
            params.append("published_in", published_in as string);
        }

        const openLibraryUrl = `https://openlibrary.org/subjects/${normalizedSubject}.json?${params.toString()}`;
        // console.log("Fetching from Open Library:", openLibraryUrl);
        const cacheKey = `subject-${normalizedSubject}-${params.toString()}`;

        cacheMiddleware(cacheKey, 86400, async () => {
            const response = await axios.get(openLibraryUrl);
            return response.data;
        }, res);
    } catch (error) {
        console.error("Error fetching subject data:", error);
        res.status(500).json({ error: "Failed to fetch subject data" });
    }
});

app.post('/add-to-reading-list', authenticateToken, async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const { bookId } = req.body;

    try {
        await pool.query(
            'INSERT INTO reading_list (user_id, book_id) VALUES ($1, $2)',
            [userId, bookId]
        );
        res.sendStatus(200);
    } catch (err: any) {
        if (err.code === '23505') {
            res.status(409).json({ message: 'Book already in reading list' })
            return;
        }
        console.error(err);
        res.sendStatus(500);
    }
}
);

// GET /reading-list
app.get('/reading-list', authenticateToken, async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.id;

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
app.delete('/reading-list/:bookId', authenticateToken, async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user.id;
    const { bookId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM reading_list WHERE user_id = $1 AND book_id = $2 RETURNING *',
            [userId, bookId]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'Book not found in reading list' })
            return;
        }

        res.json({ message: 'Book removed from reading list' });
    } catch (error) {
        console.error('Error removing book:', error);
        res.status(500).json({ error: 'Failed to remove book from reading list' });
    }
});

app.get('/bestsellers', async (req: Request, res: Response) => {
    try {
        const response = await axios.get('https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json', {
            params: {
                'api-key': process.env.NYT_API_KEY,
            }
        });

        const data = response.data as { results: { books: any[] } };
        const books = data.results.books.map(book => ({
            title: book.title,
            author: book.author,
            book_image: book.book_image,
            amazon_product_url: book.amazon_product_url,
        }));

        res.json(books);
    } catch (error) {
        console.error("Error fetching bestsellers:", error);
        res.status(500).json({ error: 'Failed to fetch bestsellers' });
    }
});

app.delete('/cache/:key', (req: Request, res: Response) => {
    const { key } = req.params;
    const success = cache.del(key);
    if (success) {
        res.json({ message: `Cache cleared for key: ${key}` });
    } else {
        res.status(404).json({ error: `Key not found: ${key}` });
    }
});

// Clear ALL cache (use carefully!)
app.delete('/cache', (req: Request, res: Response) => {
    cache.flushAll();
    res.json({ message: 'All cache cleared' });
});


function generateAccessToken(user: { id: number; name: string }) {
    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' });
}

function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.sendStatus(401); // No return here
        return;
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, decoded) => {
        if (err) {
            res.sendStatus(403); // No return here
            return;
        }
        const user = decoded as JwtPayload;
        (req as AuthenticatedRequest).user = user;
        next();
    });
}
app.listen(3000)
