import { handle_events } from './handle_events';
import { app } from './http_service';

// prod
handle_events().catch(console.error);
app.listen(8081);