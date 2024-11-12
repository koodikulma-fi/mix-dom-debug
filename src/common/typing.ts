
// - Imports - //

// Libraries.
import type { Context } from "data-signals";
import type { Host, MixDOMTreeNode, MixDOMTreeNodeType } from "mix-dom";
// Shared.
import type { HostDebugAppState, HostDebugSettings } from "../shared";


// - Contexts - //

export type DebugContextData = {
    settings: HostDebugSettings & {};
    host: Host | null;
    iUpdate: number;
};
export type DebugContextSignals = {
    domFocus: (treeNode: MixDOMTreeNode | null) => void;
};
export type DebugContext = Context<DebugContextData, DebugContextSignals>;
export type StateContextData = HostDebugAppState & {
    // Computed from local state. The selected and collapsed ids are held in UIAppHostTree.
    shouldSelect: boolean;
    noneCollapsed: boolean;
};
export type StateContextSignals = {
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
export type StateContext = Context<StateContextData, StateContextSignals>;

export type AppContexts = {
    debug: DebugContext;
    state: StateContext;
}


// - Extra typing - //

export interface TreeListItem<Item extends TreeListItem = any> {
    // id: Item["id"];
    children?: Item[];
}
export type DebugTreeItemType = Exclude<MixDOMTreeNodeType, "boundary"> | "component" | "empty" | "dom-element" | "dom-text" | "dom-external" | "dom-pseudo";
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