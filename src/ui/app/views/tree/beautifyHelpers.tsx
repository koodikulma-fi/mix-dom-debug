
// - Imports - //

// Libraries.
import { createTrigger } from "data-memo";
import { classNames, CSSProperties } from "dom-types";
import { MixDOM, ComponentFunc } from "mix-dom";


// - Helpers - //

export function stringifyObject(object: any, multiLine?: boolean, nDepth: number = 1): string {
    // Simple.
    if (!object || typeof object !== "object")
        return typeof object === "string" ? "\"" + object + "\"" : "" + object;
    // Array.
    if (Array.isArray(object))
        return "[" + (nDepth ? object.map(v => stringifyObject(v, false, nDepth - 1)) : object.toString()) + "]";
    // Dictionary.
    let str = "";
    if (!nDepth)
        return "" + object;
    nDepth--;
    for (const key in object) {
        str += (multiLine ? "\n    " : " ") + key + ": " + (nDepth ? stringifyObject(object[key], false, nDepth) : typeof object[key] === "string" ? "\"" + object[key] + "\"" : "" + object[key]) + ",";
    }
    if (str)
        str = str.slice(0, str.length - 1);
    return "{" + str + (multiLine && str ? "\n" : " ") + "}";
}


// - Helper components - //

export const Prettify = (props: { code: string; tag?: "pre" | "code"; className?: string; style?: string | CSSProperties; }) => {
    const className = classNames("style-ui-code prettyprint", props.className);
    if (window["PR"])
        return MixDOM.defHTML(window["PR"]["prettyPrintOne"](props.code), props.tag || "code", { className, style: props.style });
    return MixDOM.def(props.tag || "code", { class: className, style: props.style }, props.code);
}
export interface PrettifyDelayInfo {
    state: { isReady?: boolean; };
    props: {
        origCode: string;
        tag?: "pre" | "code";
        className?: string;
        style?: string | CSSProperties;
        /** Defaults to 100ms. Only used from initial props, or when resetId or origCode indicates a reset. */
        delay?: number;
        prePrettifier?: (str: string) => string;
        resetId?: any;
    };
    timers: "reset";
}
export const PrettifyDelay: ComponentFunc<PrettifyDelayInfo> = (_props, comp) => {
    
    comp.state = {};

    const reset = createTrigger<[any, string]>(() => {
        comp.state.isReady && comp.setState({ isReady: false });
        comp.setTimer("reset", () => comp.setState({ isReady: true }), comp.props.delay || 100);
    }, undefined, "shallow");

    return (props, state) => {
        // Update.
        const origCode = props.origCode.trim();
        reset([props.resetId, origCode]);
        // Get.
        const className = classNames("style-ui-code prettyprint", props.className);
        const code = props.prePrettifier ? props.prePrettifier(origCode) : origCode;
        // Prettify.
        if (state.isReady && window["PR"])
            return MixDOM.defHTML(window["PR"]["prettyPrintOne"](code), props.tag || "code", { className, style: props.style });
        // Just text.
        return MixDOM.def(props.tag || "code", { class: className, style: props.style }, origCode);
    }
}


// - Render helpers - //

/** Only escapes if prettify is present. */
export function escapeHTML(html: string): string {
    return window["PR"] ? html.replace(/\&(?!(\w+;))/g, '&amp;').replace(/</g, '&lt;') : html;
}

export function beautify(text: string): string {
    return window.exports && window.exports.js_beautify ? window.exports.js_beautify(text) : text;
}

export function getSnippetContainerProps(): { className: string; style: string; } {
    return {
        className: "layout-border-box",
        style: "max-width: 800px; max-height: 50vh;",
    };
}

// function getSnippetProps(extraClassName?: string): { className: string; style?: string; } {
//     return {
//         className: "layout-scrollable style-scrollable" + (extraClassName ? " " + extraClassName : ""),
//         // style: "maxWidth: 800px; maxHeight: 300px",
//     };
// }

export function getMiniScrollableProps(extraClassName?: string): { className: string; style?: string; } {
    return {
        className: "layout-scrollable style-scrollable" + (extraClassName ? " " + extraClassName : ""),
        style: "max-width: 100%; max-height: 250px"
    };
}
