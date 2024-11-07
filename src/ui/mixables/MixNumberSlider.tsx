
// - Imports - //

import { ComponentFuncRequires } from "mix-dom";
import { MixMouseMoveInfo } from "./MixMouseMove"; // From above.


// - Mixable component - //

export interface MixNumberSliderInfo {
    props: { minValue: number; maxValue: number; initValue?: number; };
    state: { value: number; };
    class: {
        sliderAlign: "horizontal" | "vertical";
        calcValueBy(e: MouseEvent): number;
        setValue(value: number): void;
    };
}
export const MixNumberSlider: ComponentFuncRequires<MixMouseMoveInfo, MixNumberSliderInfo>
 = (initProps, comp) => {
    // Init.
    comp.state = { value: initProps.initValue || 0 };
    comp.sliderAlign = "horizontal";
    // Implement limiting.
    let startValue: number | null = null;
    comp.calcValueBy = (e) => {
        const el = comp.mouseRef.getElement();
        if (!el)
            return comp.state.value;
        const rect = el.getBoundingClientRect();
        const horizontal = comp.sliderAlign === "horizontal";
        const pos = horizontal ? e.clientX : e.clientY;
        if (pos <= (horizontal ? rect.left : rect.top))
            return horizontal ? comp.props.minValue : comp.props.maxValue;
        if (pos >= (horizontal ? rect.right : rect.bottom))
            return horizontal ? comp.props.maxValue : comp.props.minValue;
        const relPos = horizontal ? (pos - rect.left) / rect.width : (pos - rect.top) / rect.height;
        return relPos * (comp.props.maxValue - comp.props.minValue) + comp.props.minValue;
    }
    comp.setValue = (value) => comp.setInState("value", value);
    // Hook up to mouse listeners.
    comp.listenTo("onMouseStart", (e) => {
        startValue = comp.state.value; // For fallback.
        comp.setValue(comp.calcValueBy(e));
    });
    comp.listenTo("onMouseMove", (e) => {
        if (startValue != null)
            comp.setValue(comp.calcValueBy(e));
    });
    comp.listenTo("onMouseEnd", (_e) => startValue = null);
    // Extend cancelling.
    const origCancel = comp.cancelMouse;
    comp.cancelMouse = () => {
        if (startValue != null)
            comp.setInState("value", startValue);
        origCancel();
    }
    // Nothing to render.
    return null;
};
