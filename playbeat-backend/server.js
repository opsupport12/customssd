require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');

const app = express();

// ─── DATABASE ─────────────────────────────────────────────
connectDB();

// ─── SECURITY ────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// Rate limiting — global
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
// Stricter limit on auth
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// ─── BODY PARSING ─────────────────────────────────────────
// Stripe webhook needs raw body — mount BEFORE json()
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── LOGGING ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ─── HEALTH CHECK ─────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── ROUTES ──────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/coupons',   require('./routes/coupons'));
app.use('/api/tickets',   require('./routes/tickets'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/homepage',  require('./routes/homepage'));
app.use('/api/staff',     require('./routes/staff'));
app.use('/api/payments',  require('./routes/payments'));

// ─── SERVE ADMIN HTML (optional static) ──────────────────
// Place your admin__1_.html as public/index.html to serve it here
app.use(express.static('public'));

// ─── 404 ─────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── ERROR HANDLER ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── START ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 PlayBeat backend running on port ${PORT}`));
