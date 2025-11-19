pipeline {
    agent any

    environment {
        DOCKER_REPO    = "saikumar7596/mario-runner"   // DockerHub repo
        DEPLOY_HOST    = "54.215.43.123"               // Your EC2 server IP
        CONTAINER_NAME = "nginx-game"                  // Name of container on EC2
    }

    tools {
        nodejs "Node16"     // Node 16 configured in Jenkins → Manage Jenkins → Tools
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
                echo "Checked out commit: ${env.GIT_COMMIT ?: 'local'}"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh """
                    npm install
                """
            }
        }

        stage('Build JavaScript App') {
            steps {
                sh """
                    npm run build
                """
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def shortCommit = (env.GIT_COMMIT ?: 'local').take(7)

                    sh """
                        echo "Building Docker image..."
                        docker build -t ${DOCKER_REPO}:${shortCommit} .
                        docker tag ${DOCKER_REPO}:${shortCommit} ${DOCKER_REPO}:latest
                    """
                }
            }
        }

        stage('Push Docker Image to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',     // Jenkins Credentials ID
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin
                        docker push ${DOCKER_REPO}:latest
                    """
                }
            }
        }

        stage('Deploy on EC2 via SSH') {
            steps {
                sshagent(['ssh-deploy']) {    // Jenkins SSH key credential ID
                    sh """
                        ssh -o StrictHostKeyChecking=no ubuntu@${DEPLOY_HOST} '
                            echo "Stopping old container if exists..."
                            docker stop ${CONTAINER_NAME} 2>/dev/null || true

                            echo "Removing old container..."
                            docker rm ${CONTAINER_NAME} 2>/dev/null || true

                            echo "Pulling new Docker image..."
                            docker pull ${DOCKER_REPO}:latest

                            echo "Starting new Nginx container..."
                            docker run -d --name ${CONTAINER_NAME} -p 80:80 --restart unless-stopped ${DOCKER_REPO}:latest
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 DEPLOYMENT SUCCESS — JavaScript Game is LIVE at http://${DEPLOY_HOST}"
        }
        failure {
            echo "❌ PIPELINE FAILED — Check console logs."
        }
    }
}
