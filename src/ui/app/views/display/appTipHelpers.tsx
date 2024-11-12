
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { createTrigger } from "data-memo";
import { MixDOM, Component, MixDOMRenderOutput, ComponentFunc, MixDOMTreeNodeBoundary, MixDOMTreeNode, MixDOMTreeNodePass, ComponentWiredFunc, ComponentWiredType, ComponentRemote, SourceBoundary } from "mix-dom";
// Common.
import { DebugTreeItem, getPassPhraseAndSource } from "../../../../common/index";
// App UI common.
import { UIAppButton } from "../../common/UIAppButton";
// Local.
import { UIAppTipSection, renderComponentLinkTip } from "./UIAppTipSection";
import { beautify, stringifyObject, Prettify } from "./beautifyHelpers";


// - Typing - //

export type OnItemLink = (id: DebugTreeItem["id"] | null, mode?: "focus" | "details" | "details-only" | "details-break" | "log") => void;


// - Structure helpers - //

export function getGroundingTreeNode(treeNode: MixDOMTreeNode): MixDOMTreeNodeBoundary | MixDOMTreeNodePass | null {
    // Loop up.
    let tNode: MixDOMTreeNode | null = treeNode;
    while (tNode = tNode.parent) {
        switch(tNode.type) {
            // Don't go pass a root container.
            case "root":
                break;
            // Found.
            case "pass":
            case "boundary":
                return tNode;
        }
    }
    // Not found.
    return null;
}


// - Render helpers - //

export function readComponentOneLine(treeNode: MixDOMTreeNodeBoundary | MixDOMTreeNodePass, onPress?: ((e: MouseEvent | KeyboardEvent) => void) | null, skipContentStartStr?: boolean): MixDOMRenderOutput {
    // Boundary.
    if (treeNode.type === "boundary")
        return <>
            <ComponentLink name={treeNode.def.tag.name || "Anonymous"} onPress={onPress || undefined} />
            <Prettify code={treeNode.def.tag.toString()} className="style-text-ellipsis" />
        </>;
    // Remote content pass.
    const [phrase, sBoundary] = getPassPhraseAndSource(treeNode);
    // Content pass.
    const name = sBoundary && sBoundary._outerDef.tag.name || "Anonymous";
    return <>
        {skipContentStartStr ? null : <span _key="pass" class="style-color-dim">{onPress ? <ComponentLink name={phrase} onPress={onPress} /> : phrase}</span>}
        <span _key="from" class="style-color-dim">{" from "}</span>
        <b>{name}</b>
    </>;
}


// - Tiny spreads - //

export function ComponentLink(props: { name: string; onPress?: (e: MouseEvent | KeyboardEvent) => void; className?: string; }) {
    return props.onPress ? 
        <UIAppButton look="edge" size="narrow" className={props.className} onPress={props.onPress} renderTip={renderComponentLinkTip}><b>{props.name}</b></UIAppButton> :
        <b>{props.name}</b>;
}

export function RenderComponentPartList(props: { component: Component; part: "props" | "state" | "contexts"; }) {
    const isCtx = props.part === "contexts";
    const portion = isCtx ? props.component.contextAPI?.getContexts() || {} : props.component[props.part] || {};
    return <RenderPartList portion={portion} overrideText={isCtx ? "Context" : undefined} />;
}
export function RenderPartList<Key extends string = string>(props: { portion: Partial<Record<Key, any>>; keys?: Key[]; overrideText?: string; }) {
    const keys = props.keys || Object.keys(props.portion);
    return keys[0] === undefined ? null : (
        <ul class="style-ui-list">{keys.map(prop =>
            <li _key={prop} class="flex-row flex-align-items-baseline layout-gap-l" >
                <RenderPropertyName bold={true}>{prop}: </RenderPropertyName><Prettify code={props.overrideText || beautify(stringifyObject(props.portion[prop], false, 2))} tag="pre" className="style-text-ellipsis" />
            </li>)}
        </ul>
    );
}

