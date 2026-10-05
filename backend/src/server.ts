import app from "@/app";
import { env } from "@/config/env";
import "@/service/driveSync.worker";
import "@/service/imageProcess.worker";

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
