#!/bin/bash

echo "Building Box Management System Docker image..."
docker build -t box-management:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    echo ""
    echo "To run the container:"
    echo "docker run -d -p 3000:5000 -v ./data:/app/data -v ./uploads:/app/uploads --name box-management box-management:latest"
    echo ""
    echo "Or use docker-compose:"
    echo "docker-compose up -d"
else
    echo "❌ Docker build failed!"
    exit 1
fi