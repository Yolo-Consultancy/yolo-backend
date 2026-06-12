const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");

async function bootstrap() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`YOLO API démarrée sur http://localhost:${env.port}`);
  });
}

bootstrap();
