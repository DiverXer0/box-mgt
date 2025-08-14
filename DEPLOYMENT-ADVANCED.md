# Advanced Deployment Guide - Production Considerations

## Dynamic Hostname/IP Management for QR Codes

### Problem
QR codes contain hardcoded URLs (e.g., `http://192.168.1.100:5000/box/box-id`) that break when:
- NAS IP address changes (DHCP renewal)
- Accessing from different networks (VPN, external)
- Port changes during updates

### Solution 1: Environment-Based URL Generation

The application now supports dynamic URL generation via environment variables:

```bash
# Set in Container Station environment variables
BASE_URL=https://nas.yourdomain.com:5000
# or
BASE_URL=http://192.168.1.100:5000
```

QR codes will automatically use the configured base URL instead of hardcoding localhost.

### Solution 2: Relative QR Codes + URL Shortener

For maximum flexibility, implement a redirect service:

```
QR Code → http://nas.local/qr/box123
Redirect → http://current-ip:5000/box/box-kitchen-storage
```

### Solution 3: mDNS/Local Domain

Set up `.local` domain resolution:
- Configure NAS hostname: `boxmanager.local`
- QR codes use: `http://boxmanager.local:5000/box/box-id`
- Works across local network regardless of IP changes

## Database and File Persistence Strategy

### Current Persistence Setup
✅ **Already Configured:**
- SQLite database: `/data/boxes.db` (volume mounted)
- Receipt uploads: `/uploads/` (volume mounted)
- Data survives container restarts and updates

### Container Update Workflow

1. **Before Update:**
   ```bash
   # Backup current data (optional but recommended)
   docker exec boxmanager cp -r /data /backup-$(date +%Y%m%d)
   docker exec boxmanager cp -r /uploads /backup-uploads-$(date +%Y%m%d)
   ```

2. **Update Container:**
   ```bash
   # Pull new image
   docker pull your-registry/boxmanager:latest
   
   # Stop and remove old container (data volumes preserved)
   docker stop boxmanager
   docker rm boxmanager
   
   # Start new container with same volume mounts
   docker run -d \
     --name boxmanager \
     -p 5000:5000 \
     -v /volume1/docker/boxmanager/data:/data \
     -v /volume1/docker/boxmanager/uploads:/uploads \
     -e BASE_URL=http://your-nas-ip:5000 \
     your-registry/boxmanager:latest
   ```

3. **Automatic Data Migration:**
   - Database schema updates handled by Drizzle migrations
   - Existing receipts remain accessible
   - No data loss during updates

### Production docker-compose.yml

```yaml
version: '3.8'
services:
  boxmanager:
    image: boxmanager:latest
    container_name: boxmanager
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      # Persistent data storage
      - ./data:/data
      - ./uploads:/uploads
      # Optional: Configuration files
      - ./config:/app/config
    environment:
      - NODE_ENV=production
      - BASE_URL=${BASE_URL:-http://localhost:5000}
      - TZ=America/New_York
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/stats"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Backup Strategy

1. **Automated Backups:**
   ```bash
   # Add to NAS cron job (daily at 2 AM)
   0 2 * * * /usr/bin/docker exec boxmanager tar -czf /data/backup-$(date +\%Y\%m\%d).tar.gz /data/boxes.db /uploads
   ```

2. **Cloud Sync (Optional):**
   - Sync `/data` and `/uploads` to cloud storage
   - Synology Cloud Station or rclone integration

### Zero-Downtime Updates

1. **Blue-Green Deployment:**
   ```bash
   # Start new version on different port
   docker run -d --name boxmanager-new -p 5001:5000 \
     -v /volume1/docker/boxmanager/data:/data \
     -v /volume1/docker/boxmanager/uploads:/uploads \
     boxmanager:latest
   
   # Test new version
   curl http://localhost:5001/api/stats
   
   # Switch ports (stop old, rename new)
   docker stop boxmanager
   docker stop boxmanager-new
   docker rename boxmanager boxmanager-old
   docker rename boxmanager-new boxmanager
   docker start boxmanager
   ```

### Network Configuration Recommendations

1. **Static IP Assignment:**
   - Configure DHCP reservation for NAS
   - Prevents IP address changes

2. **Dynamic DNS:**
   - Use services like DynDNS, No-IP
   - Access via domain name instead of IP

3. **Reverse Proxy Setup:**
   ```nginx
   # Nginx configuration
   server {
       listen 80;
       server_name boxmanager.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Environment Variable Configuration

Set these in Container Station:

```bash
# Required
BASE_URL=http://your-nas-domain:5000

# Optional
TZ=America/New_York
LOG_LEVEL=info
BACKUP_RETENTION_DAYS=30
```

The application will automatically:
- Use BASE_URL for QR code generation
- Maintain database connections across restarts
- Preserve all uploaded receipts
- Handle schema migrations seamlessly