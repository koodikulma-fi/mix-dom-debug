
// - Imports - //

// Local.
import type { HostDebugAppStateUpdate, HostDebugSettings, HostDebugSettingsInit } from "../shared";


// - Local typing - //

interface _MixDOMTreeNode {
    type: "dom" | "portal" | "boundary" | "pass" | "host" | "root" | "";
}
interface _Host {
    groundedTree: _MixDOMTreeNode;
}
interface _MixDOMDebug {
    setHost: (host: _Host, settings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null) => void;
    clearHost: (host: _Host) => void;
    updateSettings: (settings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null) => void;
}
type _ClassType<T = {}, Args extends any[] = any[]> = new (...args: Args) => T;
interface _MixDOMDebug { }
interface _MixDOMDebugType extends _ClassType<_MixDOMDebug, [container?: Element | null]> {
    /** Instance of the MixDOMDebug, once has started debugging. */
    mixDOMDebug: _MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    stopDebug: () => void;
    /** Start debugging the given host. */
    startDebug: (host?: _Host | null, settings?: HostDebugSettingsLauncher, state?: HostDebugAppStateUpdate) => _MixDOMDebug;
}


// - Exported type - //

/** Adds window features and scriptUrl to the HostDebugSettingsInit. Also automatically reads cssUrl to reflect scriptUrl if given. */
export interface HostDebugSettingsLauncher extends HostDebugSettingsInit {
    // Redefine.
    /** Whether adds the div#app-root.ui element inside the body. Defaults to true for launcher. */
    addRoot?: boolean;
    /** Whether uses a fade in when initializing the app. Defaults to true for launcher. */
    useFadeIn?: boolean;
    /** Url for loading up the main js file for the app. Defaults to: https://unpkg.com/mix-dom-debug/MixDOMDebug.js */
    scriptUrl?: string;

    // Add.
    /** Url for loading up the css file for the app. Defaults to reusing the folder from js file with: MixDOMDebug.css. If no scriptUrl defined, uses: https://unpkg.com/mix-dom-debug/MixDOMDebug.css */
    cssUrl?: string;
    /** Window features. Defaults to: `"toolbar=0,scrollbars=0,location=0,resizable=1"`. */
    windowFeatures?: string;
    /** Window target. Defaults to: `"_blank"`. */
    windowTarget?: string;
    /** Callback to call after loading. Defaults to: `undefined`. */
    onLoad?: ((debug: _MixDOMDebug | null, host: _Host | null, debugWindow: Window) => void) | null;
}

export interface HostDebugWindowSettings {
    /** Window features. Defaults to: `"toolbar=0,scrollbars=0,location=0,resizable=1"`. */
    features?: string;
    /** Window target. Defaults to: `"_blank"`. */
    target?: string;
    /** Callback to call after loading. Defaults to: `undefined`. */
    onLoad?: ((debug: _MixDOMDebug | null, host: _Host | null, debugWindow: Window) => void) | null;
}


// - Features - //

