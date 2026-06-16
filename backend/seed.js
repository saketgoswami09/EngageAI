/**
 * Seed script — populates realistic demo data for local development
 * Run: node seed.js
 *
 * Creates:
 *  - 1 Admin (if missing)
 *  - 10 Users
 *  - 10 Conversations
 *  - ~70 Messages spread over last 7 days
 *  - 10 Leads (across all 6 status stages)
 *  - 3 Documents
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-ai-dev';

// ─── Inline Schemas (mirrors src/models) ──────────────────────────────────────

const AdminSchema = new mongoose.Schema({
  email: String, password: String, name: String,
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
});
const Admin = mongoose.model('Admin', AdminSchema);

const UserSchema = new mongoose.Schema({
  phone: { type: String, unique: true },
  name: String,
  email: String,
  tags: [String],
  leadStatus: { type: String, default: 'new' },
  aiCallsThisHour: { type: Number, default: 0 },
  aiTokensUsedToday: { type: Number, default: 0 },
  lastSeen: Date,
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', UserSchema);

const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: String,
  sessionId: String,
  status: { type: String, default: 'active' },
  assignedTo: String,
  messageCount: { type: Number, default: 0 },
  lastMessageAt: Date,
  createdAt: { type: Date, default: Date.now },
});
const Conversation = mongoose.model('Conversation', ConversationSchema);

const MessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  direction: { type: String, enum: ['inbound', 'outbound'] },
  type: { type: String, default: 'text' },
  content: String,
  status: { type: String, default: 'delivered' },
  generatedByAI: { type: Boolean, default: false },
  tokensUsed: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
const Message = mongoose.model('Message', MessageSchema);

const LeadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: String,
  name: String,
  email: String,
  status: { type: String, default: 'new' },
  source: { type: String, default: 'whatsapp' },
  notes: [{ text: String, addedAt: { type: Date, default: Date.now } }],
  followUpCount: { type: Number, default: 0 },
  assignedAgent: String,
  paymentLink: String,
  createdAt: { type: Date, default: Date.now },
});
const Lead = mongoose.model('Lead', LeadSchema);

const DocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  fileName: String,
  fileUrl: String,
  documentType: { type: String, default: 'other' },
  ocrText: String,
  extractedFields: mongoose.Schema.Types.Mixed,
  validationStatus: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
const Document = mongoose.model('Document', DocumentSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (n, hoursOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9 + hoursOffset, Math.floor(Math.random() * 59), 0, 0);
  return d;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Demo Data Definitions ────────────────────────────────────────────────────

const USERS = [
  { phone: '919876543201', name: 'Arjun Sharma',    email: 'arjun@example.com',    tags: ['premium', 'referral'] },
  { phone: '919876543202', name: 'Priya Patel',     email: 'priya@example.com',    tags: ['hot-lead'] },
  { phone: '919876543203', name: 'Rohan Mehta',     email: 'rohan@example.com',    tags: ['new'] },
  { phone: '919876543204', name: 'Sneha Verma',     email: 'sneha@example.com',    tags: ['premium'] },
  { phone: '919876543205', name: 'Amit Gupta',      email: 'amit@example.com',     tags: ['referral'] },
  { phone: '919876543206', name: 'Neha Singh',      email: 'neha@example.com',     tags: ['new'] },
  { phone: '919876543207', name: 'Vikram Joshi',    email: 'vikram@example.com',   tags: ['premium', 'new'] },
  { phone: '919876543208', name: 'Kavya Nair',      email: 'kavya@example.com',    tags: ['hot-lead'] },
  { phone: '919876543209', name: 'Rahul Das',       email: 'rahul@example.com',    tags: ['referral'] },
  { phone: '919876543210', name: 'Divya Krishnan',  email: 'divya@example.com',    tags: ['new'] },
];

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'paid', 'lost', 'new', 'contacted', 'qualified', 'converted'];

const CONV_STATUSES = ['active', 'bot', 'closed', 'active', 'bot', 'active', 'closed', 'bot', 'active', 'active'];

const INBOUND_MSGS = [
  'Hi, I want to know about your services.',
  'What are the pricing plans?',
  'Can I get a demo?',
  'How does the WhatsApp bot work?',
  'I need help with integration.',
  'Is there a free trial available?',
  'What documents do I need to upload?',
  'Can you send me more details?',
  'I am interested in the premium plan.',
  'Please share the payment link.',
];

const OUTBOUND_MSGS = [
  'Hello! Welcome to our platform. How can I assist you today?',
  'Our pricing starts at ₹999/month. Would you like a full breakdown?',
  'Sure! I can schedule a demo for you. What time works best?',
  'Our WhatsApp bot uses AI to respond to customer queries 24/7.',
  'Happy to help with integration. Which platform are you using?',
  'Yes, we offer a 14-day free trial with full features!',
  'You will need to upload your Aadhaar and PAN card for verification.',
  'Of course! I am sharing our full brochure right now.',
  'Our premium plan includes unlimited AI responses and analytics.',
  'Here is your payment link: https://pay.example.com/xyz — valid for 24 hours.',
];

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  // ── Admin ──────────────────────────────────────────────────────
  let admin = await Admin.findOne({ email: 'admin@test.com' });
  if (!admin) {
    const hashed = await bcrypt.hash('Admin@1234', 12);
    admin = await Admin.create({ email: 'admin@test.com', password: hashed, name: 'Test Admin', role: 'admin' });
    console.log('✅ Admin created: admin@test.com / Admin@1234');
  } else {
    console.log('ℹ️  Admin already exists: admin@test.com');
  }

  // ── Clear old seed data ────────────────────────────────────────
  const existingUsers = await User.countDocuments();
  if (existingUsers >= 10) {
    console.log('ℹ️  Seed data already exists. Delete collections manually to re-seed.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  // ── Users ──────────────────────────────────────────────────────
  console.log('👤 Seeding 10 users...');
  const createdUsers = [];
  for (let i = 0; i < USERS.length; i++) {
    const u = await User.create({
      ...USERS[i],
      leadStatus: LEAD_STATUSES[i],
      lastSeen: daysAgo(i % 7),
      createdAt: daysAgo(6 - (i % 7)),
    });
    createdUsers.push(u);
  }
  console.log(`✅ Created ${createdUsers.length} users`);

  // ── Conversations + Messages ───────────────────────────────────
  console.log('💬 Seeding conversations and messages...');
  const createdConvs = [];
  let totalMessages = 0;

  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    const dayOffset = i % 7;
    const convCreatedAt = daysAgo(6 - dayOffset);

    const conv = await Conversation.create({
      userId: user._id,
      phone: user.phone,
      sessionId: `sess_${user.phone}_${Date.now()}`,
      status: CONV_STATUSES[i],
      messageCount: 0,
      lastMessageAt: daysAgo(dayOffset),
      createdAt: convCreatedAt,
    });

    // 6-8 messages per conversation spread across the day
    const msgCount = 6 + (i % 3);
    const messages = [];
    for (let m = 0; m < msgCount; m++) {
      const isInbound = m % 2 === 0;
      const isAI = !isInbound && Math.random() > 0.4;
      const tokensUsed = isAI ? 80 + Math.floor(Math.random() * 120) : 0;

      const ts = new Date(convCreatedAt);
      ts.setMinutes(ts.getMinutes() + m * 8);

      messages.push({
        conversationId: conv._id,
        direction: isInbound ? 'inbound' : 'outbound',
        type: 'text',
        content: isInbound
          ? INBOUND_MSGS[m % INBOUND_MSGS.length]
          : OUTBOUND_MSGS[m % OUTBOUND_MSGS.length],
        status: 'delivered',
        generatedByAI: isAI,
        tokensUsed,
        timestamp: ts,
        createdAt: ts,
      });
    }

    await Message.insertMany(messages);
    await Conversation.findByIdAndUpdate(conv._id, { messageCount: messages.length });
    totalMessages += messages.length;
    createdConvs.push(conv);
  }
  console.log(`✅ Created ${createdConvs.length} conversations with ${totalMessages} messages`);

  // ── Leads ──────────────────────────────────────────────────────
  console.log('🎯 Seeding 10 leads...');
  const leadStatuses = ['new', 'contacted', 'qualified', 'converted', 'paid', 'lost', 'new', 'contacted', 'qualified', 'converted'];
  const createdLeads = [];

  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    const status = leadStatuses[i];
    const lead = await Lead.create({
      userId: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      status,
      source: pick(['whatsapp', 'referral', 'organic', 'paid_ad']),
      notes: status !== 'new' ? [{ text: 'Initial contact made via WhatsApp bot', addedAt: daysAgo(5) }] : [],
      followUpCount: ['contacted', 'qualified', 'converted', 'paid'].includes(status) ? Math.floor(Math.random() * 3) + 1 : 0,
      paymentLink: status === 'converted' || status === 'paid' ? `https://pay.example.com/${user.phone.slice(-4)}` : undefined,
      assignedAgent: ['qualified', 'converted', 'paid'].includes(status) ? 'admin@test.com' : undefined,
      createdAt: daysAgo(5 - (i % 5)),
    });
    createdLeads.push(lead);
  }
  console.log(`✅ Created ${createdLeads.length} leads`);

  // ── Documents ─────────────────────────────────────────────────
  console.log('📄 Seeding 3 documents...');
  const docTypes = ['aadhaar', 'pan', 'other'];
  for (let i = 0; i < 3; i++) {
    await Document.create({
      userId: createdUsers[i]._id,
      conversationId: createdConvs[i]._id,
      fileName: `document_${i + 1}.jpg`,
      fileUrl: `https://res.cloudinary.com/demo/image/upload/sample_doc_${i + 1}.jpg`,
      documentType: docTypes[i],
      ocrText: 'Name: ' + createdUsers[i].name + '\nDOB: 01/01/1990\nID: ' + (1000000000 + i * 111111111),
      extractedFields: { name: createdUsers[i].name, dob: '01/01/1990', idNumber: String(1000000000 + i * 111111111) },
      validationStatus: pick(['pending', 'valid', 'valid']),
      createdAt: daysAgo(i + 1),
    });
  }
  console.log('✅ Created 3 documents');

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Admin      : admin@test.com / Admin@1234`);
  console.log(`  Users      : ${createdUsers.length}`);
  console.log(`  Conversations: ${createdConvs.length}`);
  console.log(`  Messages   : ${totalMessages} (spread over 7 days)`);
  console.log(`  Leads      : ${createdLeads.length} (across all 6 statuses)`);
  console.log(`  Documents  : 3`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
