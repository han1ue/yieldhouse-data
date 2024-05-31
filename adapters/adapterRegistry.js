import * as aavev3Adapter from "./aavev3.js";
import * as pendlev2Adapter from "./pendlev2.js";
import * as makerAdapter from "./maker.js";
import * as lidoAdapter from "./lido.js";

// Adapter Registry
// This is a registry of all the adapters that are available in the app.
// It is used to call the correct adapter function based on the protocol name.
// The adapter functions are imported from the respective adapter files.
// Claim/claimable functions are required for non rebasing yields.

export const adapterRegistry = {
  aavev3: aavev3Adapter,
  pendlev2: pendlev2Adapter,
  maker: makerAdapter,
  lido: lidoAdapter,
};
