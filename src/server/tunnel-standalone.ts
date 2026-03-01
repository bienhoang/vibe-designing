#!/usr/bin/env node
import { createTunnelServer } from "./tunnel";

const port = parseInt(process.env.VIBE_DESIGNING_PORT || "3055");
const tunnel = createTunnelServer();
tunnel.listen(port);