/** Helper to open up MixDOMDebug app in a new window.
 * @param host The host to debug. If not given, will not start up the debug.
 * @param debugSettings Optional partial settings for debugging: `{ console }`. If no settings provided defaults to: `{ console: window.console }`.
 *      - `console: Console`: Give an additional console to use for logging information. Will anyway log to the window where the debugger lives.
 *      - `rootElement?: string | Element | null`: App root element or selector. Note that when using the launcher to open in a new window, defaults to "#app-root" using the default MixDOMDebug.initApp creation process.
 *      - `cssUrl?: string`: Url for loading up the css file for the app. Defaults to reusing the folder from js file with: MixDOMDebug.css. If no scriptUrl defined, uses: https://unpkg.com/mix-dom-debug/MixDOMDebug.css
 *      - `fontUrl?: string`: Url for the font. Currently fixed to "Abel" from: "https://fonts.googleapis.com/css?family=Abel".
 *      - `prettify?: boolean`: Whether to add the Google prettify JS script to do syntax highlighting. Strongly recommended - defaults to true. The script is loaded from: "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js"
 *      - `beautify?: boolean`: Whether to add the beautify JS script to help linebreaking and tabbifying JS code. Defaults to true. The script is loaded from: "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js"
 *      - `addRoot?: boolean`: Whether adds the div#app-root.ui element inside the body. Defaults to true for launcher.
 *      - `useFadeIn?: boolean`: Whether uses a fade in when initializing the app. Defaults to true for launcher.
 *      - `windowFeatures?: string`: Window features. Defaults to: `"toolbar=0,scrollbars=0,location=0,resizable=1"`.
 *      - `windowTarget?: string`: Window target. Defaults to: `"_blank"`.
 *      - `onLoad?: (debug: _MixDOMDebug | null, host: _Host | null, debugWindow: Window) => void`: Callback to call after loading. Defaults to: `undefined`.
 * @param appState Optional partial initial app state. Defaults to empty dictionary `{}`.
 *      - `theme: "dark" | "light"`: Set the colour scheme. Defaults to `"dark"`.
 *      - `filter: string`: Set the value for the filter. Defaults to `""`.
 *      - `selected: MixDOMTreeNode[]`: Define the tree nodes that should be selected (initially). Defaults to `[]`.
 *      - `collapsed: MixDOMTreeNode[]`: Define the tree nodes that are collapsed (initially). Defaults to `[]`.
 *      - `showCollapsed: boolean`: Whether shows matched items that are collapsed by parents. Defaults to `false`.
 *      - `showParents: boolean`: Whether shows parent hierarchy for the matched items. Defaults to `false`.
 *      - `showChildren: boolean`: Whether shows children hierarchy for the matched items. Defaults to `false`.
 *      - `hideUnmatched: boolean`: Whether only shows the matches (and parent/children hierarchy), or just dims unmatched (= `false`). Defaults to `false`.
 *      - `ignoreSelection: boolean`: Whether disabled the effects of selection (in terms of matching). Defaults to `false`.
 *      - `ignoreFilter: boolean`: Whether disabled (the effects of) the filter. Defaults to `false`.
 *      - `rowMode: "select" | "select-tip" | "tip"`: In `"tip"` mode clicking the row toggles the tip. In `"select"` clicking the row does selection. In `"select-tip"`, clicking does selection, but hovering the row provides tip. Defaults to `"select-tip"`.
 *      - `hiddenTipSections: TipSectionNames[]`: Pre-hide certain tip categories. Defaults to `[]`.
 *          * Categories are: `"heading" | "code" | "props" | "state" | "contexts" | "settings" | "rendered-by" | "wired" | "remote" | "children" | "renders"`.
 */
export function openMixDOMDebug(
    host?: _Host | null,
    debugSettings?: HostDebugSettingsLauncher | null,
    appState?: HostDebugAppStateUpdate | null,
) {

    // Parse.
    let { scriptUrl, windowFeatures, windowTarget, onLoad, ...coreSettings } = {
        console: window.console,
        addRoot: true,
        useFadeIn: true,
        windowFeatures: "toolbar=0,scrollbars=0,location=0,resizable=1",
        windowTarget: "_bank",
        scriptUrl: "https://unpkg.com/mix-dom-debug/MixDOMDebug.js",
        ...debugSettings
    };
    if (coreSettings.cssUrl === undefined)
        coreSettings.cssUrl = scriptUrl.slice(0, scriptUrl.lastIndexOf("/") + 1) + "MixDOMDebug.css";

    // Open a window.
    const w = window.open(undefined, windowTarget, windowFeatures) as Window & { MixDOMDebug: _MixDOMDebugType; };

    // Generate contents.
    if (w) {
        
        // Prepare script.
        const script = w.document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", scriptUrl);

        // Add load listener.
        script.addEventListener("load", () => {
            // We use `as any` as our typing is purposefully restricted.
            const debug = w.MixDOMDebug.startDebug(host as any, coreSettings, appState);
            onLoad && onLoad(debug, host || null, w);
        });
        
        // Add window close listener.
        // .. We can use "beforeunload" to call a func inside, since we are not trying to disable the unloading.
        w.addEventListener("beforeunload", () => {
            w.MixDOMDebug && w.MixDOMDebug.stopDebug(true); // True to skip context update.
        });

        // Add script.
        w.document.body.appendChild(script);
    }

    // Return window.
    return w;
}
