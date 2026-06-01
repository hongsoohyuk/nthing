#!/bin/bash
# Let's Encrypt 초기 SSL 인증서 발급
# 사용법: ./init-ssl.sh your-domain.com your-email@example.com

set -e

DOMAIN=${1:?"도메인을 입력하세요 (예: api.onebite.app)"}
EMAIL=${2:?"이메일을 입력하세요 (예: admin@onebite.app)"}

echo "=== One Bite SSL 초기 설정 ==="
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"

# 1. 임시 self-signed 인증서 생성 (Nginx 시작용)
echo ">> 임시 인증서 생성..."
mkdir -p ./certbot/conf/live/onebite
openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
  -keyout ./certbot/conf/live/onebite/privkey.pem \
  -out ./certbot/conf/live/onebite/fullchain.pem \
  -subj "/CN=$DOMAIN"

# 2. Nginx 시작 (ACME challenge 응답용)
# --env-file 필수: 빼면 DB_* 변수가 빈 값으로 평가돼 compose가 db 컨테이너를
# 빈 크레덴셜로 재생성 → 기동/헬스체크 실패함 (dependency db failed to start)
echo ">> Nginx 시작..."
docker compose --env-file ./infra/.env -f docker-compose.prod.yml up -d nginx

# 3. Let's Encrypt 인증서 발급
# --entrypoint certbot 필수: compose의 certbot 서비스 entrypoint가 자동갱신 루프
# (while certbot renew; sleep 12h) 라서, 안 덮으면 certonly 인자가 무시되고
# renew 루프가 돌며 sleep 12h 로 영원히 멈춤
echo ">> Let's Encrypt 인증서 발급..."
docker compose --env-file ./infra/.env -f docker-compose.prod.yml run --rm \
  --entrypoint certbot certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN"

# 4. Nginx 재시작 (실제 인증서 적용)
echo ">> Nginx 재시작..."
docker compose --env-file ./infra/.env -f docker-compose.prod.yml exec nginx nginx -s reload

echo "=== SSL 설정 완료! ==="
