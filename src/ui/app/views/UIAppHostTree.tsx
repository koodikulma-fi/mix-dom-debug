
// - Imports - //

// Libraries.
import { classNames, CSSProperties, readDOMString } from "dom-types";
import { createMemo } from "data-memo";
import { SignalListenerFlags } from "data-signals";
import { MixDOM, Host, ComponentCtxFunc, hasContentInDefs, MixDOMTreeNode, ComponentTypeWith, PseudoPortalProps } from "mix-dom";
// Common.
import { flattenTreeWith, AppContexts, DebugTreeItem, HostDebugLive, HostDebugSettings, consoleLog } from "../../../common/index";
// UI library.
import { UIList, UIVirtualListInfo } from "../../library/index";
// Local.
import { UIAppTreeItem, UIAppTreeItemInfo } from "./tree/UIAppTreeItem";
import { UIAppShowTip } from "./tree/UIAppShowTip";


// - Local helpers - //

type Item = UIAppTreeItemInfo["props"]["item"];

const itemFilterTypeStrings: Record<Item["treeNode"]["type"] | "pass-remote", string> = {
    "boundary": "[boundary]",
    "dom": "[dom]",
    "root": "[root] root container",
    "host": "[host] nested host",
    "pass": "[pass] content pass from",
    "pass-remote": "[pass] remote pass from",
    "portal": "[portal] portal to",
    "": "[empty]",
};

function getDocBodyBy(treeNode: MixDOMTreeNode): HTMLElement | null {
    let tNode: MixDOMTreeNode | null = treeNode;
    while (tNode) {
        if (tNode.domNode)
            return tNode.domNode.ownerDocument?.body || null;
        tNode = tNode.parent;
    }
    return null;
}

function matchesFilter(item: Item, filterSplits: string[][]): boolean {
    return (filterSplits && filterSplits.some(splits => splits.every(s => item.name.toLowerCase().includes(s) || item.description.toLowerCase().includes(s) || ((itemFilterTypeStrings[item.treeNode.def?.getRemote ? "pass-remote" : item.treeNode.type] || "").includes(s)))))
}

function isItemWithinCollapsed(item: Item, collapsed: Item["id"][]): boolean {
    let pItem = item.parent;
    while (pItem) {
        if (collapsed.includes(pItem.id))
            return true;
        pItem = pItem.parent;
    }
    return false;
}

function findItemsIdsBy(item: Item, mode: "level" | "siblings" | "parents" | "chain" | "reset" | "self", current: Item["id"][], allItems: Item[]): Item["id"][] {
    // Prepare.
    const iExisting = current.indexOf(item.id);
    const addMode = iExisting === -1;
    // By mode.
    switch(mode) {
        case "level": {
            const level = item.level;
            const ids = allItems.filter(it => it.level === level).map(it => it.id);
            return addMode ? [...current, ...ids.filter(id => !current.includes(id))] : current.filter(id => !ids.includes(id));
        }
        case "siblings": {
            const ids = item.parent?.children?.map(it => it.id) || [item.id];
            return addMode ? [...current, ...ids.filter(id => !current.includes(id))] : current.filter(id => !ids.includes(id));
        }
        case "chain":
        case "parents": {
            // Get parent chain ids.
            const chainIds = [item.id];
            let p = item.parent;
            while (p) {
                chainIds.push(p.id);
                p = p.parent;
            }
            // Get children.
            if (mode === "chain") {
                let kids = item.children || [];
                let kid: DebugTreeItem | undefined;
                let i = 0;
                while (kid = kids[i++]) {
                    chainIds.push(kid.id);
                    if (kid.children) {
                        kids = kid.children.concat(kids.slice(i));
                        i = 0;
                    }
                }
            }
            // Get all others.
            const otherIds = allItems.filter(item => !chainIds.includes(item.id)).map(item => item.id);
            // If equal to all others, set to none, otherwise to all others.
            return current.length !== otherIds.length || current.some(id => chainIds.includes(id)) ? otherIds : [];
        }
        case "reset":
            // If already reseted, set to none, otherwise to this.
            return !addMode && current.length === 1 ? [] : [item.id];
        default:
            current = current.slice();
            addMode ? current.push(item.id) : current.splice(iExisting, 1);
            return current;
    }
}


// - Component - //

