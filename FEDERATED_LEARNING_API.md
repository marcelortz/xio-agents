# Federated Learning API Documentation

## Overview
RESTful API for distributed machine learning using federated learning framework. All endpoints are prefixed with `/federated`.

## Base URL
```
http://localhost:3000/federated
```

## API Info
### GET /info
Get API information and available endpoints.

**Response:**
```json
{
  "name": "Federated Learning API",
  "version": "1.0.0",
  "description": "Distributed machine learning framework",
  "endpoints": { ... }
}
```

---

## Sessions Management

### POST /sessions
Create a new federated learning session.

**Request Body:**
```json
{
  "initialWeights": [0.1, 0.1, 0.1, ...],
  "aggregationStrategy": "averaging"
}
```

**Parameters:**
- `initialWeights` (required): Array of initial model weights
- `aggregationStrategy` (optional): One of `averaging`, `weighted-averaging`, `median`, `trimmed-mean`. Default: `averaging`

**Response (201):**
```json
{
  "sessionId": "session-1-1789198579148",
  "aggregationStrategy": "averaging",
  "initialWeightsDimension": 10,
  "createdAt": "2026-09-12T07:36:19.148Z",
  "message": "Federated learning session created successfully"
}
```

---

### GET /sessions
List all active federated learning sessions.

**Response:**
```json
{
  "totalSessions": 2,
  "sessions": [
    {
      "sessionId": "session-1-1789198579148",
      "status": "active",
      "createdAt": "2026-09-12T07:36:19.148Z",
      "aggregationStrategy": "averaging",
      "clientCount": 3,
      "trainingRounds": 3
    }
  ]
}
```

---

### GET /sessions/:sessionId
Get details of a specific session.

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "status": "active",
  "createdAt": "2026-09-12T07:36:19.148Z",
  "aggregationStrategy": "averaging",
  "trainingRounds": 3,
  "clientCount": 3,
  "globalModelWeights": [...],
  "communicationRounds": 3,
  "trainingHistory": []
}
```

---

### DELETE /sessions/:sessionId
Delete a federated learning session.

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "deleted": true,
  "message": "Session deleted successfully"
}
```

---

## Client Management

### POST /sessions/:sessionId/clients
Add a client to a federated learning session.

**Request Body:**
```json
{
  "clientId": "client-1",
  "features": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
  "labels": [1, 0]
}
```

**Parameters:**
- `clientId` (required): Unique client identifier
- `features` (required): Array of feature arrays (training data)
- `labels` (required): Array of labels corresponding to features

**Response (201):**
```json
{
  "sessionId": "session-1-1789198579148",
  "clientId": "client-1",
  "samplesAdded": 2,
  "totalClients": 1,
  "message": "Client added successfully"
}
```

---

### GET /sessions/:sessionId/clients
List all clients in a session.

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "totalClients": 3,
  "clients": [
    {
      "clientId": "client-1",
      "samplesCount": 50,
      "featuresDimension": 10
    }
  ]
}
```

---

### DELETE /sessions/:sessionId/clients/:clientId
Remove a client from a session.

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "clientId": "client-1",
  "removed": true,
  "remainingClients": 2,
  "message": "Client removed successfully"
}
```

---

## Training & Evaluation

### POST /sessions/:sessionId/train
Run federated training rounds.

**Request Body:**
```json
{
  "rounds": 5,
  "epochs": 2
}
```

**Parameters:**
- `rounds` (required): Number of federated rounds (≥ 1)
- `epochs` (optional): Number of local training epochs per round. Default: 1

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "roundsCompleted": 3,
  "communicationRounds": 3,
  "duration": 2,
  "globalModelWeights": [...],
  "averageTimePerRound": "0.67",
  "timestamp": "2026-09-12T07:36:39.030Z",
  "message": "Training completed successfully"
}
```

---

### POST /sessions/:sessionId/evaluate
Evaluate the global model on test data.

**Request Body:**
```json
{
  "testFeatures": [[0.5, 0.5, ...], [0.1, 0.1, ...]],
  "testLabels": [1, 0]
}
```

**Parameters:**
- `testFeatures` (required): Array of test feature arrays
- `testLabels` (required): Array of test labels

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "accuracy": 75.5,
  "testSamples": 2,
  "globalModelWeights": [...],
  "timestamp": "2026-09-12T07:36:43.898Z"
}
```

---

