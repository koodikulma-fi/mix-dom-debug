
// - Imports - //

// Libraries.
import { MixDOM, mixFuncsWith } from "mix-dom";
// Common types.
import type { DebugTreeItem, HostDebugSettings } from "../../../../common/index";
// Common in UI.
import { UIPopupContainerProps } from "../../../library/index";
// UI app based.
import { UIAppTipRemote } from "../../common/index";
// Local.
import { OnItemLink } from "./appTipHelpers";
import { UIAppTipDisplay } from "./UIAppTipDisplay";
import { MixPositionedPopup } from "../../../mixables/MixPositionedPopup";


// - Component - //

export interface UIAppShowTipInfo {
    props: {
        item: DebugTreeItem | null;
        iUpdate?: number;
        onItemLink?: OnItemLink;
        getSourceElement?: (treeNode?: DebugTreeItem["id"]) => HTMLElement | null;
        onTipPresence?: (treeNode: DebugTreeItem["id"], type: "hoverable" | "popup", present: boolean) => void;
        debugInfo?: HostDebugSettings | null;
        popupContainerProps?: Omit<UIPopupContainerProps, "container" | "sourceElement">;
        reselectRefreshId?: any;
    };
    state: {
        item: DebugTreeItem | null;
    };
}
export const UIAppShowTip = mixFuncsWith(MixPositionedPopup, (_props, comp) => {

    // THE NEW PLAN:
    // - DO THIS IN HOST TREE.
    // - IN HERE, WE ONLY TRGIGER INSTANT "ENTER" & "LEAVE".
    // - AND IN HOST TREE, WE SET UP A TIMER, WHICH CAN (OFTEN) BE CANCELLED. (NO STATE CHANGE.)
    // - 

    comp.state = {
        ...comp.state,
        item: comp.props.item,
        elementMargin: 5,
        containerMargin: 10,
        popupFadeIn: 100,
        popupFadeOut: 300,
    };
    const onHistoryItem = (item: DebugTreeItem) => {
        comp.setState({ popupSourceElement: comp.props.getSourceElement ? comp.props.getSourceElement(item.id) : null })
    };

    comp.popupContainer = UIAppTipRemote;

    comp.renderPopup = () => comp.state.item ?
        <UIAppTipDisplay
            item={comp.state.item}
            iUpdate={comp.props.iUpdate}
            onItemLink={comp.props.onItemLink}
            debugInfo={comp.props.debugInfo}
            reselectRefreshId={comp.props.reselectRefreshId}
            onHistoryItem={onHistoryItem}
            onTipPresence={comp.props.onTipPresence}
            escToCloseTip={true}
        /> : null;
    
    comp.listenTo("preUpdate", (prevProps, prevState, willUpdate) => {
        // Update refreshPopupId.
        const props = comp.props;
        if (prevProps && (
            prevProps.item !== props.item ||
            prevProps.iUpdate !== props.iUpdate ||
            prevProps.onItemLink !== props.onItemLink ||
            prevProps.debugInfo !== props.debugInfo ||
            prevProps.reselectRefreshId !== props.reselectRefreshId ||
            prevProps.onTipPresence !== props.onTipPresence ||
            prevState && prevState.popupSourceElement !== comp.state.popupSourceElement
        ))
            comp.refreshPopupId = {};
        // If props.item changed.
        if (prevProps && prevProps.item !== props.item) {
            // If has item, update to state and start popup.
            if (props.item) {
                const popupSourceElement = props.getSourceElement ? props.getSourceElement() : null;
                comp.setState({item: props.item, popupSourceElement });
                comp.showPopup();
            }
            // If has no item, start hiding the popup.
            else
                comp.hidePopup();
        }
        // Popup has finished hiding.
        if (prevState && prevState.popupOpened && !comp.state.popupOpened)
            comp.setState({item: null, popupSourceElement: null });
    });

    return () => <comp.WithTooltip />;
}, null as any as UIAppShowTipInfo);