export interface UIAppHostTreeInfo {
    props: { refreshId?: any; className?: string; listClassName?: string; style?: CSSProperties; };
    state: {
        host: Host | null;
        debugSettings: HostDebugSettings | null;
        debugLive: HostDebugLive | null;
        selected: Item["id"][];
        collapsed: Item["id"][];
        tipItem: Item | null;
        filterSplits: string[][] | null;
        showCollapsed: boolean;
        showParents: boolean;
        showChildren: boolean;
        ignoreSelection: boolean;
        ignoreFilter: boolean;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode: "select" | "select-tip" | "tip";
        hideUnmatched: boolean;
        reselectRefreshId: {};
    };
    class: {
        /** Used in scroll-to-matched feature. */
        iMatchCycle: number;
    };
    contexts: AppContexts;
    timers: "tip-hover" | "skip-hover";
}

export const UIAppHostTree: ComponentCtxFunc<UIAppHostTreeInfo> = function DebugHost(_initProps, comp, cApi) {


    // - Init - //

    comp.iMatchCycle = -1;
    comp.state = {
        host: null,
        debugSettings: null,
        debugLive: null,
        selected: [],
        collapsed: [],
        tipItem: null,
        filterSplits: null,
        showCollapsed: false,
        showParents: false,
        showChildren: false,
        ignoreSelection: false,
        ignoreFilter: false,
        rowMode: "select-tip",
        hideUnmatched: false,
        reselectRefreshId: {}
    };


    // - Context to state - //

    cApi.listenToData(
        "debug.host",
        "debug.settings",
        "debug.live",
        "settings",
        (host, debugSettings, debugLive, settings) => {
            const setup = settings || { filter: "", ...comp.state };
            const filterSplits = setup.filter.replace(/\,/g, " ").trim() ? setup.filter.split(",").map(s => s.trim().split(" ").map(p => p.trim().toLowerCase()).filter(p => p)).filter(splits => splits[0] !== undefined) : null;
            comp.setState({
                host,
                debugSettings,
                debugLive,
                filterSplits: filterSplits && filterSplits[0] !== undefined && filterSplits || null,
                showCollapsed: setup.showCollapsed,
                showParents: setup.showParents,
                showChildren: setup.showChildren,
                hideUnmatched: setup.hideUnmatched,
                ignoreFilter: setup.ignoreFilter,
                ignoreSelection: setup.ignoreSelection,
                rowMode: setup.rowMode,
            });
        },
        [comp.state.host, comp.state.debugSettings, comp.state.debugLive]
    );
    

    // - Common - //

    const refVirtualList = new MixDOM.Ref<ComponentTypeWith<UIVirtualListInfo>>;
    const rowHeight = 30;
    type CommonProps = Partial<{ debugInfo?: HostDebugSettings | null; iUpdate?: number; }> & Omit<UIAppTreeItemInfo["props"], "item">;
    const getCommonProps = createMemo((debugInfo: HostDebugSettings | null, iUpdate?: number, rowMode?: UIAppHostTreeInfo["state"]["rowMode"]): CommonProps => ({
        debugInfo,
        animate: true,
        iUpdate,
        rowMode,
        toggleCollapsed,
        toggleSelected,
        toggleConcept,
        onToggleTip,
        onTipPresence,
    }));

    const getRefreshId = createMemo((...args: any[]) => ({}));
    //
    //
    // <-- TODO: Take into use.
    

    // - Items - //

    // Re-triggered whenever the iUpdate arg has changed.
    const itemsByUpdate = createMemo((host: Host | null, _iUpdate?: number): DebugTreeItem[] => {

        if (!host)
            return [];

        const items = flattenTreeWith([host.groundedTree], (treeNode, parent: DebugTreeItem | null, level): DebugTreeItem => {
            // let id = "";
            let description = "";
            let name = "";
            switch(treeNode.type) {
                case "boundary":
                    // id = "boundary:" + treeNode.boundary.bId;
                    name = treeNode.def.tag ? treeNode.def.tag.name : "";
                    description = treeNode.def.tag ? treeNode.def.tag.toString() : "";
                    break;
                case "dom": {
                    name = treeNode.def.tag || "";
                    
                    const tag = treeNode.def.tag;
                    const contentStr = typeof treeNode.def.domContent === "string" ? '"' + treeNode.def.domContent + '"' : undefined;
                    const hasKids = !!(tag && treeNode.children[0] && hasContentInDefs(treeNode.def.childDefs)); // <-- Check more deeply. To skip empty passes.
                    description = readDOMString(tag, treeNode.def.props, hasKids ? null : contentStr );
                    if (hasKids)
                        description = description.replace("/>", ">");
                    break;
                }
                case "root": {
                    const el = treeNode.domNode as HTMLElement | null;
                    name = el ? el.tagName.toLowerCase() : "";
                    if (el) {
                        const tag = name;
                        description = readDOMString(tag, null, false, el).replace("/>", ">");
                    }
                    break;
                }
                case "host":
                    name = "Host";
                    break;
                case "portal": {
                    name = "Portal";
                    const container = (treeNode.def.props as PseudoPortalProps || {}).container as HTMLElement | null | undefined;
                    description = readDOMString(container ? container.tagName.toLowerCase() : "body", treeNode.def.props, false, container || getDocBodyBy(treeNode));
                    description = description.replace("/>", ">");
                    break;
                }

            }
            // Create item.
            const item = {
                // type: treeNode.type,
                id: treeNode,
                treeNode,
                parent,
                level,
                name,
                description,
                // children: []
            };
            // Parenting.
            if (parent)
                !parent.children ? parent.children = [item] : parent.children.push(item);
            // Return item.
            return item;
        });

        // Prune.
        const allIds = items.map(item => item.id);
        // .. Correct state from old collapsed. It's fine to do it while rendering or whatever.
        const collapsed = comp.state.collapsed.filter(id => allIds.includes(id));
        if (collapsed.length !== comp.state.collapsed.length)
            setCollapsed(collapsed);
        // .. Correct state from old selected. It's fine to do it while rendering or whatever.
        const selected = comp.state.selected.filter(id => allIds.includes(id));
        if (selected.length !== comp.state.selected.length)
            setSelected(selected);

        // Return items.
        return items;
    });

    // Get initial.
    let allItems = itemsByUpdate(comp.state.host, comp.state.debugLive?.iUpdate || 0);


    // - Collapsing - //

    const areNoneCollapsed = (collapsed: Item["id"][] = comp.state.collapsed): boolean => {
        return collapsed[0] === undefined;
        // return !items.some(item => !collapsed.includes(item.id) && item.children && item.children[0] !== undefined);
    }

    // Set the state about master collapsed state (for a master collapse/expand button).
    const setCollapsed = (collapsed: Item["id"][]) => {
        const noneWereCollapsed = areNoneCollapsed();
        if (areNoneCollapsed(collapsed) !== noneWereCollapsed)
            cApi.setInData("settings.noneCollapsed", !noneWereCollapsed);
        comp.setInState("collapsed", collapsed);
    }

    const toggleCollapsed = (item: Item, mode?: "level" | "siblings" | "parents" | "chain" | "reset" | "self") => {
        setCollapsed(findItemsIdsBy(item, mode || "self", comp.state.collapsed, allItems.filter(item => item.children && item.children[0] !== undefined)));
    };

    const toggleConcept = (concept: MixDOMTreeNode["type"], reset?: boolean) => {
        // Prepare.
        let filter = cApi.getInData("settings.filter", "");
        const cStr = "[" + concept + "]";
        let splits = filter ? filter.split(",") : [];
        const lowSplits = splits.map(s => s.trim().toLowerCase());
        const iAlready = lowSplits.findIndex(s => s === cStr);
        // Reset.
        if (reset) {
            const allConcepts = (["boundary", "dom", "host", "pass", "portal", "root", ""] satisfies MixDOMTreeNode["type"][]).map(s => "[" + s + "]");
            // Remove all concepts, except this.
            const allExcept = lowSplits.filter(s => !allConcepts.includes(s) || s === cStr);
            // If already equal, add/remove this.
            if (allExcept.length === splits.length)
                iAlready !== -1 ? splits.splice(iAlready, 1) : splits.push(splits[0] === undefined ? cStr : " " + cStr);
            // Otherwise set to only this.
            else {
                splits = allExcept;
                if (iAlready === -1)
                    splits.push(splits[0] === undefined ? cStr : " " + cStr);
            }
        }
        // Toggle this concept.
        else
            iAlready !== -1 ? splits.splice(iAlready, 1) : splits.push(splits[0] === undefined ? cStr : " " + cStr);
        // Set.
        cApi.setInData("settings.filter", splits.join(","));
    };

    // When the master collapse toggle is pressed, either collapse all or uncollapse all.
    cApi.listenTo("settings.toggleCollapseAll", () => {
        setCollapsed(areNoneCollapsed() ? allItems.filter(item => item.children && item.children[0] !== undefined).map(item => item.id) : []);
    });


    // - Selecting - //

    let shouldSelectWas = true;
    const whetherShouldSelect = (selected: Item["id"][] = comp.state.selected, allVisible: boolean = false): boolean => {
        return matchedItems ?
            matchedItems.some(item => !selected.includes(item.id)) ||
            allVisible && (
                matchedParentItems && matchedParentItems.some(item => !selected.includes(item.id)) ||
                matchedChildrenItems && matchedChildrenItems.some(item => !selected.includes(item.id))
            ) || false :
            selected[0] === undefined;
    }

    // Set the state about master selected state (for a master collapse/expand button).
    const setSelected = (selected: Item["id"][]) => {
        // Cycling.
        const idWas = comp.state.selected[comp.iMatchCycle];
        const iNow = idWas !== undefined ? selected.indexOf(idWas) : -1;
        if (iNow !== -1)
            comp.iMatchCycle += iNow - comp.iMatchCycle; // Offset relatively. It's not perfect at all. But nice for simple cases.
        else if (comp.iMatchCycle >= 0)
            comp.iMatchCycle--; // Decrease by one (until -1). Again, very blurry rules. Just for common simple cases.
        // Should select.
        const filterSplits = comp.state.filterSplits;
        const shouldSelect = filterSplits && matchedItems ? matchedItems.some(item => !selected.includes(item.id) && matchesFilter(item, filterSplits)) : selected[0] === undefined;
        if (shouldSelect !== shouldSelectWas)
            cApi.setInData("settings.shouldSelect", shouldSelectWas = shouldSelect);
        // Set.
        comp.setInState("selected", selected);
    }

    const toggleSelected = (item: Item, mode?: "level" | "siblings" | "parents" | "chain" | "reset" | "self") => {
        setSelected(findItemsIdsBy(item, mode || "self", comp.state.selected, allItems));
    };

    cApi.listenTo("settings.toggleSelectMatched", (allVisible) => {
        // Prepare.
        let selIds: Item["id"][] = [];
        // Use matched.
        if (matchedItems && (comp.state.hideUnmatched || !allVisible)) {
            // Get current matches.
            const matchedIds = matchedItems.map(item => item.id).concat(allVisible ?
                (matchedParentItems && matchedParentItems.map(item => item.id) || []).concat(
                    matchedChildrenItems && matchedChildrenItems.map(item => item.id) || []) :
                []);
            // All matched.
            if (allVisible ? comp.state.selected.filter(id => matchedIds.includes(id))[0] === undefined : whetherShouldSelect())
                selIds = matchedIds;
            // Remove.
            else 
                selIds = comp.state.selected.filter(id => !matchedIds.includes(id));
        }
        // All.
        else if (comp.state.selected[0] === undefined)
            selIds = allItems.map(item => item.id);
        // Set.
        setSelected(selIds);
    });


    // - Scroll to matched - //

    cApi.listenTo("settings.scrollToMatched", (toPrevious, withinCollapsed) => {
        // Cannot.
        const okItems = matchedItems ? withinCollapsed || comp.state.showCollapsed ? matchedItems : matchedItems.filter(item => !isItemWithinCollapsed(item, comp.state.collapsed)) : [];
        if (!okItems[0])
            return;
        // Get cycled item.
        comp.iMatchCycle = toPrevious ? comp.iMatchCycle - 1 < 0 ? okItems.length - 1 : comp.iMatchCycle - 1 : comp.iMatchCycle + 1 >= okItems.length ? 0 : comp.iMatchCycle + 1;
        const okItem = okItems[comp.iMatchCycle];
        // See if should toggle parents open.
        scrollToItem(okItem);
    });

    const onItemLink = (id: Item["id"] | null, mode?: "focus" | "details" | "details-break" | "log") => {
        const item = id ? allItems.find(item => item.id === id) : null;
        switch(mode || "focus") {
            case "focus": {
                // Nothing to do.
                if (!item)
                    break;
                // See if is visible.
                const isVisible = filterer(item);
                // Case 1, is visible.
                if (isVisible)
                    scrollToItem(item);
                // Case 2, is not visible, but is not in matching mode - just scroll (with uncollapsing parents).
                else if (!matchedItems || !comp.state.hideUnmatched)
                    scrollToItem(item);
                // Case 3, is in matching mode, and is targeting an unmatched. Double make sure is not selected (implicitly is not).
                else if (!comp.state.ignoreSelection && !comp.state.selected.includes(item.treeNode)) {
                    comp.listenTo("didUpdate", () => {
                        item && scrollToItem(item);
                    }, null, SignalListenerFlags.OneShot);
                    setSelected([...comp.state.selected, item.treeNode]);
                }
                // Otherwise, cannot really do anything (nicely).
                break;
            }
            case "details":
                setTipBy(item ? item.id : null);
                break;
            case "details-break": {
                const itemWas = item || comp.state.tipItem;
                const hadHover = (tipPresence & 1) !== 0;
                setTipBy(item ? item.id : null);
                setSkipHover(!hadHover);
                itemWas && refocusToGrid(itemWas.treeNode);
                break;
            }
            case "log":
                item && consoleLog(comp.state.debugSettings, "MixDOMDebug: Log item", item.treeNode);
                break;
        }
    };

    const scrollToItem = async (item: Item) => {
        // Get.
        const uiVirtualList = refVirtualList.getComponent();
        const collapsed = comp.state.collapsed;
        if (!uiVirtualList)
            return;
        // Modified collapsed.
        let modCollapsed: Item["id"][] | null = null;
        let pItem = item.parent;
        while (pItem) {
            const iMe = (modCollapsed || collapsed).indexOf(pItem.id);
            if (iMe !== -1) {
                if (!modCollapsed)
                    modCollapsed = collapsed.slice();
                modCollapsed.splice(iMe, 1);
            }
            pItem = pItem.parent;
        }
        // Do uncollapsing.
        if (modCollapsed) {
            // Let's do inline awaiting.
            // .. Let's wait until the virtual list has updated - we know it'll update due to our refreshes (= changes in its props).
            // .. Let's add some more timeout for robustness. Not exactly sure why is needed. I guess there's an update in between.
            // let promise = new Promise<void>(res => (uiVirtualList || comp).listenTo("didUpdate", () => res(), null, SignalListenerFlags.OneShot));
            let promise = new Promise<void>(res => (uiVirtualList || comp).listenTo("didUpdate", () => (uiVirtualList || comp).setTimer(null, res, 20), null, SignalListenerFlags.OneShot));
            comp.setInState("collapsed", modCollapsed);
            await promise;
        }
        // Get total index.
        const iInAll = allItems.filter(filterer).indexOf(item);
        // Let's use instant so we have the elRow correctly.
        iInAll !== -1 && uiVirtualList.scrollToIndex(iInAll, "instant", true, (elRow) => elRow && elRow.querySelector("button")?.focus());
    };


    // - Filtering - //

    const getMatchedItems = createMemo((origItems: Item[], selected: Item["id"][] | null, filterSplits: string[][] | null): Item[] | null =>
        filterSplits || selected ? origItems.filter(item => 
            // Selection.
            (selected && selected.includes(item.id)) ||
            // The main categories (by ",") are in OR-mode, and sub categories (by " ") are in AND-mode.
            // .. So if any in the main is fine, then is fine. To know in main, all terms must be matched.
            // .. And if is not fine return false, otherwise allow through.
            (filterSplits && matchesFilter(item, filterSplits))
        ) : null
    );
    const getMatchedParents = createMemo((onlyItems: Item[]): Item[] => {
        const okParents: Item[] = [];
        for (const item of onlyItems) {
            // Loop up to collect parents.
            let p = item.parent;
            while (p) {
                if (!okParents.includes(p) && !onlyItems.includes(p))
                    okParents.push(p);
                p = p.parent;
            }
        }
        return okParents;
    });
    const getMatchedChildren = createMemo((allItems: Item[], onlyItems: Item[]): Item[] => {
        const okChildren: Item[] = [];
        for (const item of allItems) {
            // Already matched.
            if (onlyItems.includes(item))
                continue;
            // Loop up to check if has matched parents, if so accept the child.
            let p = item.parent;
            while (p) {
                if (onlyItems.includes(p)) {
                    okChildren.push(item);
                    break;
                }
                p = p.parent;
            }
        }
        return okChildren;
    });

    const filterer = (item: Item): boolean => {
        // By collapsing.
        if (
            // If showing all, then always use collapsing.
            !comp.state.hideUnmatched ||
            // If is not set to ignore collapsing, then use collapsing.
            !comp.state.showCollapsed ||
            // Otherwise use collapsing, if there is no filter nor nelection.
            (comp.state.ignoreFilter || !comp.state.filterSplits) &&
            (comp.state.ignoreSelection || comp.state.selected[0] === undefined)
        ) {
            if (isItemWithinCollapsed(item, comp.state.collapsed))
                return false;
        }
        // Fine.
        if (!matchedItems || !comp.state.hideUnmatched)
            return true;
        // Matches.
        if (matchedItems.includes(item))
            return true;
        // Allow as a parent.
        if (matchedParentItems && matchedParentItems.includes(item))
            return true;
        // Allow as a child.
        if (matchedChildrenItems && matchedChildrenItems.includes(item))
            return true;
        // Nope.
        return false;
    }
    // Get filter item variants.
    // .. Alternatively could use createTrigger and update all.
    let matchedItems = getMatchedItems(allItems, !comp.state.ignoreSelection && comp.state.selected[0] !== undefined ? comp.state.selected : null, !comp.state.ignoreFilter ? comp.state.filterSplits : null);
    let matchedParentItems = matchedItems && comp.state.showParents ? getMatchedParents(matchedItems) : null;
    let matchedChildrenItems = matchedItems && comp.state.showChildren ? getMatchedChildren(allItems, matchedItems) : null;


    // - Tip display - //

    /** &1 is hoverable, &2 popup. */
    let tipPresence: number = 0;
    let skipNextHover = false;
    /** Skips the very next hover, and any hover starts during the next 300ms.
     * - The very next is meant for when clicks the close button. (It might take longer than 300ms.)
     * - While the 300ms is meant for when mouse leaves the popup, especially downwards, as might actually hover over 2 items quickly.
     */
    const setSkipHover = (skipNext: boolean = true) => (skipNext ? skipNextHover = true : true) && comp.setTimer("skip-hover", () => {}, 300); // Let's skip for 300ms.
    const refocusToGrid = (treeNode?: Item["id"] | null, forceRefocus?: boolean) => {
        // Skip.
        const virtualList = refVirtualList.getComponent();
        if (!virtualList || !forceRefocus && virtualList.getRootElement()?.contains(document.activeElement))
            return;
        // Try specific.
        let el: HTMLElement | null | undefined = treeNode && getRowElement(treeNode);
        if (!el)
            el = virtualList.getFirstVisibleItem();
        // Focus.
        el && el.querySelector("button")?.focus();
    };
    /** To account for history vs. current again. */
    const setTipBy = (treeNode: Item["id"] | null, useRefreshId: boolean = true) => {
        if (!treeNode)
            tipPresence &= ~2;
        comp.clearTimers("tip-hover", "skip-hover");
        comp.setState({ tipItem: treeNode ? allItems.find(it => it.id === treeNode) || null : null, reselectRefreshId: useRefreshId ? {} : comp.state.reselectRefreshId });
    }
    cApi.listenTo("settings.setTipDisplay", setTipBy);
    const onToggleTip = (treeNode: Item["id"] | null) => {
        setTipBy(comp.state.tipItem?.treeNode === treeNode ? null : treeNode);
    };
    const onTipPresence = (treeNode: Item["id"], type: "hoverable" | "popup", present: boolean) => {
        // Skip.
        if (comp.state.rowMode !== "select-tip")
            return;
        // Modify presence.
        const flag = type === "popup" ? 2 : 1;
        tipPresence = present ? tipPresence | flag : tipPresence &~ flag;
        // Toggle on.
        if (present) {
            // Trigger hover timer.
            if (type === "hoverable") {
                !skipNextHover && !comp.hasTimer("skip-hover") && (tipPresence & 2) === 0 && comp.setTimer("tip-hover", () => setTipBy(treeNode), 600); // Same delay as in MixHoverSignal.
                skipNextHover = false;
            }
            // Or accept current.
            else
                setTipBy(treeNode, false);
        }
        // Toggle off.
        else {
            const itemWas = comp.state.tipItem;
            // Hide.
            if (!tipPresence && itemWas) {
                setTipBy(null);
                if (type === "popup") {
                    // setTipBy(null);
                    setSkipHover();
                    // Let's refocus, if started to close and the focus was inside the popup.
                    refocusToGrid(itemWas.treeNode);
                }
                // // After a tiny timeout.
                // else
                //     comp.setTimer("tip-hover", () => !tipPresence && setTipBy(null), 25);
            }
            // Clear hover start timer.
            else
                comp.clearTimers("tip-hover");
        }
    };
    const getTipSourceElement = (treeNode?: Item["id"]): HTMLElement | null => {
        return !treeNode && !comp.state.tipItem ? null : getRowElement(treeNode ? treeNode : comp.state.tipItem!.treeNode);
    };
    const getRowElement = (treeNode: Item["id"]): HTMLElement | null => {
        return refVirtualList.getComponent()?.getElementAt(allItems.filter(filterer).findIndex(item => item.id === treeNode)) || null;
    };


    // - Wired tree item component - //

    const Wired = MixDOM.wired<{ item: Item; }, CommonProps>(
        // Builder.
        () => {
            return getCommonProps(comp.state.debugSettings, comp.state.debugLive?.iUpdate, comp.state.rowMode);
        },
        // Mixer.
        // null,
        (parentProps, buildProps, _wired) => {
            const item = parentProps.item;
            const collapsable = item.children && item.children[0] !== undefined;
            const selected = comp.state.selected.includes(item.id);
            return {
                ...parentProps,
                ...buildProps,
                collapsed: collapsable ? comp.state.collapsed.includes(item.id) : null,
                selected,
                dimmed: matchedItems ? !matchedItems.includes(item) : !comp.state.ignoreSelection && comp.state.selected[0] !== undefined ? !selected : false,
            };
        },
        // Wired.
        UIAppTreeItem,
        // Name.
        "WiredTreeItem",
    );
    comp.addWired(Wired);

    
    // - Before update - //

    comp.listenTo("beforeUpdate", () => {
        // Pre.
        let mWas = matchedItems;
        // Update.
        allItems = itemsByUpdate(comp.state.host, comp.state.debugLive?.iUpdate || 0);
        matchedItems = getMatchedItems(allItems, !comp.state.ignoreSelection && comp.state.selected[0] !== undefined ? comp.state.selected : null, !comp.state.ignoreFilter ? comp.state.filterSplits : null);
        matchedParentItems = matchedItems && comp.state.showParents ? getMatchedParents(matchedItems) : null;
        matchedChildrenItems = matchedItems && comp.state.showChildren ? getMatchedChildren(allItems, matchedItems) : null;
        // In case changed.
        if (mWas !== matchedItems && shouldSelectWas !== whetherShouldSelect())
            cApi.setInData("settings.shouldSelect", shouldSelectWas = !shouldSelectWas);
    });


    // - Render - //

    return (props, state) => {
        // Render.
        return <div class={classNames("ui-app-host-tree layout-fit-size", props.className)} style={props.style}>
            <div class="flex-row flex-align-items-center layout-fit-size">
                <UIList<DebugTreeItem, CommonProps>
                    items={allItems}
                    Item={Wired}
                    keyProp="id"
                    filter={filterer}
                    rowHeight={rowHeight}
                    refreshId={{}} // TODO: getRefreshId(allItems, matchedItems, matchedParentItems, matchedChildrenItems, state.collapsed, iUpdate, state.selected, state.filterSplits, state.showCollapsed, state.hideUnmatched)}
                    listClassName={props.listClassName}
                    refVirtualList={refVirtualList}
                />
            </div>
            <UIAppShowTip
                item={state.tipItem}
                iUpdate={state.debugLive?.iUpdate}
                onItemLink={onItemLink}
                getSourceElement={getTipSourceElement}
                debugInfo={state.debugSettings}
                reselectRefreshId={state.reselectRefreshId}
                onTipPresence={onTipPresence}
                rowMode={state.rowMode}
            />
        </div>
    };
}
