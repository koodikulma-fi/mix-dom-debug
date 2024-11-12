
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, Component, ComponentProps, ComponentFuncReturn } from "mix-dom";
// Common.
import { HostDebugSettings } from "../../../../shared";
import { DebugTreeItem, consoleLog, DebugTreeItemType, getItemTypeFrom } from "../../../../common/index";
// App UI common.
import { UIAppButton, wrapTip } from "../../common/index";
// Local.
import { UITreeNodeType } from "./UITreeNodeType";


// - Component - //

export interface UIAppTreeItemInfo {
    props: {
        item: DebugTreeItem;
        iUpdate?: number;
        animate?: boolean;
        debugInfo?: HostDebugSettings | null;
        /** Use this to set the collapsed state (for the collapse button), if null, then cannot collapse. */
        collapsed?: boolean | null;
        selected?: boolean | null;
        dimmed?: boolean;
        toggleCollapsed?: (item: DebugTreeItem, mode?: "level" | "siblings" | "parents" | "chain" | "reset" | "self") => void;
        toggleSelected?: (item: DebugTreeItem, mode?: "level" | "siblings" | "parents" | "chain" | "reset" | "self") => void;
        toggleConcept?: (concept: DebugTreeItemType, reset?: boolean) => void;
        onToggleTip?: (id: DebugTreeItem["id"]) => void;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode?: "select" | "select-tip" | "tip";
    };
    state: {
        animFinished?: true;
    };
}
export function UIAppTreeItem(_initProps: ComponentProps<UIAppTreeItemInfo>, comp: Component<UIAppTreeItemInfo>): ComponentFuncReturn<UIAppTreeItemInfo> {

    comp.state = {};
    const onToggle = (e: MouseEvent | KeyboardEvent) => {
        comp.props.toggleCollapsed && comp.props.toggleCollapsed(comp.props.item, e.shiftKey ? "level" : e.ctrlKey || e.metaKey ? "siblings" : e.altKey ? "chain" : "self");
    };
    const onSelect = (e: MouseEvent | KeyboardEvent) => {
        comp.props.toggleSelected && comp.props.toggleSelected(comp.props.item, e.shiftKey ? "level" : e.ctrlKey || e.metaKey ? "siblings" : e.altKey ? "reset" : "self");
    };
    const onSelectConcept = (e: MouseEvent | KeyboardEvent) => {
        comp.props.toggleConcept && comp.props.toggleConcept(getItemTypeFrom(comp.props.item.treeNode), e.ctrlKey || e.altKey || e.metaKey);
    };
    const onToggleTip = (e: MouseEvent | KeyboardEvent) => {
        comp.props.onToggleTip && comp.props.onToggleTip(comp.props.item.treeNode);
    };
    const onViewInConsole = (e: MouseEvent) => {
        const item = comp.props.item;
        switch(item.treeNode.type) {
            case "boundary":
                consoleLog(comp.props.debugInfo, "MixDOMDebug: Log component", item.treeNode.boundary.component);
                break;
            case "root":
            case "dom":
            case "portal":
                consoleLog(comp.props.debugInfo, "MixDOMDebug: Log DOM element", item.treeNode.domNode);
                break;
            case "host":
                consoleLog(comp.props.debugInfo, "MixDOMDebug: Log nested host", item.treeNode.def.host);
                break;
            default:
                consoleLog(comp.props.debugInfo, "MixDOMDebug: Log treeNode", item.treeNode);
                break;
        }
    };
    comp.listenTo("didMount", () => {
        // Use 25ms timeout before revealing. It seems browsers want approximately that much (at least 20ms) - after spawning the element, before can animate.
        comp.props.animate && comp.setTimer(null, () => comp.setState({ animFinished: true }), 25);
    });

    // Tips.
    // const renderToggleTip = () => wrapTip(<div>Click to collapse/uncollapse the item.<br/> - Click with <b>Shift</b> to toggle all items in the same level.<br/> - Click with <b>Ctrl</b> to toggle all siblings.<br/> - Click with <b>Alt</b> to toggle between expanding all or only this item and its parent chain.</div>);
    const renderToggleTip = () => wrapTip(<div>Click to collapse/uncollapse the item.<br/> - Click with <b>Shift</b> to toggle all items in the same level.<br/> - Click with <b>Ctrl</b> to toggle all siblings.<br/> - Click with <b>Alt</b> to toggle between expanding all or only this item and its parents and children.</div>);
    const renderSelectTip = () => wrapTip(<div>Click to select/deselect this item.<br/> - Click with <b>Shift</b> to toggle all items in the same level.<br/> - Click with <b>Ctrl</b> to toggle all siblings.<br/> - Click with <b>Alt</b> to reset selection to this item.</div>);
    const renderConsoleTip = () => wrapTip(<div>Click to log the item in console.</div>);
    const renderTipTip = () => wrapTip(<div>Click to open the details popup.</div>);

    // 
    return (props, state) => {
        const leftOffset = props.item.level * 6;
        const colorClass = `style-stroke-app-type-${getItemTypeFrom(props.item.treeNode)}`;
        return <div
            role="treeitem"
            class={classNames("ui-app-tree-item layout-fit-height layout-margin-m-x flex-row flex-align-items-center layout-gap-m style-hoverable", props.dimmed && "style-disabled", props.animate && (!state.animFinished ? "style-opacity-0" : "style-opacity-1"))}
            style={{ marginLeft: leftOffset + "px" }}
        >
            <div class={classNames("level-indicator", props.selected ? "style-dimmed" : "style-disabled", props.selected && colorClass)} style={`position: absolute; left: 0; height: 100%; width: ${leftOffset}px; background: linear-gradient(-160deg, currentColor, ${props.selected ? "35%" : "15%"}, transparent, 100%, transparent);`} />
            <UIAppButton onPress={onSelect} iconName={props.selected ? "item-selected" : "item-deselected"} className={"flex-align-self-center"} iconClassName={classNames(!props.selected && "style-dimmed", colorClass)} look="transparent" renderTip={renderSelectTip} />
            <UIAppButton onPress={onToggle} invisible={props.collapsed === null} disabled={props.collapsed === null || undefined} iconName={props.collapsed === null ? "" : props.collapsed ? "collapsed" : "expanded"} look="transparent" renderTip={renderToggleTip} />
            <UITreeNodeType item={props.item} iUpdate={props.iUpdate} displayClassName={props.dimmed ? "style-greyed" : undefined} conceptClassName={props.dimmed ? "style-greyed" : undefined} rowMode={props.rowMode} onSelectItem={onSelect} onSelectConcept={onSelectConcept} onTipPresence={props.onTipPresence} onToggleTip={onToggleTip} />
            <UIAppButton onPress={onToggleTip} iconName="info" look="transparent" renderTip={renderTipTip} />
            <UIAppButton onPress={onViewInConsole} iconName="console" look="transparent" renderTip={renderConsoleTip} />
        </div>;
    };
};
