
// - Imports - //

// Libraries.
import { classNames } from "dom-types";
import { MixDOM, ComponentFunc, ComponentRemoteType,  MixDOMRenderOutput, ComponentWiredFunc } from "mix-dom";
// Common in UI.
import { UIPopupContainer, UIPopupContentsAlignProps } from "../library/index";


// - Mixable component - //

export interface MixPositionedPopupInfo {
    state: UIPopupContentsAlignProps & {
        popupOpened: boolean | "start" | "in" | "out";
        popupFadeIn?: number;
        popupFadeOut?: number;
        popupSourceElement?: HTMLElement | null;
    };
    class: {
        // For renderer.
        /** To insert the content. */
        WithTooltip: ComponentWiredFunc;
        /** This should be assigned to provide the popup content. */
        renderPopup?(): MixDOMRenderOutput;
        /** Use externally to indicate reason to re-render the popup's contents (including UIPopupContainer -> UIPopupContents -> UIFitBox). */
        refreshPopupId?: any;

        // API.
        /** Feature to show a popup. */
        showPopup(byElement?: HTMLElement | null, instantly?: boolean): void;
        /** Feature to hide a popup, if opened. */
        hidePopup(): void;
        // /** Keep existing popup, if has. */
        // keepPopup(): void;


        // Options.
        /** Where to insert the popup. Internally defaults to document.body */
        popupContainer?: HTMLElement | ComponentRemoteType | null;
    };
    timers: "popupFade" | string & {};
}
/** Provides popup feature with auto positioning. Renderer should include <comp.WithTooltip/>. */
export const MixPositionedPopup: ComponentFunc<MixPositionedPopupInfo> = (_initProps, comp) => {
    // Init state.
    comp.state = { ...comp.state, popupOpened: false, popupSourceElement: null };
    // Create features.
    comp.showPopup = (byElement, instantly) => {
        // Set.
        if (byElement !== undefined)
            comp.setInState("popupSourceElement", byElement);
        // Instantly.
        const fadeIn = comp.state.popupFadeIn;
        if (instantly || !fadeIn)
            comp.setInState("popupOpened", true);
        // Fade in.
        else if (comp.state.popupOpened !== true) {
            // Fade.
            comp.setTimer("popupFade", () => {
                // Stale.
                if (comp.state.popupOpened !== "start")
                    return;
                // Start fading.
                comp.setTimer("popupFade", () => comp.state.popupOpened === "in" && comp.setInState("popupOpened", true), fadeIn);
                comp.setInState("popupOpened", "in");
            }, 25); // Internal.
            // Start.
            comp.setInState("popupOpened", "start");
        }
    }
    comp.hidePopup = (instantly?: boolean) => {
        // Close.
        if (comp.state.popupOpened) {
            // Instantly.
            if (instantly || !comp.state.popupFadeOut)
                comp.setState({ popupOpened: false, popupSourceElement: null });
            // Fade out.
            else {
                comp.setInState("popupOpened", "out");
                comp.setTimer("popupFade", () => comp.state.popupOpened === "out" && comp.setState({ popupOpened: false, popupSourceElement: null }), comp.state.popupFadeOut);
            }
        }
    }
    // Let's create a wired component, so that we can update it locally.
    comp.WithTooltip = MixDOM.wired<{}, { popupOpened: boolean | "start" | "in" | "out"; popupFadeIn?: number; popupFadeOut?: number; refreshId?: any; popupSourceEl?: HTMLElement | null; } & UIPopupContentsAlignProps>(
        // Build props.
        () => ({
            popupOpened: comp.state.popupOpened,
            horizontalAlign: comp.state.horizontalAlign,
            verticalAlign: comp.state.verticalAlign,
            containerMargin: comp.state.containerMargin,
            elementMargin: comp.state.elementMargin,
            popupFadeIn: comp.state.popupFadeIn,
            popupFadeOut: comp.state.popupFadeOut,
            popupSourceEl: comp.state.popupSourceElement,
            refreshId: comp.refreshPopupId,
        }),
        // Renderer - let's create a spread func that'll return null unless should show the popup.
        (props) => {
            // Emptiness.
            if (!props.popupOpened)
                return null;
            // Get content.
            const content = comp.renderPopup ? comp.renderPopup() : null;
            if (content == null)
                return null;
            // Render with sizing support.
            const { popupOpened, refreshId, ...passProps } = props;
            const fadeTime = popupOpened === "start" || popupOpened === "in" ? props.popupFadeIn : props.popupFadeOut;
            return (
                <UIPopupContainer
                    container={comp.popupContainer}
                    sourceElement={props.popupSourceEl}
                    contentClassName={classNames("style-shadow-overlay", (popupOpened === "out" || popupOpened === "start") ? "style-opacity-0" : "style-opacity-1")}
                    contentStyle={fadeTime ? `transition: opacity ${fadeTime}ms ${popupOpened === "out" ? "ease-in" : "ease-in-out"}` : undefined}
                    {...passProps}
                >
                    {content}
                </UIPopupContainer>
            );
        },
        "WithTooltip"
    );
    comp.addWired(comp.WithTooltip);

    // Nothing to render.
    return null;
};
