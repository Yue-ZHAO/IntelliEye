# App setup and maintenance 

### Nodejs
Used for running the server, runs javascript code without browser.

Install: depends on OS. Ubuntu: `sudo apt-get install nodejs`

---

### Npm 

Node package manager, needed to install nodejs and nodejs related packages.

Install: depends on OS. Ubuntu: `sudo apt-get install npm`

On Windows, installing Nodejs will also install Npm.

When inside the root of the app, enter npm install  to install the necessary node modules.

---

### pm2

Pm2 monitors the app and is able to run the app as a daemon process, no need for ‘screen’.

Install: npm install -g pm2

Usage: http://pm2.keymetrics.io/docs/usage/quick-start/#cheat-sheet
```
pm2 start app.js //starts app.js 
pm2 start app.js --name “myapp” //for easier recall later
pm2 stop <name app/all>
pm2 restart <name app> 
```

Restarting may not update client’s css, so stop all and starting the app should work.

---

### nginx

Is used as a reversed proxy (making the HTTP app HTTPS secure) and load balancer (serves static files like css, images, javascript).

Install: depends on OS. Ubuntu: `sudo apt-get install nginx`

Setup: depends on OS, config file’s location may be different.

For Ubuntu server:
copy ssl certificates to `/etc/nginx/ssl`
edit the default file: `sudo vi /etc/nginx/sites-available/default`

Make sure the default file contains the following:

```
server {
        listen 80 default_server;              #not necessary if not using HTTP
        listen  443 ssl default_server;        #necessary for HTTPS
        server_name     moocwidgets.cc;        #domain name
        root    /home/yuez/moocwidgets/; 

        ssl_certificate "/etc/nginx/ssl/cert.pem";
        ssl_certificate_key "/etc/nginx/ssl/key.key";

        include /etc/nginx/default.d/*.conf;

        location /static/ {     #location of static files (css, js, htmls)
                alias   /home/yuez/moocwidgets/static/; 
        }

        location / { 
                proxy_pass http://131.180.125.108:8000;       #public IP of server:port defined in app.js
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }

}
```

After saving the default file, restart nginx: `nginx -s reload`

---

### Gulp

Gulp is used to make the static files production ready i.e. concatenating files, minimizing files, transpile ES6 to ES5 and renaming files.

Install: `npm install -g gulp`
    (you also need to install local packages in the app root, this will be automatically done by entering `npm install`)

* Inside the root of the app, you will find the ‘gulpfile.js’. This file determines what needs to happen when using gulp. The file makes use of the gulp tasker to order certain actions. 

* First, ‘moocwidget-dev.js’ is transpiled from ES6 to ES5 for Internet Explorer compatibility. Then it is concatenated with ‘Client.js’ for environment retrieval.

* Then the 3 versions (Pause, AuditoryAlert, VisualAlert) of `ieyewidget.js` are compiled with the right HTML introduction contents.

**Before updating the server's static content, run `gulp` in the terminal when in the root of the app to perform these actions aboce**.


---

## Workflow
* After editing Javascript files, run `gulp` in the terminal
* If necessary, commit the contents to the server
* Start or restart the app with pm2: `pm2 start app.js` or `pm2 restart <name>` (actual stop/start may be needed for CSS changes)
