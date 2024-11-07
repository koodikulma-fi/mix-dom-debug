
// - Imports - //

import { Ref, ComponentFunc } from "mix-dom";


// - Mixable component - //

export interface MixMouseMoveInfo<El extends HTMLElement = HTMLElement> {
    class: {
        mouseRef: Ref<El>;
        cancelMouse(): void;
    };
    signals: {
        onMouseStart(e: MouseEvent): void;
        onMouseMove(e: MouseEvent): void;
        onMouseEnd(e: MouseEvent | null, cancelled: boolean): void;
    };
}
export const MixMouseMove: ComponentFunc<MixMouseMoveInfo> = (_initProps, comp) => {
    // Handle mouse down, move, up events.
    const toggleListeners = (enable: boolean) => {
        if (enable === isDown)
            return;
        isDown = true;
        (isDown ? document.addEventListener : document.removeEventListener)("mousemove", onMove);
        (isDown ? document.addEventListener : document.removeEventListener)("mouseup", onUp);
    };
    let isDown = false;
    const onDown = (e: MouseEvent) => {
        toggleListeners(true);
        comp.sendSignal("onMouseStart", e);
    };
    const onMove = (e: MouseEvent) => comp.sendSignal("onMouseMove", e);
    const onUp = (e?: MouseEvent | null, cancelled?: boolean) => {
        toggleListeners(false);
        comp.sendSignal("onMouseEnd", e || null, !!cancelled);
    }
    // Add extendable cancel feature.
    comp.cancelMouse = () => onUp(null, true);
    // Create a ref and hook it up.
    comp.mouseRef = new Ref<HTMLElement>();
    comp.mouseRef.listenTo("domDidMount", (el) =>
        el.addEventListener("mousedown", onDown));
    // Nothing to render.
    return null;
};
