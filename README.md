SuperAdmin Useremail: bbibekbhowmick2001@gmail.com
SuperAdmin Password: 123456aA@
# ICTD Backend Application

Production report storage:
- IT Equipment & Functionality Report uses the `LabReport` table through `/api/v1/lab-reports`.
- Class activity reports for SoF and ICTD labs use the `ClassReport` table through `/api/v1/class-reports`.

This backend application has been dockerized for easy deployment. You can run this application on your local computer using the following methods.

## Method 1: Clone Both Projects and Run Locally Using Docker Compose

If you want to work with the source code for both the backend and frontend, you can set up a workspace and run them together using Docker Compose. 

1. **Set up the workspace and clone the repositories:**
   Create a root folder (e.g., `bd-project`) and clone both repositories inside it.
   ```bash
   mkdir bd-project
   cd bd-project
   git clone https://github.com/bibek-totol/ICTD-Backend.git
   git clone https://github.com/bibek-totol/ICTD-Lab-GSI-Project-Frontend-.git
   ```

2. **Add Environment Variables:**
   Ensure you have configured your environment variables correctly:
   - For Backend: Create `./ICTD-Backend/.env`
   - For Frontend: Create `./ICTD-Lab-GSI-Project-Frontend-/.env.local`

3. **Create the `docker-compose.yml` file:**
   In your root `bd-project` folder (alongside the cloned repositories), create a `docker-compose.yml` file with the exact configuration used in this project:

```yaml
services:
  backend:
    build:
      context: ./ICTD-Backend
      dockerfile: Dockerfile
    container_name: ictd-backend
    working_dir: /app
    env_file:
      - ./ICTD-Backend/.env
    ports:
      - "4000:4000"
    volumes:
      - ./ICTD-Backend:/app
      - backend_node_modules:/app/node_modules
    command: sh -c "npx prisma generate && npm run dev"
    restart: unless-stopped

  frontend:
    build:
      context: ./ICTD-Lab-GSI-Project-Frontend-
      dockerfile: Dockerfile
    container_name: ictd-frontend
    working_dir: /app
    env_file:
      - ./ICTD-Lab-GSI-Project-Frontend-/.env.local
    environment:
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    ports:
      - "5173:5173"
    volumes:
      - ./ICTD-Lab-GSI-Project-Frontend-:/app
      - frontend_node_modules:/app/node_modules
    command: npm run dev -- --host 0.0.0.0 --port 5173
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  backend_node_modules:
  frontend_node_modules:
```

4. **Start the application stack:**
   Run the following command in the root folder to build and start both applications:
   ```bash
   docker-compose up -d --build
   ```

## Method 2: Pull and Run the Pre-built Images from DockerHub

If you just want to quickly deploy the application without cloning any source code, you can use the pre-built images from DockerHub.

1. **Pull the frontend and backend images:**
   ```bash
   docker pull bibek20/bd-project-backend
   docker pull bibek20/bd-project-frontend
   ```

2. **Create a Docker Compose file for pre-built images:**
   Create a `docker-compose.yml` file anywhere on your computer:

```yaml
version: '3.8'
services:
  backend:
    image: bibek20/bd-project-backend
    ports:
      - "4000:4000"
    # Note: Pass any necessary environment variables here if required

  frontend:
    image: bibek20/bd-project-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

3. **Start the applications:**
   ```bash
   docker-compose up -d
   ```
