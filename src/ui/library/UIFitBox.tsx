
// - Imports - //

import { classNames, CSSProperties, parseDOMStyle } from "dom-types"
import { MixDOM, Ref } from "mix-dom";

// - Typing - //

import {
    FitBoxAlgoritms,
    Align,
    Margin,
    Offset,
    Rect,
    cleanMargin,
    FitLocks
} from "./FitBoxAlgoritms";

// Size fitter.
export interface UIFitBoxProps {
    // General.
    className?: string;
    style?: string | CSSProperties;
    // Positioning.
    lockHorizontal?: boolean;
    lockVertical?: boolean;
    margin?: Margin;
    offset?: Offset;
    align?: Align;
    // getTargetElement?: () => HTMLElement | null;
    getContainerRect?: () => Rect;
    // Talkback.
    onMaxSize?: (width: number, height: number) => void;
}
interface UIFitBoxState extends Rect { }
export interface UIFitBoxInfo {
    props: UIFitBoxProps;
    state: UIFitBoxState;
}

// - Component - //
//
// This is a general purpose class for fitting one box into another by position and alignment options.
// It supports adjusting to dynamic size. (The core method for fitting is static.)

export const UIFitBox = MixDOM.component<UIFitBoxInfo>(component => {

    let observer: ResizeObserver | null = null;
    const refElement = new Ref<HTMLDivElement>();

    component.state = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };
    component.listenTo("didMount", () => {
        // Create size observer.
        observer = new ResizeObserver(onResize);
        // Start observing.
        const elRef = refElement.getElement();
        if (elRef) {
            // Get parent element.
            const pElement = elRef.parentElement;
            // Observe both - the parent for outside changes and ourselves for inside changes.
            observer.observe(elRef);
            if (pElement)
                observer.observe(pElement);
        }
    });

    component.listenTo("willUnmount", () => {
        // Stop observing.
        if (observer)
            observer.disconnect();
        observer = null;
    });

    const onResize = () => {
        // Get target size.
        // const elRef = component.props.getTargetElement ? component.props.getTargetElement() : refElement.getElement();
        const elRef = refElement.getElement();
        const targetRect: Rect = {
            top: component.props.offset && component.props.offset.top || 0,
            left: component.props.offset && component.props.offset.left || 0,
            width: elRef ? elRef.offsetWidth : 0,
            height: elRef ? elRef.offsetHeight : 0
        };
        // Align.
        const hAlign = component.props.align && component.props.align.horizontal || "left";
        const vAlign = component.props.align && component.props.align.vertical || "top";
        if (hAlign === "right")
            targetRect.left -= targetRect.width;
        else if (hAlign === "center")
            targetRect.left -= targetRect.width * .5;
        if (vAlign === "bottom")
            targetRect.top -= targetRect.height;
        else if (vAlign === "center")
            targetRect.top -= targetRect.height * .5;
        // Update.
        resizeBy(targetRect);
    };

    const resizeBy = (targetRect: Rect) => {
        // Get container size.
        let cRect: Rect = {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        };
        // .. By callback.
        if (component.props.getContainerRect)
            cRect = component.props.getContainerRect();
        // .. By parent element (default).
        else {
            const elRef = refElement.getElement();
            if (elRef) {
                const pElement = elRef.parentElement;
                if (pElement) {
                    cRect.width = pElement.offsetWidth;
                    cRect.height = pElement.offsetHeight;
                }
            }
        }
        // Apply margin to container.
        const margin = cleanMargin(component.props.margin);
        cRect.left = margin.left;
        cRect.width -= margin.left + margin.right;
        cRect.top = margin.top;
        cRect.height -= margin.top + margin.bottom;

        // Get fit locks.
        let fitLocks = 0;
        const hAlign = component.props.align ? component.props.align.horizontal : "left";
        const vAlign = component.props.align ? component.props.align.vertical : "top";
        if (component.props.lockHorizontal)
            fitLocks |= hAlign === "left" ? FitLocks.Left : hAlign === "right" ? FitLocks.Right : FitLocks.Horizontal;
        if (component.props.lockVertical)
            fitLocks |= vAlign === "top" ? FitLocks.Top : vAlign === "bottom" ? FitLocks.Bottom : FitLocks.Vertical;
        // Get fitting algoritms.
        const hAlgoritm = component.props.lockHorizontal ? "anchored" : "push";
        const vAlgoritm = component.props.lockVertical ? "anchored" : "push";
        // Fit.
        const newState: UIFitBoxState = FitBoxAlgoritms.fitToSize(targetRect, cRect, fitLocks, hAlgoritm, vAlgoritm);
        // We want to store the max size (not target size) - because that's what these two state values will be used for.
        if (component.props.lockHorizontal)
            newState.width = hAlign === "left" ? (cRect.left + cRect.width) - targetRect.left : hAlign === "right" ? (targetRect.left + targetRect.width) - cRect.left : newState.width;
        else
            newState.width = cRect.width;
        if (component.props.lockVertical)
            newState.height = vAlign === "top" ? (cRect.top + cRect.height) - targetRect.top : vAlign === "bottom" ? (targetRect.top + targetRect.height) - cRect.top : newState.height;
        else
            newState.height = cRect.height;
        // Call.
        if (component.props.onMaxSize && ((newState.width !== component.state.width) || (newState.height !== component.state.height)))
            component.props.onMaxSize(newState.width, newState.height);
        // Update.
        // .. Immediately, as we don't want any lag after resizing.
        // .. However, if not mounted yet, no point in forcing it.
        component.isMounted() ? component.setState(newState, true, false, null, null) : component.setState(newState);
    }

    // Trigger resize once already - we might have (even dom based) values before we ever mount.
    // .. So in that case, we want the values to be correct already on the very first render call..!
    onResize();

    return (props, state) => {
        // Prepare positioning.
        const style: CSSProperties = {
            ...props.style ? typeof props.style === "string" ? parseDOMStyle(props.style) : props.style : undefined,
            position: "absolute",
            left: state.left + "px",
            top: state.top + "px",
            maxWidth: state.width + "px",
            maxHeight: state.height + "px"
        };
        // Render.
        return (
            <div
                className={ classNames("m-size-fitter", props.className) }
                _ref={refElement}
                style={style}
            >
                {MixDOM.Content}
            </div>
        );
    }
});
