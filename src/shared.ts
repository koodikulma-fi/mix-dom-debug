
// - Settings and app state - //

export interface HostDebugSettings {
    /** Give an additional console to use for logging information. Will anyway log to the window where the debugger lives. */
    console: Console | null;
}

/** This type contains partial HostDebugSettings and a few initial settings only used on start up (rootElement and cssUrl). */
export interface HostDebugSettingsInit extends Partial<HostDebugSettings> {
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


export interface HostDebugAppState {
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
    // UI.
    hiddenTipSections: TipSectionNames[];
}
export interface HostDebugAppStateUpdate extends Partial<HostDebugAppState> {
    selected?: _MixDOMTreeNode[];
    collapsed?: _MixDOMTreeNode[];
    includedSubHosts?: _Host[] | boolean;
}


// - Helper types - //

export type TipSectionNames = "heading" | "code" | "props" | "state" | "contexts" | "settings" | "rendered-by" | "wired" | "remote" | "children" | "renders";

/** Simplified version of MixDOMTreeNode. */
interface _MixDOMTreeNode {
    type: "dom" | "portal" | "boundary" | "pass" | "host" | "root" | "";
}
interface _Host {
    groundedTree: _MixDOMTreeNode;
}