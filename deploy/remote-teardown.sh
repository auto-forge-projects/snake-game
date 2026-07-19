#!/usr/bin/env bash
# AutoForge SSH-push uzak KALDIRMA (soft undeploy). CI bunu sunucuda `bash -s` ile çalıştırır.
# Env: PROJECT HOST
# Yaptığı: container'ı durdur+sil → bu projenin nginx bloğunu kaldır → nginx -t + reload.
# YALNIZ bu projeye dokunur (kendi adıyla + kendi HOST conf'u). Repo/imaj SİLİNMEZ (soft).
# nginx -t geçmeden reload YOK → mevcut siteler (wordchain/n8n vb.) güvende.
set -euo pipefail
: "${PROJECT:?} ${HOST:?}"

docker rm -f "$PROJECT" >/dev/null 2>&1 || true

CONF="/etc/nginx/sites-available/${HOST}.conf"
sudo rm -f "/etc/nginx/sites-enabled/${HOST}.conf" "$CONF"
# nginx -t başarısızsa reload etme (başka bir site bozuksa canlıyı bozma).
if sudo nginx -t; then
  sudo systemctl reload nginx
  echo "torn down: ${HOST} (container + nginx bloğu kaldırıldı)"
else
  echo "UYARI: nginx -t başarısız — reload atlandı; conf kaldırıldı ama nginx yeniden yüklenmedi." >&2
  exit 1
fi
