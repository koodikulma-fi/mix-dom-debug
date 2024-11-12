
// - Imports - //

// Libraries.
import { MixDOM, MixDOMRenderOutput, Component, ComponentProps, ComponentWith, ComponentFuncReturn, MixDOMProps, Ref } from "mix-dom";
import { HTMLAttributes } from "dom-types/camelCase";
import { classNames, DOMElement, DOMTags } from "dom-types";
// Mixables.
import { MixHoverSignal, MixHoverSignalInfo } from "../../mixables/MixHoverSignal";
import { MixPositionedPopup, MixPositionedPopupInfo } from "../../mixables/MixPositionedPopup";
import { MixOnEscape, MixOnEscapeInfo } from "../../mixables/MixOnEscape";


// - Remote component - //

// Create a remote. Insert it somewhere with: `UIAppTipRemote.Content`.
export const UIAppTipRemote = MixDOM.remote();


// - Mixed component - //

interface UIAppTipOwnProps<Tag extends DOMTags = "div"> {
    tag: Tag;
    rootRef?: Ref<DOMElement<Tag>> | null;
    escToCloseTip?: boolean;
    /** Defaults to true. */
    clickToCloseTip?: boolean;
    getPositionSource?: (source: HTMLElement | null) => HTMLElement | null;
    /** Provide the tip here. Can be any render output, or alternatively a function: (tipComponent) => output. */
    renderTip?: MixDOMRenderOutput | ((uiAppTipComponent: Component<UIAppTipInfo>) => MixDOMRenderOutput);
    disableHover?: boolean;
    className?: string; // Assuming css classes handle button styling.
    refreshId?: any;
}
interface UIAppTipOwnInfo<Tag extends DOMTags = "div"> {
    props: UIAppTipOwnProps<Tag> & MixDOMProps<Tag, "camelCase">;
    class: {
        setHovered: (isHovered: boolean) => void;
    };
}
export type UIAppTipInfo<Tag extends DOMTags = "div"> = MixOnEscapeInfo & MixHoverSignalInfo & MixPositionedPopupInfo & UIAppTipOwnInfo<Tag>;
/** Simple button with hovertip. */
// Create the hover tip button - with access to the remote.
export const UIAppTip = MixDOM.mixFuncsWith(MixHoverSignal, MixOnEscape, MixPositionedPopup, (_, comp) => {
    // Set up internal settings.
    comp.state = {
        ...comp.state,
        elementMargin: 5,
        containerMargin: 10,
        popupFadeIn: 100,
        popupFadeOut: 300,
    };
    // Use our app based component remote.
    comp.popupContainer = UIAppTipRemote;
    // More features.
    comp.setHovered = (isHovered: boolean) => {
        const el = comp.hoverRef.getElement();
        isHovered ? comp.showPopup(comp.props.getPositionSource ? comp.props.getPositionSource(el) : el) : comp.hidePopup();
        comp.useEscape(comp.props.escToCloseTip && isHovered || false);
    }
    // Connect the separate features together.
    comp.listenTo("onHover", (isHovered) => {
        if (isHovered && comp.hoverDisabled === "one-time") {
            comp.hoverDisabled = false;
            return;
        }
        comp.setHovered(isHovered);
    });
    comp.listenTo("onEscape", () => comp.hidePopup());
    // Click.
    const onClick = (e: MouseEvent) => {
        comp.props.onClick && comp.props.onClick(e);
        if (comp.props.clickToCloseTip !== false)
            comp.state.popupOpened ? comp.hidePopup() : comp.hoverDisabled = "one-time";
    }
    // Here we decide how to handle the content - we'll use "renderTip" prop.
    comp.renderPopup = () => typeof comp.props.renderTip === "function" ?
        comp.props.renderTip(comp) : comp.props.renderTip;
    // Disabling.
    comp.listenTo("preUpdate", (prevProps) => {
        if (prevProps && prevProps.disableHover !== comp.props.disableHover)
            comp.hoverDisabled = comp.props.disableHover;
    });
    // Return composition.
    return (props) => {
        const { class: _class, className, tag, renderTip, getPositionSource, escToCloseTip, clickToCloseTip, onClick: _onClick, refreshId, rootRef, ...passProps } = props;
        comp.refreshPopupId = renderTip; // Use the renderTip as refreshId for popup tip.
        return MixDOM.def(tag, { _ref: rootRef ? [rootRef, comp.hoverRef] as Ref<Node>[] : comp.hoverRef, class: classNames(_class, className), onClick, ...passProps }, MixDOM.Content, MixDOM.def(comp.WithTooltip) );
    };
}, null as any as UIAppTipOwnInfo,
"UIAppTip"
// Note. We need `as any` here on the build.
) as any as <Tag extends DOMTags = "div">(initProps: ComponentProps<UIAppTipInfo<Tag>> & Omit<HTMLAttributes<Tag>, "class">, comp: ComponentWith<UIAppTipInfo<Tag>>) => ComponentFuncReturn<UIAppTipInfo<Tag>>;
