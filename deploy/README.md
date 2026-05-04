# GCP Compute Engine 部署指引

針對 v0.1，採用「**單台 VM + Docker Compose**」部署策略。可日後再水平擴展、改成 GKE。

---

## 1. 建立 GCP VM

```bash
# 設定常用參數
export PROJECT=your-gcp-project
export REGION=asia-east1
export ZONE=asia-east1-b
export VM_NAME=gov-platform-prod

# 建一台 e2-standard-4（4 vCPU / 16GB）— 可視流量調整
gcloud compute instances create $VM_NAME \
  --project=$PROJECT \
  --zone=$ZONE \
  --machine-type=e2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=100GB \
  --boot-disk-type=pd-ssd \
  --tags=http-server,https-server

# 建立靜態外部 IP 並綁到 VM
gcloud compute addresses create gov-platform-ip \
  --project=$PROJECT --region=$REGION

EXTERNAL_IP=$(gcloud compute addresses describe gov-platform-ip \
  --project=$PROJECT --region=$REGION --format="value(address)")

gcloud compute instances add-access-config $VM_NAME \
  --project=$PROJECT --zone=$ZONE \
  --address=$EXTERNAL_IP

# 開放 80 / 443
gcloud compute firewall-rules create allow-http-https \
  --project=$PROJECT \
  --allow=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=http-server,https-server
```

> SSH 進 VM：`gcloud compute ssh $VM_NAME --project=$PROJECT --zone=$ZONE`

---

## 2. VM 上安裝 Docker

```bash
# Docker 官方 apt 來源
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 將自己加入 docker group，免每次 sudo
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3. 部署程式碼

```bash
# 把 repo clone 到 VM
git clone https://github.com/<your-org>/gov-platform.git
cd gov-platform

# 建立 .env 並填入正式秘密
cp .env.production.example .env
chmod 600 .env
$EDITOR .env   # 一一替換 __REPLACE_*__

# 第一次 build + 啟動（不含 nginx 的 HTTPS 段，因為憑證還沒簽）
docker compose -f docker-compose.prod.yml up -d postgres redis minio
docker compose -f docker-compose.prod.yml up -d api admin
```

第一次跑 API 之前，需要在 Postgres 內建好 schema：

```bash
# 進 api container 跑 migration
docker compose -f docker-compose.prod.yml exec api \
  node node_modules/.bin/tsx packages/db/src/migrate.ts

# 視需要 seed 第一個超級管理員與初始 tenant
docker compose -f docker-compose.prod.yml exec api \
  node node_modules/.bin/tsx packages/db/src/seed/index.ts
```

---

## 4. 簽發 TLS 憑證（Let's Encrypt）

先把 DNS A-record 指到 VM IP，等 DNS 生效（用 `dig admin.gov.taipei` 確認）。

```bash
# 啟動 nginx 提供 ACME 驗證的 /.well-known
docker compose -f docker-compose.prod.yml up -d nginx

# 為兩個子網域簽憑證
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d admin.gov.taipei -d api.gov.taipei \
  --email ops@your-org.tw --agree-tos --no-eff-email

# 開啟 deploy/nginx/conf.d/default.conf 中的 HTTPS server block，存檔
# reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

自動續期可以用 cron（VM 上）：

```cron
0 3 * * * cd /home/$USER/gov-platform && docker compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## 5. 後續操作

| 動作 | 指令 |
|---|---|
| 看 logs | `docker compose -f docker-compose.prod.yml logs -f api` |
| 重啟單一服務 | `docker compose -f docker-compose.prod.yml restart api` |
| 部署新版 | `git pull && docker compose -f docker-compose.prod.yml up -d --build api admin` |
| 進 DB | `docker compose -f docker-compose.prod.yml exec postgres psql -U $POSTGRES_USER $POSTGRES_DB` |
| 備份 DB | `docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB \| gzip > backup-$(date +%F).sql.gz` |

---

## 6. 還沒做但 Production 上線前一定要補的

- [ ] **DB 自動備份**：寫 cron 上傳 `pg_dump` 到 GCS bucket，保留 30 天
- [ ] **監控**：Cloud Monitoring agent 或 Prometheus + Grafana
- [ ] **日誌集中**：把 docker logs 送 GCP Cloud Logging
- [ ] **MinIO 改 GCS**：production 應該用 GCS（透過 S3 相容 API）取代自架 MinIO，避免單機磁碟成為瓶頸與單點故障
- [ ] **Postgres 改 Cloud SQL**：避免 VM 重開機造成停機
- [ ] **Redis 改 Memorystore**：同上
