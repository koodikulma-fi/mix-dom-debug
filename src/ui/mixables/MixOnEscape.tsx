
// - Imports - //

import { ComponentFunc } from "mix-dom";


// - Mixable component - //

export interface MixOnEscapeInfo {
    class: { useEscape(enabled: boolean): void; };
    signals: { onEscape(): void; };
}
export const MixOnEscape: ComponentFunc<MixOnEscapeInfo> = (_initProps, comp) => {
    // Event handler.
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            comp.sendSignal("onEscape");
        }
    }
    // Toggle feature on / off.
    comp.useEscape = (enabled) =>
        (enabled ? window.addEventListener : window.removeEventListener)("keydown", onKeyDown);
    // Nothing to render.
    return null;
};
