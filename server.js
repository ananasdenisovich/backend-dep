const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const upload = multer();

let fetch;
async function initializeFetch() {
    try {
        const fetchModule = await import('node-fetch');
        fetch = fetchModule.default;
    } catch (err) {
        fetch = require('node-fetch');
    }



    const app = express();
    const PORT = process.env.PORT || 3000;

    const corsOptions = {
        origin: 'https://backend-dep-aq9c.onrender.com',
        credentials: true,
    };

    app.use(cors(corsOptions));

    app.use(bodyParser.json());
    app.use(express.json());
//local: mongodb://localhost:27017/backend
    //atlas: mongodb+srv://ananasovich2002:87787276658Aa.@cluster0.80wl48q.mongodb.net/backend
    mongoose.connect('mongodb+srv://ananasovich2002:87787276658Aa.@cluster0.80wl48q.mongodb.net/backend', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
        console.log('Connected to MongoDB');
    });

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const tokenExpiration = '1h';

    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    const userSchema = new mongoose.Schema({
        username: { type: String, unique: true, required: true },
        password: { type: String, required: true },
        programs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
        test_scores: [{ language: String, score: Number }],
    });

    const User = mongoose.model('User', userSchema);

    const { Schema, model } = mongoose;

    const bookSchema = new Schema({
        title: { type: String, required: true },
        author: { type: String },
        language: { type: String, required: true },
        level: { type: String },
        publisher: { type: String },
    });

    const Book = model('Book', bookSchema);

    const programSchema = new mongoose.Schema({
        name: { type: String, required: true },
        language: { type: String, required: true },
        books_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    });
    const Program = model('Program', programSchema);

    const testScoreSchema = new mongoose.Schema({
        userId: String,
        language: String,
        score: Number,
    });

    const TestScore = mongoose.model('TestScore', testScoreSchema);

    const questionSchema = new mongoose.Schema({
        language: { type: String, required: true },
        text: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOption: { type: String, required: true },
    });

    const Question = mongoose.model('Question', questionSchema);
    const authenticateJWT = (req, res, next) => {
        const token = req.header('Authorization').split(' ')[1];
        console.log('Received Token:', token);

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                console.error('Token Verification Error:', err);
                return res.status(401).json({ error: 'Invalid token' });
            }

            req.user = user;
            next();
        });
    };

    app.post('/register', async (req, res) => {
        try {
            const { username, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, password: hashedPassword });
            await newUser.save();

            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const token = jwt.sign({ userId: user._id }, jwtSecret, {
                expiresIn: tokenExpiration,
            });

            const populatedUser = await User.findById(user._id).populate('programs');

            res.cookie('authToken', token, {
                httpOnly: true,
                maxAge: 3600000,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'None',
            });

            res.status(200).json({ token, userId: user._id, programs: populatedUser.programs });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/logout', (req, res) => {
        res.status(200).json({ message: 'Logout successful' });
    });

    app.get('/protected-route', authenticateJWT, (req, res) => {
        res.json({ message: 'Access granted' });
    });

    app.post('/books/:language', async (req, res) => {
        try {
            const { title, author, level, publisher } = req.body;
            const language = req.params.language.toLowerCase();
            const newBook = new Book({ title, author, language, level, publisher });
            await newBook.save();

            res.status(201).json({ message: 'Book added successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.use('/books', express.static('books'));

    app.get('/books/:language', async (req, res) => {
        try {
            const language = req.params.language.toLowerCase();
            const books = await Book.find({ language });
            res.json(books);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/books', async (req, res) => {
        try {
            const { language, sortBy, page, limit, level, author, publisher } = req.query;

            let query = {};

            if (language) {
                query.language = language.toLowerCase();
            }

            if (level) {
                query.level = level;
            }

            if (author) {
                query.author = author;
            }

            if (publisher) {
                query.publisher = publisher;
            }

            const sortOrder = sortBy === 'desc' ? -1 : 1;
            const books = await Book.find(query)
                .sort({ title: sortOrder })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            res.json(books);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/programs', async (req, res) => {
        try {
            const { name } = req.body;
            const newProgram = new Program({ name });
            await newProgram.save();

            res.status(201).json({ message: 'Program created successfully', program: newProgram });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/programs', async (req, res) => {
        try {
            const programs = await Program.find();
            res.json(programs);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/add-program/:userId/:programId', authenticateJWT, async (req, res) => {
        try {
            const userId = req.params.userId;
            const programId = req.params.programId;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (user.programs.includes(programId)) {
                return res.status(400).json({ error: 'Program already added' });
            }

            user.programs.push(programId);
            await user.save();

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error adding program:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/remove-program/:userId/:programId', authenticateJWT, async (req, res) => {
        try {
            const userId = req.params.userId;
            const programId = req.params.programId;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (!user.programs.includes(programId)) {
                return res.status(400).json({ error: 'Program not found in user\'s list' });
            }

            user.programs = user.programs.filter(p => p.toString() !== programId);
            await user.save();

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error removing program:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/user-programs/:userId', authenticateJWT, async (req, res) => {
        try {
            const userId = req.params.userId;

            const user = await User.findById(userId).populate('programs');

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.status(200).json({ userPrograms: user.programs });
        } catch (error) {
            console.error('Error fetching user programs:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/test-scores', async (req, res) => {
        try {
            const { userId, language, score } = req.query;

            const testScore = new TestScore({ userId, language, score });
            await testScore.save();

            res.json({ success: true, message: 'Test score saved successfully.' });
        } catch (error) {
            console.error('Error saving test score:', error);
            res.status(500).json({ success: false, error: 'Internal server error.' });
        }
    });

    app.get('/test-scores', async (req, res) => {
        try {
            const userId = req.query.userId;
            const language = req.query.language;
            const testScore = await TestScore.findOne({ userId, language });

            if (testScore) {
                res.json({ success: true, score: testScore.score });
            } else {
                res.status(404).json({ success: false, error: 'Test score not found.' });
            }
        } catch (error) {
            console.error('Error fetching test score:', error);
            res.status(500).json({ success: false, error: 'Internal server error.' });
        }
    });

    app.post('/saveTestScores/:userId', authenticateJWT, async (req, res) => {
        try {
            const userId = req.params.userId;
            const { language, score } = req.body;
            const user = await User.findById(userId);
            user.test_scores.push({ language, score });
            await user.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Error saving test scores:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });


    app.get('/getProgramId/:userId/:language/:score', authenticateJWT, async (req, res) => {
        try {
            const userId = req.params.userId;
            const language = req.params.language;
            const score = parseInt(req.params.score);

            const program = await Program.findOne({ language, scoreRange: { $gte: score } }).sort('scoreRange').limit(1);

            if (program) {
                res.json({ success: true, programId: program._id });
            } else {
                res.json({ success: false, error: 'Program not found' });
            }
        } catch (error) {
            console.error('Error getting program ID:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
    app.get('/getTestQuestions/:language', async (req, res) => {
        try {
            const language = req.params.language;

            const questions = await Question.find({ language });

            if (questions.length > 0) {

                const correctAnswers = questions.map(question => question.correctOption);

                res.json({ success: true, questions, correctAnswers });
            } else {
                res.json({ success: false, error: 'No questions found for the specified language' });
            }
        } catch (error) {
            console.error('Error fetching test questions:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });


    app.get('/getUserIdByUsername/:username', async (req, res) => {
        try {
            const { username } = req.params;
            const user = await User.findOne({ username });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.json({ userId: user._id });
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.listen(process.env.PORT || PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

initializeFetch();
