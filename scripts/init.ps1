# FitFlow 项目初始化脚本 (PowerShell 版本)
# 这个脚本用于快速初始化 Windows 开发环境

Write-Host "🚀 FitFlow 项目初始化开始..." -ForegroundColor Green

# 检查必要的命令
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

Write-Host "📋 检查依赖..." -ForegroundColor Cyan

$commands = @("node", "npm", "git", "docker")
$missing = @()

foreach ($cmd in $commands) {
    if (Test-Command $cmd) {
        Write-Host "✅ $cmd 已安装" -ForegroundColor Green
    } else {
        Write-Host "❌ $cmd 未找到" -ForegroundColor Red
        $missing += $cmd
    }
}

if ($missing.Count -gt 0) {
    Write-Host "错误: 缺少以下工具: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "请先安装这些工具后重试" -ForegroundColor Yellow
    exit 1
}

# 初始化后端
Write-Host "🔧 初始化后端项目..." -ForegroundColor Cyan

if (-not (Test-Path "backend")) {
    Write-Host "创建后端项目文件夹..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "backend" -Force | Out-Null
}

Push-Location "backend"

if (-not (Test-Path "package.json")) {
    Write-Host "初始化 NestJS 项目..." -ForegroundColor Yellow
    npm init -y | Out-Null
    
    # 安装核心依赖
    npm install `
        @nestjs/common `
        @nestjs/core `
        @nestjs/config `
        @prisma/client `
        prisma `
        passport `
        passport-jwt `
        bcrypt `
        @nestjs/jwt `
        @nestjs/passport `
        class-validator `
        class-transformer | Out-Null
    
    # 安装开发依赖
    npm install -D `
        @types/node `
        typescript `
        ts-node `
        @types/bcrypt `
        @types/passport-jwt | Out-Null
} else {
    Write-Host "后端项目已存在，跳过创建" -ForegroundColor Yellow
}

Pop-Location

# 初始化前端
Write-Host "🎨 初始化前端项目..." -ForegroundColor Cyan

if (-not (Test-Path "frontend")) {
    Write-Host "创建前端项目文件夹..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "frontend" -Force | Out-Null
}

Push-Location "frontend"

if (-not (Test-Path "package.json")) {
    Write-Host "初始化 Next.js 项目..." -ForegroundColor Yellow
    npm init -y | Out-Null
    
    # 安装核心依赖
    npm install next react react-dom axios zustand | Out-Null
    
    # 安装开发依赖
    npm install -D `
        typescript `
        @types/node `
        @types/react `
        @types/react-dom `
        tailwindcss `
        postcss `
        autoprefixer `
        eslint `
        eslint-config-next `
        prettier | Out-Null
} else {
    Write-Host "前端项目已存在，跳过创建" -ForegroundColor Yellow
}

Pop-Location

# 创建环境变量文件
Write-Host "⚙️ 创建环境变量文件..." -ForegroundColor Cyan

if (-not (Test-Path "backend/.env.example")) {
    $backendEnv = @"
# 数据库配置
DATABASE_URL=postgresql://fitflow_user:fitflow_pass@localhost:5432/fitflow_db
NODE_ENV=development

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# 服务器配置
PORT=3001
API_VERSION=v1
"@
    Set-Content -Path "backend/.env.example" -Value $backendEnv -Encoding UTF8
    Write-Host "✅ 创建 backend/.env.example" -ForegroundColor Green
}

if (-not (Test-Path "frontend/.env.example")) {
    $frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=FitFlow
NEXT_PUBLIC_APP_VERSION=1.0.0
"@
    Set-Content -Path "frontend/.env.example" -Value $frontendEnv -Encoding UTF8
    Write-Host "✅ 创建 frontend/.env.example" -ForegroundColor Green
}

# 创建 docker-compose.yml
Write-Host "🐳 准备 Docker 环境..." -ForegroundColor Cyan

if (-not (Test-Path "docker-compose.yml")) {
    $dockerCompose = @"
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: fitflow_db
    environment:
      POSTGRES_DB: fitflow_db
      POSTGRES_USER: fitflow_user
      POSTGRES_PASSWORD: fitflow_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fitflow_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fitflow_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    container_name: fitflow_backend
    environment:
      DATABASE_URL: postgresql://fitflow_user:fitflow_pass@postgres:5432/fitflow_db
      NODE_ENV: development
      JWT_SECRET: your_jwt_secret_key_here
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - fitflow_network
    volumes:
      - ./backend/src:/app/src
    command: npm run start:dev

  frontend:
    build: ./frontend
    container_name: fitflow_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - fitflow_network
    volumes:
      - ./frontend/src:/app/src

volumes:
  postgres_data:

networks:
  fitflow_network:
    driver: bridge
"@
    Set-Content -Path "docker-compose.yml" -Value $dockerCompose -Encoding UTF8
    Write-Host "✅ 创建 docker-compose.yml" -ForegroundColor Green
}

# 完成
Write-Host ""
Write-Host "✨ 初始化完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. 启动 Docker 环境: docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣ 后端设置:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   cp .env.example .env" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npx prisma migrate dev" -ForegroundColor Cyan
Write-Host "   npm run start:dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3️⃣ 前端设置 (新终端):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Cyan
Write-Host "   cp .env.example .env.local" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Green
Write-Host "📱 前端: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⚙️ 后端: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 PostgreSQL: localhost:5432" -ForegroundColor Cyan
