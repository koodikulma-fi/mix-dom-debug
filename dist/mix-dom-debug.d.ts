import { Context } from 'data-signals';
import { Host, MixDOMTreeNode, MixDOMTreeNodeType } from 'mix-dom';
import { ClassType } from 'mixin-types';

interface HostDebugSettings {
    /** Give an additional console to use for logging information. Will anyway log to the window where the debugger lives. */
    console: Console | null;
}
/** This type contains partial HostDebugSettings and a few initial settings only used on start up (rootElement and cssUrl). */
interface HostDebugSettingsInit extends Partial<HostDebugSettings> {
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
    selected?: _MixDOMTreeNode[];
    collapsed?: _MixDOMTreeNode[];
    includedSubHosts?: _Host[] | boolean;
}
type TipSectionNames = "heading" | "code" | "props" | "state" | "contexts" | "settings" | "rendered-by" | "wired" | "remote" | "children" | "renders";
/** Simplified version of MixDOMTreeNode. */
interface _MixDOMTreeNode {
    type: "dom" | "portal" | "boundary" | "pass" | "host" | "root" | "";
}
interface _Host {
    groundedTree: _MixDOMTreeNode;
}

type DebugContextData = {
    settings: HostDebugSettings & {};
    host: Host | null;
    iUpdate: number;
};
type DebugContextSignals = {
    domFocus: (treeNode: MixDOMTreeNode | null) => void;
};
type DebugContext = Context<DebugContextData, DebugContextSignals>;
type StateContextData = HostDebugAppState & {
    shouldSelect: boolean;
    noneCollapsed: boolean;
};
type StateContextSignals = {
    /** Handled by UIAppHostTree. */
    scrollToMatched: (toPrevious?: boolean, withinCollapsed?: boolean) => void;
    /** Handled by UIAppHostTree. */
    toggleCollapseAll: () => void;
    /** Handled by UIAppHostTree. */
    toggleSelectMatched: (includeRelated?: boolean) => void;
    /** Handled by UIAppHostTree. */
    setTipDisplay: (treeNode: MixDOMTreeNode | null) => void;
    /** Handled by UIAppHostTree. */
    modifySelected: (ids: MixDOMTreeNode[], mode: "reset" | "invert" | "add" | "remove") => void;
    /** Handled by UIAppHostTree. */
    modifyCollapsed: (ids: MixDOMTreeNode[], mode: "reset" | "invert" | "add" | "remove") => void;
    /** Handled by UIAppHostTree. */
    modifySubHosts: (hostsOrToggle: boolean | Host[]) => void;
    /** Handled by MixDOMDebug. */
    connectSubHost: (host: Host, refresh?: boolean) => void;
    /** Handled by MixDOMDebug. */
    disconnectSubHost: (host: Host, refresh?: boolean) => void;
    /** Handled by MixDOMDebug. */
    toggleTheme: () => void;
};
type StateContext = Context<StateContextData, StateContextSignals>;
type AppContexts = {
    debug: DebugContext;
    state: StateContext;
};
interface TreeListItem<Item extends TreeListItem = any> {
    children?: Item[];
}
type DebugTreeItemType = Exclude<MixDOMTreeNodeType, "boundary"> | "component" | "empty" | "dom-element" | "dom-text" | "dom-external" | "dom-pseudo";
interface DebugTreeItem extends TreeListItem<DebugTreeItem> {
    id: MixDOMTreeNode;
    treeNode: MixDOMTreeNode;
    parent: DebugTreeItem | null;
    level: number;
    /** Name of the component, or other naming. */
    name: string;
    /** One liner of the content. For example, for a DOM element, it's the element as code. For a component, it's the class/function as a string. Does not contain nested content. */
    description: string;
}
type IconNames = "" | "console" | "info" | "theme" | "close" | "back" | "forwards" | "expanded" | "collapsed" | "show-all" | "show-matched" | "scroll-to" | "select-all" | "select-none" | "no-selection" | "no-filter" | "click-select" | "click-select-tip" | "click-tip" | "filter" | "filter-collapsed" | "filter-expanded" | "filter-parents" | "filter-children" | "item-selected" | "item-deselected";