export function RenderPropertyName(props: { italic?: boolean; bold?: boolean; }) {
    return <span class={classNames("style-color-dim layout-inline-block flex-no-shrink", props.italic && "style-text-italic", props.bold && "style-text-bold")} style="min-width: 100px;">{MixDOM.Content}</span>
}

// function RenderComponentWiredSiblings(props: { wiredAPI: ComponentWiredAPI; onItemLink?: OnItemLink; } ) {
//     if (!props.wiredAPI.components.size)
//         return null;
//     return <ul class="style-ui-list">
//         {[...props.wiredAPI.components].map((c, i) => 
//             <li _key={i} class="flex-row flex-align-items-baseline layout-gap-l" >
//                 <RenderComponentChild treeNode={c.boundary.treeNode as MixDOMTreeNodeBoundary} onItemLink={props.onItemLink} index={i} childText="Wired" />
//             </li>
//         )}
//     </ul>;
// }

export function RenderComponentWiredChildren(props: { wired: Set<ComponentWiredType | ComponentWiredFunc>; onItemLink?: OnItemLink; } ) {
    if (!props.wired.size)
        return null;
    let iTotal = -1;
    return <ul class="style-ui-list">
        {[...props.wired].map(c => 
            c.api && c.api.components.size ? [...c.api.components].map(w => 
                <li _key={++iTotal} class="flex-row flex-align-items-baseline layout-gap-l" >
                    <RenderComponentChild treeNode={w.boundary.treeNode as MixDOMTreeNodeBoundary} onItemLink={props.onItemLink} index={iTotal} childText="Wired" />
                </li>
            ) : null
        )}
    </ul>;
}

export function RenderComponentRemoteChildren(props: { remote: ComponentRemote; remotePasses?: MixDOMTreeNodePass[]; onItemLink?: OnItemLink; }) {
    const remote = props.remote;
    const links = props.remotePasses || remote.getHost().findTreeNodes(["pass"], 0, true, (tNode => (tNode as MixDOMTreeNodePass).def.getRemote && (tNode as MixDOMTreeNodePass).def.getRemote!() === remote)) as MixDOMTreeNodePass[];
    return !links[0] ? null : <ul class="style-ui-list">
        {[...links].map((tNode, i) => 
            <li _key={tNode} class="flex-row flex-align-items-baseline layout-gap-l" >
                <RenderComponentChild treeNode={tNode} onItemLink={props.onItemLink} index={i} childText="Pass" />
            </li>
        )}
    </ul>;
}

export function RenderComponentChildren(props: { treeNode: MixDOMTreeNodeBoundary | MixDOMTreeNodePass; onItemLink?: OnItemLink; } ) {
    const boundary = props.treeNode.boundary;
    return !boundary || !boundary.innerBoundaries[0] ? null : <ul class="style-ui-list">
        {boundary.innerBoundaries.map((b, i) => 
            <li _key={i} class="flex-row flex-align-items-baseline layout-gap-l" >
                <RenderComponentChild treeNode={b.treeNode as MixDOMTreeNodeBoundary} onItemLink={props.onItemLink} index={i} />
            </li>
        )}
    </ul>;
}


// - Full components - //

const RenderComponentChild: ComponentFunc<{ props: { treeNode: MixDOMTreeNodeBoundary | MixDOMTreeNodePass; childText?: string; onItemLink?: OnItemLink; index?: number; }; }> = (_props, comp) => {
    const onPress = (e: MouseEvent | KeyboardEvent) => comp.props.onItemLink && comp.props.onItemLink(comp.props.treeNode, e.shiftKey ? "log" : e.ctrlKey || e.altKey || e.metaKey ? "details" : "focus");
    return (props) =>
        <>
            <RenderPropertyName italic={true}>{props.childText || "Child"} {props.index === undefined ? "" : "#" + (props.index + 1)}: </RenderPropertyName>
            {readComponentOneLine(props.treeNode, onPress)}
        </>;
}

