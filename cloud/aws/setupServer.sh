
#/bin/bash

cd ~/

install_cronjob () {
    sudo cp /home/ec2-user/skycare-deploy-configs/db /home/ec2-user/ -R
    sudo chown ec2-user /home/ec2-user/db -R
    sudo chmod +x /home/ec2-user/db/backupDB.sh
    sudo chmod +x /home/ec2-user/db/setupDB.sh
    sudo chmod +x /home/ec2-user/db/restoreDB.sh
    (sudo crontab -l ; echo "00 00 * * * /home/ec2-user/db/backupDB.sh > /home/ec2-user/db/backup.log 2>&1") | sudo crontab -

    sudo cp /home/ec2-user/skycare-deploy-configs/prod/send_email_notice.sh /home/ec2-user/
    sudo chown ec2-user /home/ec2-user/send_email_notice.sh
    sudo chmod +x /home/ec2-user/send_email_notice.sh
    (sudo crontab -l ; echo "00 00 * * 1 /home/ec2-user/send_email_notice.sh > /home/ec2-user/email.log 2>&1") | sudo crontab -
}


# Make sure the S3.FUSE driver is present and built
S3FUSE_IS_MISSING="false"
command -v s3fs >/dev/null 2>&1 || { S3FUSE_IS_MISSING="true"; }
if [ $S3FUSE_IS_MISSING == "true" ]; then
    sudo yum install automake fuse fuse-devel gcc-c++ git libcurl-devel libxml2-devel make openssl-devel nano
    git clone https://github.com/s3fs-fuse/s3fs-fuse.git
    cd s3fs-fuse/
    ./autogen.sh
    ./configure --prefix=/usr --with-openssl
    make
    sudo make install
    cd ..
else
    echo "S3.FUSE driver already installed"
fi

# Setup the security credentials for accessing the S3 buckets
if [ ! -f /etc/passwd-s3fs ]; then
    sudo sh -c 'echo "AKIAYHE4V2APTRV32E7K:wqSKqtqrzibMYLiOK2nNlGEaEsu81hy4VTCKsClZ" > /etc/passwd-s3fs'
    sudo chmod 640 /etc/passwd-s3fs
else
    echo "S3 credentials file already exists"
fi

# Mount the main deployment configurations bucket
if [ ! -d ./skycare-deploy-configs ]; then
    mkdir skycare-deploy-configs
    sudo s3fs skycare-deploy-configs -o use_cache=/tmp -o allow_other -o uid=1001 -o mp_umask=002 -o multireq_max=5 -o passwd_file=/etc/passwd-s3fs /home/ec2-user/skycare-deploy-configs
    sudo sh -c 'echo "/usr/bin/s3fs skycare-deploy-configs -o use_cache=/tmp -o allow_other -o uid=1001 -o mp_umask=002 -o multireq_max=5 -o passwd_file=/etc/passwd-s3fs /home/ec2-user/skycare-deploy-configs" >> /etc/rc.local'
else
    echo "skycare-deploy-configs S3 bucket already mounted"
fi

read -p "Is this a PROD system? Y or N : " yn
case $yn in
    [Yy]* ) install_cronjob; exit;;
    [Nn]* ) exit;;
    * ) exit;;
esac
