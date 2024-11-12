
// - Imports - //

// Libraries.
import { MixDOMTreeNode, MixDOMTreeNodePass, SourceBoundary } from "mix-dom";
// Common.
import type { HostDebugSettings } from "../shared";
import type { DebugTreeItem, DebugTreeItemType } from "./typing";


// - App specific helpers - //

export function getItemTypeFrom(treeNode: MixDOMTreeNode): DebugTreeItemType {
    switch(treeNode.type) {
        case "":
            return "empty";
        case "dom":
            return treeNode.def.domContent && (treeNode.def.domContent as Node).nodeType ? "dom-external" : 
                treeNode.def.domElement !== undefined ? "dom-pseudo" :
                !treeNode.def.tag ? "dom-text" :
                "dom-element";
        case "boundary":
            return "component";
        default:
            return treeNode.type;
    }
}

export function getPassPhraseAndSource(treeNode: MixDOMTreeNodePass): [phrase: string, sBoundary: SourceBoundary | null] {
    return treeNode.def.getRemote ?
        ["Remote pass", treeNode.def.getRemote().boundary] : 
        ["Content pass", treeNode.boundary && treeNode.boundary.sourceBoundary];
}


// - Console log - //

export function consoleLog(debugInfo: HostDebugSettings | null | undefined, ...args: any[]): void {
    console.log(...args);
    debugInfo && debugInfo.console && debugInfo.console !== console && debugInfo.console.log(...args);
}
export function consoleWarn(debugInfo: HostDebugSettings | null | undefined, ...args: any[]): void {
    console.warn(...args);
    debugInfo && debugInfo.console && debugInfo.console !== console && debugInfo.console.warn(...args);
}

export const consoleLogItem = (debugInfo: HostDebugSettings | null | undefined, item: DebugTreeItem): void => {
    switch(item.treeNode.type) {
        case "boundary":
            consoleLog(debugInfo, "MixDOMDebug: Log component", item.treeNode.boundary.component);
            break;
        case "root":
        case "dom":
        case "portal":
            consoleLog(debugInfo, "MixDOMDebug: Log DOM element", item.treeNode.domNode);
            break;
        case "host":
            consoleLog(debugInfo, "MixDOMDebug: Log nested host", item.treeNode.def.host);
            break;
        default:
            consoleLog(debugInfo, "MixDOMDebug: Log treeNode", item.treeNode);
            break;
    }
};


// - Tree helpers - //

/** Helper to read array like properties from an object, optionally only certain kind of arrays. */
export type ArrLikePropsOf<T extends Record<string, any>, Arr extends any[] = any[]> = { [Key in string & keyof T]: T[Key] extends Arr ? Key : never; }[string & keyof T];
/** Helper to flatten a tree. */
export function flattenTree<Item extends Partial<Record<ChildProp, Item[]>>, ChildProp extends string & ArrLikePropsOf<Item, Item[]>>(rootItems: Item[], childProp: ChildProp): Item[];
export function flattenTree<Item extends Partial<Record<"children", Item[]>>>(rootItems: Item[], childProp?: "children"): Item[];
export function flattenTree<Item extends Partial<Record<string, Item[]>>>(rootItems: Item[], childProp?: string): Item[] {
    // Clean params.
    if (!childProp)
        childProp = "children";
    // Prepare.
    const items: Item[] = [];
    let loopItems: Item[] = rootItems;
    let item: Item | undefined;
    let i = 0;
    // Loop all in tree order.
    while (item = loopItems[i++]) {
        items.push(item);
        if (item[childProp]) {
            loopItems = item[childProp]!.concat(loopItems.slice(i));
            i = 0;
        }
    }
    // Return flattened items.
    return items;
}

/** Helper to flatten a tree. */
export function flattenTreeWith<Item extends Partial<Record<ChildProp, Item[]>>, FinalItem, ChildProp extends string & ArrLikePropsOf<Item, Item[]>, PItem extends FinalItem = FinalItem>(rootItems: Item[], itemHandler: (origItem: Item, parent: PItem | null, level: number, ignoreKids: () => void) => FinalItem | null, childProp: ChildProp): PItem[];
export function flattenTreeWith<Item extends Partial<Record<"children", Item[]>>, FinalItem, PItem extends FinalItem = FinalItem>(rootItems: Item[], itemHandler: (origItem: Item, parent: PItem | null, level: number, ignoreKids: () => void) => FinalItem | null, childProp?: "children"): PItem[];
export function flattenTreeWith<Item extends Partial<Record<string, Item[]>>, FinalItem, PItem extends FinalItem = FinalItem>(rootItems: Item[], itemHandler: (origItem: Item, parent: PItem | null, level: number, ignoreKids: () => void) => FinalItem | null, childProp?: string, ): PItem[] {
    // Clean params.
    if (!childProp)
        childProp = "children";
    // Prepare.
    const items: PItem[] = [];
    type ItemPair = [child: Item, parent: PItem | null, level: number];
    let loopPairs: ItemPair[] = rootItems.map(item => [item, null, 0]);
    let pair: ItemPair | undefined;
    let i = 0;
    // Loop all in tree order.
    let skipKids = false;
    const ignoreKids = () => skipKids = true;
    while (pair = loopPairs[i++]) {
        // Get.
        const [origItem, parent, level] = pair;
        const item = itemHandler(origItem, parent, level, ignoreKids) as PItem | null;
        // Skip.
        if (!item)
            continue;
        // Add.
        items.push(item);
        // Add kids.
        if (skipKids)
            skipKids = false;
        else if (origItem[childProp]) {
            const nextLevel = level + 1;
            loopPairs = origItem[childProp]!.map((kid: Item): ItemPair => [kid, item, nextLevel]).concat(loopPairs.slice(i));
            i = 0;
        }
    }
    // Return flattened items.
    return items;
}
