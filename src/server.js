const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");
const { startRatingEmailWorker } = require("./workers/rating-email.worker");

async function bootstrap() {
  await connectDB();
  startRatingEmailWorker();
  app.listen(env.port, () => {
    console.log(`YOLO API démarrée sur http://localhost:${env.port}`);
  });
}

bootstrap();