### GET /sessions/:sessionId/model
Get the current global model weights.

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "globalModel": {
    "weights": [0.0884, 0.1095, 0.1076, ...],
    "dimension": 10,
    "aggregationStrategy": "averaging"
  },
  "timestamp": "2026-09-12T07:36:43.898Z"
}
```

---

### GET /sessions/:sessionId/metrics
Get detailed training metrics and history.

**Response:**
```json
{
  "sessionId": "session-1-1789198579148",
  "metrics": {
    "globalWeights": [...],
    "communicationRounds": 3,
    "aggregationStrategy": "averaging",
    "clientCount": 3,
    "trainingHistory": []
  },
  "timestamp": "2026-09-12T07:36:43.898Z"
}
```

---

## Strategies

### GET /strategies
List available aggregation strategies.

**Response:**
```json
{
  "strategies": [
    {
      "id": "averaging",
      "name": "Averaging Aggregator",
      "description": "Simple average of all client models",
      "robustness": "Low",
      "speed": "Fast",
      "useCase": "Homogeneous data distributions"
    },
    {
      "id": "weighted-averaging",
      "name": "Weighted Averaging Aggregator",
      "description": "Custom weight assignment per client",
      "robustness": "Low",
      "speed": "Fast",
      "useCase": "Heterogeneous data volumes"
    },
    {
      "id": "median",
      "name": "Median Aggregator",
      "description": "Robust aggregation using median values",
      "robustness": "High",
      "speed": "Slow",
      "useCase": "Potentially malicious clients"
    },
    {
      "id": "trimmed-mean",
      "name": "Trimmed Mean Aggregator",
      "description": "Trims extreme values before averaging",
      "robustness": "High",
      "speed": "Medium",
      "useCase": "Balanced robustness and efficiency"
    }
  ]
}
```

---

## Complete Example Workflow

```bash
# 1. Create a new session
SESSION=$(curl -s -X POST http://localhost:3000/federated/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "initialWeights": [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    "aggregationStrategy": "averaging"
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['sessionId'])")

echo "Created session: $SESSION"

# 2. Add clients with training data
for i in 1 2 3; do
  curl -X POST http://localhost:3000/federated/sessions/$SESSION/clients \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"client-$i\",
      \"features\": [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]],
      \"labels\": [1]
    }"
done

# 3. Run federated training
curl -X POST http://localhost:3000/federated/sessions/$SESSION/train \
  -H "Content-Type: application/json" \
  -d '{"rounds": 5, "epochs": 2}'

# 4. Evaluate the global model
curl -X POST http://localhost:3000/federated/sessions/$SESSION/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "testFeatures": [[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]],
    "testLabels": [1]
  }'

# 5. Get session metrics
curl http://localhost:3000/federated/sessions/$SESSION/metrics

# 6. Delete session when done
curl -X DELETE http://localhost:3000/federated/sessions/$SESSION
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success (GET, POST on successful training)
- **201**: Resource created (POST on session/client creation)
- **400**: Bad request (missing/invalid parameters)
- **404**: Resource not found (session/client doesn't exist)
- **500**: Internal server error

**Error Response:**
```json
{
  "error": "Description of the error"
}
```

---

## Status Codes Summary

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, POST, or data retrieval |
| 201 | Created | Session or client successfully created |
| 400 | Bad Request | Missing required fields, invalid data |
| 404 | Not Found | Session or client ID doesn't exist |
| 500 | Server Error | Unexpected error during processing |

---

## Integration with Frontend

### JavaScript/Node.js Example
```javascript
const API_BASE = 'http://localhost:3000/federated';

async function createSession() {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      initialWeights: Array(10).fill(0.1),
      aggregationStrategy: 'averaging'
    })
  });
  return response.json();
}

async function addClient(sessionId, clientId, features, labels) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, features, labels })
  });
  return response.json();
}

async function trainSession(sessionId, rounds, epochs) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rounds, epochs })
  });
  return response.json();
}
```

---

## Performance Considerations

- **Request Size Limits**: JSON payloads up to 10MB supported
- **Training Duration**: Depends on data size, model dimensions, and number of rounds
- **Memory Usage**: Sessions are kept in memory; delete sessions when complete
- **Concurrent Sessions**: Multiple sessions can run simultaneously

---

## Future Enhancements

- [ ] Differential privacy integration
- [ ] Asynchronous client updates
- [ ] Model compression
- [ ] Secure aggregation
- [ ] Byzantine-robust aggregation
- [ ] WebSocket support for real-time updates
- [ ] Database persistence for sessions
- [ ] Advanced monitoring and logging
