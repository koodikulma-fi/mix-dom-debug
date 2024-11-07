
// - Imports - //

// Libraries.
import { MixDOM, ComponentCtxFunc } from "mix-dom/camelCase";
import { classNames } from "dom-types";
// Common.
import { AppContexts } from "../../common/index";
// UI Common.
import { UIAppTipRemote } from "./common/UIAppTip";
// Views.
import { UIAppHostTree } from "./views/UIAppHostTree";
import { UIAppTopBar } from "./views/UIAppTopBar";


// - Component - //

export interface UIAppInfo {
    props: { refreshId?: any; };
    state: {
        theme: "dark" | "light";
    };
    contexts: AppContexts;
}

export const UIApp: ComponentCtxFunc<UIAppInfo> = function UIApp(_initProps, comp, cAPI) {

    comp.state = { theme: "dark" };
    cAPI.listenToData("settings.theme", theme => comp.setInState("theme", theme), [comp.state.theme]);

    return (props, state) => {
        return <div
            class={classNames(
                "ui-app style-back-main style-front-main layout-fit-size flex-col",
                "color-theme-" + state.theme,
                "layout-theme-default",
                "transition-theme-default",
            )}
        >
            <UIAppTopBar refreshId={props.refreshId} />
            <div class="flex-row layout-fit-width flex-grow layout-overflow-hidden">
                <UIAppHostTree refreshId={props.refreshId} listClassName="layout-padding-m layout-border-box" />
            </div>
            <UIAppTipRemote.WithContent>
                <div class="popup-tip-container layout-abs-fill layout-z-high layout-overflow-hidden layout-no-pointer">
                    {UIAppTipRemote.Content}
                </div>
            </UIAppTipRemote.WithContent>
        </div>
    };
}
