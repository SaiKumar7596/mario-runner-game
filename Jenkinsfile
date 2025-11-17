pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "mario-runner-game:latest"
        DOCKER_REGISTRY = "docker.io"
        DOCKER_CREDENTIALS_ID = "docker-hub-credentials" // ID in Jenkins credentials store
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Node & Dependencies') {
            agent {
                docker {
                    image 'node:18-alpine'
                    args '-u root:root'
                }
            }
            steps {
                sh 'node -v'
                sh 'npm -v'
                sh 'npm install || echo "No dependencies to install"'
            }
        }

        stage('Build') {
            agent {
                docker {
                    image 'node:18-alpine'
                    args '-u root:root'
                }
            }
            steps {
                sh 'npm run build'
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                        def app = docker.build(DOCKER_IMAGE)
                        app.push()
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Run container locally on the Jenkins agent; adjust for your environment
                    sh 'docker ps -q --filter "ancestor=${DOCKER_IMAGE}" | xargs -r docker stop'
                    sh 'docker run -d -p 80:80 --rm --name mario-runner-game ${DOCKER_IMAGE}'
                }
            }
        }
    }
}
