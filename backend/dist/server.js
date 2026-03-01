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
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const generative_ai_1 = require("@google/generative-ai");
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const geoip_lite_1 = __importDefault(require("geoip-lite"));
const ua_parser_js_1 = require("ua-parser-js");
const axios_1 = __importDefault(require("axios"));
require("dotenv").config(); // safe if .env missing
console.log('--- Startup Config ---');
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY.substring(0, 5));
}
console.log('----------------------');
const app = (0, express_1.default)();
app.set('trust proxy', true); // Vital for reverse proxies (cPanel/Nginx)
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
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/'))
            cb(null, true);
        else
            cb(new Error('Only image and audio files are allowed'));
    }
});
// Middleware
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // You can add specific allowed origins here, or simply allow all
        // Given the error in the screenshot, allowing all origins that match the request is often safest for an open API if credentials are true
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
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
// --- Enhanced Analytics ---
function getMetadata(reqOrSocket) {
    return __awaiter(this, void 0, void 0, function* () {
        let ip = '';
        let ua = '';
        if (reqOrSocket.handshake) {
            // Socket.io
            // Trust x-forwarded-for first in proxy environments
            ip = reqOrSocket.handshake.headers['x-forwarded-for'] || reqOrSocket.handshake.address || reqOrSocket.request.connection.remoteAddress || '';
            ua = reqOrSocket.handshake.headers['user-agent'] || '';
        }
        else {
            // Express Request
            // In Express, req.ip handles the proxy trust automatically because we set app.set('trust proxy', true)
            ip = reqOrSocket.ip || reqOrSocket.headers['x-forwarded-for'] || reqOrSocket.socket.remoteAddress || '';
            ua = reqOrSocket.headers['user-agent'] || '';
        }
        // Ensure IP is a string and handle comma-separated lists from x-forwarded-for
        const ipString = Array.isArray(ip) ? ip[0] : (ip || '').toString().split(',')[0].trim().replace('::ffff:', '');
        // Geo lookup
        let geo = geoip_lite_1.default.lookup(ipString);
        // Fallback or local dev lookup
        if (!geo || ipString === '::1' || ipString === '127.0.0.1' || ipString === 'localhost') {
            try {
                const queryIp = (ipString === '::1' || ipString === '127.0.0.1' || ipString === 'localhost') ? '' : ipString;
                const response = yield axios_1.default.get(`http://ip-api.com/json/${queryIp}`);
                if (response.data && response.data.status === 'success') {
                    geo = {
                        country: response.data.countryCode,
                        region: response.data.region,
                        city: response.data.city,
                    };
                }
            }
            catch (err) {
                console.warn('Geo-IP fallback failed:', err.message);
            }
        }
        const parser = new ua_parser_js_1.UAParser(ua);
        const uaResult = parser.getResult();
        const device_type = uaResult.device.type || (uaResult.os.name === 'Android' || uaResult.os.name === 'iOS' ? 'mobile' : 'desktop');
        return {
            ip_address: ipString,
            user_agent: ua,
            country: (geo === null || geo === void 0 ? void 0 : geo.country) || 'unknown',
            device_type
        };
    });
}
app.post('/api/analytics/track', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { event_type, page, session_id, duration_ms, star_id } = req.body;
        const metadata = yield getMetadata(req);
        yield prisma.analyticsEvent.create({
            data: Object.assign({ event_type,
                page,
                session_id, duration_ms: duration_ms ? parseInt(duration_ms) : null, star_id: star_id ? parseInt(star_id) : null }, metadata)
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Failed to track analytics' });
    }
}));
app.get('/api/analytics', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalRequests = yield prisma.contactRequest.count();
        const stats = yield prisma.analyticsEvent.groupBy({
            by: ['event_type'],
            where: {
                NOT: { page: { startsWith: '/admin' } }
            },
            _count: { id: true }
        });
        // Add more detailed analytics
        const recentPageViews = yield prisma.analyticsEvent.findMany({
            where: {
                event_type: 'page_view',
                NOT: { page: { startsWith: '/admin' } }
            },
            orderBy: { timestamp: 'desc' },
            take: 20
        });
        const countryStats = yield prisma.analyticsEvent.groupBy({
            by: ['country'],
            where: {
                event_type: 'page_view',
                NOT: { page: { startsWith: '/admin' } }
            },
            _count: { id: true }
        });
        const deviceStats = yield prisma.analyticsEvent.groupBy({
            by: ['device_type'],
            where: {
                event_type: 'page_view',
                NOT: { page: { startsWith: '/admin' } }
            },
            _count: { id: true }
        });
        // Time-series data for charts (last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const dailyDataRaw = yield prisma.analyticsEvent.findMany({
            where: {
                timestamp: { gte: fourteenDaysAgo },
                NOT: { page: { startsWith: '/admin' } }
            },
            select: {
                event_type: true,
                timestamp: true,
                duration_ms: true,
                page: true
            }
        });
        // Process daily visits and duration in JS for flexibility
        const dailyVisits = {};
        const dailyDuration = {};
        const pageViews = {};
        // Initialize last 14 days with 0s
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyVisits[dateStr] = 0;
            dailyDuration[dateStr] = { total: 0, count: 0 };
        }
        dailyDataRaw.forEach((event) => {
            const dateStr = event.timestamp.toISOString().split('T')[0];
            if (event.event_type === 'page_view') {
                if (dailyVisits[dateStr] !== undefined)
                    dailyVisits[dateStr]++;
                if (event.page) {
                    pageViews[event.page] = (pageViews[event.page] || 0) + 1;
                }
            }
            if (event.event_type === 'page_stay' && event.duration_ms) {
                if (dailyDuration[dateStr] !== undefined) {
                    dailyDuration[dateStr].total += event.duration_ms;
                    dailyDuration[dateStr].count++;
                }
            }
        });
        const dailyVisitsChart = Object.keys(dailyVisits).sort().map(date => ({
            date: date.split('-').slice(1).join('/'), // simplify date to MM/DD
            visits: dailyVisits[date]
        }));
        const engagementChart = Object.keys(dailyDuration).sort().map(date => ({
            date: date.split('-').slice(1).join('/'),
            avgDuration: dailyDuration[date].count > 0
                ? Math.round(dailyDuration[date].total / dailyDuration[date].count / 1000) // seconds
                : 0
        }));
        const topPagesChart = Object.keys(pageViews)
            .map(page => ({ page, views: pageViews[page] }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);
        res.json({
            totalRequests,
            stats,
            recentPageViews,
            countryStats,
            deviceStats,
            dailyVisitsChart,
            engagementChart,
            topPagesChart
        });
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
// --- Star Management (Protected) ---
// --- Global Settings ---
app.get('/api/settings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield prisma.globalSettings.upsert({
            where: { id: 'current' },
            update: {},
            create: { id: 'current', hero_show_cards: true, hero_show_image: false }
        });
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/admin/settings', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hero_show_cards, hero_show_image, hero_image_url } = req.body;
        const settings = yield prisma.globalSettings.upsert({
            where: { id: 'current' },
            create: { id: 'current', hero_show_cards, hero_show_image, hero_image_url },
            update: { hero_show_cards, hero_show_image, hero_image_url }
        });
        res.json(settings);
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
// Socket tracking for disconnection handling
const socketUserMap = new Map();
// Socket.io Real-time Support Logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join_support', (_a) => __awaiter(void 0, [_a], void 0, function* ({ session_id, role }) {
        socket.join(session_id);
        const userRole = role || 'user';
        socketUserMap.set(socket.id, { session_id, role: userRole });
        console.log(`${userRole} joined support session: ${session_id}`);
        try {
            const existingSession = yield prisma.chatSession.findUnique({
                where: { id: session_id }
            });
            if (userRole === 'admin') {
                if (existingSession && existingSession.status !== 'ended') {
                    const wasWaiting = existingSession.status === 'waiting';
                    yield prisma.chatSession.update({
                        where: { id: session_id },
                        data: { chat_type: 'LIVE', status: 'active' }
                    });
                    if (wasWaiting) {
                        yield prisma.chatSessionActivity.create({
                            data: { session_id, status: 'active' }
                        });
                    }
                }
                io.to(session_id).emit('agent_joined', { session_id });
            }
            // For 'user' role, we intentionally do nothing in the DB until they send their first live message.
        }
        catch (error) {
            console.error('Error joining support:', error);
        }
    }));
    socket.on('typing_start', ({ session_id, sender }) => {
        socket.to(session_id).emit('typing_start', { sender });
    });
    socket.on('typing_stop', ({ session_id, sender }) => {
        socket.to(session_id).emit('typing_stop', { sender });
    });
    socket.on('send_live_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { session_id, message, sender, country } = data;
        try {
            if (sender === 'user') {
                const existingSession = yield prisma.chatSession.findUnique({
                    where: { id: session_id }
                });
                if (!existingSession) {
                    // Start a brand new live session
                    yield prisma.chatSession.create({
                        data: { id: session_id, chat_type: 'LIVE', status: 'waiting' }
                    });
                    io.emit('new_support_request', { session_id, timestamp: new Date() });
                }
                else if (existingSession.chat_type === 'AI' || existingSession.status === 'ended') {
                    // Transition an existing AI session to LIVE, or resurrect an ended session
                    yield prisma.chatSession.update({
                        where: { id: session_id },
                        data: { chat_type: 'LIVE', status: 'waiting' }
                    });
                    io.emit('new_support_request', { session_id, timestamp: new Date() });
                }
            }
            const metadata = yield getMetadata(socket);
            const savedMsg = yield prisma.chatMessage.create({
                data: Object.assign(Object.assign({ session_id,
                    sender,
                    message, chat_type: 'LIVE' }, metadata), { 
                    // Prioritize real geo data from the server's IP check
                    country: (metadata.country && metadata.country !== 'unknown') ? metadata.country : (country || 'unknown') })
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
    socket.on('admin_close_session', (_a) => __awaiter(void 0, [_a], void 0, function* ({ session_id }) {
        try {
            yield prisma.chatSession.update({
                where: { id: session_id },
                data: { status: 'ended' }
            });
            // Create persistent SYSTEM message
            const systemMsg = yield prisma.chatMessage.create({
                data: {
                    session_id,
                    sender: 'system',
                    message: 'Chat closed by Admin.',
                    chat_type: 'SYSTEM',
                    country: 'System'
                }
            });
            yield prisma.chatSessionActivity.create({
                data: { session_id, status: 'ended', reason: 'admin_closed' }
            });
            // Notify both the admin and the user that the chat has been explicitly closed, along with the system message
            io.to(session_id).emit('chat_ended', { session_id, reason: 'admin_closed', systemMessage: systemMsg });
        }
        catch (error) {
            console.error('Error ending session by admin:', error);
        }
    }));
    socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Client disconnected:', socket.id);
        const userData = socketUserMap.get(socket.id);
        if (userData && userData.role === 'user') {
            const { session_id } = userData;
            try {
                const session = yield prisma.chatSession.findUnique({ where: { id: session_id } });
                if (!session || session.status === 'ended')
                    return;
                // If a user disconnects abruptly without the closing beacon, mark the session as ended
                yield prisma.chatSession.update({
                    where: { id: session_id },
                    data: { status: 'ended' }
                });
                // Create persistent SYSTEM message
                const systemMsg = yield prisma.chatMessage.create({
                    data: {
                        session_id,
                        sender: 'system',
                        message: 'Chat closed by User.',
                        chat_type: 'SYSTEM',
                        country: 'System'
                    }
                });
                yield prisma.chatSessionActivity.create({
                    data: { session_id, status: 'ended', reason: 'user_disconnected' }
                });
                // Notify the admin room that the chat has ended
                io.to(session_id).emit('chat_ended', { session_id, reason: 'user_disconnected', systemMessage: systemMsg });
                console.log(`Session ${session_id} ended due to user disconnect.`);
            }
            catch (error) {
                console.error('Error ending session on disconnect:', error);
            }
        }
        socketUserMap.delete(socket.id);
    }));
});
// Handle AI chat messages
app.post('/api/chat', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { session_id, message, sender, country } = req.body;
        const metadata = yield getMetadata(req);
        const existingSession = yield prisma.chatSession.findUnique({
            where: { id: session_id }
        });
        yield prisma.chatSession.upsert({
            where: { id: session_id },
            update: { updated_at: new Date(), status: 'active', chat_type: 'AI' },
            create: { id: session_id, chat_type: 'AI', status: 'active' }
        });
        if (!existingSession || existingSession.status !== 'active') {
            yield prisma.chatSessionActivity.create({
                data: { session_id, status: 'active' }
            });
        }
        const userMsg = yield prisma.chatMessage.create({
            data: Object.assign(Object.assign({ session_id,
                sender,
                message, chat_type: 'AI' }, metadata), { country: metadata.country || country })
        });
        // For assistant message tracking later
        const { ip_address, user_agent, device_type } = metadata;
        const finalCountry = metadata.country || country;
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
                country: finalCountry,
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
// Explicit endpoint to mark chat sessions as ended (handles browser closes or explicit "Leave Chat" from AI mode)
app.post('/api/chat/end', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { session_id, reason, chatMode } = req.body;
        if (!session_id)
            return res.status(400).json({ error: 'Session ID required' });
        const session = yield prisma.chatSession.findUnique({ where: { id: session_id } });
        if (!session || session.status === 'ended') {
            return res.json({ success: true, message: 'Already ended or not found' });
        }
        yield prisma.chatSession.update({
            where: { id: session_id },
            data: { status: 'ended' }
        });
        let reasonText = 'Chat closed by User.';
        if (reason === 'inactivity')
            reasonText = 'Chat ended due to inactivity.';
        else if (reason === 'browser_closed')
            reasonText = `Browser closed during ${chatMode || 'AI'} chat.`;
        const systemMsg = yield prisma.chatMessage.create({
            data: {
                session_id,
                sender: 'system',
                message: reasonText,
                chat_type: chatMode || 'AI',
                country: 'System'
            }
        });
        yield prisma.chatSessionActivity.create({
            data: {
                session_id,
                status: 'ended',
                reason: reason
            }
        });
        // Broadcast to relevant Live Support room if it was a LIVE chat
        if (session.chat_type === 'LIVE' || chatMode === 'LIVE') {
            io.to(session_id).emit('chat_ended', { session_id, reason, systemMessage: systemMsg });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error ending chat explicitly:', error);
        res.status(500).json({ error: 'Failed to end chat' });
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
        const type = req.query.type;
        const dateStr = req.query.date;
        const statusStr = req.query.status;
        const whereClause = {};
        if (type) {
            whereClause.chat_type = type;
        }
        if (statusStr) {
            const statuses = statusStr.split(',');
            whereClause.status = { in: statuses };
        }
        if (dateStr) {
            // dateStr is expected to be YYYY-MM-DD
            const startDate = new Date(`${dateStr}T00:00:00.000Z`);
            const endDate = new Date(`${dateStr}T23:59:59.999Z`);
            whereClause.updated_at = {
                gte: startDate,
                lte: endDate
            };
        }
        const sessions = yield prisma.chatSession.findMany({
            where: Object.assign(Object.assign({}, whereClause), { messages: {
                    some: {
                        sender: { in: ['user', 'admin', 'assistant'] }
                    }
                } }),
            orderBy: { updated_at: 'desc' },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
}));
// --- Settings & Sounds Management ---
app.get('/api/admin/notification-sounds', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sounds = yield prisma.notificationSound.findMany({
            orderBy: { created_at: 'desc' }
        });
        res.json(sounds);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/admin/notification-sounds/upload', authenticateAdmin, upload.single('audio'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No audio file uploaded' });
        const host = req.headers.host;
        const url = `http://${host}/uploads/${req.file.filename}`;
        const sound = yield prisma.notificationSound.create({
            data: {
                name: req.file.originalname,
                url
            }
        });
        res.status(201).json(sound);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.delete('/api/admin/notification-sounds/:id', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const sound = yield prisma.notificationSound.findUnique({ where: { id } });
        if (!sound)
            return res.status(404).json({ error: 'Sound not found' });
        // Delete file from disk
        const filename = sound.url.split('/').pop();
        if (filename) {
            const filepath = path_1.default.join(uploadsDir, filename);
            if (fs_1.default.existsSync(filepath))
                fs_1.default.unlinkSync(filepath);
        }
        yield prisma.notificationSound.delete({ where: { id } });
        res.json({ message: 'Sound deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/api/admin/settings', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let settings = yield prisma.globalSettings.findUnique({
            where: { id: 'current' },
            include: { active_notification_sound: true }
        });
        if (!settings) {
            settings = yield prisma.globalSettings.create({
                data: { id: 'current', header_transparent: true },
                include: { active_notification_sound: true }
            });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/admin/settings/header-transparency', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { transparent } = req.body;
        const settings = yield prisma.globalSettings.upsert({
            where: { id: 'current' },
            update: { header_transparent: transparent },
            create: { id: 'current', header_transparent: transparent }
        });
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/api/admin/settings/notification-sound', authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sound_id } = req.body;
        const settings = yield prisma.globalSettings.upsert({
            where: { id: 'current' },
            update: { active_notification_sound_id: sound_id },
            create: { id: 'current', active_notification_sound_id: sound_id }
        });
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/api/public/settings/notification-sound', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield prisma.globalSettings.findUnique({
            where: { id: 'current' },
            include: { active_notification_sound: true }
        });
        if (settings === null || settings === void 0 ? void 0 : settings.active_notification_sound) {
            res.json({ url: settings.active_notification_sound.url });
        }
        else {
            res.json({ url: null });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/api/public/settings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield prisma.globalSettings.findUnique({
            where: { id: 'current' },
            select: {
                header_transparent: true,
                hero_show_cards: true,
                hero_show_image: true,
                hero_image_url: true
            }
        });
        res.json(settings || { header_transparent: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
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
