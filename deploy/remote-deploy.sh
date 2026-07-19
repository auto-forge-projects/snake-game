#!/usr/bin/env bash
# AutoForge SSH-push uzak deploy. CI bunu sunucuda `bash -s` ile çalıştırır.
# Env: PROJECT IMAGE HOST HOST_PORT PORT CERT_BASE
# Yaptığı: imajı çek → container'ı 127.0.0.1:<host_port>'ta (yeniden) çalıştır →
# mevcut host nginx'e wildcard-cert'li server bloğu koy → nginx -t + reload.
# YALNIZ bu projeye dokunur (kendi adıyla). nginx -t geçmeden reload YOK → mevcut siteler güvende.
#
# NOT (private GHCR): imaj private ise sunucu bir kez `docker login ghcr.io` olmalı
# (read:packages token), ya da paketi public yap. Bu script pull'u doğrudan dener.
set -euo pipefail
: "${PROJECT:?} ${IMAGE:?} ${HOST:?} ${HOST_PORT:?} ${PORT:?} ${CERT_BASE:?}"

# Private GHCR paketleri için otomatik login (GHCR_TOKEN/GHCR_USER verilirse).
# Böylece paketi elle public yapmaya gerek kalmaz; verilmezse public paket varsayılır.
if [ -n "${GHCR_TOKEN:-}" ] && [ -n "${GHCR_USER:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null
fi

# Port çakışma ön-denetimi (AF-033): host_port'u BİZİM container DIŞINDA biri tutuyorsa DUR.
# Fabrika-tarafı tahsis (servers.json port_range) kayıt-dışı bir kullanımı bilemez; bu, sunucuda
# fiilen doğrular. Pull/rm ÖNCESİ koşar → çakışmada eski container'a dokunmaz, siteler güvende.
self_holds="$(docker ps --filter "name=^${PROJECT}$" --filter "publish=${HOST_PORT}" -q 2>/dev/null | head -1 || true)"
other_ctr="$(docker ps --filter "publish=${HOST_PORT}" --format '{{.Names}}' 2>/dev/null | grep -vx "${PROJECT}" | head -1 || true)"
if [ -n "$other_ctr" ]; then
  echo "HATA: host_port ${HOST_PORT} başka container ('$other_ctr') tarafından kullanılıyor — çakışma." >&2
  echo "  Çözüm: servers.json reserved_ports'a ${HOST_PORT} ekle + projeye yeni port ata (ya da '$other_ctr' taşı)." >&2
  exit 1
fi
if [ -z "$self_holds" ] && command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -qE "[:.]${HOST_PORT}[[:space:]]"; then
  echo "HATA: host_port ${HOST_PORT} container-DIŞI bir süreç tarafından kullanılıyor (AutoForge kaydında yok) — çakışma." >&2
  echo "  Çözüm: servers.json reserved_ports'a ${HOST_PORT} ekle + projeye yeni port ata." >&2
  exit 1
fi

docker pull "$IMAGE"
docker rm -f "$PROJECT" >/dev/null 2>&1 || true
docker run -d --name "$PROJECT" --restart unless-stopped -p "127.0.0.1:${HOST_PORT}:${PORT}" "$IMAGE"

CONF="/etc/nginx/sites-available/${HOST}.conf"
sudo tee "$CONF" >/dev/null <<NG
server { listen 80; server_name ${HOST}; return 301 https://\$host\$request_uri; }
server {
  listen 443 ssl;
  server_name ${HOST};
  ssl_certificate ${CERT_BASE}/fullchain.pem;
  ssl_certificate_key ${CERT_BASE}/privkey.pem;
  location / {
    proxy_pass http://127.0.0.1:${HOST_PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
NG
sudo ln -sf "$CONF" "/etc/nginx/sites-enabled/${HOST}.conf"
sudo nginx -t && sudo systemctl reload nginx
echo "deployed: https://${HOST}"
