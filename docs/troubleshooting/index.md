# Troubleshooting

Common issues and solutions for DClaw Network.

## Quick Diagnostics

```bash
# Check app pods
kubectl get pods -n dclaw-network

# Check logs
kubectl logs -n dclaw-network deployment/dclaw-network-backend

# Check database
kubectl get clusters -n dclaw-network
```

## Sections

- [Common Issues](./common-issues)
- [FAQ](./faq)
