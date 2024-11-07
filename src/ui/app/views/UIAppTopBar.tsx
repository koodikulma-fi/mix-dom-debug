
// - Imports - //

// Libraries.
import { MixDOM, ComponentCtxFunc } from "mix-dom";
import { classNames } from "dom-types";
// Common.
import { AppContexts, SettingsContextData, consoleLog, wrapTip, appVersion } from "../../../common/index";
// Components.
import { UIAppButton } from "../common/UIAppButton";
import { UIAppInput } from "../common/UIAppInput";


// - Component - //

export interface UIAppTopBarInfo {
    props: { refreshId?: any; };
    state: Omit<SettingsContextData, "hiddenTipSections">;
    contexts: AppContexts;
}

export const UIAppTopBar: ComponentCtxFunc<UIAppTopBarInfo> = function DebugHost(_initProps, comp, cApi) {

    // Context to state.
    comp.state = {
        theme: "dark",
        filter: "",
        showCollapsed: false,
        showParents: false,
        showChildren: false,
        hideUnmatched: false,
        ignoreFilter: false,
        ignoreSelection: false,
        ignoreTip: false,
        shouldSelect: true,
        noneCollapsed: true,
    };

    cApi.listenToData("settings", (settings) => {
        const { hiddenTipSections, ...s } = settings! || comp.state;
        comp.setState({ ...s });
    }); //, [comp.state]);
     // <-- WHY KEEPS UNDEFINED IN TYPING..

    // Togglers.
    const setFilter = (filter: string) => {
        cApi.setInData("settings.filter", filter);
    }
    const toggleFilterAuto = () => cApi.setInData("settings.showCollapsed", !comp.state.showCollapsed);
    const toggleFilterParents = () => cApi.setInData("settings.showParents", !comp.state.showParents);
    const toggleFilterChildren = () => cApi.setInData("settings.showChildren", !comp.state.showChildren);
    const toggleHideUnmatched = () => cApi.setInData("settings.hideUnmatched", !comp.state.hideUnmatched);
    const toggleIgnoreFilter = () => cApi.setInData("settings.ignoreFilter", !comp.state.ignoreFilter);
    const toggleIgnoreSelection = () => cApi.setInData("settings.ignoreSelection", !comp.state.ignoreSelection);
    const toggleIgnoreTip = () => cApi.setInData("settings.ignoreTip", !comp.state.ignoreTip);
    const toggleCollapseAll = () => cApi.sendSignal("settings.toggleCollapseAll");
    const toggleSelectMatched = (e: MouseEvent | KeyboardEvent) => cApi.sendSignal("settings.toggleSelectMatched", e.shiftKey);
    const toggleTheme = () => cApi.sendSignal("settings.toggleTheme");
    const scrollToMatched = (e: MouseEvent | KeyboardEvent) => cApi.sendSignal("settings.scrollToMatched", e.ctrlKey || e.altKey || e.metaKey, e.shiftKey);
    const logHost = () => consoleLog(cApi.getInData("debug.settings"), "MixDOMDebug: Log host", cApi.getInData("debug.host"));
    
    // Tips.
    const renderCollapseTip = () => wrapTip(<div>Click to collapse/uncollapse all.</div>);
    const renderSelectTip = () => wrapTip(<div>Click to select/deselect matched (or all).<br/> - Click with <b>Shift</b> to always select/deselect all (= including dimly visible).</div>);
    const renderScrollToMatchedTip = () => wrapTip(<div>Scroll and focus to the next match.<br/> - Click with <b>Ctrl</b>/<b>Alt</b> to go backwards.<br/> - Click with <b>Shift</b> to include matched but collapsed by parents (= uncollapses parents).</div>);
    const renderHideUnmatchedTip = () => wrapTip(<div>Whether to always show all items, or only matched by filter and/or selection.</div>);
    const renderIgnoreFilterTip = () => wrapTip(<div>Disable the effect of the filter temporarily.</div>);
    const renderIgnoreSelectionTip = () => wrapTip(<div>Disable the effect of the selection temporarily.</div>);
    const renderIgnoreTipTip = () => wrapTip(<div>Disable the automatic popup display.</div>);
    const renderFilterAutoTip = () => wrapTip(<div>Whether auto-expands collapsed parents when filtering.</div>);
    const renderFilterParentsTip = () => wrapTip(<div>Whether shows parents with matching children.</div>);
    const renderFilterChildrenTip = () => wrapTip(<div>Whether shows children of matching parents.</div>);
    const renderThemesTip = () => wrapTip(<div>Toggle color theme.</div>);
    const renderInputTip = () => wrapTip(<div>Filter items by keywords.<br/> - Separate by comma (<b>,</b>) and join by space (<b> </b>).<br/> - Use brackets for tags: [root], [boundary], [dom], [portal], [pass], [host]</div>);
    const renderConsoleTip = () => wrapTip(<div>Click to log the debugged <b>Host</b> instance in console.</div>);

    // Render.
    return (props, state) => {
        const hasFilter = !!comp.state.filter && comp.state.filter.replace(/\,/g, "").trim();
        return <div class="ui-app-top-bar layout-fit-width flex-row flex-align-items-center layout-gap-m layout-padding-m layout-border-box">
            <UIAppButton _key="select" look="transparent" escToCloseTip={true} iconName={state.shouldSelect ? "select-all" : "select-none"} onPress={toggleSelectMatched} renderTip={renderSelectTip} />
            <UIAppButton _key="collapse" look="transparent" escToCloseTip={true} iconName={state.noneCollapsed ? "expanded" : "collapsed"} onPress={toggleCollapseAll} renderTip={renderCollapseTip} />
            <UIAppButton _key="scrollTo" look="transparent" escToCloseTip={true} iconName="scroll-to" disabled={state.shouldSelect && !hasFilter || undefined} onPress={scrollToMatched} renderTip={renderScrollToMatchedTip} />
            <UIAppInput
                _key="filter"
                look="edge"
                type="text"
                disabled={state.ignoreFilter || undefined}
                escToCloseTip={true}
                escToClearInput={true}
                value={state.filter}
                onValue={setFilter}
                className={classNames("flex-grow layout-fit-height style-text-bold", hasFilter && "active")}
                placeholder="filter items"
                renderTip={renderInputTip}
            />
            {state.hideUnmatched ? <>
                <UIAppButton _key="showCollapsed" look={state.hideUnmatched ? "transparent" : "filled"} escToCloseTip={true} iconName={!state.hideUnmatched ? "filter-collapsed" : "filter-expanded"} disabled={!state.hideUnmatched || undefined} toggled={state.hideUnmatched && state.showCollapsed} onPress={toggleFilterAuto} renderTip={renderFilterAutoTip} />
                <UIAppButton _key="showParents"  look={state.hideUnmatched ? "transparent" : "filled"} escToCloseTip={true} iconName="filter-parents" disabled={!state.hideUnmatched || undefined} toggled={state.hideUnmatched && state.showParents} onPress={toggleFilterParents} renderTip={renderFilterParentsTip} />
                <UIAppButton _key="showChildren" look={state.hideUnmatched ? "transparent" : "filled"} escToCloseTip={true} iconName="filter-children" disabled={!state.hideUnmatched || undefined} toggled={state.hideUnmatched && state.showChildren} onPress={toggleFilterChildren} renderTip={renderFilterChildrenTip} />
            </> : null}
            <UIAppButton _key="eye" look="edge" escToCloseTip={true} iconName={state.hideUnmatched ? "show-matched" : "show-all"} onPress={toggleHideUnmatched} renderTip={renderHideUnmatchedTip} />
            <UIAppButton _key="ignoreFilter" look="transparent" escToCloseTip={true} iconName="no-filter" toggled={state.ignoreFilter} onPress={toggleIgnoreFilter} renderTip={renderIgnoreFilterTip} />
            <UIAppButton _key="ignoreSelection" look="transparent" escToCloseTip={true} iconName="no-selection" toggled={state.ignoreSelection} onPress={toggleIgnoreSelection} renderTip={renderIgnoreSelectionTip} />
            <UIAppButton _key="ignoreTip" look="transparent" escToCloseTip={true} iconName="no-info" toggled={state.ignoreTip} onPress={toggleIgnoreTip} renderTip={renderIgnoreTipTip} />
            <span _key="mix-dom-debug"><b>mix-dom-debug</b> <span class="style-text-small">(v{appVersion})</span></span>
            <UIAppButton _key="theme" look="transparent" escToCloseTip={true} iconName="theme" onPress={toggleTheme} renderTip={renderThemesTip}/>
            <UIAppButton _key="console" look="transparent" escToCloseTip={true} iconName="console" onPress={logHost} renderTip={renderConsoleTip} />
        </div>
    };
}
