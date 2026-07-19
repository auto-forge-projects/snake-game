# snake-game — Express statik sunucu, sıfır sunucu-durumu (bkz. docs/05-architecture.md).
# Tek-aşama node:22-alpine imaj (NFR-7: hedef ≤150MB, hızlı build). SEC-5/6/7/8 (docs/07-security.md).
FROM node:22-alpine

WORKDIR /app

# SEC-5/SEC-6: yalnız prod bağımlılıkları (express) — devDependency (supertest) imaja girmez.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
  && npm audit --omit=dev --audit-level=high

# SEC-8: yalnız çalışma zamanı için gereken dosyalar kopyalanır (.dockerignore ile sınırlanır).
COPY src ./src
COPY public ./public

# SEC-7: root olmayan kullanıcı ile çalıştır (node:22-alpine imajında hazır 'node' kullanıcısı).
USER node

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
