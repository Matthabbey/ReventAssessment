# CI/CD Pipeline

## Steps
1. **Setup Node.js environment**: Use the `actions/setup-node` action to set up the Node.js environment.
2. **Install dependencies**: Run `npm install` to install project dependencies.
3. **Run tests**: Execute tests using `npm test`.
4. **Build Docker images**: Build Docker images for each service.
5. **Push Docker images**: Push the Docker images to a container registry.
6. **Deploy services**: Use `docker-compose` to deploy the services to the target environment.
