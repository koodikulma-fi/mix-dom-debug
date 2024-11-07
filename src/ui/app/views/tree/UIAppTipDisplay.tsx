
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, MixDOMRenderOutput, ComponentFunc, ComponentWith, ComponentRemoteType, ComponentRemote, MixDOMTreeNodePass } from "mix-dom";
// Common.
import { DebugTreeItem, HostDebugSettings } from "../../../../common/index";
// App UI common.
import { UIAppTipInfo } from "../../common/index";
// Local.
import { beautify, escapeHTML, getMiniScrollableProps, getSnippetContainerProps, Prettify, PrettifyDelay } from "./beautifyHelpers";
import { UIAppTipHeading, UIAppTipSection } from "./UIAppTipSection";
import { readComponentOneLine, RenderComponentChildren, RenderComponentPartList, RenderComponentWiredChildren, RenderComponentRemoteChildren, RenderedByComponents, OnItemLink } from "./appTipHelpers";


// - Component - //

export interface UIAppTipDisplayInfo {
    props: {
        item: DebugTreeItem;
        tipComponent?: ComponentWith<UIAppTipInfo>;
        debugInfo?: HostDebugSettings | null;
        iUpdate?: number;
        onItemLink?: OnItemLink;
        reselectRefreshId?: any;
        escToCloseTip?: boolean;
        onHistoryItem?: (item: DebugTreeItem) => void;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
    };
    state: {
        isAlive?: boolean;
        history: DebugTreeItem[];
        iHistory: number;
    };
    class: {
        onHistory: (iTo: number) => void;
    }
}
export const UIAppTipDisplay: ComponentFunc<UIAppTipDisplayInfo> = (_props, comp) => {

    comp.state = { history: [comp.props.item], iHistory: 0 };

    // Key down.
    const onKeyDown = (e: KeyboardEvent) => {
        e.key === "Escape" && comp.props.escToCloseTip && comp.props.onItemLink && comp.props.onItemLink(null, "details-break");
    };
    comp.listenTo("didMount", () => document.addEventListener("keydown", onKeyDown));
    comp.listenTo("willUnmount", () => document.removeEventListener("keydown", onKeyDown));

    // Before update.
    comp.listenTo("preUpdate", (prevProps, prevState) => {
        // Item changed (or re-selected) - modify history.
        if (prevProps && (prevProps.item !== comp.props.item || prevProps.reselectRefreshId !== comp.props.reselectRefreshId)) {
            // If already at the item, nothing to do.
            if (comp.props.item === comp.state.history[comp.state.iHistory]) { }
            // If next item would be the one, just travel in history one step.
            else if (comp.props.item === comp.state.history[comp.state.iHistory + 1])
                comp.setInState("iHistory", comp.state.iHistory + 1);
            // Normal case.
            else {
                // Cut and add.
                const history = comp.state.history.slice(0, comp.state.iHistory + 1).concat([comp.props.item]);
                // Navigate to the newly added.
                comp.setState({ history, iHistory: history.length - 1 });
            }
        }
    });

    comp.onHistory = (iTo: number) => {
        comp.setInState("iHistory", Math.min(Math.max(0, iTo), comp.state.history.length - 1));
        comp.props.onHistoryItem && comp.props.onHistoryItem(comp.state.history[comp.state.iHistory]);
    }

    const getHeadingProps = () => {
        return {
            idToScroll: (comp.state.history[comp.state.iHistory] || comp.props.item).treeNode,
            onItemLink: comp.props.onItemLink,
            history: comp.state.history,
            iHistory: comp.state.iHistory,
            onHistory: comp.onHistory,
        };
    }

    const domDidMount = (domNode: Node) => {
        domNode.addEventListener("mouseenter", () => comp.props.tipComponent?.setHovered(true));
        domNode.addEventListener("mouseleave", () => comp.props.tipComponent?.setHovered(false));
        comp.setTimer(null, () => comp.setState({ isAlive: true }), 1);
    };

    const sProps = getSnippetContainerProps();
    const onTipEnter = () => comp.props.onTipPresence && comp.props.onTipPresence(comp.props.item.treeNode, "popup", true);
    const onTipLeave = () => comp.props.onTipPresence && comp.props.onTipPresence(comp.props.item.treeNode, "popup", false);


    return (props, state) => {
        const item = comp.state.history[comp.state.iHistory] || comp.props.item;
        const treeNode = item.treeNode;
        let showRenderedBy = true;
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
                else {
                    // const hasKids = !!(tag && treeNode.children[0] && hasContentInDefs(treeNode.def.childDefs)); // <-- Check more deeply. To skip empty passes.
                    // tagStr = tag ? "<" + tag + (hasKids ? ">" : "/>") : "";
                    tagStr = item.description;
                }
                // Content.
                preContent = <UIAppTipHeading title={tag ? (treeNode.domNode && treeNode.domNode["ownerSVGElement"] !== undefined ? "SVG" : "HTML") + " element" : "Text node"} extraTitle={<Prettify code={tagStr ? escapeHTML(tagStr) : item.description} />} {...getHeadingProps()} />
                break;
            }
            case "boundary": {
                const tag = treeNode.def.tag;
                const component = treeNode.boundary.component;
                const rPasses = component.constructor.MIX_DOM_CLASS === "Remote" ? component.getHost().findTreeNodes(["pass"], 0, false, (tNode => (tNode as MixDOMTreeNodePass).def.getRemote && (tNode as MixDOMTreeNodePass).def.getRemote!() === component)) as MixDOMTreeNodePass[] : null;
                // if (!domContentStr)
                //     domContentStr = "\n";
                preContent = <>
                    <UIAppTipHeading _key="heading" title={tag["MIX_DOM_CLASS"] === "Remote" ? "Remote component" : component.contextAPI ? <>Component <span class="style-text-small">(with ContextAPI)</span></> : "Component"} extraTitle={<b class="style-color-emphasis">{item.name || "Anonymous"}</b>} {...getHeadingProps()} />
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
                preContent = (
                    <UIAppTipHeading title="Root container" extraTitle={item.description ? <Prettify code={escapeHTML(item.description)} /> : null} {...getHeadingProps()} >
                        <ul class="style-ui-list">
                            <li>Contains the debugged host.</li>
                        </ul>
                    </UIAppTipHeading>
                );
                break;
            }
            case "host":
                preContent = (
                    <UIAppTipHeading title="Nested host" {...getHeadingProps()} >
                        <ul class="style-ui-list">
                            <li>Contains another host instance.</li>
                        </ul>
                    </UIAppTipHeading>
                );
                break;
            case "pass":
                preContent = (
                    <UIAppTipHeading title={treeNode.def.getRemote ? "Remote pass" : "Content pass"} afterTitle={readComponentOneLine(treeNode, null, true)} {...getHeadingProps()} />
                );
                postContent = <>
                    {treeNode.boundary?.innerBoundaries[0] ? <UIAppTipSection _key="children" type="children" title="Inner components"><RenderComponentChildren treeNode={treeNode} onItemLink={props.onItemLink}/></UIAppTipSection> : null}
                </>;
                break;
            case "portal":
                // if (!domContentStr)
                //     domContentStr = "\n";
                preContent = (
                    <UIAppTipHeading title="Portal container" afterTitle={<Prettify code={escapeHTML(item.description)} />} {...getHeadingProps()} />
                );
                break;
            case "":
                preContent = (
                    <UIAppTipHeading title="Empty" {...getHeadingProps()} >
                        <ul class="style-ui-list">
                            <li>Empty treeNodes should not typically end up in the grounded tree.</li>
                        </ul>
                    </UIAppTipHeading>
                );
                break;
        }
        return <div class={classNames("style-ui-panel layout-scrollable style-scrollable flex-col layout-gap-m", sProps.className, state.isAlive && "layout-auto-pointer")} style={sProps.style} _signals={{domDidMount}} onMouseEnter={onTipEnter} onMouseLeave={onTipLeave} >
            {preContent}
            {showRenderedBy ? <RenderedByComponents treeNode={treeNode} iUpdate={props.iUpdate} onItemLink={props.onItemLink} /> : null}
            {postContent}
            {treeNode.type === "root" || !domContentStr ? null :
                <UIAppTipSection type="renders" title="Renders in DOM" useDefaultLimits={false} >
                    <PrettifyDelay origCode={domContentStr.replace(/\t/g, "    ")} prePrettifier={escapeHTML} tag="pre" {...getMiniScrollableProps()} />
                </UIAppTipSection>
            }
        </div>;
    }
}
