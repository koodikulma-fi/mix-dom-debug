interface HostDebugSettings {
    /** Give an additional console to use for logging information. Will anyway log to the window where the debugger lives. */
    console: Console | null;
}
/** This type contains partial HostDebugSettings and a few initial settings only used on start up (rootElement and cssUrl). */
interface HostDebugSettingsInit extends Partial<HostDebugSettings> {
    /** Callback to call after loading. Defaults to: `undefined`. */
    onLoad?: ((debug: _MixDOMDebug$1 | null, host: _Host$1 | null, debugWindow: Window) => void) | null;
    /** App root element or selector. Note that when using the launcher to open in a new window, defaults to "#app-root" using the default MixDOMDebug.initApp creation process. */
    rootElement?: string | Element | null;
    /** Url for loading up the css file for the app. Defaults to: https://unpkg.com/mix-dom-debug/MixDOMDebug.css */
    cssUrl?: string;
    /** Url for the font. Currently fixed to "Abel" from: "https://fonts.googleapis.com/css?family=Abel". */
    fontUrl?: string;
    /** Whether to add the Google prettify JS script to do syntax highlighting. Strongly recommended - defaults to true. The script is loaded from: "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js" */
    prettify?: boolean;
    /** Whether to add the beautify JS script to help linebreaking and tabbifying JS code. Defaults to true. The script is loaded from: "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js" */
    beautify?: boolean;
    /** Whether adds the div#app-root.ui element inside the body. Defaults to false. */
    addRoot?: boolean;
    /** Whether uses a fade in when initializing the app. Defaults to false. */
    useFadeIn?: boolean;
}
interface HostDebugAppState {
    theme: "dark" | "light";
    filter: string;
    showCollapsed: boolean;
    showParents: boolean;
    showChildren: boolean;
    hideUnmatched: boolean;
    ignoreSelection: boolean;
    ignoreFilter: boolean;
    /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
    rowMode: "select" | "select-tip" | "tip";
    hiddenTipSections: TipSectionNames[];
}
interface HostDebugAppStateUpdate extends Partial<HostDebugAppState> {
    selected?: _MixDOMTreeNode$1[];
    collapsed?: _MixDOMTreeNode$1[];
    includedSubHosts?: _Host$1[] | boolean;
}
type TipSectionNames = "heading" | "code" | "props" | "state" | "contexts" | "settings" | "rendered-by" | "wired" | "remote" | "children" | "renders";
/** Simplified version of MixDOMTreeNode. */
interface _MixDOMTreeNode$1 {
    type: "dom" | "portal" | "boundary" | "pass" | "host" | "root" | "";
}
interface _Host$1 {
    groundedTree: _MixDOMTreeNode$1;
}
interface _MixDOMDebug$1 {
    setHost: (host: _Host$1, settings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null) => void;
    clearHost: () => void;
    updateSettings: (settings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null) => void;
}

interface _MixDOMTreeNode {
    type: "dom" | "portal" | "boundary" | "pass" | "host" | "root" | "";
}
interface _Host {
    groundedTree: _MixDOMTreeNode;
}
type _ClassType<T = {}, Args extends any[] = any[]> = new (...args: Args) => T;
interface _MixDOMDebug {
    setHost: (host: _Host, settings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null) => void;
    clearHost: () => void;
    updateSettings: (settings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null) => void;
}
interface _MixDOMDebug {
}
interface _MixDOMDebugType extends _ClassType<_MixDOMDebug, [container?: Element | null]> {
    /** Instance of the MixDOMDebug, once has started debugging. */
    mixDOMDebug: _MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    stopDebug: () => void;
    /** Start debugging the given host. */
    startDebug: (host?: _Host | null, settings?: HostDebugSettingsLauncher, state?: HostDebugAppStateUpdate) => _MixDOMDebug;
}
/** Adds window features and scriptUrl to the HostDebugSettingsInit. Also automatically reads cssUrl to reflect scriptUrl if given. */
interface HostDebugSettingsLauncher extends HostDebugSettingsInit {
    /** Whether adds the div#app-root.ui element inside the body. Defaults to true for launcher. */
    addRoot?: boolean;
    /** Whether uses a fade in when initializing the app. Defaults to true for launcher. */
    useFadeIn?: boolean;
    /** Url for loading up the main js file for the app. Defaults to: https://unpkg.com/mix-dom-debug/MixDOMDebug.js */
    scriptUrl?: string;
    /** Url for loading up the css file for the app. Defaults to reusing the folder from js file with: MixDOMDebug.css. If no scriptUrl defined, uses: https://unpkg.com/mix-dom-debug/MixDOMDebug.css */
    cssUrl?: string;
    /** Window features. Defaults to: `"toolbar=0,scrollbars=0,location=0,resizable=1"`. */
    windowFeatures?: string;
    /** Window target. Defaults to: `"_blank"`. */
    windowTarget?: string;
}
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
declare function openMixDOMDebug(host?: _Host | null, debugSettings?: HostDebugSettingsLauncher | null, appState?: HostDebugAppStateUpdate | null): Window & {
    MixDOMDebug: _MixDOMDebugType;
};

export { HostDebugSettingsLauncher, openMixDOMDebug };
