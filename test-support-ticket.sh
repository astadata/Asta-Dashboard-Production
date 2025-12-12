#!/bin/bash

# Test creating a support ticket

curl -X POST http://localhost:3030/api/support-tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "customerEmail": "test@example.com",
    "customerName": "Test Customer",
    "vendorId": 1,
    "vendorName": "Test Vendor",
    "serviceId": 1,
    "serviceName": "Test Service",
    "issueDetails": "This is a test support ticket",
    "status": "open"
  }'

echo ""
echo "---"
echo "Fetching all tickets:"
curl -s http://localhost:3030/api/support-tickets | jq '.'
