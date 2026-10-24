# Deploy MEDACTIO on the OVH HDS Public Cloud instance

Target: `medactio.fr` served from the OVHcloud Public Cloud project
**MEDACTIO-PROD-HDS**, created with the "Hébergement de données de santé et
certification HDS" option enabled. Only resources created inside that project
are covered by OVHcloud's HDS certification.

This runbook replaces [DEPLOY_OVH_APACHE.md](DEPLOY_OVH_APACHE.md), which
targets the non-HDS VPS currently serving the domain. Internal names are
unchanged, so both documents describe the same application layout:

| | |
|---|---|
| Public Cloud project | `MEDACTIO-PROD-HDS` |
| Region | `SBG7` — Strasbourg, 1-AZ, France |
| Instance | `medactio-prod-hds`, b3-8 (2 vCPU, 8 GB), 50 GB NVMe |
| Image | Ubuntu 24.04 LTS (UEFI) |
| Public address | Floating IP `57.128.27.124` (survives instance rebuild) |
| Private address | `10.1.3.99` on `pn-SBG7` |
| Instance backups | automated, rotation 14 |
| App directory | `/var/www/redactio` |
| Linux user | `redactio` |
| Internal app port | `127.0.0.1:3121` |
| systemd service | `redactio.service` |
| MySQL database/user | `redactio`, listening on `127.0.0.1` only |

Health data is never persisted by the application: uploads stay in memory,
OCR writes to a private temporary directory that is wiped after extraction,
and MySQL only holds accounts, organisations, the audit log and the medical
dictionary. The instance still processes health data in memory, which is why
it must live inside the HDS project.

## 1. First connection

The floating IP is shown in **Public Cloud → Instances**. Connect with the key
created for this project:

```bash
ssh -i ~/.ssh/medactio-hds ubuntu@FLOATING_IP
```

Add a shortcut in `~/.ssh/config` on the workstation so later commands are
shorter:

```sshconfig
Host medactio-hds
    HostName FLOATING_IP
    User ubuntu
    IdentityFile ~/.ssh/medactio-hds
    IdentitiesOnly yes
```

## 2. System hardening

```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Europe/Paris
```

Password authentication must stay disabled — the image ships with key-only
access, verify it rather than assume it:

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitrootlogin)'
```

Both must read `no`. Then restrict the firewall to the three ports the service
needs:

```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

Unattended security updates, so the instance does not drift:

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 3. Packages

```bash
sudo apt install -y apache2 mysql-server curl git unzip \
    poppler-utils tesseract-ocr tesseract-ocr-fra
```

`poppler-utils` (`pdftoppm`) and `tesseract-ocr` are required for scanned,
image-only PDF uploads (Observation médicale, file extraction). Without them
those uploads fail with an OCR error instead of falling back to text
extraction.

Node.js 22 LTS and pnpm:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
corepack prepare pnpm@10.4.1 --activate
```

## 4. Application user and directory

```bash
sudo adduser --system --group --home /var/www/redactio redactio
sudo mkdir -p /var/www/redactio
sudo chown -R redactio:redactio /var/www/redactio
```

## 5. MySQL

The database listens on the loopback interface only — nothing in the private
network needs to reach it:

```bash
sudo grep -E '^bind-address' /etc/mysql/mysql.conf.d/mysqld.cnf
```

It must read `bind-address = 127.0.0.1`. Then create the database and its
dedicated user:

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

Generate the password with `openssl rand -base64 24` and store it in a
password manager, not in a note.

> Moving to an OVH managed database later only changes `DATABASE_URL` and adds
> `DATABASE_SSL_CA` (see section 6). The application already supports TLS with
> a certificate authority file.

## 6. Production environment

```bash
cd /var/www/redactio
sudo -u redactio cp .env.production.example .env
sudo -u redactio nano .env
sudo chmod 600 .env
```

Minimum values:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3121
JWT_SECRET=GENERATE_WITH_OPENSSL_RAND_HEX_32
LOCAL_ADMIN_EMAIL=gloirerofie@gmail.com
LOCAL_ADMIN_PASSWORD=CHANGE_ME_STRONG_ADMIN_PASSWORD
LOCAL_ADMIN_NAME=Gloire Rofie
DATABASE_URL=mysql://redactio:CHANGE_ME_STRONG_DB_PASSWORD@127.0.0.1:3306/redactio
ANTHROPIC_API_KEY=...
```

