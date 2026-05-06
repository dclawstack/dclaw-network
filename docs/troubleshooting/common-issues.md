# Common Issues

## App won't start

**Symptoms:** Pods in `CrashLoopBackOff` or `Error` state.

**Solutions:**

```bash
# Check logs
kubectl logs -n dclaw-network deployment/dclaw-network-backend

# Check events
kubectl get events -n dclaw-network --sort-by='.lastTimestamp'

# Verify database connection
kubectl exec -n dclaw-network deployment/dclaw-network-backend --   python -c "import asyncio; from sqlalchemy import text; ..."
```

## Database connection errors

**Symptoms:** Backend logs show `connection refused` or `timeout`.

**Solutions:**

1. Verify the database cluster is ready:
   ```bash
   kubectl get clusters -n dclaw-network
   ```

2. Check the connection string secret:
   ```bash
   kubectl get secret dclaw-network-db-credentials -n dclaw-network
   ```

## Frontend can't reach backend

**Symptoms:** Browser console shows CORS errors or 502 Bad Gateway.

**Solutions:**

1. Verify backend pod is running
2. Check ingress configuration
3. Verify `NEXT_PUBLIC_API_URL` is set correctly
