require("dotenv").config();

// Fail fast with a clear message instead of crashing on the first request
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy server/.env.example to server/.env and fill in the values.");
  process.exit(1);
}

const connection = require("./database");
const app = require("./app");
const { seedFeaturedDoctors } = require("./seed/featuredDoctors");

const port = process.env.PORT || 4000;

const start = async () => {
  // Connect to MongoDB before accepting requests
  await connection();
  await seedFeaturedDoctors().catch((err) => console.warn("[seed]", err.message));

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

start();
