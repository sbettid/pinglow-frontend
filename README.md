# Pinglow Frontend

A modern, responsive Vue.js frontend for [Pinglow](https://github.com/sbettid/pinglow), a Kubernetes-ready monitoring engine.

## Features

- **Real-time Check Monitoring**: View status and performance data for all configured checks
- **Interactive Performance Graphs**: Zoom, pan, and explore performance metrics with Chart.js
- **Check Management**: 
  - Mute/unmute notifications
  - Schedule immediate check execution
  - **Process check results** (manual result submission)
- **Role-based Access**: Support for viewer, operator, and admin roles via OIDC
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Built with Vuetify for consistent design
- **Distinguishable Metrics**: 12-color palette ensures performance metrics are easily distinguishable

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for containerized deployment)
- Kubernetes cluster (optional, for Helm deployment)

### Docker Deployment

```bash
# Build the Docker image
docker build -t pinglow-frontend:latest .

# Run the container
docker run -p 80:80 \
  -e PINGLOW_API_URL=http://pinglow-backend:8000 \
  pinglow-frontend:latest
```

The frontend will be available at `http://localhost`.

### Kubernetes Deployment (Helm)

A Helm chart is provided for easy Kubernetes deployment:

```bash
# Deploy the frontend (image version defaults to Chart.appVersion)
helm install pinglow-frontend ./chart \
  --namespace default \
  --set pinglow.apiUrl=http://pinglow:80
```

#### Helm Configuration

Key values in `chart/values.yaml`:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of frontend replicas | `1` |
| `image.repository` | Docker image repository | `ghcr.io/sbettid/pinglow-frontend` |
| `image.tag` | Docker image tag (empty = Chart.appVersion) | `""` |
| `pinglow.apiUrl` | URL to the Pinglow backend API | `http://pinglow:80` |
| `service.type` | Kubernetes service type | `ClusterIP` |
| `resources.limits` | Container resource limits | `256m CPU, 128Mi RAM` |
| `resources.requests` | Container resource requests | `100m CPU, 64Mi RAM` |

### Development

```bash
# Install dependencies
cd client
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend expects the Pinglow API to be available at `/api` (configurable).

## Architecture

### Component Structure

```
client/src/
├── App.vue                    # Main application component
├── api/
│   └── pinglow.ts            # API client for Pinglow backend
├── components/
│   ├── StatusCard.vue        # Individual check card
│   └── PerformanceDataChart.vue  # Performance graph component
├── stores/
│   └── auth.ts               # Authentication state management (Pinia)
├── types/
│   ├── Check.ts              # Check and CheckWithStatus types
│   └── PerformanceData.ts    # Performance data types and color palette
└── utils/
    └── Datetime.ts           # Date/time formatting utilities
```

### API Integration

The frontend communicates with the Pinglow backend through the following endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/checks` | List all checks |
| `GET` | `/api/check-status/{name}` | Get check status and last result |
| `GET` | `/api/performance-data/{name}` | Get performance metrics |
| `PUT` | `/api/check/{name}/mute?until={iso8601}` | Mute notifications |
| `DELETE` | `/api/check/{name}/mute` | Unmute notifications |
| `POST` | `/api/check/{name}/schedule-now` | Schedule immediate execution |
| `POST` | `/api/check/{name}/result` | **Process a check result** |

### Authentication

The frontend relies on OIDC authentication managed by the Pinglow backend. Authentication endpoints:

- `GET /api/auth/me` - Get current user information
- `GET /api/auth/login` - Redirect to login (handled by backend)
- `POST /api/auth/logout` - Logout

## Features in Detail

### Process Check Result

The frontend allows operators to manually submit check results via the "Process result" option in the check menu. This is useful for:

- **Integration Testing**: Submit synthetic results to test notification systems
- **Passive Checks**: For checks that cannot run automatically, manually report results
- **External Monitoring**: Submit results from external monitoring systems

**To process a result:**

1. Click on a check card to open details
2. Click the menu (⋮) button
3. Select "Process result"
4. Fill in:
   - **Status**: 0 (OK), 1 (Warning), or 2 (Critical)
   - **Output**: Result message/description
5. Click "Submit"

### Performance Graphs

The performance graph displays all metrics for a check with:

- **Zoom**: Scroll wheel or pinch to zoom
- **Pan**: Click and drag to navigate
- **Hover**: Tooltip shows exact values and timestamps
- **Legend**: Click to toggle metric visibility

The graph automatically scales to show the last 10% of data on initial load.

**Color Palette**: 12 distinct colors ensure metrics remain distinguishable even with many metrics.

### Notifications

Checks can be muted to suppress notifications:

- Mute for 1 hour, 8 hours, 1 day, or 1 week
- Mute indefinitely
- Unmute immediately

Muted status is displayed with a bell icon on the check card.

## Configuration

### Environment Variables

- `PINGLOW_API_URL`: URL to the Pinglow backend API (used in Kubernetes deployments)

### Browser Requirements

- Modern browser with ES6+ support
- JavaScript enabled
- Cookies enabled (for authentication)

## Troubleshooting

### "Cannot reach Pinglow API"

1. Verify the backend API URL in deployment configuration
2. Check backend service is running: `kubectl get svc pinglow`
3. Verify network connectivity between frontend and backend
4. Check backend logs for OIDC or API errors

### "Sign in button doesn't work"

1. Ensure OIDC is properly configured on the backend
2. Check browser console for CORS errors
3. Verify `pinglow-oidc` secret exists in Kubernetes (if deployed)

### "Performance data not loading"

1. Ensure check has been executed at least once
2. Check database retention policy (default: 7 days)
3. Verify check status shows successful execution

## Contributing

Contributions are welcome! Please:

1. Follow Vue 3 Composition API patterns
2. Use TypeScript for type safety
3. Test responsive design on multiple devices
4. Update documentation for new features

## Development Stack

- **Vue.js 3**: Progressive framework for user interfaces
- **TypeScript**: Type-safe JavaScript
- **Vuetify 4**: Material Design component library
- **Chart.js**: Flexible charting library
- **Vite**: Next-generation frontend build tool
- **Pinia**: State management
- **Axios**: HTTP client

## License

MIT License - See LICENSE file

## Support

For issues, feature requests, or questions:

- GitHub Issues: [pinglow-frontend](https://github.com/sbettid/pinglow-frontend/issues)
- Pinglow Documentation: [pinglow](https://github.com/sbettid/pinglow)
