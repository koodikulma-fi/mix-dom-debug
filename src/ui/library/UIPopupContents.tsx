
// - Imports - //

// Libraries.
import { MixDOM } from "mix-dom";
import { classNames, CSSProperties } from "dom-types";
// Local.
import { Align, HAlign, VAlign, Rect, Margin, cleanMargin } from "./FitBoxAlgoritms";
import { UIFitBox } from "./UIFitBox";
import { UIPopupContentsAlignProps } from "./UIPopupContainer";
import { createMemo, createTrigger } from "data-memo";


// - Popup container - //

export interface UIPopupContentsProps extends UIPopupContentsAlignProps {
	getElement?: HTMLElement | null | (() => HTMLElement | null);
	getContainerRect?: () => Rect;
	className?: string;
	contentClassName?: string;
	contentStyle?: string | CSSProperties;
    // Content props.
	hAlign?: HAlign;
	vAlign?: VAlign;
	/** Margin from container rect. */
	margin?: Margin;
	/** Margin from element (by getElement) if provided. */
	elementMargin?: Margin;
	style?: string | CSSProperties;
}
export const UIPopupContents = MixDOM.component<{props: UIPopupContentsProps; state: { refreshId?: {}; }}>(component => {
	// State.
	component.state = { refreshId: {} };
	// Let's mutate these if needs to update.
	const offset = {
		top: 0,
		left: 0
	}
	const align: Align = {
		horizontal: component.props.hAlign || "center",
		vertical: component.props.vAlign || "center"
	};
	// Prepare getter for whole - this is a popup container who should overlap the entire window.
	const updateGetContainerRect = createMemo((getContainerRect?: () => Rect, refreshId?: any) => () => getContainerRect && getContainerRect() || ({ top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }));
	// We only get the offset once - by design.
	type RefreshPos = { getContainerRect?: () => Rect; getElement?: HTMLElement | null | (() => HTMLElement | null); elementMargin?: Margin; hAlign?: HAlign; vAlign?: VAlign; refreshId?: any; };
	const refreshPos = createTrigger<RefreshPos>(({ getContainerRect, getElement, elementMargin, hAlign, vAlign, refreshId }) => {
		// Get.
		const whole = updateGetContainerRect(getContainerRect, refreshId)();
		const element = getElement && (typeof getElement === "function" ? getElement() : getElement) || null;
		// Use element.
		if (element && document.body.contains(element)) {
			const rect = element.getBoundingClientRect();
			const margin = cleanMargin(elementMargin == null ? 0 : elementMargin);

			// <-- TODO: Verify margin sides...!

			align.horizontal = hAlign || "center"; // (rect.left + rect.width * .5 > whole.width * .5 ? "right" : "left");
			align.vertical = vAlign || (rect.top + rect.height * .5 > whole.height * .5 ? "bottom" : "top");
			offset.left = rect.left + (align.horizontal === "right" ? -margin.right + rect.width : align.horizontal === "center" ? rect.width * .5 : margin.left);
			offset.top = rect.top + (align.vertical === "top" ? margin.bottom + rect.height : align.vertical === "center" ? rect.height * .5 : -margin.top);
		}
		// Just center.
		else {
			offset.left = whole.left + whole.width * .5;
			offset.top = whole.top + whole.height * .5;
			align.horizontal = "center";
			align.vertical = "center";
		}
	});
	// Create size observer.
	const observer = new ResizeObserver(() => {
		component.setState({ refreshId: {} });
	});
	component.listenTo("willUnmount", () => observer.disconnect);
	const domDidMount = (el: HTMLElement) => { observer.observe(el); };

	// Renderer.
	return (props, state) => {
		refreshPos({ getContainerRect: props.getContainerRect, getElement: props.getElement, elementMargin: props.elementMargin, hAlign: props.hAlign, vAlign: props.vAlign, refreshId: state.refreshId });
		return (
			<div class={classNames("ui-popup-contents layout-abs-fill", props.className)} style={props.style} _signals={{ domDidMount }} >
				<UIFitBox offset={offset} getContainerRect={updateGetContainerRect(props.getContainerRect) } align={align} margin={props.margin} >
					<div class={classNames("popup-content", props.contentClassName)} style={props.contentStyle} >
						{MixDOM.Content}
					</div>
				</UIFitBox>
			</div>
		);
	}
});
