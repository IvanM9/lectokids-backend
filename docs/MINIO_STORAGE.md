# MINIO Storage Integration

This project supports both Firebase Storage and MINIO as storage backends for multimedia files. You can configure which storage provider to use via environment variables.

## Supported Storage Providers

- **Firebase Storage** (default): Google Cloud-based object storage
- **MINIO**: Open-source, S3-compatible object storage

## Environment Configuration

### Common Settings

```env
# Storage provider selection ('firebase' or 'minio')
STORAGE_PROVIDER=minio

# Bucket/container name for storing files
BUCKET_NAME=lectokids-multimedia

# Local directory for temporary file storage
PUBLIC_DIR=./src/public
```

### Firebase Configuration (when STORAGE_PROVIDER=firebase)

```env
# Firebase service account credentials (JSON string)
FIREBASE_CONFIG='{"type":"service_account","project_id":"your-project",...}'
```

### MINIO Configuration (when STORAGE_PROVIDER=minio)

```env
# MINIO server endpoint (without protocol)
MINIO_ENDPOINT=localhost

# MINIO server port
MINIO_PORT=9000

# Whether to use SSL/TLS (true/false)
MINIO_USE_SSL=false

# MINIO access credentials
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Optional: Custom public URL for generating file URLs
# If not set, URLs will be generated using the MINIO_ENDPOINT
MINIO_PUBLIC_URL=http://localhost:9000
```

## MINIO Setup

### Using Docker

1. **Run MINIO server:**
   ```bash
   docker run -p 9000:9000 -p 9001:9001 \
     --name minio-server \
     -e MINIO_ROOT_USER=minioadmin \
     -e MINIO_ROOT_PASSWORD=minioadmin \
     -v /path/to/data:/data \
     minio/minio server /data --console-address ":9001"
   ```

2. **Access MINIO Console:**
   - URL: http://localhost:9001
   - Username: minioadmin
   - Password: minioadmin

### Using Docker Compose

```yaml
version: '3.7'
services:
  minio:
    image: minio/minio
    container_name: minio-server
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  minio_data:
```

### Manual Installation

1. **Download MINIO:**
   ```bash
   wget https://dl.min.io/server/minio/release/linux-amd64/minio
   chmod +x minio
   ```

2. **Run MINIO:**
   ```bash
   ./minio server /path/to/data --console-address ":9001"
   ```

## Usage

### Switching Storage Providers

Simply change the `STORAGE_PROVIDER` environment variable and restart the application:

```env
# For Firebase
STORAGE_PROVIDER=firebase

# For MINIO
STORAGE_PROVIDER=minio
```

### API Endpoints

The multimedia API endpoints remain the same regardless of the storage provider:

- `POST /multimedia` - Upload files
- `GET /multimedia/:id` - Get file metadata
- `GET /multimedia/:id/download` - Download file
- `DELETE /multimedia/:id` - Delete file
- `POST /multimedia/url` - Upload file from URL

### File Operations

The system automatically handles:

1. **Upload**: Files are uploaded to the configured storage backend
2. **Public URLs**: Generated automatically for public file access
3. **Download**: Files can be retrieved from the storage backend
4. **Delete**: Files are removed from both database and storage backend

## Security Considerations

### MINIO Security

1. **Change default credentials:**
   ```env
   MINIO_ACCESS_KEY=your-secure-access-key
   MINIO_SECRET_KEY=your-secure-secret-key
   ```

2. **Use SSL in production:**
   ```env
   MINIO_USE_SSL=true
   MINIO_ENDPOINT=your-domain.com
   MINIO_PORT=443
   ```

3. **Configure bucket policies:**
   The system automatically sets public read access for uploaded files. Review and adjust bucket policies as needed.

### Firebase Security

Ensure your Firebase service account has the minimum required permissions for storage operations.

## Troubleshooting

### Common MINIO Issues

1. **Connection refused:**
   - Verify MINIO server is running
   - Check endpoint and port configuration
   - Ensure firewall allows connections

2. **Access denied:**
   - Verify access key and secret key
   - Check bucket permissions

3. **SSL certificate issues:**
   - Set `MINIO_USE_SSL=false` for local development
   - Use valid SSL certificates in production

### Common Firebase Issues

1. **Authentication errors:**
   - Verify Firebase service account JSON is valid
   - Check project permissions

2. **Bucket access errors:**
   - Ensure bucket exists and is accessible
   - Verify service account has storage permissions

## Migration

### From Firebase to MINIO

1. Set up MINIO server
2. Update environment variables
3. Restart application
4. Optionally migrate existing files using the MINIO client or custom scripts

### From MINIO to Firebase

1. Set up Firebase Storage
2. Update environment variables
3. Restart application
4. Optionally migrate existing files using Firebase Admin SDK

## Monitoring

Both storage providers support standard monitoring practices:

- **MINIO**: Use Prometheus metrics endpoint or MINIO Console
- **Firebase**: Use Google Cloud Console monitoring