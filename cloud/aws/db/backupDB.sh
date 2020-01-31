#/bin/bash

cd ~/

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

# Backup the local database container to an intermediate file
rm -f backup.txt
rm -f *.gz

echo "Creating a backup of the Cloudant database"
couchbackup --url http://localhost:8080 --db skycare --output backup.txt
ls -l backup.txt

echo "Compressing the backup file"
cat backup.txt | gzip -9 > skycare_$(date +%s).gz
ls -l skycare_*.gz

# Only move the backup to remote storage if this is run in a default mode (no command line arguments)
if [ "$#" = "0" ]; then
    # Move the database archive to the S3 subfolder
    echo "Moving the compressed archive to S3"
    sudo mv skycare*.gz /home/ec2-user/skycare-backups/database/
    rm -f backup.txt
    ls -l /home/ec2-user/skycare-backups/database/

    # Prune all archives older than 30 days, if the count of files is greater than 30, and if the amount of remaining files would be greater than 20
    ARCHIVES_OLDER_THAN_THIRTY_DAYS=$(find /home/ec2-user/skycare-backups/database -type f -mtime +30 | wc -l)
    TOTAL_ARCHIVES=$(find /home/ec2-user/skycare-backups/database -type f | wc -l)
    REMAINING_ARCIVES="$(($TOTAL_ARCHIVES-$ARCHIVES_OLDER_THAN_THIRTY_DAYS))"
    if [ $TOTAL_ARCHIVES -gt 30 ]; then
        if [ $ARCHIVES_OLDER_THAN_THIRTY_DAYS -gt 0 ]; then
            if [ $REMAINING_ARCIVES -gt 20 ]; then
                echo "ARCHIVE DELETION: Deleting $ARCHIVES_OLDER_THAN_THIRTY_DAYS database archives"
                sudo find /home/ec2-user/skycare-backups/database -mtime +30 -delete
                echo "ARCHIVE DELETION: $(find /home/ec2-user/skycare-backups/database -type f | wc -l) database archives remaining"
            else
                echo "NO ARCHIVE DELETION: More than 30 archives and some are older than 30 days old."
                echo "NO ARCHIVE DELETION: Did not delete any because there would be less than 20 remaining"
            fi
        else
            echo "NO ARCHIVE DELETION: More than 30 archives"
            echo "NO ARCHIVE DELETION: Did not delete any because none are older than 30 days"
        fi
    else
        echo "NO ARCHIVE DELETION: Did not delete any archives because there are less than 30"
    fi
fi