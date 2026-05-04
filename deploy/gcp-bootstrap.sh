#!/bin/bash
# 臺北市政府多租戶網站平台 — GCP 自動化開機與基礎環境設定腳本
# 專案 ID: doit-digiiinova-website

set -e

# ===== 設定參數 =====
PROJECT_ID="doit-digiiinova-website"
REGION="asia-east1"
ZONE="asia-east1-b"
VM_NAME="gov-platform-prod"
MACHINE_TYPE="e2-standard-4" # 4 vCPU / 16GB
IP_NAME="gov-platform-static-ip"

echo "🚀 開始執行 GCP 自動化設定 (Project: $PROJECT_ID)..."

# 1. 確認 gcloud 已登入且設定專案
gcloud config set project $PROJECT_ID

# 2. 建立靜態外部 IP (若不存在)
echo "🌐 正在配置靜態 IP..."
if ! gcloud compute addresses describe $IP_NAME --region=$REGION >/dev/null 2>&1; then
  gcloud compute addresses create $IP_NAME --region=$REGION
else
  echo "✅ 靜態 IP 已存在"
fi

STATIC_IP=$(gcloud compute addresses describe $IP_NAME --region=$REGION --format="value(address)")
echo "📌 靜態 IP 位址: $STATIC_IP"

# 3. 建立防火牆規則 (80/443)
echo "🛡️ 正在設定防火牆規則..."
if ! gcloud compute firewall-rules describe allow-http-https >/dev/null 2>&1; then
  gcloud compute firewall-rules create allow-http-https \
    --allow=tcp:80,tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server,https-server
else
  echo "✅ 防火牆規則已存在"
fi

# 4. 建立 VM 執行個體
echo "🖥️ 正在建立 VM 執行個體 ($VM_NAME)..."
if ! gcloud compute instances describe $VM_NAME --zone=$ZONE >/dev/null 2>&1; then
  gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server \
    --address=$STATIC_IP
else
  echo "✅ VM 已存在"
fi

echo ""
echo "🎉 GCP 基礎環境已準備就緒！"
echo "--------------------------------------------------------"
echo "下一步請執行以下指令進入伺服器進行軟體安裝與部署："
echo ""
echo "gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "進入伺服器後，請執行專案中的 deploy/README.md 指引進行 Docker 安裝。"
echo "--------------------------------------------------------"
echo "提示：請記得將您的網域 (如 admin.gov.taipei) 指向此 IP: $STATIC_IP"
