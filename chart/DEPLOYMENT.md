# Pinglow Frontend Helm Chart

A lightweight Helm chart for deploying the Pinglow Frontend in Kubernetes.

## Quick Start

### Basic Deployment

```bash
# Deploy frontend with default configuration
helm install pinglow-frontend ./chart \
  --namespace pinglow \
  --create-namespace
```

This assumes the Pinglow backend is accessible at `http://pinglow:80` (default API URL).

### Custom Backend URL

```bash
# Deploy with custom backend API URL
helm install pinglow-frontend ./chart \
  --namespace pinglow \
  --set pinglow.apiUrl=http://pinglow.monitoring:80
```

## Configuration

The Helm chart has minimal required configuration:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Docker image repository | `ghcr.io/sbettid/pinglow-frontend` |
| `image.tag` | Docker image tag (empty = Chart.appVersion) | `""` |
| `pinglow.apiUrl` | Pinglow backend API URL | `http://pinglow:80` |
| `service.type` | Kubernetes service type | `ClusterIP` |
| `resources.limits` | Resource limits | `256m CPU, 128Mi RAM` |

### Example values file (values-prod.yaml):

```yaml
replicaCount: 2

image:
  repository: ghcr.io/sbettid/pinglow-frontend
  # tag is auto-set to Chart.appVersion if not specified
  pullPolicy: IfNotPresent

pinglow:
  apiUrl: http://pinglow.monitoring.svc.cluster.local:80

service:
  type: ClusterIP
  port: 80

resources:
  limits:
    cpu: 512m
    memory: 256Mi
  requests:
    cpu: 250m
    memory: 128Mi
```

Deploy with:
```bash
helm install pinglow-frontend ./chart -f values-prod.yaml --namespace pinglow
```

## Deployment Patterns

### Pattern 1: Same Namespace as Backend

```bash
# Deploy both backend and frontend in same namespace
helm install pinglow ./pinglow-chart --namespace monitoring
helm install pinglow-frontend ./chart --namespace monitoring
# Uses default pinglow.apiUrl: http://pinglow:80
```

### Pattern 2: Frontend and Backend in Different Namespaces

```bash
# Backend in monitoring namespace
helm install pinglow ./pinglow-chart --namespace monitoring

# Frontend in frontend namespace, pointing to backend
helm install pinglow-frontend ./chart \
  --namespace frontend \
  --create-namespace \
  --set pinglow.apiUrl=http://pinglow.monitoring.svc.cluster.local:80
```

### Pattern 3: External Backend

```bash
# Frontend pointing to external Pinglow instance
helm install pinglow-frontend ./chart \
  --namespace frontend \
  --set pinglow.apiUrl=https://pinglow.example.com
```

## Accessing the Frontend

### Via Port Forward (Development)

```bash
kubectl port-forward -n pinglow svc/pinglow-frontend 8080:80
# Visit http://localhost:8080
```

### Via Service (Internal)

Within the cluster, the frontend is accessible at:
```
http://pinglow-frontend.pinglow.svc.cluster.local:80
```

### Via LoadBalancer

```bash
# Change service type to LoadBalancer
helm install pinglow-frontend ./chart \
  --namespace pinglow \
  --set service.type=LoadBalancer
```

Then get the external IP:
```bash
kubectl get svc -n pinglow pinglow-frontend
```

## Troubleshooting

### Frontend Can't Reach Backend

1. **Verify backend is running:**
   ```bash
   kubectl get pods -n pinglow | grep pinglow
   kubectl port-forward -n pinglow svc/pinglow 8000:80 &
   curl http://localhost:8000/checks
   ```

2. **Check the configured API URL:**
   ```bash
   kubectl get deployment -n pinglow pinglow-frontend -o yaml | grep PINGLOW_API_URL
   ```

3. **Test DNS resolution from frontend pod:**
   ```bash
   kubectl exec -it -n pinglow <frontend-pod> -- \
     nslookup pinglow.pinglow.svc.cluster.local
   ```

4. **Check frontend logs:**
   ```bash
   kubectl logs -n pinglow deployment/pinglow-frontend
   ```

### OIDC Authentication Fails

1. **Verify backend OIDC is configured:**
   ```bash
   kubectl logs -n pinglow deployment/pinglow | grep -i oidc
   ```

2. **Check OIDC secret exists:**
   ```bash
   kubectl get secret -n pinglow pinglow-oidc -o yaml
   ```

3. **Verify OIDC provider is reachable from cluster**

## Updating

### Update Image Version

```bash
# Update to new version tag
helm upgrade pinglow-frontend ./chart \
  --set image.tag=v0.3.0
```

### Update API URL

```bash
helm upgrade pinglow-frontend ./chart \
  --set pinglow.apiUrl=http://new-backend:80
```

### Scale Replicas

```bash
helm upgrade pinglow-frontend ./chart \
  --set replicaCount=3
```

## Uninstallation

```bash
helm uninstall pinglow-frontend --namespace pinglow
```

## Chart Customization

The chart is intentionally minimal. For complex deployments:

1. Create a custom values file for your environment
2. Use Helm hooks for custom initialization
3. Create Kustomize overlays for complex scenarios
4. Manage Ingress separately if needed

## Integration with Pinglow Backend

The frontend automatically integrates with Pinglow backend features:

- **Check Management**: View and manage checks via API
- **OIDC Authentication**: Leverages backend OIDC configuration
- **Performance Data**: Displays metrics from backend database
- **Result Processing**: Can submit check results via API

Ensure the backend has proper configuration for OIDC and API access.
