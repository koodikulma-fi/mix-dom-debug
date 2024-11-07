
// - Imports - //

import { ComponentFuncMixable } from "mix-dom";
import { MixEnabled } from "./MixEnabled";


// - Mixable component - //

/** Requires MixEnabledInfo and provides toggling enabled off with "Escape" key. No info added. */
//export const MixEscEnabled: ComponentFuncRequires<MixEnabledInfo> = (_initProps, comp) => {
export const MixEscEnabled: ComponentFuncMixable<typeof MixEnabled> = (_initProps, comp) => {
    // Prepare keydown handler.
    const onKeyDown = (e: KeyboardEvent) => {
        // On escape, toggle off and mark event as handled.
        if (e.key === "Escape" && comp.state.enabled) {
            comp.toggleEnabled();
            e.preventDefault();
            e.stopPropagation();
        }
    }
    // Extend toggleEnabled feature.
    const origToggle = comp.toggleEnabled;
    comp.toggleEnabled = () => {
        // Add / remove native keydown event listener.
        if (!comp.state.enabled)
            window.addEventListener("keydown", onKeyDown);
        else
            window.removeEventListener("keydown", onKeyDown);
        // Do the original toggling.
        origToggle();
    }
    // Nothing to render.
	return null;
}