```bash
openssl rand -hex 32   # JWT_SECRET
```

With MySQL on the same machine the connection stays on the loopback interface
and needs no TLS. With a managed database, add the certificate authority
downloaded from the OVH console:

```env
DATABASE_SSL_CA=/var/www/redactio/ovh-mysql-ca.pem
```

The server refuses to start in production when `DATABASE_URL` is missing or
the database is unreachable, so a misconfigured `.env` fails loudly at
`systemctl start` instead of serving an app without accounts or audit log.

## 7. Code, build, migrations

```bash
cd /var/www/redactio
sudo -u redactio git clone https://github.com/1234gloire/redactio.git .
sudo -u redactio pnpm install --frozen-lockfile
sudo -u redactio pnpm build
sudo -u redactio pnpm db:migrate
```

## 8. systemd service

```bash
sudo cp /var/www/redactio/deploy/systemd/redactio.service /etc/systemd/system/redactio.service
sudo systemctl daemon-reload
sudo systemctl enable --now redactio
sudo systemctl status redactio
journalctl -u redactio -n 50
```

The log must contain `[Database] Connexion établie`. Health check:

```bash
curl -I http://127.0.0.1:3121/
```

## 9. Apache reverse proxy

```bash
sudo a2enmod proxy proxy_http headers rewrite ssl
sudo cp /var/www/redactio/deploy/apache/medactio.fr.conf /etc/apache2/sites-available/medactio.fr.conf
sudo a2ensite medactio.fr.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

The vhost proxies to `127.0.0.1:3121` with `timeout=600`, which covers long
multi-page AI extractions.

## 10. Copy the database from the current VPS

Run this **before** the DNS cutover, and freeze writes on the old server for
the duration — ask users to stop working, or stop the service.

On the current VPS (`vps-cc025947.vps.ovh.net`):

```bash
sudo systemctl stop redactio
mysqldump -u redactio -p --single-transaction --routines --default-character-set=utf8mb4 redactio > /tmp/redactio.sql
```

Copy it over, through the workstation:

```bash
scp OLD_VPS:/tmp/redactio.sql /tmp/redactio.sql
scp /tmp/redactio.sql medactio-hds:/tmp/redactio.sql
```

On the HDS instance:

```bash
mysql -u redactio -p redactio < /tmp/redactio.sql
sudo -u redactio pnpm db:migrate     # applies any migration the dump predates
sudo systemctl restart redactio
rm /tmp/redactio.sql
```

Delete the dump from every machine it touched — it contains account hashes and
the audit log.

## 11. Verify before switching DNS

Check the application through the floating IP, while `medactio.fr` still
points at the old VPS:

```bash
curl -I http://FLOATING_IP/
```

Then log in through the IP, generate a document in each module, and confirm an
export. Only move on once that passes.

## 12. DNS cutover

Lower the TTL to 300 seconds at the registrar **at least a day before**, then
point both records at the floating IP:

```text
medactio.fr     -> FLOATING_IP
www.medactio.fr -> FLOATING_IP
```

```bash
dig +short medactio.fr
```

Once the IP has propagated, issue the certificate:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d medactio.fr -d www.medactio.fr
curl -I https://medactio.fr/
```

Raise the TTL back to its usual value afterwards.

## 13. After the cutover

- Keep the old VPS **stopped but not deleted** for a week, as a rollback path.
- Resiliate it once the HDS instance has run a full week without incident —
  it is billed on the other OVH account until then.
- Check that the first automated instance backup has run (Public Cloud →
  Sauvegarde d'instance).
- Request the HDS attestation from OVH support; health establishments ask for
  it during procurement.

## 14. Updates

```bash
cd /var/www/redactio
sudo -u redactio git pull
sudo -u redactio pnpm install --frozen-lockfile
sudo -u redactio pnpm build
sudo -u redactio pnpm db:migrate
sudo systemctl restart redactio
journalctl -u redactio -n 30
```

## Port collision policy

MEDACTIO uses internal port `3121` only. Before deploying:

```bash
sudo ss -ltnp | grep ':3121'
```

If occupied, change both `/var/www/redactio/.env` (`PORT=`) and the
`ProxyPass` target in `/etc/apache2/sites-available/medactio.fr.conf`.
