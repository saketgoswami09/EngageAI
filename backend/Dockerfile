# ─── Backend Dockerfile ──────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
RUN chown -R nodeapp:nodejs /app
USER nodeapp

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/app.js"]
