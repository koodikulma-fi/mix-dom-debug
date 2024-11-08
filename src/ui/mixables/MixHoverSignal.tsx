
// - Imports - //

import { Ref, ComponentFunc } from "mix-dom";


// - Mixable component - //

export interface MixHoverSignalInfo {
    signals: { 
        onHover(isHovered: boolean): void;
    };
    class: {
        /** Hover ref. This should be assigned to the desired element (single). */
        hoverRef: Ref<HTMLElement>;
        /** Only used on mouse enter: if disabled, won't trigger timer -> set state. */
        hoverDisabled?: boolean | "one-time";
        /** Timeout before the tip is triggered. Defaults to 600. */
        hoverTimeout: number;
    };
    timers: "onMouseEnter" | string & {};
}
/** Provides hover feature. Renderer should assign comp.hoverRef to the element. */
export const MixHoverSignal: ComponentFunc<MixHoverSignalInfo> = (_initProps, comp) => {
    // Defaults.
	comp.hoverTimeout = 500;
    // Create ref and hook up to creation.
    let isHovered = false;
    comp.hoverRef = new Ref<HTMLElement>();
    comp.hoverRef.listenTo("domDidMount", (domNode) => {
        // Add listener for onMouseEnter.
        domNode.addEventListener("mouseenter", () => {
            !comp.hoverDisabled && comp.setTimer("onMouseEnter", () => comp.sendSignal("onHover", isHovered = true), comp.hoverTimeout);
        });
        // Add listener for onMouseLeave - to toggle the state off.
        domNode.addEventListener("mouseleave", () => {
            if (comp.hoverDisabled === "one-time")
                comp.hoverDisabled = false;
            comp.clearTimers("onMouseEnter");
            if (isHovered)
                comp.sendSignal("onHover", isHovered = false);
        });
    });
    // Nothing to render.
	return null;
};
