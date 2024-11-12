
// - Imports - //

import { MixDOMDebug as _MixDOMDebug } from "./classes/MixDOMDebug";


// // - Export for global - //

// // Main class.
// export * from "./classes/MixDOMDebug";
// // Main UI.
// export * from "./ui/app/UIApp";
// // Window.
// export * from "./window";



// - Global - //

// Declare.
declare global {
    interface Window {
        MixDOMDebug: typeof _MixDOMDebug;
    }
}

// Attach.
window.MixDOMDebug = _MixDOMDebug;
