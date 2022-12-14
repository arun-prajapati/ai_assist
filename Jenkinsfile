def namespace = "wms"
def project_name = "${namespace}" + "-web"
def dirName = "${project_name}"
def branch_name_1 = "production"
def branch_name_2 = "development"
def image_name = "wms-backend"
def container_name = "${image_name}" + "-cont"
def sshagent_name = "adme"
def ip_address = "0.0.0.0"
def system_port = "8000"
def cont_port = "8000"
def env_sub_folder = "backend"

pipeline {
    agent any
    options {
        buildDiscarder(logRotator(numToKeepStr: '7'))
    }

    stages {
        stage('Build') {
            steps {
                echo "+---------+---------+---------+Information of your build+---------+---------+---------+---------+"
                echo "Project Name: ${project_name}"
                echo "Branch Name: ${env.BRANCH_NAME}"
                echo "Image: ${image_name}"
                echo "Port mapping: ${system_port}:${cont_port}"
                echo "+---------+---------+---------+---------+---------+---------+---------+---------+"
                script {
                    echo "+---------+---------+---------+"
                    echo "Take a deep breath, Your application is building."
                    echo "+---------+---------+---------+"
                    if (env.BRANCH_NAME == "${branch_name_1}") {
                        
                        withAWS(region:'eu-west-1',credentials:'s3-env-sabkienv') {
                            def identity=awsIdentity();
                            s3Download(file:'.env', bucket:'sabkienv', path:"${namespace}/${env_sub_folder}/${branch_name_1}/.env", force:true)
                        }

                        sshagent(["${sshagent_name}"]) {
                            sh "zip -r ${dirName}.zip . -x *.git*"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'mkdir /home/ubuntu/${dirName}/ || ls'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${dirName} && sudo rm -r * || ls'"
                            sh "scp -o StrictHostKeyChecking=no ${dirName}.zip ubuntu@${ip_address}:/home/ubuntu/"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/ && mv ${dirName}.zip ${dirName}/'"
                            sh "rm -r ${dirName}.zip || ls"

                        }

                    } else if (env.BRANCH_NAME == "${branch_name_2}") {
                    
                        sh "pwd && ls -la"
                        echo "Checkout Done & docker build started"
                        sh "docker build -t ${project_name} ."
                        echo "docker build done and it will run......"

                    } 
                }
            }
        }
        stage('Deploy') {
            steps {
                echo 'do something'
                script {
                    if (env.BRANCH_NAME == "${branch_name_1}") {

                        sshagent(["${sshagent_name}"]) {

                        	sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'sudo apt-get update && sudo apt-get install unzip'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${dirName} && unzip -o ${dirName}.zip'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${dirName} && sudo rm -r ${dirName}.zip'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'cd /home/ubuntu/${project_name} && sudo docker build -t ${project_name} .'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'sudo docker rm -f ${container_name} || date'"
                            sh "ssh -o StrictHostKeyChecking=no ubuntu@${ip_address} 'sudo docker run --restart always -d -p ${system_port}:${cont_port} --name ${container_name} ${project_name}:latest'"
                        }


                    } else if (env.BRANCH_NAME == "${branch_name_2}") {

                        sh "docker rm -f ${container_name} || ls"
                        sh "docker run -d --restart always --name ${container_name} -p ${system_port}:${cont_port} ${project_name}"
                        sh "docker ps | grep ${container_name}"
                        echo "deployed"
                    }
                }
            }
        }
    }
}