export const RenderedByComponents: ComponentFunc<{ props: { treeNode: MixDOMTreeNode; iUpdate?: number; onItemLink?: OnItemLink; }; }> = (_props, comp) => {

    // For simplicity.
    comp.setConstantProps({ treeNode: true });
    const treeNode = comp.props.treeNode;

    // Get.
    const sComponentNode = treeNode.sourceBoundary?.treeNode as MixDOMTreeNodeBoundary | undefined | null || null;
    const sPassNode: MixDOMTreeNodePass | null = treeNode.type === "pass" ? treeNode : null;
    const sRealSourceNode = sPassNode ? sPassNode.def.getRemote ? sPassNode.def.getRemote().boundary.treeNode as MixDOMTreeNodeBoundary : sPassNode.def.contentPass?.sourceBoundary?.treeNode as MixDOMTreeNodeBoundary | undefined | null || null : null;

    // Get thru boundaries.
    let throughNodes: Array<MixDOMTreeNodeBoundary | MixDOMTreeNodePass> = [];

    // Callbacks.
    const callbacks: Map<MixDOMTreeNodeBoundary | MixDOMTreeNodePass, (e: MouseEvent | KeyboardEvent) => void> = new Map();
    const beforeRender = createTrigger<number | undefined>(() => {
        // Through nodes.
        // .. Note that if has no source boundary, it must be the host's root source boundary. In that case, don't collect through nodes.
        throughNodes = [];
        if (sComponentNode) {
            let thru = getGroundingTreeNode(treeNode);
            while (thru && thru !== sComponentNode) {
                throughNodes.push(thru);
                // if (thru.type === "pass" && sRealSourceNode && thru.def.contentPass?.sourceBoundary?.treeNode === sRealSourceNode)
                if (thru.def.getRemote && thru.def.getRemote().boundary.treeNode === sComponentNode)
                    break;
                thru = getGroundingTreeNode(thru);
            }
            throughNodes.reverse();
        }
        // Callbacks.
        const unusedKeys = new Set(callbacks.keys());
        for (const tNode of [...[sComponentNode, sRealSourceNode].filter(t => t), ...throughNodes]) {
            if (!tNode)
                continue;
            callbacks.set(tNode, callbacks.get(tNode) || ((e: MouseEvent | KeyboardEvent) => {
                comp.props.onItemLink && comp.props.onItemLink(tNode, e.shiftKey ? "log" : e.ctrlKey || e.altKey || e.metaKey ? "details" : "focus");
            }));
            unusedKeys.delete(tNode);
        }
        for (const key of unusedKeys)
            callbacks.delete(key);
    });

    // Render.
    const liProps = { class: "flex-row flex-align-items-baseline layout-gap-l" };
    return (props) => {
        // Refresh.
        beforeRender(props.iUpdate);
        // Render.
        return !sComponentNode && !throughNodes[0] ? null : (
            <UIAppTipSection type="rendered-by" title="Rendered by component">
                <ul class="style-ui-list">
                    {sRealSourceNode ? <li {...liProps} _key="pass" ><RenderPropertyName italic={true}>Pass from: </RenderPropertyName>{readComponentOneLine(sRealSourceNode, callbacks.get(sRealSourceNode))}</li> : null}
                    {sComponentNode ? <li {...liProps} _key="source" ><RenderPropertyName italic={true}>Source: </RenderPropertyName>{readComponentOneLine(sComponentNode, callbacks.get(sComponentNode))}</li> : null}
                    {throughNodes.map(thru => <li {...liProps} _key={thru.boundary!.bId}><RenderPropertyName italic={true}>Through: </RenderPropertyName>{readComponentOneLine(thru, callbacks.get(thru))}</li>)}
                </ul>
            </UIAppTipSection>
        );
    }
}
