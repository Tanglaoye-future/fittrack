#!/bin/bash

# FitFlow 项目初始化脚本
# 这个脚本用于快速初始化开发环境

set -e

echo "🚀 FitFlow 项目初始化开始..."

# 检查必要的命令
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ 错误: 未找到 $1，请先安装"
    exit 1
  fi
}

echo "📋 检查依赖..."
check_command "node"
check_command "npm"
check_command "git"
check_command "docker"

echo "✅ 依赖检查完成"

# 初始化后端
echo "🔧 初始化后端项目..."
if [ ! -d "backend" ]; then
  echo "创建后端项目文件夹..."
  mkdir -p backend
fi

cd backend

if [ ! -f "package.json" ]; then
  echo "初始化 NestJS 项目..."
  npm init -y
  npm install -g @nestjs/cli
  # 实际项目应使用: nest new . --package-manager npm
  npm install @nestjs/common @nestjs/core @nestjs/config
  npm install @prisma/client prisma
  npm install passport jwt bcrypt
  npm install @nestjs/jwt @nestjs/passport
  npm install class-validator class-transformer
  npm install --save-dev @types/node typescript ts-node @nestjs/cli
else
  echo "后端项目已存在，跳过创建"
fi

cd ..

# 初始化前端
echo "🎨 初始化前端项目..."
if [ ! -d "frontend" ]; then
  echo "创建前端项目文件夹..."
  mkdir -p frontend
fi

cd frontend

if [ ! -f "package.json" ]; then
  echo "初始化 Next.js 项目..."
  npm init -y
  npm install next@latest react@latest react-dom@latest
  npm install -D tailwindcss postcss autoprefixer
  npm install -D typescript @types/node @types/react @types/react-dom
  npm install -D eslint eslint-config-next prettier
  npm install axios zustand
else
  echo "前端项目已存在，跳过创建"
fi

cd ..

# Docker 准备
echo "🐳 准备 Docker 环境..."
if [ ! -f "docker-compose.yml" ]; then
  echo "创建 docker-compose.yml..."
  cat > docker-compose.yml << 'EOF'
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
EOF
else
  echo "docker-compose.yml 已存在"
fi

# 创建环境变量文件
echo "⚙️ 创建环境变量文件..."

if [ ! -f "backend/.env.example" ]; then
  cat > backend/.env.example << 'EOF'
# 数据库配置
DATABASE_URL=postgresql://fitflow_user:fitflow_pass@localhost:5432/fitflow_db
NODE_ENV=development

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# 服务器配置
PORT=3001
API_VERSION=v1
EOF
fi

if [ ! -f "frontend/.env.example" ]; then
  cat > frontend/.env.example << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=FitFlow
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
fi

echo ""
echo "✨ 初始化完成！"
echo ""
echo "下一步操作:"
echo "1. 启动 Docker 环境: docker-compose up -d"
echo "2. 进入后端目录: cd backend"
echo "3. 复制环境变量: cp .env.example .env"
echo "4. 安装依赖: npm install"
echo "5. 运行数据库迁移: npx prisma migrate dev"
echo "6. 启动后端: npm run start:dev"
echo ""
echo "7. 在新终端进入前端目录: cd frontend"
echo "8. 复制环境变量: cp .env.example .env.local"
echo "9. 安装依赖: npm install"
echo "10. 启动前端: npm run dev"
echo ""
echo "访问地址:"
echo "📱 前端: http://localhost:3000"
echo "⚙️ 后端: http://localhost:3001"
echo "📊 PostgreSQL: localhost:5432"
