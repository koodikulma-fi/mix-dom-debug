
// - Imports - //

import { MixDOMDebug as _MixDOMDebug } from "./classes/MixDOMDebug";


// - Global - //

// Declare.
declare global {
    interface Window {
        MixDOMDebug: typeof _MixDOMDebug;
    }
}

// Attach.
window.MixDOMDebug = _MixDOMDebug;
