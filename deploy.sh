# deploy.sh - Deployment script
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Configuration
DOCKER_REGISTRY="your-registry.com"
VERSION=${1:-latest}
ENVIRONMENT=${2:-production}

# Build and push images
echo "📦 Building Docker images..."
docker build -t ${DOCKER_REGISTRY}/calc-backend:${VERSION} ./backend
docker build -t ${DOCKER_REGISTRY}/calc-frontend:${VERSION} ./frontend

echo "⬆️ Pushing images to registry..."
docker push ${DOCKER_REGISTRY}/calc-backend:${VERSION}
docker push ${DOCKER_REGISTRY}/calc-frontend:${VERSION}

# Deploy based on environment
if [ "$ENVIRONMENT" == "kubernetes" ]; then
    echo "☸️ Deploying to Kubernetes..."
    kubectl apply -f kubernetes/
    kubectl set image deployment/backend backend=${DOCKER_REGISTRY}/calc-backend:${VERSION} -n calculation-app
    kubectl set image deployment/frontend frontend=${DOCKER_REGISTRY}/calc-frontend:${VERSION} -n calculation-app
    kubectl set image deployment/celery-worker celery=${DOCKER_REGISTRY}/calc-backend:${VERSION} -n calculation-app
    kubectl rollout status deployment/backend -n calculation-app
    kubectl rollout status deployment/frontend -n calculation-app
    kubectl rollout status deployment/celery-worker -n calculation-app
elif [ "$ENVIRONMENT" == "docker-compose" ]; then
    echo "🐳 Deploying with Docker Compose..."
    VERSION=${VERSION} docker-compose -f docker-compose.production.yml up -d
    docker-compose -f docker-compose.production.yml ps
else
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
fi

echo "✅ Deployment complete!"