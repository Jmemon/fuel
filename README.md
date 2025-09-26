  To run the application:

  cd /Users/johnmemon/Desktop/fuel/v0-7-impl
  # Install dependencies
  cd backend && npm install && cd ../frontend && npm install && cd ..
  # Start with Docker
  docker-compose up --build -d

  # Logs viewable at
  docker-compose logs fuel_backend  # frontend and backend
  docker-compose logs postgres  # postgres
  // frontend logs also viewable in console log 

  The application will be available at:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:3001/api/v1/activity-logs
  - Health Check: http://localhost:3001/health
