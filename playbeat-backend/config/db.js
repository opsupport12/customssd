const mongoose = require('mongoose');

function buildUriFromEnv() {
  let uri = process.env.MONGODB_URI;
  if (uri && !uri.includes('<') && !uri.includes('>')) return uri;

  const user = process.env.DB_USER || process.env.MONGO_USER || process.env.MONGODB_USER || process.env.DIRECTOR_DB_USER || process.env.USERNAME;
  const pass = process.env.DB_PASS || process.env.MONGO_PASS || process.env.MONGODB_PASSWORD || process.env.PASSWORD;
  const host = process.env.DB_HOST || process.env.MONGO_HOST || process.env.MONGODB_HOST || 'localhost';
  const db = process.env.DB_NAME || process.env.MONGO_DB || process.env.MONGODB_DB || '';

  if (!user || !pass) return uri; // nothing we can do

  const encoded = encodeURIComponent(pass);
  const dbSuffix = db ? `/${db}` : '';
  // default to mongodb+srv with retryWrites
  return `mongodb+srv://${user}:${encoded}@${host}${dbSuffix}?retryWrites=true&w=majority`;
}

const connectDB = async () => {
  const uri = buildUriFromEnv();
  if (!uri) {
    console.error('❌ MongoDB connection error: MONGODB_URI not set and DB user/pass not provided');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (err.message && err.message.toLowerCase().includes('auth')) {
      console.error('→ Authentication failed. Verify your MONGODB_URI, username, and password (URL-encode special characters in the password).');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
