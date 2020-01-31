#/bin/bash

cd ~/

restore_last_backup () {
    cd ~/
    echo ""
    echo "Restoring from the database backup..."
    echo ""

    FILE_NAME=$(ls -t skycare-backups/database/ | head -1)
    cp skycare-backups/database/$FILE_NAME .
    gzip -d -c $FILE_NAME |  couchrestore --url http://localhost:8080 --db skycare
    rm $FILE_NAME

    echo "Restore is complete"
}

# Check for NVM
if [ -f ~/.nvm/nvm.sh ]; then
    chmod +x ~/.nvm/nvm.sh
    . ~/.nvm/nvm.sh
fi

NVM_IS_PRESENT=$(nvm --version 2>&1 | grep -c "0.34.0")
if [ $NVM_IS_PRESENT -eq 0 ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash

    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
else
    echo "NVM is already installed"
fi

# Check for the nodejs version
NODE_IS_PRESENT=$(node --version 2>&1 | grep -c "10.15.0")
if [ $NODE_IS_PRESENT -eq 0 ]; then
    nvm install v10.15.0
    nvm use v10.15.0
else
    echo "Nodejs and NPM are already installed"
fi

# Make sure the couchbackup package is installed globally
COUCHBU_IS_PRESENT=$(npm list -g --depth 0 | grep -c couchbackup)
if [ $COUCHBU_IS_PRESENT -eq 0 ]; then
    npm install -g couchbackup
else
    echo "CouchBackup is already installed"
fi

# Make sure the S3 mount is loaded locally
if [ ! -d /home/ec2-user/skycare-backups ]; then
    mkdir -p /home/ec2-user/skycare-backups
    sudo s3fs skycare-backups -o use_cache=/tmp -o allow_other -o uid=1001 -o mp_umask=002 -o multireq_max=5 -o passwd_file=/etc/passwd-s3fs /home/ec2-user/skycare-backups
    sudo sh -c 'echo "sudo s3fs skycare-backups -o use_cache=/tmp -o allow_other -o uid=1001 -o mp_umask=002 -o multireq_max=5 -o passwd_file=/etc/passwd-s3fs /home/ec2-user/skycare-backups" >> /etc/rc.local'
else
    echo "skycare-backups S3 bucket is already mounted locally"
fi

# Make sure the database and keys subdirectories exist in the S3 mount
sudo mkdir -p /home/ec2-user/skycare-backups/database
sudo mkdir -p /home/ec2-user/skycare-backups/keys

# Find the newest database backup
LAST_BACKUP_FILE_NAME=$(sudo ls -lthgG ./skycare-backups/database | awk '{print $7}' | tail -n +2 | head -1)
LAST_BACKUP_FILE_DATE=$(sudo ls -lthgG ./skycare-backups/database | awk '{print $4, $5}' | tail -n +2 | head -1)
LAST_BACKUP_FILE_SIZE=$(sudo ls -lthgG ./skycare-backups/database | awk '{print $3}' | tail -n +2 | head -1)

echo "======================================================"
echo "||"
echo "||   Located the last database backup in storge"
echo "||"
echo "||   File name : $LAST_BACKUP_FILE_NAME"
echo "||   File date : $LAST_BACKUP_FILE_DATE"
echo "||   File size : $LAST_BACKUP_FILE_SIZE"
echo "||"
echo "======================================================"
echo ""

read -p "Do you want to restore this database backup? Y or N : " yn
case $yn in
    [Yy]* ) restore_last_backup; exit;;
    [Nn]* ) exit;;
    * ) exit;;
esac
