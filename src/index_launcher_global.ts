
// - Export classes, common and UIs - //

// UI.
import { openMixDOMDebug as _openMixDOMDebug} from "./launcher/index";


// - Typing - //

declare global {
    interface Window {
        openMixDOMDebug: typeof _openMixDOMDebug;
    }
}


// - Attach globals - //

window.openMixDOMDebug = _openMixDOMDebug;
