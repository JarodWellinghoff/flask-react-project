pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        DOCKER_CREDENTIALS = credentials('docker-hub')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Test Backend') {
            agent {
                docker {
                    image 'python:3.11'
                    args '-u root'
                }
            }
            steps {
                sh '''
                    cd backend
                    pip install -r requirements.txt
                    pip install pytest pytest-cov
                    pytest tests/ --junitxml=test-results.xml
                '''
            }
            post {
                always {
                    junit 'backend/test-results.xml'
                }
            }
        }
        
        stage('Test Frontend') {
            agent {
                docker {
                    image 'node:18'
                }
            }
            steps {
                sh '''
                    cd frontend
                    npm ci
                    npm test -- --watchAll=false
                    npm run build
                '''
            }
        }
        
        stage('Build Docker Images') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-credentials') {
                        def backendImage = docker.build("${DOCKER_REGISTRY}/backend:${env.BUILD_ID}", "./backend")
                        backendImage.push()
                        backendImage.push('latest')
                        
                        def frontendImage = docker.build("${DOCKER_REGISTRY}/frontend:${env.BUILD_ID}", "./frontend")
                        frontendImage.push()
                        frontendImage.push('latest')
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    echo "Deploying to production..."
                    # Add deployment commands here
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}