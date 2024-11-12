
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, MixDOMRenderOutput, ComponentFunc } from "mix-dom";
// Common.
import { HostDebugSettings, TipSectionNames } from "../../../../shared";
import { DebugTreeItem, AppContexts, consoleLog } from "../../../../common/index";
// App UI common.
import { UIAppButton, wrapTip } from "../../common/index";
// Local.
import { getMiniScrollableProps } from "./beautifyHelpers";
import { OnItemLink } from "./appTipHelpers";


// - Dev. note - //
//
// - This could be refactored now:
//      * To not use a context on every tip section.
//      * But instead one context connections on the UIAppTipDisplay instead.


// - Helpers - //

// Tips.
export const renderComponentLinkTip = () => wrapTip(<div>Scroll and focus to the target.<br /> - If is matching and item is out of view, also selects it.<br/> - Click with <b>Ctrl</b>/<b>Alt</b> to open details popup instead.<br /> - Click with <b>Shift</b> to log into console instead.</div>);
const renderUIAppTipSectionTip = () => wrapTip(<div>Toggle the section visibility.<br/> - Click with <b>Ctrl</b>/<b>Alt</b> to only show this section or all.</div>);
const renderConsoleTip = () => wrapTip(<div>Click to log in console.</div>);
// Constants.
const allTipSectionNames = ["heading", "code", "props", "state", "contexts", "settings", "rendered-by", "wired", "remote", "children", "renders"] as const;


// - Component - //

export interface UIAppTipSectionInfo {
    props: {
        type: Exclude<TipSectionNames, "heading">;
        title: MixDOMRenderOutput;
        extraTitle?: MixDOMRenderOutput;
        afterTitle?: MixDOMRenderOutput;
        /** If gives extraTitle or afterTitle defaults to true. Otherwise false. */
        useOverflow?: boolean;
        /** If provided with onItemLink, then wraps extraTitle or title as a scroll-to-link. */
        idToScroll?: DebugTreeItem["id"];
        onItemLink?: OnItemLink;
        /** Defaults to true. */
        useDefaultLimits?: boolean;
        /** Used for logging the debugTarget. */
        debugInfo?: HostDebugSettings | null;
        /** Info to log into console. */
        debugTarget?: Record<string, any>;
    };
    state: {
        hiddenSections: TipSectionNames[];
    };
    contexts: AppContexts;
};
export const UIAppTipSection: ComponentFunc<UIAppTipSectionInfo> = (_props, comp, cApi) => {
    // Context to state.
    comp.state = { hiddenSections: [] };
    cApi.listenToData("state.hiddenTipSections", (hiddenSections) => {
        comp.setState({ hiddenSections })
    }, [comp.state.hiddenSections]);
    // Callbacks.
    const onSectionClick = (e: MouseEvent) => {
        // Prepare.
        let hiddenSections = comp.state.hiddenSections.slice();
        const type = comp.props.type;
        // Reset mode.
        if (e.ctrlKey || e.altKey || e.metaKey)
            hiddenSections = hiddenSections.length + 1 !== allTipSectionNames.length || hiddenSections.includes(type) ? allTipSectionNames.filter(t => t !== type) : [];
        // Normal mode.
        else {
            const i = hiddenSections.indexOf(type);
            i !== -1 ? hiddenSections.splice(i, 1) : hiddenSections.push(type);
        }
        // Set.
        cApi.setInData("state.hiddenTipSections", hiddenSections);
    };
    const onPressLink = (e: MouseEvent | KeyboardEvent) => {
        comp.props.onItemLink && comp.props.idToScroll !== undefined && comp.props.onItemLink(comp.props.idToScroll, e.shiftKey ? "log" : e.ctrlKey || e.altKey || e.metaKey ? "details" : "focus");
    };
    const onLog = () => {
        consoleLog(comp.props.debugInfo, "MixDOMDebug: Log info", { ...comp.props.debugTarget });
    }
    // Render.
    return (props, state ) => {
        const isVisible = !state.hiddenSections.includes(props.type);
        const useOverflow = props.useOverflow === undefined ? props.extraTitle !== undefined || props.afterTitle !== undefined : props.useOverflow;
        return (
            <aside>
                <h3 class={classNames("style-ui-heading", props.debugInfo && "flex-row")}>
                    <UIAppButton
                        look="transparent"
                        // size="narrow"
                        className={classNames(useOverflow && "style-text-ellipsis", !isVisible && "style-dimmed")}
                        renderTip={renderUIAppTipSectionTip}
                        onPress={onSectionClick}
                    >
                        <Title title={props.title} extraTitle={props.extraTitle} afterTitle={props.afterTitle} idToScroll={props.idToScroll} onPress={onPressLink} />
                    </UIAppButton>
                    {props.debugInfo ? <span class="flex-grow" /> : null}
                    {props.debugInfo ? <UIAppButton look="transparent" iconName="console" onPress={onLog} renderTip={renderConsoleTip} /> : null}
                </h3>
                {isVisible ? <MixDOM.WithContent><div {...props.useDefaultLimits !== false ? getMiniScrollableProps("style-ui-mini-panel") : { className: "style-ui-mini-panel" }}>{MixDOM.Content}</div></MixDOM.WithContent> : null}
            </aside>
        );
    }
}


// - Component alternative - //