/** Settings to initialize the app. */
interface InitAppSettings {
    /** Url for the css file, defaults to: "https://unpkg.com/mix-dom-debug/MixDOMDebug.css" */
    cssUrl: string;
    /** Url for the font. Currently fixed to "Abel" from: "https://fonts.googleapis.com/css?family=Abel". */
    fontUrl: string;
    /** Whether adds the Google's prettify script for syntax highlighting. Defaults to true. Loaded from: "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js". */
    prettify: boolean;
    /** Whether adds the beautify script for JS code linebreaking and tabbing. Defaults to true. Loaded from: "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js". */
    beautify: boolean;
    /** Whether adds the div#app-root inside document.body or not. Defaults to false. */
    addRoot: boolean;
    /** Whether adds a fade in element. Defaults to false. */
    useFadeIn: boolean;
}
/** The static class type for MixDOMDebug. */
interface MixDOMDebugType extends ClassType<MixDOMDebug, [container?: Element | null]> {
    /** Instance of the MixDOMDebug, once has started debugging. */
    debug: MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    stopDebug: () => void;
    /** Start debugging the given host. */
    startDebug: (host: Host, settings?: Partial<HostDebugSettings>, state?: Partial<HostDebugAppState>) => MixDOMDebug;
}
declare class MixDOMDebug {
    ["constructor"]: MixDOMDebugType;
    /** Our own contexts. */
    contexts: AppContexts;
    /** Our own host. */
    ownHost: Host;
    /** For forcing refreshes. */
    refreshId: {};
    /** Updates are delayed by a timer. */
    updateTimer: number | null;
    constructor(container?: Element | null);
    setHost(host: Host, debugSettings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null): void;
    clearHost(): void;
    updateSettings(debugSettings?: Partial<HostDebugSettings> | null, appState?: HostDebugAppStateUpdate | null): void;
    refresh(forceRefresh?: boolean): void;
    onUpdate: (cancelled?: boolean, host?: Host) => void;
    getSettings(settings?: Partial<HostDebugSettings> | null, includeCurrent?: boolean): HostDebugSettings;
    private clearHostListeners;
    private setHostListeners;
    /** Instance of the MixDOMDebug, once has started debugging. */
    static debug: MixDOMDebug | null;
    /** Stop debugging the current host, if has one. */
    static stopDebug: (skipContext?: boolean) => void;
    /** Start debugging the given host and initialize the app (unless already inited). */
    static startDebug: (host?: Host | null, settings?: HostDebugSettingsInit | null, appState?: HostDebugAppStateUpdate | null) => MixDOMDebug;
    /** Should only be called once. Adds the css, scripts and a couple of DOM elements to set up the app.
     * @param settings A partial dictionary of settings.
     *      - cssUrl (string): Url for the css file, defaults to: "https://unpkg.com/mix-dom-debug/MixDOMDebug.css"
     *      - fontUrl (string): Url for the font. Currently fixed to "Abel" from: "https://fonts.googleapis.com/css?family=Abel".
     *      - prettify (boolean): Whether adds the Google's prettify script for syntax highlighting. Defaults to true. Loaded from: "https://cdn.jsdelivr.net/gh/google/code-prettify@master/loader/prettify.js".
     *      - beautify (boolean): Whether adds the beautify script for JS code linebreaking and tabbing. Defaults to true. Loaded from: "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.15.1/beautify.min.js".
     *      - addRoot (boolean): Whether adds the div#app-root.ui inside document.body or not. Defaults to false.
     *      - useFadeIn (boolean): Whether adds a fade in element. Defaults to false.
     * @param onLoad Called after loading the two optional auxiliary scripts.
     */
    static initApp: (settings?: Partial<InitAppSettings> | null, onLoad?: (() => void) | null) => void;
}

export { AppContexts, DebugContext, DebugContextData, DebugContextSignals, DebugTreeItem, DebugTreeItemType, HostDebugAppState, HostDebugAppStateUpdate, HostDebugSettings, HostDebugSettingsInit, IconNames, InitAppSettings, MixDOMDebug, MixDOMDebugType, StateContext, StateContextData, StateContextSignals, TipSectionNames, TreeListItem };
