
// - Imports - //

import { Context } from "data-signals";
import { Host, MixDOMTreeNode, MixDOMTreeNodeType } from "mix-dom";


// - Settings and live state - //

export type HostDebugSettings = {
    /** Give an additional console to use for logging information. Will anyway log to the window where the debugger lives. */
    console: Console | null;
    // /** Whether listens to focus changes in the original host. If enabled (by giving the document root), displays a refresh button in the UI to scroll and select the related dom tree node. */
    // focusSource: Document | null;
}

export type HostDebugLive = {
    iUpdate: number;
    // /** The main listener. */
    // focusInListener?: (e: FocusEvent) => void;
    // /** Not supported fully by some major browsers, eg. FireFox. */
    // focusOutListener?: (e: FocusEvent) => void;
}


// - Contexts - //

export type DebugContextData = {
    settings: HostDebugSettings;
    live: HostDebugLive;
    host: Host | null;
    focusedId: DebugTreeItem["id"] | null;
};
export type DebugContextSignals = {
    domFocus: (treeNode: MixDOMTreeNode | null) => void;
};
export type DebugContext = Context<DebugContextData, DebugContextSignals>;

export const allTipSectionNames = ["heading", "code", "props", "state", "contexts", "rendered-by", "wired", "remote", "children", "renders"] as const;
export type TipSectionNames = typeof allTipSectionNames[number];
export type SettingsContextData = {
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
    // Computed from local state. The selected and collapsed ids are held in UIAppHostTree.
    shouldSelect: boolean;
    noneCollapsed: boolean;
    // UI.
    hiddenTipSections: TipSectionNames[];
};
export type SettingsContextSignals = {
    /** Handled by UIAppHostTree. */
    scrollToMatched: (toPrevious?: boolean, withinCollapsed?: boolean) => void;
    /** Handled by UIAppHostTree. */
    toggleCollapseAll: () => void;
    /** Handled by UIAppHostTree. */
    toggleSelectMatched: (includeRelated?: boolean) => void;
    /** Handled by UIAppHostTree. */
    setTipDisplay: (treeNode: MixDOMTreeNode | null) => void;
    toggleTheme: () => void;
};
export type SettingsContext = Context<SettingsContextData, SettingsContextSignals>;

export type AppContexts = {
    debug: DebugContext;
    settings: SettingsContext;
}


// - Extra typing - //

export interface TreeListItem<Item extends TreeListItem = any> {
    // id: Item["id"];
    children?: Item[];
}
export type DebugTreeItemType = MixDOMTreeNodeType | "";
export interface DebugTreeItem extends TreeListItem<DebugTreeItem> {
    id: MixDOMTreeNode;
    treeNode: MixDOMTreeNode;
    parent: DebugTreeItem | null;
    level: number;
    // Extracted info.
    /** Name of the component, or other naming. */
    name: string;
    /** One liner of the content. For example, for a DOM element, it's the element as code. For a component, it's the class/function as a string. Does not contain nested content. */
    description: string;
    // type: DebugTreeItemType;
}


// - UI - //

export type IconNames =

    | ""

    | "console"
    | "info"
    | "theme"
    | "close"

    | "back"
    | "forwards"
    
    | "expanded"
    | "collapsed"
    
    | "show-all"
    | "show-matched"

    | "scroll-to"

    | "select-all"
    | "select-none"

    | "no-selection"
    | "no-filter"
    // | "no-info"

    | "click-select"
    | "click-select-tip"
    | "click-tip"

    | "filter"
    | "filter-collapsed"
    | "filter-expanded"
    | "filter-parents"
    | "filter-children"
    
    | "item-selected"
    | "item-deselected"

    ;