export interface UIAppTipHeadingInfo {
    props: {
        title: MixDOMRenderOutput;
        extraTitle?: MixDOMRenderOutput;
        afterTitle?: MixDOMRenderOutput;
        afterLogTitle?: MixDOMRenderOutput;
        afterLogTarget?: object | null;
        /** If gives extraTitle or afterTitle defaults to true. Otherwise false. */
        useOverflow?: boolean;
        /** If provided with onItemLink, then wraps extraTitle or title as a scroll-to-link. */
        idToScroll?: DebugTreeItem["id"];
        onItemLink?: OnItemLink;
        /** Needed for afterLogTarget. */
        debugInfo?: HostDebugSettings;
        /** Defaults to true. */
        useDefaultLimits?: boolean;
        // History.
        history?: DebugTreeItem[];
        iHistory?: number;
        onHistory?: (iTo: number) => void;
    };
    contexts: AppContexts;
};
export const UIAppTipHeading: ComponentFunc<UIAppTipHeadingInfo> = (_props, comp, cApi) => {
    //  Callbacks.
    const onPressLink = (e: MouseEvent | KeyboardEvent) => {
        comp.props.onItemLink && comp.props.idToScroll !== undefined && comp.props.onItemLink(comp.props.idToScroll, e.shiftKey ? "log" : e.ctrlKey || e.altKey || e.metaKey ? "details" : "focus");
    };
    const onPressTargetLog = (e: MouseEvent | KeyboardEvent) => {
        consoleLog(comp.props.debugInfo, "MixDOMDebug: Log element", comp.props.afterLogTarget);
    };
    const onPressClose = (e: MouseEvent | KeyboardEvent) => {
        comp.props.onItemLink && comp.props.onItemLink(null, "details-break");
    };
    const onHistoryPrev = (e: MouseEvent | KeyboardEvent) => {
        comp.props.onHistory && comp.props.onHistory(comp.props.iHistory ? Math.max(comp.props.iHistory - 1, 0) : 0);
    };
    const onHistoryNext = (e: MouseEvent | KeyboardEvent) => {
        comp.props.onHistory && comp.props.onHistory(comp.props.iHistory != null ? Math.min(comp.props.iHistory + 1, comp.props.history?.length || 0) : 0);
    };
    // Render.
    return (props) => {
        const useOverflow = props.useOverflow === undefined ? props.extraTitle !== undefined || props.afterTitle !== undefined : props.useOverflow;
        return (
            <aside class="layout-gap-m flex-col layout-padding-m-x layout-padding-l-y layout-padding-no-top">
                <h2 class="style-ui-heading flex-row flex-align-items-baseline layout-gap-m">
                    {props.history && props.history[1] ?
                        props.history[2] ? 
                            <>
                                <UIAppButton iconName="back" look="transparent" size="large" className="flex-align-self-center history-button" onPress={onHistoryPrev} disabled={props.iHistory === 0} />
                                <UIAppButton iconName="forwards" look="transparent" size="large" className="flex-align-self-center history-button" onPress={onHistoryNext} disabled={props.iHistory === props.history.length - 1} />
                            </> :
                        <UIAppButton iconName={props.iHistory === 1 ? "back" : "forwards"} look="transparent" size="large" className="flex-align-self-center history-button" onPress={props.iHistory === 1 ? onHistoryPrev : onHistoryNext} /> :
                    null}
                    <span class="flex-grow"/>
                    <span class={classNames("flex-row layout-gap-l", props.extraTitle != null ? "flex-align-items-center" : "flex-align-items-baseline", useOverflow && "style-text-ellipsis")}>
                        <Title title={props.title} extraTitle={props.extraTitle} afterTitle={props.afterTitle} afterLogTitle={props.afterLogTitle} idToScroll={props.idToScroll} onPress={onPressLink} onPressAfterLog={onPressTargetLog} />
                    </span>
                    <span class="flex-grow"/>
                    <UIAppButton iconName="close" look="transparent" size="large" className="flex-align-self-center" onPress={onPressClose} />
                </h2>
                <MixDOM.WithContent><div {...props.useDefaultLimits !== false ? getMiniScrollableProps("style-ui-mini-panel layout-margin-no-bottom") : { className: "style-ui-mini-panel layout-margin-no-bottom" }}>{MixDOM.Content}</div></MixDOM.WithContent>
            </aside>
        );
    }
}


// - Local helper spread - //

function Title(props: { 
    title: MixDOMRenderOutput;
    extraTitle?: MixDOMRenderOutput;
    afterTitle?: MixDOMRenderOutput;
    afterLogTitle?: MixDOMRenderOutput;
    /** If provided with onItemLink, then wraps extraTitle or title as a scroll-to-link. */
    idToScroll?: DebugTreeItem["id"];
    onPress?: (e: MouseEvent | KeyboardEvent) => void;
    onPressAfterLog?: (e: MouseEvent | KeyboardEvent) => void;
}) {
    const afterLogContent = props.afterLogTitle == null ? null : <UIAppButton look="edge" size="no" className="style-text-ellipsis" onPress={props.onPressAfterLog} renderTip={renderConsoleTip}>{props.afterLogTitle}</UIAppButton>;
    return props.idToScroll ?
        <>
            {props.extraTitle !== undefined ? <span>{props.title}{": "}</span> : null}
            <UIAppButton look="edge" size="no" className="style-text-ellipsis" onPress={props.onPress} renderTip={renderComponentLinkTip}>{props.extraTitle !== undefined ? props.extraTitle : props.title}</UIAppButton>
            {props.afterTitle}
            {afterLogContent}
        </> :
        <>
            {props.title}
            {props.extraTitle}
            {props.afterTitle}
            {afterLogContent}
        </>;
}
