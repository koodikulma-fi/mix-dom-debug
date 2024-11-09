
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, MixDOMRenderOutput, ComponentFunc, ComponentRemote, MixDOMTreeNodePass, MixDOMTreeNodeHost } from "mix-dom";
// Common.
import { DebugTreeItem, HostDebugSettings } from "../../../../common/index";
// Local.
import { beautify, escapeHTML, getMiniScrollableProps, getSnippetContainerProps, Prettify, PrettifyDelay } from "./beautifyHelpers";
import { UIAppTipHeading, UIAppTipSection } from "./UIAppTipSection";
import { readComponentOneLine, RenderComponentChildren, RenderComponentPartList, RenderComponentWiredChildren, RenderComponentRemoteChildren, RenderedByComponents, OnItemLink } from "./appTipHelpers";


// - Component - //

export interface UIAppTipDisplayInfo {
    props: {
        item: DebugTreeItem;
        debugInfo?: HostDebugSettings | null;
        iUpdate?: number;
        onItemLink?: OnItemLink;
        reselectRefreshId?: any;
        escToCloseTip?: boolean;
        onHistoryItem?: (item: DebugTreeItem) => void;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        /** In "tip" mode clicking the row toggles the tip. In "select" clicking the row does selection. In "select-tip", clicking does selection, but hovering the row provides tip. */
        rowMode?: "select" | "select-tip" | "tip";
    };
    state: {
        isAlive: boolean;
        history: DebugTreeItem[];
        iHistory: number;
    };
    class: {
        onHistory: (iTo: number) => void;
    };
    timers: "alive";
}
export const UIAppTipDisplay: ComponentFunc<UIAppTipDisplayInfo> = (_props, comp) => {

    comp.state = { history: [comp.props.item], iHistory: 0, isAlive: false };

    // Let's give some time for DOM technical reasons.
    const bringAlive = () => !comp.hasTimer("alive") && comp.setTimer("alive", () => comp.setState({ isAlive: true }), 25);

    // Key down.
    const onKeyDown = (e: KeyboardEvent) => {
        e.key === "Escape" && comp.props.escToCloseTip && comp.props.onItemLink && comp.props.onItemLink(null, "details-break");
    };
    comp.listenTo("didMount", () => { bringAlive(); document.addEventListener("keydown", onKeyDown); });
    comp.listenTo("willUnmount", () => document.removeEventListener("keydown", onKeyDown));

    // Before update.
    comp.listenTo("preUpdate", (prevProps, prevState) => {
        // Item changed (or re-selected) - modify history.
        if (prevProps && (prevProps.item !== comp.props.item || prevProps.reselectRefreshId !== comp.props.reselectRefreshId)) {
            // If already at the item, nothing to do.
            if (comp.props.item === comp.state.history[comp.state.iHistory])
                return;
            // If next item would be the requested one, just travel in history one step. Instead of adding it.
            else if (comp.props.item === comp.state.history[comp.state.iHistory + 1])
                comp.setState({ iHistory: comp.state.iHistory + 1, isAlive: false });
            // Normal case.
            else if (comp.props.item) {
                // Cut and add.
                const history = comp.state.history.slice(0, comp.state.iHistory + 1).concat([comp.props.item]);
                // Navigate to the newly added.
                comp.setState({ history, iHistory: history.length - 1, isAlive: false });
            }
            // Bring alive.
            !comp.state.isAlive && bringAlive();
        }
    });

    comp.onHistory = (iTo: number) => {
        const forwards = iTo > comp.state.iHistory;
        comp.setState({ iHistory: Math.min(Math.max(0, iTo), comp.state.history.length - 1), isAlive: false });
        comp.props.onHistoryItem && comp.props.onHistoryItem(comp.state.history[comp.state.iHistory]);
        bringAlive();
        comp.setTimer(null, () => {
            const historyButtons = [...(comp.queryElement("div.style-ui-panel") as HTMLElement | undefined)?.querySelectorAll("button.history-button:not([disabled])") || []] as HTMLElement[];
            (historyButtons[forwards ? 1 : 0] || historyButtons[0])?.focus();
        }, 5);
    }

    const getHeadingProps = () => {
        return {
            idToScroll: (comp.state.history[comp.state.iHistory]).treeNode,
            onItemLink: comp.props.onItemLink,
            history: comp.state.history,
            iHistory: comp.state.iHistory,
            onHistory: comp.onHistory,
        };
    }

    const sProps = getSnippetContainerProps();
    const onTipEnter = () => comp.props.rowMode === "select-tip" && comp.state.isAlive && comp.props.onTipPresence && comp.props.onTipPresence(comp.state.history[comp.state.iHistory].treeNode, "popup", true);
    const onTipLeave = () => comp.props.rowMode === "select-tip" && comp.state.isAlive && comp.props.onTipPresence && comp.props.onTipPresence(comp.state.history[comp.state.iHistory].treeNode, "popup", false);

    return (props, state) => {
        const item = comp.state.history[comp.state.iHistory];
        const treeNode = item.treeNode;
        let showRenderedBy = true;
        let headingContent: MixDOMRenderOutput = null;
        let preContent: MixDOMRenderOutput = null;
        let postContent: MixDOMRenderOutput = null;
        let domContentStr = MixDOM.readDOMString(treeNode, false, 0, null);
        switch(treeNode.type) {
            case "dom": {
                // Prepare.
                const tag = treeNode.def.tag;
                let tagStr = "";
                // Text node.
                if (!tag) {
                    if (domContentStr)
                        domContentStr = '"' + domContentStr + '"';
                }
                // Normal nodes.
                else
                    tagStr = item.description;
                // Content.
                headingContent = <UIAppTipHeading title={tag ? (treeNode.domNode && treeNode.domNode["ownerSVGElement"] !== undefined ? "SVG" : "HTML") + " element" : "Text node"} extraTitle={<Prettify code={tagStr ? escapeHTML(tagStr) : item.description} className="layout-padding-l layout-inline-block" />} {...getHeadingProps()} />
                break;
            }
            case "boundary": {
                const tag = treeNode.def.tag;
                const component = treeNode.boundary.component;
                const rPasses = component.constructor.MIX_DOM_CLASS === "Remote" ? component.getHost().findTreeNodes(["pass"], 0, false, (tNode => (tNode as MixDOMTreeNodePass).def.getRemote && (tNode as MixDOMTreeNodePass).def.getRemote!() === component)) as MixDOMTreeNodePass[] : null;
                headingContent = <UIAppTipHeading _key="heading" title={tag["MIX_DOM_CLASS"] === "Remote" ? "Remote component" : component.contextAPI ? <>Component <span class="style-text-small">(with ContextAPI)</span></> : "Component"} extraTitle={<b class="style-color-emphasis layout-padding-l-x layout-padding-m-y layout-inline-block">{item.name || "Anonymous"}</b>} {...getHeadingProps()} />;
                preContent = <>
                    <UIAppTipSection _key="code" type="code" title="JS code" useDefaultLimits={false} >
                        <PrettifyDelay origCode={tag.toString()} prePrettifier={beautify} tag="pre" {...getMiniScrollableProps()} />
                    </UIAppTipSection>
                    {component.props && Object.keys(component.props)[0] !== undefined ? <UIAppTipSection _key="props" type="props" title="Props" debugInfo={props.debugInfo} debugTarget={component.props} ><RenderComponentPartList component={component} part="props" /></UIAppTipSection> : null}
                    {component.state && Object.keys(component.state)[0] !== undefined ? <UIAppTipSection _key="state" type="state" title="State" debugInfo={props.debugInfo} debugTarget={component.state} ><RenderComponentPartList component={component} part="state" /></UIAppTipSection> : null}
                    {component.contextAPI && Object.keys(component.contextAPI.getContexts())[0] !== undefined ? <UIAppTipSection _key="contexts" type="contexts" title="Contexts" debugInfo={props.debugInfo} debugTarget={component.contextAPI?.getContexts()} ><RenderComponentPartList component={component} part="contexts" /></UIAppTipSection> : null}
                </>;
                postContent = <>
                    {component.wired && component.wired.size ? <UIAppTipSection _key="wired" type="wired" title="Wired components"><RenderComponentWiredChildren wired={component.wired} onItemLink={props.onItemLink}/></UIAppTipSection> : null}
                    {rPasses && rPasses[0] ? <UIAppTipSection _key="remote" type="remote" title="Remote passes"><RenderComponentRemoteChildren remote={component as ComponentRemote} remotePasses={rPasses} onItemLink={props.onItemLink}/></UIAppTipSection> : null}
                    {treeNode.boundary.innerBoundaries[0] ? <UIAppTipSection _key="children" type="children" title="Inner components"><RenderComponentChildren treeNode={treeNode} onItemLink={props.onItemLink}/></UIAppTipSection> : null}
                </>;
                    // {tag.api && tag.api.constructor.name === "ComponentWiredAPI" && (tag.api as ComponentWiredAPI).components.size ? <UIAppTipSection _key="wired" type="wired" title="Wired components"><RenderComponentWiredSiblings wiredAPI={tag.api} onItemLink={props.onItemLink}/></UIAppTipSection> : null}
                break;
            }
            case "root": {
                showRenderedBy = false;
                headingContent = (
                    <UIAppTipHeading title="Root container" extraTitle={item.description ? <Prettify code={escapeHTML(item.description)} className="layout-padding-l layout-border-box" /> : null} {...getHeadingProps()} >
                        <ul class="style-ui-list">
                            <li>Contains the debugged host.</li>
                        </ul>
                    </UIAppTipHeading>
                );
                break;
            }
            case "host": {
                headingContent = (
                    <UIAppTipHeading title="Nested host" {...getHeadingProps()} >
                        <ul class="style-ui-list">
                            <li>Contains another host instance.</li>
                        </ul>
                    </UIAppTipHeading>
                );
                const host = (treeNode as MixDOMTreeNodeHost).def.host;
                domContentStr = host && host.groundedTree.children[0] ? MixDOM.readDOMString(host.groundedTree.children[0], false, 0, null) : "";
                break;
            }
            case "pass":
                headingContent = (
                    <UIAppTipHeading title={<span class="layout-padding-l-x layout-padding-m-y layout-inline-block">{treeNode.def.getRemote ? "Remote pass" : "Content pass"}</span>} afterTitle={readComponentOneLine(treeNode, null, true)} {...getHeadingProps()} />
                );
                postContent = <>
                    {treeNode.boundary?.innerBoundaries[0] ? <UIAppTipSection _key="children" type="children" title="Inner components"><RenderComponentChildren treeNode={treeNode} onItemLink={props.onItemLink}/></UIAppTipSection> : null}
                </>;
                break;
            case "portal":
                headingContent = (
                    <UIAppTipHeading title="Portal container" afterTitle={<Prettify code={escapeHTML(item.description)} className="layout-padding-l layout-border-box" />} {...getHeadingProps()} />
                );
                break;
            case "":
                headingContent = (
                    <UIAppTipHeading title={<span class="layout-padding-l layout-border-box">Empty</span>} {...getHeadingProps()} >
                        <ul class="style-ui-list">
                            <li>Empty treeNodes should not typically end up in the grounded tree.</li>
                        </ul>
                    </UIAppTipHeading>
                );
                break;
        }
        return <div class={classNames("style-ui-panel flex-col", sProps.className, state.isAlive ? "layout-auto-pointer" : "layout-no-pointer")} style={sProps.style} onMouseEnter={onTipEnter} onMouseLeave={onTipLeave} >
            {headingContent}
            <div class="layout-scrollable style-scrollable flex-col layout-gap-m layout-padding-m">
                {preContent}
                {showRenderedBy ? <RenderedByComponents treeNode={treeNode} iUpdate={props.iUpdate} onItemLink={props.onItemLink} /> : null}
                {postContent}
                {treeNode.type === "root" || !domContentStr ? null :
                    <UIAppTipSection type="renders" title="Renders in DOM" useDefaultLimits={false} >
                        <PrettifyDelay origCode={domContentStr.replace(/\t/g, "    ")} prePrettifier={escapeHTML} tag="pre" {...getMiniScrollableProps()} />
                    </UIAppTipSection>
                }
            </div>
        </div>;
    }
}
