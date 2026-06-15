# Deploy REDACTIO on OVH Ubuntu with Apache

Target domain: `redactio.evc-pae.fr`

This deployment keeps REDACTIO isolated from other projects:

- app directory: `/var/www/redactio`
- Linux user: `redactio`
- internal app port: `127.0.0.1:3121`
- Apache vhost: `redactio.evc-pae.fr`
- MySQL database/user: `redactio`
- systemd service: `redactio.service`

## 1. DNS

Create an `A` record:

```text
redactio.evc-pae.fr -> VPS_PUBLIC_IPV4
```

Wait until:

```bash
dig +short redactio.evc-pae.fr
```

returns the VPS IP.

## 2. VPS packages

```bash
sudo apt update
sudo apt install -y apache2 mysql-server curl git unzip
```

Install Node.js 22 LTS or newer. Example with NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
corepack prepare pnpm@10.4.1 --activate
```

## 3. Create isolated Linux user and app directory

```bash
sudo adduser --system --group --home /var/www/redactio redactio
sudo mkdir -p /var/www/redactio
sudo chown -R redactio:redactio /var/www/redactio
```

Copy or clone the project into `/var/www/redactio`.

## 4. MySQL database

Use a strong password in production.

```bash
sudo mysql
```

```sql
CREATE DATABASE IF NOT EXISTS redactio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'redactio'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON redactio.* TO 'redactio'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 5. Production environment

Create `/var/www/redactio/.env` from `.env.production.example`:

```bash
sudo -u redactio cp /var/www/redactio/.env.production.example /var/www/redactio/.env
sudo -u redactio nano /var/www/redactio/.env
```

Minimum production values:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3121
JWT_SECRET=GENERATE_WITH_OPENSSL_RAND_HEX_32
LOCAL_ADMIN_EMAIL=gloirerofie@gmail.com
LOCAL_ADMIN_PASSWORD=CHANGE_ME_STRONG_ADMIN_PASSWORD
LOCAL_ADMIN_NAME=Gloire Rofie
DATABASE_URL=mysql://redactio:CHANGE_ME_STRONG_DB_PASSWORD@127.0.0.1:3306/redactio
```

Generate a JWT secret:

```bash
openssl rand -hex 32
```

## 6. Build and migrate

```bash
cd /var/www/redactio
sudo -u redactio pnpm install --frozen-lockfile
sudo -u redactio pnpm build
sudo -u redactio pnpm db:migrate
```

## 7. systemd service

```bash
sudo cp /var/www/redactio/deploy/systemd/redactio.service /etc/systemd/system/redactio.service
sudo systemctl daemon-reload
sudo systemctl enable --now redactio
sudo systemctl status redactio
```

Logs:

```bash
journalctl -u redactio -f
```

Health check:

```bash
curl -I http://127.0.0.1:3121/
```

## 8. Apache reverse proxy

Enable required modules without changing other vhosts:

```bash
sudo a2enmod proxy proxy_http headers rewrite ssl
sudo systemctl reload apache2
```

Install the REDACTIO vhost only:

```bash
sudo cp /var/www/redactio/deploy/apache/redactio.evc-pae.fr.conf /etc/apache2/sites-available/redactio.evc-pae.fr.conf
sudo a2ensite redactio.evc-pae.fr.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## 9. TLS certificate

If Certbot is not installed:

```bash
sudo apt install -y certbot python3-certbot-apache
```

Issue the certificate:

```bash
sudo certbot --apache -d redactio.evc-pae.fr
```

Then verify:

```bash
curl -I https://redactio.evc-pae.fr/
```

## 10. Updates

```bash
cd /var/www/redactio
sudo -u redactio git pull
sudo -u redactio pnpm install --frozen-lockfile
sudo -u redactio pnpm build
sudo -u redactio pnpm db:migrate
sudo systemctl restart redactio
```

## Port collision policy

REDACTIO uses only internal port `3121`. Before deploying, verify:

```bash
sudo ss -ltnp | grep ':3121'
```

If occupied, choose another internal port and update both:

- `/var/www/redactio/.env` -> `PORT=...`
- `/etc/apache2/sites-available/redactio.evc-pae.fr.conf` -> `ProxyPass` target
