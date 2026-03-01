"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const generative_ai_1 = require("@google/generative-ai");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
require("dotenv").config(); // safe if .env missing

console.log('--- Startup Config ---');
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);

if (process.env.GEMINI_API_KEY) {
    console.log(
        'GEMINI_API_KEY starts with:',
        process.env.GEMINI_API_KEY.substring(0, 5)
    );
}
console.log('----------------------');
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, 'uploads');
if (!fs_1.default.existsSync(uploadsDir))
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
// Configure multer storage
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, unique + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            cb(null, true);
        else
            cb(new Error('Only image files are allowed'));
    }
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(uploadsDir));
// --- Routes ---
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});
app.get('/api/stars', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stars = yield prisma.star.findMany();
        res.json(stars);
    }
    catch (error) {
        console.error('Error fetching stars:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Submit a contact request
app.post('/api/contact', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { full_name, company, email, phone, country, star_id, event_type, event_date, message } = req.body;
        const request = yield prisma.contactRequest.create({
            data: {
                full_name,
                company,
                email,
                phone,
                country,
                star_id: parseInt(star_id),
                event_type,
                event_date,
                message,
            },
            include: {
                star: true
            }
        });
        // Track analytics event
        yield prisma.analyticsEvent.create({
            data: {
                event_type: 'form_submit',
                page: '/contact',
                country,
                star_id: parseInt(star_id)
            }
        });
        res.status(201).json({ message: 'Request submitted successfully', request });
    }
    catch (error) {
        console.error('Error submitting request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        const token = jsonwebtoken_1.default.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    }
    else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});
// Middleware for Admin Auth
const authenticateAdmin = (req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err)
            return res.status(403).json({ error: 'Forbidden' });
        req.user = decoded;
        next();
    });
};
// Upload images (Protected)
app.post('/api/admin/upload', authenticateAdmin, upload.array('images', 10), (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
    }
    const host = req.headers.host;
    const urls = files.map(f => `http://${host}/uploads/${f.filename}`);
    res.json({ urls });
});
// Get Analytics (Protected)
app.get('/api/analytics', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalRequests = yield prisma.contactRequest.count();
        const stats = yield prisma.analyticsEvent.groupBy({
            by: ['event_type'],
            _count: { id: true }
        });
        res.json({ totalRequests, stats });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- Star Management (Protected) ---
app.get('/api/admin/stars', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stars = yield prisma.star.findMany({
            orderBy: { created_at: 'desc' },
            include: { _count: { select: { requests: true } } }
        });
        res.json(stars);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/api/admin/stars/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const star = yield prisma.star.findUnique({ where: { id: Number(req.params.id) } });
        if (!star)
            return res.status(404).json({ error: 'Star not found' });
        res.json(star);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/admin/stars', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, country, short_bio, full_bio, image_url, availability_status } = req.body;
        const star = yield prisma.star.create({
            data: { name, category, country, short_bio, full_bio, image_url, availability_status: availability_status || 'Available' }
        });
        res.status(201).json(star);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.put('/api/admin/stars/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, country, short_bio, full_bio, image_url, availability_status } = req.body;
        const star = yield prisma.star.update({
            where: { id: Number(req.params.id) },
            data: { name, category, country, short_bio, full_bio, image_url, availability_status }
        });
        res.json(star);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.delete('/api/admin/stars/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.analyticsEvent.deleteMany({ where: { star_id: Number(req.params.id) } });
        yield prisma.contactRequest.deleteMany({ where: { star_id: Number(req.params.id) } });
        yield prisma.star.delete({ where: { id: Number(req.params.id) } });
        res.json({ message: 'Star deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// --- Chat Assistant Logic ---
const getDeviceType = (ua) => {
    if (!ua)
        return 'unknown';
    if (/mobile/i.test(ua))
        return 'mobile';
    if (/tablet/i.test(ua))
        return 'tablet';
    return 'desktop';
};
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const getRosterContext = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stars = yield prisma.star.findMany({
            take: 20,
            select: { name: true, category: true, image_url: true }
        });
        return stars.map(s => `${s.name} (${s.category})`).join(', ');
    }
    catch (e) {
        return "Actors, Influencers, Speakers";
    }
});
const initAI = () => __awaiter(void 0, void 0, void 0, function* () {
    const roster = yield getRosterContext();
    return genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: `You are Dazzbit, your Personal Assistant for Meet My Star, an elite talent management agency.
    
    Current Roster Highlights: ${roster}.
    
    Your mission is to provide an elite, seamless booking experience.
    
    Guidelines:
    1. Categories: We specialize in Actors, Influencers, and Speakers.
    2. Rich Media Triggers (CRITICAL):
       - To show talent cards: Include [[STARS:CategoryName]] (e.g., [[STARS:Actor]]).
       - To show the booking form: Include [[SHOW_FORM]] when helping with inquiry or booking.
    3. Suggestions: Always provide 2-4 structured suggestions at the VERY END of your message in this EXACT format: [[Suggestion 1, Suggestion 2]].
    
    IMPORTANT: Do NOT use markdown bold/italics (like **) around these tags. Keep the tags clean.
    
    Example Response:
    "I would be delighted to show you our premier influencers. [[STARS:Influencer]]
    
    [[Explore Actors, Book a Speaker]]"
    
    When a user asks about talent or categories, prioritize showing the cards.
    When a user mentions booking, pricing, or "how to contact", prioritize showing the form.`
    });
});
let model;
initAI()
    .then(m => {
        model = m;
        console.log('✅ Executive AI System Initialized');
    })
    .catch(err => {
        console.error('❌ FATAL: Executive AI failed to initialize:', err);
    });
// Socket.io Real-time Support Logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join_support', (_a) => __awaiter(void 0, [_a], void 0, function* ({ session_id }) {
        socket.join(session_id);
        console.log(`User joined support session: ${session_id}`);
        try {
            yield prisma.chatSession.upsert({
                where: { id: session_id },
                update: { chat_type: 'LIVE', status: 'waiting' },
                create: { id: session_id, chat_type: 'LIVE', status: 'waiting' }
            });
            io.emit('new_support_request', { session_id, timestamp: new Date() });
        }
        catch (error) {
            console.error('Error joining support:', error);
        }
    }));
    socket.on('send_live_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { session_id, message, sender, country } = data;
        try {
            const savedMsg = yield prisma.chatMessage.create({
                data: {
                    session_id,
                    sender,
                    message,
                    chat_type: 'LIVE',
                    country
                }
            });
            io.to(session_id).emit('receive_live_message', savedMsg);
            if (sender === 'admin') {
                yield prisma.chatSession.update({
                    where: { id: session_id },
                    data: { status: 'active' }
                });
            }
        }
        catch (error) {
            console.error('Error sending live message:', error);
        }
    }));
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Handle AI chat messages
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { session_id, message, sender, country } = req.body;
        const ip_address = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
        const user_agent = req.headers['user-agent'] || 'unknown';
        const device_type = getDeviceType(user_agent);
        yield prisma.chatSession.upsert({
            where: { id: session_id },
            update: { updated_at: new Date() },
            create: { id: session_id, chat_type: 'AI', status: 'active' }
        });
        const userMsg = yield prisma.chatMessage.create({
            data: {
                session_id,
                sender,
                message,
                ip_address,
                user_agent,
                country,
                device_type,
                chat_type: 'AI'
            }
        });
        let aiResponse = '';
        try {
            if (!model) {
                for (let i = 0; i < 6; i++) {
                    if (model)
                        break;
                    yield new Promise(r => setTimeout(r, 500));
                }
            }
            if (!model)
                throw new Error("AI Concierge is still warming up. Please try again in a moment.");
            const result = yield model.generateContent(message);
            aiResponse = (yield result.response).text();
        }
        catch (aiError) {
            console.error('CRITICAL GEMINI ERROR:', aiError.message || aiError);
            aiResponse = "I'm experiencing a brief connection issue with my executive network. How can I assist you with our talent categories in the meantime? [[Actors, Influencers, Speakers]]";
        }
        let reply = aiResponse;
        let suggestions = ["Actors", "Influencers", "Speakers"];
        let stars = [];
        let showForm = false;
        // 1. Extract STARS tags
        const starsMatches = reply.matchAll(/\[\[STARS:(.*?)\]\]/g);
        for (const match of starsMatches) {
            const category = match[1].trim();
            const categoryStars = yield prisma.star.findMany({
                where: { category: { contains: category }, availability_status: "Available" },
                take: 6,
                select: { id: true, name: true, category: true, image_url: true }
            });
            stars = [...stars, ...categoryStars];
            reply = reply.replace(match[0], '');
        }
        // 2. Extract SHOW_FORM tag
        if (reply.includes('[[SHOW_FORM]]')) {
            showForm = true;
            reply = reply.replace(/\[\[SHOW_FORM\]\]/g, '');
        }
        // 3. Extract Suggestion tags (all remaining [[...]] blocks)
        const suggestionsMatches = reply.matchAll(/\[\[(.*?)\]\]/g);
        let foundSuggestions = false;
        for (const match of suggestionsMatches) {
            const parts = match[1].split(',').map(s => s.trim()).filter(Boolean);
            if (parts.length > 0) {
                if (!foundSuggestions) {
                    suggestions = parts;
                    foundSuggestions = true;
                }
                else {
                    suggestions = [...suggestions, ...parts];
                }
            }
            reply = reply.replace(match[0], '');
        }
        // Clean up formatting artifacts (asterisks, extra newlines, leftover list markers)
        reply = reply
            .replace(/\*+/g, '') // Remove asterisks
            .replace(/[ \t]+/g, ' ') // Collapse horizontal spaces
            .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
            .replace(/\s*:\s*$/, '') // Remove trailing colons
            .trim();
        const assistantMsg = yield prisma.chatMessage.create({
            data: {
                session_id,
                sender: 'assistant',
                message: reply,
                ip_address,
                user_agent,
                country,
                device_type,
                chat_type: 'AI'
            }
        });
        res.json({
            userMessage: userMsg,
            assistantMessage: Object.assign(Object.assign({}, assistantMsg), { suggestions, stars, showForm })
        });
    }
    catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Failed to process chat' });
    }
}));
app.get('/api/chat/history/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messages = yield prisma.chatMessage.findMany({
            where: { session_id: req.params.sessionId },
            orderBy: { timestamp: 'asc' }
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
}));
app.get('/api/admin/requests', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = yield prisma.contactRequest.findMany({
            orderBy: { created_at: 'desc' },
            include: { star: { select: { name: true } } }
        });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/api/support/sessions', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sessions = yield prisma.chatSession.findMany({
            where: { chat_type: 'LIVE' },
            orderBy: { updated_at: 'desc' },
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            }
        });
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
}));
const server = httpServer.listen(PORT, () => {
    console.log(`🚀 Executive Server actively listening on http://localhost:${PORT}`);
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ PORT ${PORT} IS ALREADY IN USE. Please kill the other process.`);
    }
    else {
        console.error('❌ SERVER BIND ERROR:', err);
    }
});
setInterval(() => { }, 1000 * 60 * 60);
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
