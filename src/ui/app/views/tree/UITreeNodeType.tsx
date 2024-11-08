
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, MixDOMRenderOutput, ComponentFunc } from "mix-dom";
// Common.
import { DebugTreeItem, wrapTip } from "../../../../common/index";
// App UI common.
import { UIAppButton } from "../../common/index";
// Local.
import { escapeHTML, Prettify } from "./beautifyHelpers";
import { readComponentOneLine } from "./appTipHelpers";


// - Sub component - //

export interface UITreeNodeTypeInfo {
    props: {
        item: DebugTreeItem;
        iUpdate?: number;
        className?: string;
        displayClassName?: string;
        conceptClassName?: string;
        onSelectItem?: (e: MouseEvent | KeyboardEvent) => void;
        onSelectConcept?: (e: MouseEvent | KeyboardEvent) => void;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        onToggleTip?: (e: MouseEvent | KeyboardEvent) => void;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode?: "select" | "select-tip" | "tip";
    };
}
export const UITreeNodeType: ComponentFunc<UITreeNodeTypeInfo> = (_props, comp) => {

    const renderConceptTip = (): MixDOMRenderOutput =>
        wrapTip(<div>Filter by view by treeNode type: <b>{comp.props.item.treeNode.type || "empty"}</b>.<br/> - Click with <b>Ctrl</b>/<b>Alt</b> to only filter this type.</div>);

    let mouseDownInfo: [clientX: number, clientY: number] | null = null;
    const onRowClick = (e: MouseEvent | KeyboardEvent) => {
        // With prevention.
        if (!(e.type === "click" && (mouseDownInfo && ((e as MouseEvent).clientX !== mouseDownInfo[0] || (e as MouseEvent).clientY !== mouseDownInfo[1])))) {
            const rowMode = comp.props.rowMode || "tip";
            if (rowMode === "tip") {
                comp.props.onToggleTip && comp.props.onToggleTip(e);
            }
            else { //if (rowMode === "select" || rowMode === "select-tip") {
                comp.props.onSelectItem && comp.props.onSelectItem(e);
                if (rowMode === "select-tip")
                    comp.props.onTipPresence && comp.props.onTipPresence(comp.props.item.treeNode, "hoverable", false);
            }
        }
        // Flag.
        mouseDownInfo = null;
    };
    const onRowMouseDown = (e: MouseEvent) => {
        mouseDownInfo = [e.clientX, e.clientY];
    };
    const onRowMouseEnter = (e: MouseEvent) => {
        comp.props.rowMode === "select-tip" && comp.props.onTipPresence && comp.props.onTipPresence(comp.props.item.treeNode, "hoverable", true);
    }
    const onRowMouseLeave = (e: MouseEvent) => {
        comp.props.rowMode === "select-tip" && comp.props.onTipPresence && comp.props.onTipPresence(comp.props.item.treeNode, "hoverable", false);
    }

    
    // Renderer. (Could be a spread, but feels better to wrap it here.)
    return (props, state) => {
        const item = props.item;
        const treeNode = item.treeNode;

        let type = treeNode.type;
        let description: MixDOMRenderOutput = null;

        // By type.
        switch(treeNode.type) {
            case "dom":
                description = <Prettify code={escapeHTML(item.description)} className="style-text-ellipsis" />;
                break;
            case "pass":
            case "boundary":
                description = readComponentOneLine(treeNode);
                break;
            case "portal":
                description = <>
                    <span class="style-color-dim">Portal to </span>
                    <Prettify code={escapeHTML(item.description)} className="style-text-ellipsis" />
                </>;
                break;
            case "root":
                description = <>
                    <span class="style-color-dim">Root container </span>
                    <Prettify code={escapeHTML(item.description)} className="style-text-ellipsis" />
                </>;
                break;
            case "host":
                description = <>
                    <span class="style-color-dim">Nested host</span>
                </>;
                break;
            case "":
                description = <>
                    <span class="style-color-dim">Empty</span>
                </>;
                break;
        }

        return <div class={classNames("flex-row flex-align-items-center flex-grow layout-overflow-hidden layout-gap-m layout-fit-height", props.className)}>
            <span
                class={classNames("description layout-fit-height flex-row flex-align-items-center flex-grow layout-overflow-hidden", props.displayClassName)}
                onMouseEnter={onRowMouseEnter}
                onMouseLeave={onRowMouseLeave}
                onMouseDown={onRowMouseDown}
                onClick={onRowClick}
            >
                <div class="layout-gap-m flex-row flex-align-items-baseline flex-grow layout-overflow-hidden">{description}</div>
            </span>
            <UIAppButton look="filled" className={classNames("type style-ui-concept style-fill-app-type-" + type, props.conceptClassName)} onPress={props.onSelectConcept} renderTip={renderConceptTip} >{type || "empty"}</UIAppButton>
        </div>;
    }
}
