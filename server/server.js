/** server for watch party */

import { httpServer } from "./app.js";
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server starting on port ${PORT}`);
});
